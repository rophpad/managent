package middleware

import (
	"context"

	"github.com/rophpad/managent/internal/mcp/protocol"
)

type Request struct {
	Tool        string
	Arguments   map[string]any
	WorkspaceID string
	APIKeyID    string
	AgentID     string
	AgentName   string
	AgentTags   []string
	ToolID      string
	Action      string
}

func (r Request) ToolCall() protocol.ToolCallParams {
	return protocol.ToolCallParams{Name: r.Tool, Arguments: r.Arguments}
}

type Response struct {
	Result         *protocol.ToolCallResult
	Error          error
	Decision       string
	DecisionReason string
	DecidedBy      string
}

type Handler func(ctx context.Context, req Request) Response

type Middleware interface {
	Handle(ctx context.Context, req Request, next Handler) Response
}

func Chain(middlewares []Middleware, final Handler) Handler {
	for i := len(middlewares) - 1; i >= 0; i-- {
		middleware := middlewares[i]
		next := final
		final = func(ctx context.Context, req Request) Response {
			return middleware.Handle(ctx, req, next)
		}
	}
	return final
}
