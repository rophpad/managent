package policy

import (
	"fmt"
	"log/slog"
	"reflect"
	"strings"
	"sync"
)

type Action string

const (
	ActionAllow           Action = "allow"
	ActionDeny            Action = "deny"
	ActionRequireApproval Action = "require_approval"
)

type Rule struct {
	Name        string
	ToolPattern string
	Action      Action
	Conditions  map[string]Condition
}

type Condition struct {
	GT     *float64
	GTE    *float64
	LT     *float64
	LTE    *float64
	EQ     any
	Exists *bool
}

type Decision struct {
	Action   Action
	RuleName string
	Reason   string
}

type Engine struct {
	mu     sync.RWMutex
	rules  []Rule
	logger *slog.Logger
}

func NewEngine(logger *slog.Logger) *Engine {
	return &Engine{logger: logger}
}

func ParseAction(value string) (Action, error) {
	switch Action(strings.ToLower(strings.TrimSpace(value))) {
	case "", ActionAllow:
		return ActionAllow, nil
	case ActionDeny:
		return ActionDeny, nil
	case ActionRequireApproval:
		return ActionRequireApproval, nil
	default:
		return "", fmt.Errorf("unsupported policy action %q", value)
	}
}

func (e *Engine) ReplaceRules(rules []Rule) {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.rules = append([]Rule(nil), rules...)
}

func (e *Engine) AddRule(rule Rule) {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.rules = append(e.rules, rule)
}

func (e *Engine) Evaluate(tool string, args map[string]any) Decision {
	e.mu.RLock()
	defer e.mu.RUnlock()
	for _, rule := range e.rules {
		if !matchTool(rule.ToolPattern, tool) {
			continue
		}
		matched, reason := matchConditions(rule.Conditions, args)
		if !matched {
			continue
		}
		decision := Decision{Action: rule.Action, RuleName: rule.Name, Reason: reason}
		e.logger.Debug("policy matched", "tool", tool, "rule", rule.Name, "action", rule.Action, "reason", reason)
		return decision
	}
	return Decision{Action: ActionAllow}
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

func matchConditions(conditions map[string]Condition, args map[string]any) (bool, string) {
	for field, condition := range conditions {
		value, exists := args[field]
		if condition.Exists != nil && *condition.Exists != exists {
			return false, ""
		}
		if !exists {
			return false, ""
		}
		if condition.EQ != nil && !reflect.DeepEqual(value, condition.EQ) {
			return false, ""
		}
		number, isNumber := numeric(value)
		if condition.GT != nil && (!isNumber || number <= *condition.GT) {
			return false, ""
		}
		if condition.GTE != nil && (!isNumber || number < *condition.GTE) {
			return false, ""
		}
		if condition.LT != nil && (!isNumber || number >= *condition.LT) {
			return false, ""
		}
		if condition.LTE != nil && (!isNumber || number > *condition.LTE) {
			return false, ""
		}
	}
	if len(conditions) == 0 {
		return true, "rule matched"
	}
	return true, "conditions matched"
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
