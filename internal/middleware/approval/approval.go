package approval

import (
	"context"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"github.com/rophpad/managent/internal/middleware"
)

type Status string

const (
	StatusPending  Status = "pending"
	StatusApproved Status = "approved"
	StatusDenied   Status = "denied"
)

type Requirement struct {
	RuleID          string
	RuleName        string
	Reason          string
	ChannelOverride string
}

type PendingRequest struct {
	ID             string
	WorkspaceID    string
	AgentID        string
	AgentName      string
	ToolID         string
	Tool           string
	Action         string
	PayloadSummary map[string]any
	RuleID         string
	RuleName       string
	Channel        string
	Status         Status
	RequestedAt    time.Time
	DecidedBy      string
	DecisionReason string
	Provider       string
	MessageID      string
	DecidedAt      *time.Time
}

type Resolution struct {
	Status     Status
	DecidedBy  string
	Reason     string
	MessageID  string
	Provider   string
	OccurredAt time.Time
}

type Store interface {
	Create(ctx context.Context, pending PendingRequest) (PendingRequest, error)
	Wait(ctx context.Context, id string) (Resolution, error)
	Resolve(ctx context.Context, id string, resolution Resolution) (PendingRequest, bool, error)
}

type Notifier interface {
	Notify(ctx context.Context, pending PendingRequest) (PendingRequest, error)
	Update(ctx context.Context, pending PendingRequest, resolution Resolution) error
}

type Middleware struct {
	store    Store
	notifier Notifier
	timeout  time.Duration
	logger   *slog.Logger
}

func NewMiddleware(store Store, notifier Notifier, timeout time.Duration, logger *slog.Logger) *Middleware {
	if timeout == 0 {
		timeout = 15 * time.Minute
	}
	return &Middleware{store: store, notifier: notifier, timeout: timeout, logger: logger}
}

type approvalKey struct{}

func WithApprovalRequired(ctx context.Context, requirement Requirement) context.Context {
	return context.WithValue(ctx, approvalKey{}, requirement)
}

func ApprovalRequired(ctx context.Context) (Requirement, bool) {
	requirement, ok := ctx.Value(approvalKey{}).(Requirement)
	return requirement, ok
}

func (m *Middleware) Handle(ctx context.Context, req middleware.Request, next middleware.Handler) middleware.Response {
	requirement, ok := ApprovalRequired(ctx)
	if !ok {
		return next(ctx, req)
	}

	pending, err := m.store.Create(ctx, PendingRequest{
		WorkspaceID:    req.WorkspaceID,
		AgentID:        req.AgentID,
		AgentName:      req.AgentName,
		ToolID:         req.ToolID,
		Tool:           req.Tool,
		Action:         req.Action,
		PayloadSummary: redactPayload(req.Arguments),
		RuleID:         requirement.RuleID,
		RuleName:       requirement.RuleName,
		Channel:        requirement.ChannelOverride,
		Status:         StatusPending,
	})
	if err != nil {
		return middleware.Response{Error: fmt.Errorf("create approval: %w", err), Decision: "denied", DecisionReason: "approval create failed"}
	}

	if m.notifier != nil {
		pending, err = m.notifier.Notify(ctx, pending)
		if err != nil {
			return middleware.Response{Error: fmt.Errorf("send approval request: %w", err), Decision: "denied", DecisionReason: "approval dispatch failed"}
		}
	}

	waitCtx, cancel := context.WithTimeout(ctx, m.timeout)
	defer cancel()

	resolution, err := m.store.Wait(waitCtx, pending.ID)
	if err != nil {
		if waitCtx.Err() == context.DeadlineExceeded {
			resolution = Resolution{
				Status:     StatusDenied,
				DecidedBy:  "timeout",
				Reason:     "timed out",
				OccurredAt: time.Now().UTC(),
				MessageID:  pending.MessageID,
				Provider:   pending.Provider,
			}
			if _, _, resolveErr := m.store.Resolve(context.Background(), pending.ID, resolution); resolveErr != nil {
				m.logger.Warn("failed to auto-deny timed out approval", "approval_id", pending.ID, "error", resolveErr)
			}
			if m.notifier != nil {
				_ = m.notifier.Update(context.Background(), pending, resolution)
			}
			return middleware.Response{Error: fmt.Errorf("approval timed out"), Decision: "denied", DecisionReason: "timed out"}
		}
		return middleware.Response{Error: fmt.Errorf("approval wait failed: %w", err), Decision: "denied", DecisionReason: "approval wait failed"}
	}

	if m.notifier != nil {
		_ = m.notifier.Update(ctx, pending, resolution)
	}
	if resolution.Status != StatusApproved {
		return middleware.Response{Error: fmt.Errorf("request denied by %s", resolution.DecidedBy), Decision: "denied", DecisionReason: resolution.Reason, DecidedBy: resolution.DecidedBy}
	}

	resp := next(ctx, req)
	resp.Decision = "approved"
	resp.DecidedBy = resolution.DecidedBy
	if resolution.Reason != "" && resp.DecisionReason == "" {
		resp.DecisionReason = resolution.Reason
	}
	return resp
}

func redactPayload(arguments map[string]any) map[string]any {
	if len(arguments) == 0 {
		return map[string]any{}
	}
	out := make(map[string]any, len(arguments))
	for key, value := range arguments {
		lower := strings.ToLower(key)
		if strings.Contains(lower, "token") || strings.Contains(lower, "secret") || strings.Contains(lower, "password") {
			out[key] = "[redacted]"
			continue
		}
		out[key] = value
	}
	return out
}
