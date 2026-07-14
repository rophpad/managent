package main

import (
	"strings"
	"testing"

	"github.com/rophpad/managent/internal/mcp/protocol"
)

func TestCheckInjectedCredentialReportsPresenceWithoutLeakingSecret(t *testing.T) {
	result, err := callTool(protocol.ToolCallParams{
		Name: "check_injected_credential",
		Arguments: map[string]any{
			"message":   "ping",
			"api_token": "sk_demo_secret_123456",
		},
	})
	if err != nil {
		t.Fatalf("callTool returned error: %v", err)
	}

	if len(result.Content) != 1 {
		t.Fatalf("expected 1 content item, got %d", len(result.Content))
	}

	text := result.Content[0].Text
	if text != "message=ping credential_present=true" {
		t.Fatalf("unexpected response text: %q", text)
	}

	if strings.Contains(text, "sk_demo_secret_123456") {
		t.Fatalf("response leaked injected secret: %q", text)
	}
}

func TestCheckInjectedCredentialReportsMissingCredential(t *testing.T) {
	result, err := callTool(protocol.ToolCallParams{
		Name: "check_injected_credential",
		Arguments: map[string]any{
			"message": "ping",
		},
	})
	if err != nil {
		t.Fatalf("callTool returned error: %v", err)
	}

	if len(result.Content) != 1 {
		t.Fatalf("expected 1 content item, got %d", len(result.Content))
	}

	if got := result.Content[0].Text; got != "message=ping credential_present=false" {
		t.Fatalf("unexpected response text: %q", got)
	}
}
