package server

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"strings"

	"github.com/rophpad/managent/internal/mcp/protocol"
)

type ToolProvider interface {
	ListTools(ctx context.Context) ([]protocol.Tool, error)
	CallTool(ctx context.Context, params protocol.ToolCallParams) (*protocol.ToolCallResult, error)
}

type Handler struct {
	provider ToolProvider
	logger   *slog.Logger
}

func NewHandler(provider ToolProvider, logger *slog.Logger) *Handler {
	return &Handler{provider: provider, logger: logger}
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req protocol.Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.writeError(w, nil, protocol.ErrParseError, "parse error", err.Error())
		return
	}

	resp, isNotification := h.Process(r.Context(), &req)
	if isNotification {
		w.WriteHeader(http.StatusAccepted)
		return
	}

	if wantsSSE(r) {
		h.writeSSEResponse(w, resp)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(resp)
}

func (h *Handler) ServeSSE(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Connection", "keep-alive")
		_, _ = fmt.Fprintf(w, "event: ready\ndata: {\"endpoint\":\"%s\"}\n\n", strings.TrimSuffix(r.URL.Path, "/sse"))
		if flusher, ok := w.(http.Flusher); ok {
			flusher.Flush()
		}
		return
	}
	h.ServeHTTP(w, r)
}

func (h *Handler) Process(ctx context.Context, req *protocol.Request) (*protocol.Response, bool) {
	switch req.Method {
	case protocol.MethodInitialize:
		return h.handleInitialize(req), false
	case protocol.MethodInitialized:
		return nil, true
	case protocol.MethodToolsList:
		return h.handleToolsList(ctx, req), false
	case protocol.MethodToolsCall:
		return h.handleToolsCall(ctx, req), false
	case protocol.MethodPing:
		return &protocol.Response{JSONRPC: "2.0", ID: req.ID, Result: map[string]any{}}, false
	default:
		return &protocol.Response{JSONRPC: "2.0", ID: req.ID, Error: &protocol.Error{Code: protocol.ErrMethodNotFound, Message: fmt.Sprintf("method not found: %s", req.Method)}}, false
	}
}

func (h *Handler) handleInitialize(req *protocol.Request) *protocol.Response {
	return &protocol.Response{JSONRPC: "2.0", ID: req.ID, Result: protocol.InitializeResult{
		ProtocolVersion: "2024-11-05",
		Capabilities: map[string]any{
			"tools": map[string]any{},
		},
		ServerInfo: protocol.ServerInfo{Name: "managent", Version: "0.1.0"},
	}}
}

func (h *Handler) handleToolsList(ctx context.Context, req *protocol.Request) *protocol.Response {
	tools, err := h.provider.ListTools(ctx)
	if err != nil {
		h.logger.Error("tools/list failed", "error", err)
		return &protocol.Response{JSONRPC: "2.0", ID: req.ID, Error: &protocol.Error{Code: protocol.ErrInternal, Message: err.Error()}}
	}
	return &protocol.Response{JSONRPC: "2.0", ID: req.ID, Result: protocol.ToolsListResult{Tools: tools}}
}

func (h *Handler) handleToolsCall(ctx context.Context, req *protocol.Request) *protocol.Response {
	var params protocol.ToolCallParams
	raw, err := json.Marshal(req.Params)
	if err != nil {
		return h.errResp(req.ID, protocol.ErrInvalidParams, "invalid params")
	}
	if err := json.Unmarshal(raw, &params); err != nil {
		return h.errResp(req.ID, protocol.ErrInvalidParams, "invalid params")
	}

	result, err := h.provider.CallTool(ctx, params)
	if err != nil {
		h.logger.Error("tools/call failed", "tool", params.Name, "error", err)
		return &protocol.Response{JSONRPC: "2.0", ID: req.ID, Error: &protocol.Error{Code: protocol.ErrInternal, Message: err.Error()}}
	}
	return &protocol.Response{JSONRPC: "2.0", ID: req.ID, Result: result}
}

func (h *Handler) errResp(id any, code int, msg string) *protocol.Response {
	return &protocol.Response{JSONRPC: "2.0", ID: id, Error: &protocol.Error{Code: code, Message: msg}}
}

func (h *Handler) writeError(w http.ResponseWriter, id any, code int, msg string, data any) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(protocol.Response{JSONRPC: "2.0", ID: id, Error: &protocol.Error{Code: code, Message: msg, Data: data}})
}

func (h *Handler) writeSSEResponse(w http.ResponseWriter, resp *protocol.Response) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	payload, _ := json.Marshal(resp)
	_, _ = fmt.Fprintf(w, "event: message\ndata: %s\n\n", payload)
	if flusher, ok := w.(http.Flusher); ok {
		flusher.Flush()
	}
}

func wantsSSE(r *http.Request) bool {
	return strings.Contains(r.Header.Get("Accept"), "text/event-stream")
}
