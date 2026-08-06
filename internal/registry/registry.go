package registry

import (
	"context"
	"fmt"
	"sort"
	"sync"

	"github.com/rophpad/managent/internal/mcp/protocol"
)

type ToolEntry struct {
	Tool         protocol.Tool
	MCPID        string
	UpstreamName string
	ToolID       string
}

type BuiltinHandler func(ctx context.Context, args map[string]any) (*protocol.ToolCallResult, error)

type Registry struct {
	mu       sync.RWMutex
	tools    map[string]ToolEntry
	builtins map[string]BuiltinHandler
}

func New() *Registry {
	return &Registry{tools: make(map[string]ToolEntry), builtins: make(map[string]BuiltinHandler)}
}

func (r *Registry) RegisterBuiltin(tool protocol.Tool, handler BuiltinHandler) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.tools[tool.Name] = ToolEntry{Tool: tool, UpstreamName: tool.Name, ToolID: tool.Name}
	r.builtins[tool.Name] = handler
}

func (r *Registry) RegisterMCPTools(mcpID, namespace string, tools []protocol.Tool) {
	r.mu.Lock()
	defer r.mu.Unlock()
	for _, tool := range tools {
		federated := tool
		federated.Name = fmt.Sprintf("%s.%s", namespace, tool.Name)
		r.tools[federated.Name] = ToolEntry{
			Tool:         federated,
			MCPID:        mcpID,
			UpstreamName: tool.Name,
			ToolID:       fmt.Sprintf("%s:%s", mcpID, tool.Name),
		}
	}
}

func (r *Registry) ResetMCPTools(mcpID string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	for name, entry := range r.tools {
		if entry.MCPID == mcpID {
			delete(r.tools, name)
		}
	}
}

func (r *Registry) ListTools() []protocol.Tool {
	r.mu.RLock()
	defer r.mu.RUnlock()
	out := make([]protocol.Tool, 0, len(r.tools))
	for _, entry := range r.tools {
		out = append(out, entry.Tool)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Name < out[j].Name })
	return out
}

func (r *Registry) Lookup(name string) (ToolEntry, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	entry, ok := r.tools[name]
	return entry, ok
}

func (r *Registry) BuiltinHandlerFor(name string) (BuiltinHandler, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	handler, ok := r.builtins[name]
	if !ok {
		return nil, fmt.Errorf("no builtin handler for %q", name)
	}
	return handler, nil
}
