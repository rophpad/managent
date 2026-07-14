package client

import (
	"context"

	"github.com/rophpad/managent/internal/mcp/protocol"
)

type Client interface {
	Initialize(ctx context.Context) error
	ListTools(ctx context.Context) ([]protocol.Tool, error)
	CallTool(ctx context.Context, req protocol.ToolCallParams) (*protocol.ToolCallResult, error)
	Close() error
}
