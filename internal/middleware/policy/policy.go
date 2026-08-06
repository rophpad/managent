package policy

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/rophpad/managent/internal/middleware"
	approvalmiddleware "github.com/rophpad/managent/internal/middleware/approval"
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
	decision := m.engine.Evaluate(enginepolicy.Request{
		AgentID:   req.AgentID,
		AgentTags: req.AgentTags,
		Tool:      req.Tool,
		Action:    req.Action,
		Arguments: req.Arguments,
	})
	switch decision.Action {
	case enginepolicy.ActionDeny:
		m.logger.Warn("policy denied tool call", "tool", req.Tool, "rule", decision.RuleName, "reason", decision.Reason)
		return middleware.Response{Error: fmt.Errorf("policy denied by %s: %s", decision.RuleName, decision.Reason), Decision: "blocked_by_policy", DecisionReason: decision.Reason}
	case enginepolicy.ActionRequireApproval:
		m.logger.Warn("policy requires approval", "tool", req.Tool, "rule", decision.RuleName, "reason", decision.Reason)
		ctx = approvalmiddleware.WithApprovalRequired(ctx, approvalmiddleware.Requirement{
			RuleID:          decision.RuleID,
			RuleName:        decision.RuleName,
			Reason:          decision.Reason,
			ChannelOverride: decision.ChannelOverride,
		})
		return next(ctx, req)
	default:
		return next(ctx, req)
	}
}
