package policy

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/rophpad/managent/internal/middleware"
	enginepolicy "github.com/rophpad/managent/internal/policy"
)

type Middleware struct {
	engine *enginepolicy.Engine
	logger *slog.Logger
}

func NewMiddleware(engine *enginepolicy.Engine, logger *slog.Logger) *Middleware {
	return &Middleware{engine: engine, logger: logger}
}

func (m *Middleware) Handle(ctx context.Context, req middleware.Request, next middleware.Handler) middleware.Response {
	decision := m.engine.Evaluate(req.Tool, req.Arguments)
	switch decision.Action {
	case enginepolicy.ActionDeny:
		m.logger.Warn("policy denied tool call", "tool", req.Tool, "rule", decision.RuleName, "reason", decision.Reason)
		return middleware.Response{Error: fmt.Errorf("policy denied by %s: %s", decision.RuleName, decision.Reason), Decision: "deny", DecisionReason: decision.Reason}
	case enginepolicy.ActionRequireApproval:
		m.logger.Warn("policy requires approval", "tool", req.Tool, "rule", decision.RuleName, "reason", decision.Reason)
		return middleware.Response{Error: fmt.Errorf("approval required by %s: %s", decision.RuleName, decision.Reason), Decision: "require_approval", DecisionReason: decision.Reason}
	default:
		return next(ctx, req)
	}
}
