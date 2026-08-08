package marketplace

import (
	"strings"
	"testing"
)

func TestGitHubRemoteHTTPAcceptsJSONAndSSE(t *testing.T) {
	listing, ok := Get("github-mcp")
	if !ok {
		t.Fatal("GitHub marketplace template not found")
	}
	option, err := listing.transportOption("remote-http")
	if err != nil {
		t.Fatalf("remote HTTP option: %v", err)
	}
	accept := option.Headers["Accept"]
	if !strings.Contains(accept, "application/json") || !strings.Contains(accept, "text/event-stream") {
		t.Fatalf("Accept = %q, want JSON and SSE media types", accept)
	}
}
