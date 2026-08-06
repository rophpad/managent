package app

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/rophpad/managent/internal/database"
	approvalmiddleware "github.com/rophpad/managent/internal/middleware/approval"
)

type approvalStore struct {
	db      *database.Store
	waiters sync.Map
}

func newApprovalStore(db *database.Store) *approvalStore {
	return &approvalStore{db: db}
}

func (s *approvalStore) Create(ctx context.Context, pending approvalmiddleware.PendingRequest) (approvalmiddleware.PendingRequest, error) {
	record, err := s.db.CreatePendingApproval(ctx, database.PendingApprovalRecord{
		WorkspaceID:    pending.WorkspaceID,
		AgentID:        pending.AgentID,
		ToolID:         pending.ToolID,
		ToolName:       pending.Tool,
		Action:         pending.Action,
		PayloadSummary: pending.PayloadSummary,
		PolicyID:       pending.RuleID,
		PolicyName:     pending.RuleName,
		Channel:        pending.Channel,
		Provider:       pending.Provider,
		Status:         string(pending.Status),
	})
	if err != nil {
		return approvalmiddleware.PendingRequest{}, err
	}
	pending.ID = record.ID
	pending.RequestedAt = record.RequestedAt
	return pending, nil
}

func (s *approvalStore) Wait(ctx context.Context, id string) (approvalmiddleware.Resolution, error) {
	record, err := s.db.GetPendingApproval(ctx, id)
	if err == nil && record.Status != string(approvalmiddleware.StatusPending) {
		return approvalmiddleware.Resolution{
			Status:     approvalmiddleware.Status(record.Status),
			DecidedBy:  record.DecidedBy,
			Reason:     record.DecisionReason,
			MessageID:  record.MessageID,
			Provider:   record.Provider,
			OccurredAt: decidedAt(record.DecidedAt),
		}, nil
	}
	waiter := make(chan approvalmiddleware.Resolution, 1)
	s.waiters.Store(id, waiter)
	defer s.waiters.Delete(id)
	select {
	case <-ctx.Done():
		return approvalmiddleware.Resolution{}, ctx.Err()
	case resolution := <-waiter:
		return resolution, nil
	}
}

func (s *approvalStore) Resolve(ctx context.Context, id string, resolution approvalmiddleware.Resolution) (approvalmiddleware.PendingRequest, bool, error) {
	record, ok, err := s.db.ResolvePendingApproval(ctx, id, string(resolution.Status), resolution.DecidedBy, resolution.Reason)
	if err != nil || !ok {
		return approvalmiddleware.PendingRequest{}, ok, err
	}
	if waiter, ok := s.waiters.Load(id); ok {
		waiter.(chan approvalmiddleware.Resolution) <- resolution
	}
	return approvalmiddleware.PendingRequest{
		ID:             id,
		WorkspaceID:    record.WorkspaceID,
		AgentID:        record.AgentID,
		ToolID:         record.ToolID,
		Tool:           record.ToolName,
		Action:         record.Action,
		PayloadSummary: record.PayloadSummary,
		RuleID:         record.PolicyID,
		RuleName:       record.PolicyName,
		Channel:        record.Channel,
		Status:         approvalmiddleware.Status(record.Status),
		RequestedAt:    record.RequestedAt,
		DecidedBy:      record.DecidedBy,
		DecisionReason: record.DecisionReason,
		Provider:       record.Provider,
		MessageID:      record.MessageID,
		DecidedAt:      record.DecidedAt,
	}, true, nil
}

type approvalNotifier struct {
	db      *database.Store
	baseURL string
	logger  *slog.Logger
	http    *http.Client
}

func newApprovalNotifier(db *database.Store, baseURL string, logger *slog.Logger) *approvalNotifier {
	return &approvalNotifier{db: db, baseURL: strings.TrimRight(baseURL, "/"), logger: logger, http: &http.Client{Timeout: 10 * time.Second}}
}

func (n *approvalNotifier) Notify(ctx context.Context, pending approvalmiddleware.PendingRequest) (approvalmiddleware.PendingRequest, error) {
	workspaceID, err := strconv.ParseInt(pending.WorkspaceID, 10, 64)
	if err != nil {
		return pending, err
	}
	integrations, err := n.db.ListApprovalIntegrations(ctx, workspaceID)
	if err != nil || len(integrations) == 0 {
		return pending, nil
	}
	integration := integrations[0]
	secretsRecord, secrets, err := n.db.GetApprovalIntegration(ctx, workspaceID, integration.Provider)
	if err != nil {
		return pending, nil
	}
	pending.Provider = secretsRecord.Provider
	if pending.Channel == "" {
		pending.Channel = secretsRecord.DefaultChannel
	}
	payload := map[string]any{
		"provider":      secretsRecord.Provider,
		"approvalId":    pending.ID,
		"agentName":     pending.AgentName,
		"tool":          pending.Tool,
		"action":        pending.Action,
		"payload":       pending.PayloadSummary,
		"channel":       pending.Channel,
		"policy":        pending.RuleName,
		"requestedAt":   pending.RequestedAt,
		"approveUrl":    n.baseURL + "/api/v1/approvals/webhook/" + secretsRecord.Provider,
		"approveMethod": "POST",
		"buttons": []map[string]string{
			{"label": "Approve", "decision": "approved"},
			{"label": "Deny", "decision": "denied"},
		},
	}
	if webhookURL, _ := secretsRecord.Config["webhookUrl"].(string); webhookURL != "" {
		body, _ := json.Marshal(payload)
		req, err := http.NewRequestWithContext(ctx, http.MethodPost, webhookURL, bytes.NewReader(body))
		if err == nil {
			req.Header.Set("Content-Type", "application/json")
			if token := secrets["access_token"]; token != "" {
				req.Header.Set("Authorization", "Bearer "+token)
			}
			if _, err := n.http.Do(req); err != nil {
				n.logger.Warn("approval notification failed", "provider", secretsRecord.Provider, "error", err)
			}
		}
	}
	_ = n.db.UpdatePendingApproval(ctx, database.PendingApprovalRecord{
		ID:             pending.ID,
		WorkspaceID:    pending.WorkspaceID,
		AgentID:        pending.AgentID,
		ToolID:         pending.ToolID,
		ToolName:       pending.Tool,
		Action:         pending.Action,
		PayloadSummary: pending.PayloadSummary,
		PolicyID:       pending.RuleID,
		PolicyName:     pending.RuleName,
		Channel:        pending.Channel,
		Provider:       pending.Provider,
		Status:         string(pending.Status),
		MessageID:      pending.ID,
	})
	pending.MessageID = pending.ID
	return pending, nil
}

func (n *approvalNotifier) Update(ctx context.Context, pending approvalmiddleware.PendingRequest, resolution approvalmiddleware.Resolution) error {
	workspaceID, err := strconv.ParseInt(pending.WorkspaceID, 10, 64)
	if err != nil || pending.Provider == "" {
		return err
	}
	record, secrets, err := n.db.GetApprovalIntegration(ctx, workspaceID, pending.Provider)
	if err != nil {
		return nil
	}
	webhookURL, _ := record.Config["webhookUrl"].(string)
	if webhookURL == "" {
		return nil
	}
	body, _ := json.Marshal(map[string]any{
		"approvalId": pending.ID,
		"status":     resolution.Status,
		"decidedBy":  resolution.DecidedBy,
		"reason":     resolution.Reason,
		"messageId":  pending.MessageID,
	})
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, webhookURL, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	if token := secrets["access_token"]; token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	_, err = n.http.Do(req)
	return err
}

func signApprovalBody(secret string, body []byte) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(body)
	return hex.EncodeToString(mac.Sum(nil))
}

func approvalSignatureValid(secret string, body []byte, provided string) bool {
	if secret == "" || provided == "" {
		return false
	}
	expected := signApprovalBody(secret, body)
	return hmac.Equal([]byte(expected), []byte(strings.TrimSpace(provided)))
}

func decidedAt(value *time.Time) time.Time {
	if value == nil {
		return time.Time{}
	}
	return *value
}
