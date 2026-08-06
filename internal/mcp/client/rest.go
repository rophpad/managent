package client

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"

	"github.com/rophpad/managent/internal/mcp/protocol"
)

type RESTConfig struct {
	Name             string
	URLTemplate      string
	Method           string
	Headers          map[string]string
	CredentialTarget string
	CredentialName   string
	InputSchema      map[string]any
	OutputSchema     map[string]any
}

type RESTClient struct {
	cfg        RESTConfig
	logger     *slog.Logger
	httpClient *http.Client
}

func NewREST(cfg RESTConfig, logger *slog.Logger) *RESTClient {
	return &RESTClient{cfg: cfg, logger: logger, httpClient: &http.Client{}}
}

func (c *RESTClient) Initialize(context.Context) error {
	if strings.TrimSpace(c.cfg.URLTemplate) == "" {
		return fmt.Errorf("rest adapter url template is required")
	}
	if strings.TrimSpace(c.cfg.Method) == "" {
		c.cfg.Method = http.MethodPost
	}
	return nil
}

func (c *RESTClient) ListTools(context.Context) ([]protocol.Tool, error) {
	return []protocol.Tool{{
		Name:        c.cfg.Name,
		Description: "REST adapter",
		InputSchema: defaultSchema(c.cfg.InputSchema),
	}}, nil
}

func (c *RESTClient) CallTool(ctx context.Context, req protocol.ToolCallParams) (*protocol.ToolCallResult, error) {
	body, err := json.Marshal(req.Arguments)
	if err != nil {
		return nil, err
	}
	httpReq, err := http.NewRequestWithContext(ctx, c.cfg.Method, c.cfg.URLTemplate, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	for key, value := range c.cfg.Headers {
		httpReq.Header.Set(key, value)
	}
	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	responseBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= http.StatusBadRequest {
		return nil, fmt.Errorf("rest adapter error %d: %s", resp.StatusCode, strings.TrimSpace(string(responseBody)))
	}
	var payload any
	if len(responseBody) > 0 {
		if err := json.Unmarshal(responseBody, &payload); err != nil {
			payload = string(responseBody)
		}
	}
	text, _ := json.Marshal(payload)
	return &protocol.ToolCallResult{
		Content: []protocol.ContentItem{{Type: "text", Text: string(text)}},
	}, nil
}

func (c *RESTClient) Close() error { return nil }

func defaultSchema(schema map[string]any) map[string]any {
	if len(schema) > 0 {
		return schema
	}
	return map[string]any{
		"type":       "object",
		"properties": map[string]any{},
	}
}
