package mcp

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"sync"

	"github.com/rophpad/managent/internal/mcp/client"
	"github.com/rophpad/managent/internal/mcp/protocol"
	"github.com/rophpad/managent/internal/registry"
)

type Transport string

type Status string

const (
	TransportStdio Transport = "stdio"
	TransportHTTP  Transport = "http"
	TransportSSE   Transport = "sse"
	TransportREST  Transport = "rest"

	StatusDisconnected Status = "disconnected"
	StatusConnected    Status = "connected"
	StatusError        Status = "error"
)

type Config struct {
	ID               string
	AgentID          string
	Name             string
	Namespace        string
	Transport        Transport
	Endpoint         string
	CredentialRef    string
	Command          string
	Args             []string
	URL              string
	Headers          map[string]string
	Env              map[string]string
	Method           string
	URLTemplate      string
	CredentialTarget string
	CredentialName   string
	InputSchema      map[string]any
	OutputSchema     map[string]any
	SecretEnv        map[string]string
	SecretHeaders    map[string]string
	Enabled          bool
}

type Snapshot struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Namespace string    `json:"namespace"`
	Transport Transport `json:"transport"`
	Status    Status    `json:"status"`
	LastError string    `json:"last_error,omitempty"`
	ToolCount int       `json:"tool_count"`
}

type RuntimeStore interface {
	UpdateMCPState(ctx context.Context, id string, status Status, lastError string) error
	ReplaceMCPTools(ctx context.Context, id string, tools []protocol.Tool) error
}

type MCP interface {
	ID() string
	Name() string
	Namespace() string
	Start(ctx context.Context) error
	Stop() error
	Reconnect(ctx context.Context) error
	Status() Snapshot
	ListTools(ctx context.Context) ([]protocol.Tool, error)
	CallTool(ctx context.Context, req protocol.ToolCallParams) (*protocol.ToolCallResult, error)
}

type managedMCP struct {
	cfg       Config
	logger    *slog.Logger
	store     RuntimeStore
	mu        sync.RWMutex
	client    client.Client
	status    Status
	lastError string
	toolCount int
}

func New(cfg Config, logger *slog.Logger, store RuntimeStore) MCP {
	if cfg.Namespace == "" {
		cfg.Namespace = cfg.Name
	}
	return &managedMCP{cfg: cfg, logger: logger, store: store, status: StatusDisconnected}
}

func (c *managedMCP) ID() string        { return c.cfg.ID }
func (c *managedMCP) Name() string      { return c.cfg.Name }
func (c *managedMCP) Namespace() string { return c.cfg.Namespace }

func (c *managedMCP) Start(ctx context.Context) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	if !c.cfg.Enabled {
		c.status = StatusDisconnected
		c.persistState(ctx)
		return nil
	}
	if c.client != nil {
		return nil
	}

	cl, err := c.newClient(ctx)
	if err != nil {
		c.status = StatusError
		c.lastError = err.Error()
		c.persistState(ctx)
		return err
	}

	tools, err := cl.ListTools(ctx)
	if err != nil {
		_ = cl.Close()
		c.status = StatusError
		c.lastError = err.Error()
		c.persistState(ctx)
		return fmt.Errorf("mcp %s: list tools: %w", c.cfg.Name, err)
	}

	c.client = cl
	c.status = StatusConnected
	c.lastError = ""
	c.toolCount = len(tools)
	c.persistState(ctx)
	if c.store != nil {
		if err := c.store.ReplaceMCPTools(ctx, c.cfg.ID, tools); err != nil {
			c.logger.Warn("failed to persist mcp tools", "mcp", c.cfg.Name, "error", err)
		}
	}
	c.logger.Info("mcp started", "mcp", c.cfg.Name, "transport", c.cfg.Transport, "tools", len(tools))
	return nil
}

func (c *managedMCP) Stop() error {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.client == nil {
		c.status = StatusDisconnected
		c.persistState(context.Background())
		return nil
	}
	err := c.client.Close()
	c.client = nil
	c.toolCount = 0
	c.status = StatusDisconnected
	if err != nil {
		c.lastError = err.Error()
	}
	c.persistState(context.Background())
	return err
}

func (c *managedMCP) Reconnect(ctx context.Context) error {
	if err := c.Stop(); err != nil {
		c.logger.Warn("mcp stop before reconnect failed", "mcp", c.cfg.Name, "error", err)
	}
	return c.Start(ctx)
}

func (c *managedMCP) Status() Snapshot {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return Snapshot{ID: c.cfg.ID, Name: c.cfg.Name, Namespace: c.cfg.Namespace, Transport: c.cfg.Transport, Status: c.status, LastError: c.lastError, ToolCount: c.toolCount}
}

func (c *managedMCP) ListTools(ctx context.Context) ([]protocol.Tool, error) {
	c.mu.RLock()
	cl := c.client
	c.mu.RUnlock()
	if cl == nil {
		return nil, fmt.Errorf("mcp %s is not connected", c.cfg.Name)
	}
	tools, err := cl.ListTools(ctx)
	if err != nil {
		c.mu.Lock()
		c.status = StatusError
		c.lastError = err.Error()
		c.mu.Unlock()
		c.persistState(ctx)
		return nil, err
	}
	c.mu.Lock()
	c.toolCount = len(tools)
	c.mu.Unlock()
	if c.store != nil {
		if err := c.store.ReplaceMCPTools(ctx, c.cfg.ID, tools); err != nil {
			c.logger.Warn("failed to persist mcp tools", "mcp", c.cfg.Name, "error", err)
		}
	}
	return tools, nil
}

func (c *managedMCP) CallTool(ctx context.Context, req protocol.ToolCallParams) (*protocol.ToolCallResult, error) {
	c.mu.RLock()
	cl := c.client
	c.mu.RUnlock()
	if cl == nil {
		return nil, fmt.Errorf("mcp %s is not connected", c.cfg.Name)
	}
	result, err := cl.CallTool(ctx, req)
	if err != nil {
		c.mu.Lock()
		c.status = StatusError
		c.lastError = err.Error()
		c.mu.Unlock()
		c.persistState(ctx)
		return nil, err
	}
	return result, nil
}

func (c *managedMCP) newClient(ctx context.Context) (client.Client, error) {
	switch c.cfg.Transport {
	case TransportStdio:
		cl := client.NewStdio(c.cfg.Command, c.cfg.Args, mergeStringMaps(c.cfg.Env, c.cfg.SecretEnv), c.logger)
		if err := cl.Initialize(ctx); err != nil {
			return nil, fmt.Errorf("mcp %s: initialize stdio client: %w", c.cfg.Name, err)
		}
		return cl, nil
	case TransportHTTP:
		cl := client.NewHTTP(c.cfg.URL, mergeStringMaps(c.cfg.Headers, c.cfg.SecretHeaders), c.logger)
		if err := cl.Initialize(ctx); err != nil {
			return nil, fmt.Errorf("mcp %s: initialize http client: %w", c.cfg.Name, err)
		}
		return cl, nil
	case TransportSSE:
		cl := client.NewSSE(c.cfg.URL, mergeStringMaps(c.cfg.Headers, c.cfg.SecretHeaders), c.logger)
		if err := cl.Initialize(ctx); err != nil {
			return nil, fmt.Errorf("mcp %s: initialize sse client: %w", c.cfg.Name, err)
		}
		return cl, nil
	case TransportREST:
		cl := client.NewREST(client.RESTConfig{
			Name:             c.cfg.Name,
			URLTemplate:      c.cfg.URLTemplate,
			Method:           c.cfg.Method,
			Headers:          mergeStringMaps(c.cfg.Headers, c.cfg.SecretHeaders),
			CredentialTarget: c.cfg.CredentialTarget,
			CredentialName:   c.cfg.CredentialName,
			InputSchema:      c.cfg.InputSchema,
			OutputSchema:     c.cfg.OutputSchema,
		}, c.logger)
		if err := cl.Initialize(ctx); err != nil {
			return nil, fmt.Errorf("mcp %s: initialize rest client: %w", c.cfg.Name, err)
		}
		return cl, nil
	default:
		return nil, fmt.Errorf("unsupported mcp transport %q", c.cfg.Transport)
	}
}

func (c *managedMCP) persistState(ctx context.Context) {
	if c.store == nil {
		return
	}
	if err := c.store.UpdateMCPState(ctx, c.cfg.ID, c.status, c.lastError); err != nil {
		c.logger.Warn("failed to persist mcp state", "mcp", c.cfg.Name, "error", err)
	}
}

type Manager struct {
	mu         sync.RWMutex
	mcps map[string]MCP
	logger     *slog.Logger
	store      RuntimeStore
}

func NewManager(logger *slog.Logger, store RuntimeStore) *Manager {
	return &Manager{mcps: make(map[string]MCP), logger: logger, store: store}
}

func (m *Manager) Add(cfg Config) MCP {
	mcp := New(cfg, m.logger, m.store)
	m.mu.Lock()
	m.mcps[cfg.ID] = mcp
	m.mu.Unlock()
	return mcp
}

func (m *Manager) Replace(ctx context.Context, cfg Config) error {
	if cfg.ID == "" {
		return fmt.Errorf("mcp id is required")
	}
	if current, ok := m.Get(cfg.ID); ok {
		if err := current.Stop(); err != nil {
			m.logger.Warn("mcp stop before replace failed", "mcp", cfg.Name, "error", err)
		}
	}
	next := New(cfg, m.logger, m.store)
	m.mu.Lock()
	m.mcps[cfg.ID] = next
	m.mu.Unlock()
	return next.Start(ctx)
}

func mergeStringMaps(base, extra map[string]string) map[string]string {
	if len(base) == 0 && len(extra) == 0 {
		return nil
	}
	out := make(map[string]string, len(base)+len(extra))
	for key, value := range base {
		out[key] = value
	}
	for key, value := range extra {
		out[key] = value
	}
	return out
}

func (m *Manager) Get(id string) (MCP, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	mcp, ok := m.mcps[id]
	return mcp, ok
}

func (m *Manager) All() []MCP {
	m.mu.RLock()
	defer m.mu.RUnlock()
	out := make([]MCP, 0, len(m.mcps))
	for _, mcp := range m.mcps {
		out = append(out, mcp)
	}
	return out
}

func (m *Manager) StartAll(ctx context.Context) error {
	var errs []error
	for _, mcp := range m.All() {
		if err := mcp.Start(ctx); err != nil {
			errs = append(errs, err)
		}
	}
	return errors.Join(errs...)
}

func (m *Manager) StopAll() error {
	var errs []error
	for _, mcp := range m.All() {
		if err := mcp.Stop(); err != nil {
			errs = append(errs, err)
		}
	}
	return errors.Join(errs...)
}

func (m *Manager) Reconnect(ctx context.Context, id string) error {
	mcp, ok := m.Get(id)
	if !ok {
		return fmt.Errorf("mcp %q not found", id)
	}
	return mcp.Reconnect(ctx)
}

func (m *Manager) Health() []Snapshot {
	mcps := m.All()
	out := make([]Snapshot, 0, len(mcps))
	for _, mcp := range mcps {
		out = append(out, mcp.Status())
	}
	return out
}

func (m *Manager) SyncRegistry(ctx context.Context, reg *registry.Registry) error {
	var errs []error
	for _, mcp := range m.All() {
		status := mcp.Status()
		reg.ResetMCPTools(status.ID)
		if status.Status != StatusConnected {
			continue
		}
		tools, err := mcp.ListTools(ctx)
		if err != nil {
			errs = append(errs, fmt.Errorf("mcp %s: %w", status.Name, err))
			continue
		}
		reg.RegisterMCPTools(status.ID, status.Namespace, tools)
	}
	return errors.Join(errs...)
}
