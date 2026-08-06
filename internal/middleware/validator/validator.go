package validator

import (
	"context"
	"fmt"
	"strings"

	"github.com/rophpad/managent/internal/middleware"
	"github.com/rophpad/managent/internal/registry"
)

type Middleware struct {
	reg *registry.Registry
}

func New(reg *registry.Registry) *Middleware {
	return &Middleware{reg: reg}
}

func (m *Middleware) Handle(ctx context.Context, req middleware.Request, next middleware.Handler) middleware.Response {
	entry, ok := m.reg.Lookup(req.Tool)
	if !ok {
		return middleware.Response{Error: fmt.Errorf("unknown tool: %s", req.Tool), Decision: "deny", DecisionReason: "unknown tool"}
	}
	if req.ToolID == "" {
		req.ToolID = entry.ToolID
	}
	if err := validateSchema(entry.Tool.InputSchema, req.Arguments); err != nil {
		return middleware.Response{Error: fmt.Errorf("schema validation failed: %w", err), Decision: "deny", DecisionReason: "schema validation failed"}
	}
	return next(ctx, req)
}

func validateSchema(schema map[string]any, args map[string]any) error {
	required, _ := schema["required"].([]any)
	for _, rawField := range required {
		field, _ := rawField.(string)
		if _, ok := args[field]; !ok {
			return fmt.Errorf("missing required argument: %s", field)
		}
	}

	properties, _ := schema["properties"].(map[string]any)
	for field, rawSpec := range properties {
		spec, _ := rawSpec.(map[string]any)
		expectedType, _ := spec["type"].(string)
		format, _ := spec["format"].(string)
		value, ok := args[field]
		if !ok {
			continue
		}
		if err := checkType(field, expectedType, value); err != nil {
			return err
		}
		if err := checkFormat(field, format, value); err != nil {
			return err
		}
	}
	return nil
}

func checkType(field, expectedType string, value any) error {
	if expectedType == "" {
		return nil
	}
	var ok bool
	switch expectedType {
	case "string":
		_, ok = value.(string)
	case "number":
		_, ok = numeric(value)
	case "integer":
		number, isNumber := numeric(value)
		ok = isNumber && number == float64(int64(number))
	case "boolean":
		_, ok = value.(bool)
	case "array":
		_, ok = value.([]any)
	case "object":
		_, ok = value.(map[string]any)
	default:
		ok = true
	}
	if !ok {
		return fmt.Errorf("field %q: expected %s", field, expectedType)
	}
	return nil
}

func checkFormat(field, format string, value any) error {
	if format == "" {
		return nil
	}
	text, ok := value.(string)
	if !ok {
		return fmt.Errorf("field %q: format %s requires a string", field, format)
	}
	switch format {
	case "email":
		if !strings.Contains(text, "@") {
			return fmt.Errorf("field %q: invalid email format", field)
		}
	}
	return nil
}

func numeric(value any) (float64, bool) {
	switch number := value.(type) {
	case float64:
		return number, true
	case float32:
		return float64(number), true
	case int:
		return float64(number), true
	case int64:
		return float64(number), true
	case int32:
		return float64(number), true
	default:
		return 0, false
	}
}
