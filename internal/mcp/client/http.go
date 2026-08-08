package client

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"strings"
	"sync/atomic"

	"github.com/rophpad/managent/internal/mcp/protocol"
)

type HTTPClient struct {
	endpoint   string
	headers    map[string]string
	logger     *slog.Logger
	httpClient *http.Client
	mode       string
	postURL    string
	nextID     atomic.Int64
}

func NewHTTP(endpoint string, headers map[string]string, logger *slog.Logger) *HTTPClient {
	return &HTTPClient{endpoint: endpoint, headers: headers, logger: logger, httpClient: &http.Client{}, mode: "http"}
}

func NewSSE(endpoint string, headers map[string]string, logger *slog.Logger) *HTTPClient {
	return &HTTPClient{endpoint: endpoint, headers: headers, logger: logger, httpClient: &http.Client{}, mode: "sse"}
}

func (c *HTTPClient) Initialize(ctx context.Context) error {
	if strings.TrimSpace(c.endpoint) == "" {
		return fmt.Errorf("mcp endpoint is required")
	}
	if c.mode == "sse" {
		postURL, err := c.discoverEndpoint(ctx)
		if err != nil {
			return err
		}
		c.postURL = postURL
	} else {
		c.postURL = c.endpoint
	}
	_, err := c.call(ctx, protocol.MethodInitialize, protocol.InitializeParams{
		ProtocolVersion: "2024-11-05",
		Capabilities:    map[string]any{},
		ClientInfo:      protocol.ClientInfo{Name: "managent", Version: "0.1.0"},
	})
	return err
}

func (c *HTTPClient) ListTools(ctx context.Context) ([]protocol.Tool, error) {
	resp, err := c.call(ctx, protocol.MethodToolsList, map[string]any{})
	if err != nil {
		return nil, err
	}
	raw, _ := json.Marshal(resp)
	var result protocol.ToolsListResult
	if err := json.Unmarshal(raw, &result); err != nil {
		return nil, fmt.Errorf("decode tools: %w", err)
	}
	return result.Tools, nil
}

func (c *HTTPClient) CallTool(ctx context.Context, req protocol.ToolCallParams) (*protocol.ToolCallResult, error) {
	resp, err := c.call(ctx, protocol.MethodToolsCall, req)
	if err != nil {
		return nil, err
	}
	raw, _ := json.Marshal(resp)
	var result protocol.ToolCallResult
	if err := json.Unmarshal(raw, &result); err != nil {
		return nil, fmt.Errorf("decode tool result: %w", err)
	}
	return &result, nil
}

func (c *HTTPClient) Close() error {
	return nil
}

func (c *HTTPClient) call(ctx context.Context, method string, params any) (any, error) {
	id := c.nextID.Add(1)
	requestBody, err := json.Marshal(protocol.Request{JSONRPC: "2.0", ID: id, Method: method, Params: params})
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.postURL, bytes.NewReader(requestBody))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	for key, value := range c.headers {
		req.Header.Set(key, value)
	}
	if c.mode == "sse" {
		req.Header.Set("Accept", "text/event-stream")
	} else {
		// Streamable HTTP servers may respond with either JSON or SSE. MCP
		// requires clients to advertise support for both media types.
		req.Header.Set("Accept", "application/json, text/event-stream")
	}
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= http.StatusBadRequest {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("mcp http error %d: %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}
	message, err := decodeHTTPResponse(resp)
	if err != nil {
		return nil, err
	}
	if message.Error != nil {
		return nil, fmt.Errorf("mcp error %d: %s", message.Error.Code, message.Error.Message)
	}
	return message.Result, nil
}

func (c *HTTPClient) discoverEndpoint(ctx context.Context) (string, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.endpoint, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("Accept", "text/event-stream")
	for key, value := range c.headers {
		req.Header.Set(key, value)
	}
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= http.StatusBadRequest {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("mcp sse handshake error %d: %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}
	payload, err := decodeSSEData(resp.Body)
	if err != nil {
		return "", err
	}
	var ready struct {
		Endpoint string `json:"endpoint"`
	}
	if err := json.Unmarshal(payload, &ready); err != nil {
		return "", fmt.Errorf("decode sse ready event: %w", err)
	}
	if strings.TrimSpace(ready.Endpoint) == "" {
		return "", fmt.Errorf("sse ready event did not include an endpoint")
	}
	baseURL, err := url.Parse(c.endpoint)
	if err != nil {
		return "", err
	}
	rel, err := url.Parse(ready.Endpoint)
	if err != nil {
		return "", err
	}
	return baseURL.ResolveReference(rel).String(), nil
}

func decodeHTTPResponse(resp *http.Response) (*protocol.Response, error) {
	if strings.Contains(resp.Header.Get("Content-Type"), "text/event-stream") {
		payload, err := decodeSSEData(resp.Body)
		if err != nil {
			return nil, err
		}
		var message protocol.Response
		if err := json.Unmarshal(payload, &message); err != nil {
			return nil, fmt.Errorf("decode sse response: %w", err)
		}
		return &message, nil
	}
	var message protocol.Response
	if err := json.NewDecoder(resp.Body).Decode(&message); err != nil {
		return nil, fmt.Errorf("decode http response: %w", err)
	}
	return &message, nil
}

func decodeSSEData(body io.Reader) ([]byte, error) {
	scanner := bufio.NewScanner(body)
	scanner.Buffer(make([]byte, 0, 64*1024), 1024*1024)
	var dataLines []string
	for scanner.Scan() {
		line := scanner.Text()
		if line == "" {
			if len(dataLines) > 0 {
				return []byte(strings.Join(dataLines, "\n")), nil
			}
			continue
		}
		if strings.HasPrefix(line, "data:") {
			dataLines = append(dataLines, strings.TrimSpace(strings.TrimPrefix(line, "data:")))
		}
	}
	if err := scanner.Err(); err != nil {
		return nil, err
	}
	if len(dataLines) == 0 {
		return nil, fmt.Errorf("no sse data received")
	}
	return []byte(strings.Join(dataLines, "\n")), nil
}
