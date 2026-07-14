package auth

import (
	"context"
	"fmt"
	"strings"

	"github.com/rophpad/managent/internal/authz"
	"github.com/rophpad/managent/internal/middleware"
)

type Validator interface {
	ValidateAPIKey(ctx context.Context, rawKey string) (authz.APIKey, bool, error)
}

type apiKeyContextKey struct{}

type bearerContextKey struct{}

func WithAPIKey(ctx context.Context, key authz.APIKey) context.Context {
	return context.WithValue(ctx, apiKeyContextKey{}, key)
}

func APIKeyFromContext(ctx context.Context) (authz.APIKey, bool) {
	key, ok := ctx.Value(apiKeyContextKey{}).(authz.APIKey)
	return key, ok
}

func ContextWithBearer(ctx context.Context, bearer string) context.Context {
	return context.WithValue(ctx, bearerContextKey{}, bearer)
}

func BearerFromContext(ctx context.Context) string {
	bearer, _ := ctx.Value(bearerContextKey{}).(string)
	return bearer
}

type Middleware struct {
	store Validator
}

func NewMiddleware(store Validator) *Middleware {
	return &Middleware{store: store}
}

func (m *Middleware) Handle(ctx context.Context, req middleware.Request, next middleware.Handler) middleware.Response {
	bearer := strings.TrimSpace(BearerFromContext(ctx))
	if bearer == "" {
		return middleware.Response{Error: fmt.Errorf("missing authorization"), Decision: "deny", DecisionReason: "missing authorization"}
	}

	key, ok, err := m.store.ValidateAPIKey(ctx, bearer)
	if err != nil {
		return middleware.Response{Error: fmt.Errorf("authorization lookup failed: %w", err), Decision: "error", DecisionReason: "auth lookup failed"}
	}
	if !ok {
		return middleware.Response{Error: fmt.Errorf("unauthorized: invalid api key"), Decision: "deny", DecisionReason: "invalid api key"}
	}

	ctx = WithAPIKey(ctx, key)
	req.WorkspaceID = key.WorkspaceID
	req.APIKeyID = key.ID
	return next(ctx, req)
}
