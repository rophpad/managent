package client

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/rophpad/managent/internal/mcp/protocol"
)

func TestHTTPClientListToolsOverHTTP(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer r.Body.Close()
		var req protocol.Request
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			t.Fatalf("decode request: %v", err)
		}
		switch req.Method {
		case protocol.MethodInitialize:
			_ = json.NewEncoder(w).Encode(protocol.Response{JSONRPC: "2.0", ID: req.ID, Result: protocol.InitializeResult{ProtocolVersion: "2024-11-05", Capabilities: map[string]any{"tools": map[string]any{}}, ServerInfo: protocol.ServerInfo{Name: "test", Version: "0.1.0"}}})
		case protocol.MethodToolsList:
			_ = json.NewEncoder(w).Encode(protocol.Response{JSONRPC: "2.0", ID: req.ID, Result: protocol.ToolsListResult{Tools: []protocol.Tool{{Name: "search_repository", InputSchema: map[string]any{"type": "object"}}}}})
		default:
			t.Fatalf("unexpected method %q", req.Method)
		}
	}))
	defer server.Close()

	client := NewHTTP(server.URL, map[string]string{"X-Test": "yes"}, slog.Default())
	if err := client.Initialize(context.Background()); err != nil {
		t.Fatalf("Initialize() error = %v", err)
	}
	tools, err := client.ListTools(context.Background())
	if err != nil {
		t.Fatalf("ListTools() error = %v", err)
	}
	if len(tools) != 1 || tools[0].Name != "search_repository" {
		t.Fatalf("ListTools() = %#v", tools)
	}
}

func TestHTTPClientCallToolIncludesEmptyArguments(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer r.Body.Close()
		var req struct {
			ID     any             `json:"id"`
			Method string          `json:"method"`
			Params json.RawMessage `json:"params"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			t.Fatalf("decode request: %v", err)
		}
		switch req.Method {
		case protocol.MethodInitialize:
			_ = json.NewEncoder(w).Encode(protocol.Response{JSONRPC: "2.0", ID: req.ID, Result: protocol.InitializeResult{ProtocolVersion: "2024-11-05"}})
		case protocol.MethodToolsCall:
			if !strings.Contains(string(req.Params), `"arguments":{}`) {
				t.Errorf("params = %s, want empty arguments object", req.Params)
			}
			_ = json.NewEncoder(w).Encode(protocol.Response{JSONRPC: "2.0", ID: req.ID, Result: protocol.ToolCallResult{Content: []protocol.ContentItem{{Type: "text", Text: "done"}}}})
		default:
			t.Fatalf("unexpected method %q", req.Method)
		}
	}))
	defer server.Close()

	client := NewHTTP(server.URL, nil, slog.Default())
	if err := client.Initialize(context.Background()); err != nil {
		t.Fatalf("Initialize() error = %v", err)
	}
	if _, err := client.CallTool(context.Background(), protocol.ToolCallParams{Name: "get_me", Arguments: map[string]any{}}); err != nil {
		t.Fatalf("CallTool() error = %v", err)
	}
}

func TestHTTPClientAdvertisesJSONAndSSEForStreamableHTTP(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		accept := r.Header.Get("Accept")
		if !strings.Contains(accept, "application/json") || !strings.Contains(accept, "text/event-stream") {
			t.Errorf("Accept = %q, want JSON and SSE media types", accept)
		}
		defer r.Body.Close()
		var req protocol.Request
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			t.Fatalf("decode request: %v", err)
		}
		_ = json.NewEncoder(w).Encode(protocol.Response{JSONRPC: "2.0", ID: req.ID, Result: protocol.InitializeResult{ProtocolVersion: "2024-11-05"}})
	}))
	defer server.Close()

	client := NewHTTP(server.URL, map[string]string{"Accept": "application/json"}, slog.Default())
	if err := client.Initialize(context.Background()); err != nil {
		t.Fatalf("Initialize() error = %v", err)
	}
}

func TestHTTPClientCallToolOverSSE(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.Method == http.MethodGet && r.URL.Path == "/sse":
			w.Header().Set("Content-Type", "text/event-stream")
			_, _ = fmt.Fprint(w, "event: ready\ndata: {\"endpoint\":\"/mcp\"}\n\n")
		case r.Method == http.MethodPost && r.URL.Path == "/mcp":
			defer r.Body.Close()
			body, _ := io.ReadAll(r.Body)
			var req protocol.Request
			if err := json.Unmarshal(body, &req); err != nil {
				t.Fatalf("decode request: %v", err)
			}
			w.Header().Set("Content-Type", "text/event-stream")
			switch req.Method {
			case protocol.MethodInitialize:
				payload, _ := json.Marshal(protocol.Response{JSONRPC: "2.0", ID: req.ID, Result: protocol.InitializeResult{ProtocolVersion: "2024-11-05", Capabilities: map[string]any{"tools": map[string]any{}}, ServerInfo: protocol.ServerInfo{Name: "test", Version: "0.1.0"}}})
				_, _ = fmt.Fprintf(w, "event: message\ndata: %s\n\n", payload)
			case protocol.MethodToolsCall:
				payload, _ := json.Marshal(protocol.Response{JSONRPC: "2.0", ID: req.ID, Result: protocol.ToolCallResult{Content: []protocol.ContentItem{{Type: "text", Text: "done"}}}})
				_, _ = fmt.Fprintf(w, "event: message\ndata: %s\n\n", payload)
			default:
				t.Fatalf("unexpected method %q", req.Method)
			}
		default:
			t.Fatalf("unexpected request %s %s", r.Method, r.URL.Path)
		}
	}))
	defer server.Close()

	client := NewSSE(server.URL+"/sse", map[string]string{"Authorization": "Bearer token"}, slog.Default())
	if err := client.Initialize(context.Background()); err != nil {
		t.Fatalf("Initialize() error = %v", err)
	}
	result, err := client.CallTool(context.Background(), protocol.ToolCallParams{Name: "create_issue", Arguments: map[string]any{"title": "test"}})
	if err != nil {
		t.Fatalf("CallTool() error = %v", err)
	}
	if len(result.Content) != 1 || strings.TrimSpace(result.Content[0].Text) != "done" {
		t.Fatalf("CallTool() = %#v", result)
	}
}
