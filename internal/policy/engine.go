package policy

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"reflect"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"
)

type Action string

const (
	ActionAllow           Action = "allow"
	ActionDeny            Action = "deny"
	ActionRequireApproval Action = "require_approval"
)

type SubjectType string

const (
	SubjectAgent SubjectType = "agent"
	SubjectTag   SubjectType = "tag"
)

type Rule struct {
	ID              string
	Name            string
	SubjectType     SubjectType
	SubjectValue    string
	ToolPattern     string
	ActionName      string
	Action          Action
	Condition       Condition
	RateLimit       string
	ChannelOverride string
	Precedence      int
}

type Condition struct {
	Field    string `json:"field"`
	Operator string `json:"operator"`
	Value    any    `json:"value"`
}

type Request struct {
	AgentID   string
	AgentTags []string
	Tool      string
	Action    string
	Arguments map[string]any
}

type Decision struct {
	Action          Action
	RuleID          string
	RuleName        string
	Reason          string
	ChannelOverride string
	Matched         bool
}

type rateCounter struct {
	WindowStart time.Time
	Count       int
}

type Engine struct {
	mu       sync.RWMutex
	rules    []Rule
	logger   *slog.Logger
	counters map[string]rateCounter
}

func NewEngine(logger *slog.Logger) *Engine {
	return &Engine{logger: logger, counters: make(map[string]rateCounter)}
}

func ParseAction(value string) (Action, error) {
	switch Action(strings.ToLower(strings.TrimSpace(value))) {
	case ActionAllow:
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
	sort.SliceStable(e.rules, func(i, j int) bool {
		left, right := e.rules[i], e.rules[j]
		if left.SubjectType != right.SubjectType {
			return left.SubjectType == SubjectAgent
		}
		if left.Precedence != right.Precedence {
			return left.Precedence < right.Precedence
		}
		return left.Name < right.Name
	})
}

func (e *Engine) Evaluate(req Request) Decision {
	e.mu.Lock()
	defer e.mu.Unlock()
	for _, rule := range e.rules {
		if !matchSubject(rule, req.AgentID, req.AgentTags) {
			continue
		}
		if !matchTool(rule.ToolPattern, req.Tool) {
			continue
		}
		if !matchAction(rule.ActionName, req.Action) {
			continue
		}
		matched, reason := matchCondition(rule.Condition, req.Arguments)
		if !matched {
			continue
		}
		if exceeded, rlReason := e.consumeRateLimit(rule, req.AgentID); exceeded {
			return Decision{
				Action:   ActionDeny,
				RuleID:   rule.ID,
				RuleName: rule.Name,
				Reason:   rlReason,
				Matched:  true,
			}
		}
		decision := Decision{
			Action:          rule.Action,
			RuleID:          rule.ID,
			RuleName:        rule.Name,
			Reason:          reason,
			ChannelOverride: rule.ChannelOverride,
			Matched:         true,
		}
		e.logger.Debug("policy matched", "tool", req.Tool, "rule", rule.Name, "action", rule.Action, "reason", reason)
		return decision
	}
	return Decision{
		Action:  ActionDeny,
		Reason:  "no matching rule; default deny",
		Matched: false,
	}
}

func matchSubject(rule Rule, agentID string, tags []string) bool {
	switch rule.SubjectType {
	case SubjectAgent:
		return rule.SubjectValue != "" && rule.SubjectValue == agentID
	case SubjectTag:
		if rule.SubjectValue == "*" {
			return true
		}
		for _, tag := range tags {
			if tag == rule.SubjectValue {
				return true
			}
		}
		return false
	default:
		return false
	}
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

func matchAction(expected, actual string) bool {
	expected = strings.TrimSpace(expected)
	if expected == "" || expected == "*" {
		return true
	}
	return expected == actual
}

func matchCondition(condition Condition, args map[string]any) (bool, string) {
	field := strings.TrimSpace(condition.Field)
	if field == "" {
		return true, "rule matched"
	}
	value, exists := args[field]
	if !exists {
		return false, ""
	}
	switch strings.ToLower(strings.TrimSpace(condition.Operator)) {
	case "", "eq":
		if reflect.DeepEqual(value, condition.Value) {
			return true, fmt.Sprintf("%s == %v", field, condition.Value)
		}
	case "gt", "gte", "lt", "lte":
		left, ok := numeric(value)
		if !ok {
			return false, ""
		}
		right, ok := numeric(condition.Value)
		if !ok {
			return false, ""
		}
		switch strings.ToLower(condition.Operator) {
		case "gt":
			if left > right {
				return true, fmt.Sprintf("%s > %v", field, condition.Value)
			}
		case "gte":
			if left >= right {
				return true, fmt.Sprintf("%s >= %v", field, condition.Value)
			}
		case "lt":
			if left < right {
				return true, fmt.Sprintf("%s < %v", field, condition.Value)
			}
		case "lte":
			if left <= right {
				return true, fmt.Sprintf("%s <= %v", field, condition.Value)
			}
		}
	case "contains":
		text, ok := value.(string)
		if ok && strings.Contains(text, fmt.Sprint(condition.Value)) {
			return true, fmt.Sprintf("%s contains %v", field, condition.Value)
		}
	case "exists":
		want := truthy(condition.Value)
		if want == exists {
			return true, fmt.Sprintf("%s exists == %t", field, want)
		}
	}
	return false, ""
}

func (e *Engine) consumeRateLimit(rule Rule, agentID string) (bool, string) {
	if strings.TrimSpace(rule.RateLimit) == "" {
		return false, ""
	}
	limit, window, err := parseRateLimit(rule.RateLimit)
	if err != nil {
		return true, fmt.Sprintf("invalid rate limit %q", rule.RateLimit)
	}
	key := fmt.Sprintf("%s:%s", rule.ID, agentID)
	now := time.Now().UTC()
	counter := e.counters[key]
	if counter.WindowStart.IsZero() || now.Sub(counter.WindowStart) >= window {
		counter = rateCounter{WindowStart: now, Count: 0}
	}
	counter.Count++
	e.counters[key] = counter
	if counter.Count > limit {
		return true, fmt.Sprintf("rate limit exceeded for %s", rule.RateLimit)
	}
	return false, ""
}

func parseRateLimit(raw string) (int, time.Duration, error) {
	parts := strings.Split(strings.TrimSpace(raw), "/")
	if len(parts) != 2 {
		return 0, 0, fmt.Errorf("expected count/window")
	}
	limit, err := strconv.Atoi(parts[0])
	if err != nil || limit <= 0 {
		return 0, 0, fmt.Errorf("invalid limit")
	}
	switch parts[1] {
	case "s":
		return limit, time.Second, nil
	case "m":
		return limit, time.Minute, nil
	case "h":
		return limit, time.Hour, nil
	default:
		return 0, 0, fmt.Errorf("invalid window")
	}
}

func truthy(value any) bool {
	switch v := value.(type) {
	case bool:
		return v
	case string:
		return strings.EqualFold(v, "true")
	default:
		return false
	}
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
	case json.Number:
		v, err := number.Float64()
		return v, err == nil
	case string:
		v, err := strconv.ParseFloat(number, 64)
		return v, err == nil
	default:
		return 0, false
	}
}
