package router

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/rophpad/managent/internal/connector"
	"github.com/rophpad/managent/internal/mcp/protocol"
	"github.com/rophpad/managent/internal/registry"
)

type Router struct {
	registry *registry.Registry
	connMgr  *connector.Manager
	logger   *slog.Logger
}

func New(reg *registry.Registry, connMgr *connector.Manager, logger *slog.Logger) *Router {
	return &Router{registry: reg, connMgr: connMgr, logger: logger}
}

func (r *Router) ListTools(_ context.Context) ([]protocol.Tool, error) {
	return r.registry.ListTools(), nil
}

func (r *Router) CallTool(ctx context.Context, params protocol.ToolCallParams) (*protocol.ToolCallResult, error) {
	entry, ok := r.registry.Lookup(params.Name)
	if !ok {
		return nil, fmt.Errorf("unknown tool: %s", params.Name)
	}

	if entry.ConnectorID == "" {
		handler, err := r.registry.BuiltinHandlerFor(params.Name)
		if err != nil {
			return nil, err
		}
		return handler(ctx, params.Arguments)
	}

	connector, ok := r.connMgr.Get(entry.ConnectorID)
	if !ok {
		return nil, fmt.Errorf("connector %q not found for tool %s", entry.ConnectorID, params.Name)
	}

	r.logger.Info("routing tool call", "tool", params.Name, "connector", connector.Name(), "upstream_tool", entry.UpstreamName)
	return connector.CallTool(ctx, protocol.ToolCallParams{Name: entry.UpstreamName, Arguments: params.Arguments})
}
