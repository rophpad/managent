package permission

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/rophpad/managent/internal/middleware"
)

// Checker resolves the agent's current dashboard grants for every call.
// Implementations must not cache the result: revocations need to take effect
// without restarting the gateway.
type Checker interface {
	AgentHasToolPermission(ctx context.Context, agentID, agentName, tool string) (bool, string, error)
}

type Middleware struct {
	checker Checker
	logger  *slog.Logger
}

func New(checker Checker, logger *slog.Logger) *Middleware {
	return &Middleware{checker: checker, logger: logger}
}

func (m *Middleware) Handle(ctx context.Context, req middleware.Request, next middleware.Handler) middleware.Response {
	allowed, reason, err := m.checker.AgentHasToolPermission(ctx, req.AgentID, req.AgentName, req.Tool)
	if err != nil {
		m.logger.Error("permission lookup failed", "agent", req.AgentID, "tool", req.Tool, "error", err)
		return middleware.Response{
			Error: fmt.Errorf("permission lookup failed: %w", err), Decision: "error",
			DecisionReason: "permission lookup failed",
		}
	}
	if !allowed {
		m.logger.Warn("permission denied tool call", "agent", req.AgentID, "tool", req.Tool, "reason", reason)
		return middleware.Response{
			Error: fmt.Errorf("permission denied: %s", reason), Decision: "blocked_by_permission",
			DecisionReason: reason,
		}
	}
	return next(ctx, req)
}
