package approval

import (
	"context"
	"fmt"
	"log/slog"
	"sync"
	"time"

	"github.com/rophpad/managent/internal/middleware"
	"github.com/rophpad/managent/internal/mcp/protocol"
)

type Status string

const (
	StatusPending  Status = "pending"
	StatusApproved Status = "approved"
	StatusRejected Status = "rejected"
)

// PendingRequest holds an execution that is waiting for human approval.
type PendingRequest struct {
	ID          string
	WorkspaceID string
	Tool        string
	Arguments   map[string]any
	Status      Status
	CreatedAt   time.Time
	resolvedAt  time.Time
	ch          chan Status
}

// Store holds pending approval requests in memory (Redis-backed in later phases).
type Store struct {
	mu       sync.RWMutex
	requests map[string]*PendingRequest
}

func NewStore() *Store {
	return &Store{requests: make(map[string]*PendingRequest)}
}

func (s *Store) Create(workspaceID, tool string, args map[string]any) *PendingRequest {
	id := fmt.Sprintf("apr_%d", time.Now().UnixNano())
	req := &PendingRequest{
		ID:          id,
		WorkspaceID: workspaceID,
		Tool:        tool,
		Arguments:   args,
		Status:      StatusPending,
		CreatedAt:   time.Now(),
		ch:          make(chan Status, 1),
	}
	s.mu.Lock()
	s.requests[id] = req
	s.mu.Unlock()
	return req
}

func (s *Store) Resolve(id string, status Status) error {
	s.mu.Lock()
	req, ok := s.requests[id]
	if !ok {
		s.mu.Unlock()
		return fmt.Errorf("approval request %q not found", id)
	}
	req.Status = status
	req.resolvedAt = time.Now()
	s.mu.Unlock()
	req.ch <- status
	return nil
}

func (s *Store) List(workspaceID string) []*PendingRequest {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var out []*PendingRequest
	for _, r := range s.requests {
		if r.WorkspaceID == workspaceID && r.Status == StatusPending {
			out = append(out, r)
		}
	}
	return out
}

// Middleware pauses execution until a human approves or rejects the request.
type Middleware struct {
	store   *Store
	timeout time.Duration
	logger  *slog.Logger
}

func NewMiddleware(store *Store, timeout time.Duration, logger *slog.Logger) *Middleware {
	if timeout == 0 {
		timeout = 15 * time.Minute
	}
	return &Middleware{store: store, timeout: timeout, logger: logger}
}

// NeedsApproval is set on the context by the policy middleware to signal this call requires approval.
type approvalKey struct{}

func WithApprovalRequired(ctx context.Context) context.Context {
	return context.WithValue(ctx, approvalKey{}, true)
}

func ApprovalRequired(ctx context.Context) bool {
	v, _ := ctx.Value(approvalKey{}).(bool)
	return v
}

func (m *Middleware) Handle(ctx context.Context, req middleware.Request, next middleware.Handler) middleware.Response {
	if !ApprovalRequired(ctx) {
		return next(ctx, req)
	}

	pending := m.store.Create(req.WorkspaceID, req.Tool, req.Arguments)
	m.logger.Info("approval required — execution paused",
		"approval_id", pending.ID,
		"tool", req.Tool,
		"workspace", req.WorkspaceID,
	)

	timer := time.NewTimer(m.timeout)
	defer timer.Stop()

	select {
	case <-ctx.Done():
		return middleware.Response{Error: fmt.Errorf("request cancelled while awaiting approval")}
	case <-timer.C:
		return middleware.Response{Error: fmt.Errorf("approval timed out for %s (id: %s)", req.Tool, pending.ID)}
	case status := <-pending.ch:
		if status != StatusApproved {
			return middleware.Response{Error: fmt.Errorf("execution rejected for %s (id: %s)", req.Tool, pending.ID)}
		}
		m.logger.Info("approval granted", "approval_id", pending.ID, "tool", req.Tool)

		// Attach approved result — re-run the downstream handler
		result := next(ctx, req)
		if result.Error != nil {
			// Wrap with approved content marker for audit
			result.Result = &protocol.ToolCallResult{
				Content: []protocol.ContentItem{{Type: "text", Text: fmt.Sprintf("approved execution failed: %s", result.Error)}},
				IsError: true,
			}
		}
		return result
	}
}
