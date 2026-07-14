package logger

import (
	"context"
	"log/slog"
	"time"

	"github.com/rophpad/managent/internal/audit"
	"github.com/rophpad/managent/internal/middleware"
)

type LoggerMiddleware struct {
	logger *slog.Logger
	audit  *audit.Logger
}

func New(logger *slog.Logger, auditLogger *audit.Logger) *LoggerMiddleware {
	return &LoggerMiddleware{logger: logger, audit: auditLogger}
}

func (m *LoggerMiddleware) Handle(ctx context.Context, req middleware.Request, next middleware.Handler) middleware.Response {
	start := time.Now()
	resp := next(ctx, req)
	latency := time.Since(start)

	decision := resp.Decision
	if decision == "" {
		if resp.Error != nil {
			decision = "error"
		} else {
			decision = "allow"
		}
	}

	requestBody := map[string]any{"arguments": req.Arguments, "api_key_id": req.APIKeyID, "latency_ms": latency.Milliseconds(), "decision_reason": resp.DecisionReason}
	responseBody := map[string]any{}
	if resp.Result != nil {
		responseBody["result"] = resp.Result
	}
	if resp.Error != nil {
		responseBody["error"] = resp.Error.Error()
		m.logger.Error("tool call failed", "tool", req.Tool, "workspace", req.WorkspaceID, "duration_ms", latency.Milliseconds(), "error", resp.Error)
	} else {
		responseBody["status"] = "success"
		m.logger.Info("tool call completed", "tool", req.Tool, "workspace", req.WorkspaceID, "duration_ms", latency.Milliseconds())
	}

	m.audit.Write(ctx, audit.Record{Timestamp: time.Now().UTC(), WorkspaceID: req.WorkspaceID, Tool: req.Tool, Request: requestBody, Response: responseBody, Decision: decision})
	return resp
}
