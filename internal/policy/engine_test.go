package policy

import (
	"io"
	"log/slog"
	"testing"
)

func TestEvaluatePrefersSpecificAgentAndAbstainsWithoutMatch(t *testing.T) {
	engine := NewEngine(slog.New(slog.NewTextHandler(io.Discard, nil)))
	engine.ReplaceRules([]Rule{
		{
			ID:           "2",
			Name:         "tag-allow",
			SubjectType:  SubjectTag,
			SubjectValue: "finance",
			ToolPattern:  "stripe.refund",
			ActionName:   "call",
			Action:       ActionAllow,
			Precedence:   2,
		},
		{
			ID:           "1",
			Name:         "agent-approval",
			SubjectType:  SubjectAgent,
			SubjectValue: "42",
			ToolPattern:  "stripe.refund",
			ActionName:   "call",
			Action:       ActionRequireApproval,
			Precedence:   1,
		},
	})

	decision := engine.Evaluate(Request{
		AgentID:   "42",
		AgentTags: []string{"finance"},
		Tool:      "stripe.refund",
		Action:    "call",
		Arguments: map[string]any{},
	})
	if decision.Action != ActionRequireApproval {
		t.Fatalf("expected specific agent rule to win, got %s", decision.Action)
	}

	noMatch := engine.Evaluate(Request{
		AgentID:   "99",
		AgentTags: []string{"other"},
		Tool:      "stripe.refund",
		Action:    "call",
		Arguments: map[string]any{},
	})
	if noMatch.Matched || noMatch.Action != "" {
		t.Fatalf("expected policy engine to abstain, got %#v", noMatch)
	}
}

func TestEvaluateMatchesConditionAndRateLimit(t *testing.T) {
	engine := NewEngine(slog.New(slog.NewTextHandler(io.Discard, nil)))
	engine.ReplaceRules([]Rule{{
		ID:           "1",
		Name:         "high-value",
		SubjectType:  SubjectTag,
		SubjectValue: "finance",
		ToolPattern:  "stripe.refund",
		ActionName:   "call",
		Action:       ActionRequireApproval,
		Condition:    Condition{Field: "amount", Operator: "gt", Value: 10000},
		RateLimit:    "1/m",
		Precedence:   1,
	}})

	first := engine.Evaluate(Request{
		AgentID:   "42",
		AgentTags: []string{"finance"},
		Tool:      "stripe.refund",
		Action:    "call",
		Arguments: map[string]any{"amount": 20000},
	})
	if first.Action != ActionRequireApproval {
		t.Fatalf("expected approval on first request, got %s", first.Action)
	}

	second := engine.Evaluate(Request{
		AgentID:   "42",
		AgentTags: []string{"finance"},
		Tool:      "stripe.refund",
		Action:    "call",
		Arguments: map[string]any{"amount": 20000},
	})
	if second.Action != ActionDeny {
		t.Fatalf("expected rate-limited request to deny, got %s", second.Action)
	}
}
