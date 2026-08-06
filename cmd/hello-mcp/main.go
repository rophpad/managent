package main

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"os"

	"github.com/rophpad/managent/internal/mcp/protocol"
)

var tools = []protocol.Tool{
	{
		Name:        "greet",
		Description: "Return a greeting for the provided name.",
		InputSchema: map[string]any{
			"type": "object",
			"properties": map[string]any{
				"name": map[string]any{"type": "string"},
			},
			"required": []any{"name"},
		},
	},
	{
		Name:        "check_injected_credential",
		Description: "Verify hidden credential injection without returning any secret-derived value.",
		InputSchema: map[string]any{
			"type": "object",
			"properties": map[string]any{
				"message": map[string]any{"type": "string"},
			},
			"required": []any{"message"},
		},
	},
}

func main() {
	scanner := bufio.NewScanner(os.Stdin)
	writer := bufio.NewWriter(os.Stdout)
	defer writer.Flush()

	for scanner.Scan() {
		var req protocol.Request
		if err := json.Unmarshal(scanner.Bytes(), &req); err != nil {
			write(writer, protocol.Response{JSONRPC: "2.0", Error: &protocol.Error{Code: protocol.ErrParseError, Message: err.Error()}})
			continue
		}

		resp, notification := handle(context.Background(), &req)
		if notification {
			continue
		}
		write(writer, *resp)
	}
}

func handle(_ context.Context, req *protocol.Request) (*protocol.Response, bool) {
	switch req.Method {
	case protocol.MethodInitialize:
		return &protocol.Response{JSONRPC: "2.0", ID: req.ID, Result: protocol.InitializeResult{
			ProtocolVersion: "2024-11-05",
			Capabilities:    map[string]any{"tools": map[string]any{}},
			ServerInfo:      protocol.ServerInfo{Name: "hello-mcp", Version: "0.1.0"},
		}}, false
	case protocol.MethodInitialized:
		return nil, true
	case protocol.MethodPing:
		return &protocol.Response{JSONRPC: "2.0", ID: req.ID, Result: map[string]any{}}, false
	case protocol.MethodToolsList:
		return &protocol.Response{JSONRPC: "2.0", ID: req.ID, Result: protocol.ToolsListResult{Tools: tools}}, false
	case protocol.MethodToolsCall:
		var params protocol.ToolCallParams
		raw, _ := json.Marshal(req.Params)
		if err := json.Unmarshal(raw, &params); err != nil {
			return &protocol.Response{JSONRPC: "2.0", ID: req.ID, Error: &protocol.Error{Code: protocol.ErrInvalidParams, Message: err.Error()}}, false
		}
		result, err := callTool(params)
		if err != nil {
			return &protocol.Response{JSONRPC: "2.0", ID: req.ID, Error: &protocol.Error{Code: protocol.ErrInternal, Message: err.Error()}}, false
		}
		return &protocol.Response{JSONRPC: "2.0", ID: req.ID, Result: result}, false
	default:
		return &protocol.Response{JSONRPC: "2.0", ID: req.ID, Error: &protocol.Error{Code: protocol.ErrMethodNotFound, Message: "method not found"}}, false
	}
}

func callTool(params protocol.ToolCallParams) (*protocol.ToolCallResult, error) {
	switch params.Name {
	case "greet":
		name, _ := params.Arguments["name"].(string)
		if name == "" {
			name = "world"
		}
		return &protocol.ToolCallResult{Content: []protocol.ContentItem{{Type: "text", Text: fmt.Sprintf("hello %s", name)}}}, nil
	case "check_injected_credential":
		message, _ := params.Arguments["message"].(string)
		secret, _ := params.Arguments["api_token"].(string)
		return &protocol.ToolCallResult{Content: []protocol.ContentItem{{Type: "text", Text: fmt.Sprintf("message=%s credential_present=%t", message, secret != "")}}}, nil
	default:
		return nil, fmt.Errorf("unknown tool: %s", params.Name)
	}
}

func write(writer *bufio.Writer, resp protocol.Response) {
	line, _ := json.Marshal(resp)
	_, _ = writer.Write(append(line, '\n'))
	_ = writer.Flush()
}
