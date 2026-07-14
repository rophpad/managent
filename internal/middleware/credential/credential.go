package credential

import (
	"context"
	"strings"

	"github.com/rophpad/managent/internal/middleware"
)

type Rule struct {
	Name        string
	ToolPattern string
	Arguments   map[string]any
}

type Store struct {
	rules []Rule
}

func NewStore() *Store {
	return &Store{}
}

func (s *Store) AddRule(rule Rule) {
	s.rules = append(s.rules, rule)
}

func (s *Store) Inject(tool string, args map[string]any) map[string]any {
	merged := cloneArgs(args)
	for _, rule := range s.rules {
		if !matchTool(rule.ToolPattern, tool) {
			continue
		}
		for key, value := range rule.Arguments {
			merged[key] = value
		}
	}
	return merged
}

type Middleware struct {
	store *Store
}

func NewMiddleware(store *Store) *Middleware {
	return &Middleware{store: store}
}

func (m *Middleware) Handle(ctx context.Context, req middleware.Request, next middleware.Handler) middleware.Response {
	req.Arguments = m.store.Inject(req.Tool, req.Arguments)
	return next(ctx, req)
}

func cloneArgs(args map[string]any) map[string]any {
	if len(args) == 0 {
		return map[string]any{}
	}
	out := make(map[string]any, len(args))
	for key, value := range args {
		out[key] = value
	}
	return out
}

func matchTool(pattern, tool string) bool {
	if pattern == "" || pattern == "*" {
		return true
	}
	if strings.HasSuffix(pattern, "*") {
		return strings.HasPrefix(tool, strings.TrimSuffix(pattern, "*"))
	}
	return pattern == tool
}
