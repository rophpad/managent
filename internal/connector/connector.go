package connector

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

	StatusDisconnected Status = "disconnected"
	StatusConnected    Status = "connected"
	StatusError        Status = "error"
)

type Config struct {
	ID            string
	Name          string
	Namespace     string
	Transport     Transport
	Command       string
	Args          []string
	URL           string
	Headers       map[string]string
	Env           map[string]string
	SecretEnv     map[string]string
	SecretHeaders map[string]string
	Enabled       bool
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
	UpdateConnectorState(ctx context.Context, id string, status Status, lastError string) error
	ReplaceConnectorTools(ctx context.Context, id string, tools []protocol.Tool) error
}

type Connector interface {
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

type managedConnector struct {
	cfg       Config
	logger    *slog.Logger
	store     RuntimeStore
	mu        sync.RWMutex
	client    client.Client
	status    Status
	lastError string
	toolCount int
}

func New(cfg Config, logger *slog.Logger, store RuntimeStore) Connector {
	if cfg.Namespace == "" {
		cfg.Namespace = cfg.Name
	}
	return &managedConnector{cfg: cfg, logger: logger, store: store, status: StatusDisconnected}
}

func (c *managedConnector) ID() string        { return c.cfg.ID }
func (c *managedConnector) Name() string      { return c.cfg.Name }
func (c *managedConnector) Namespace() string { return c.cfg.Namespace }

func (c *managedConnector) Start(ctx context.Context) error {
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
		return fmt.Errorf("connector %s: list tools: %w", c.cfg.Name, err)
	}

	c.client = cl
	c.status = StatusConnected
	c.lastError = ""
	c.toolCount = len(tools)
	c.persistState(ctx)
	if c.store != nil {
		if err := c.store.ReplaceConnectorTools(ctx, c.cfg.ID, tools); err != nil {
			c.logger.Warn("failed to persist connector tools", "connector", c.cfg.Name, "error", err)
		}
	}
	c.logger.Info("connector started", "connector", c.cfg.Name, "transport", c.cfg.Transport, "tools", len(tools))
	return nil
}

func (c *managedConnector) Stop() error {
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

func (c *managedConnector) Reconnect(ctx context.Context) error {
	if err := c.Stop(); err != nil {
		c.logger.Warn("connector stop before reconnect failed", "connector", c.cfg.Name, "error", err)
	}
	return c.Start(ctx)
}

func (c *managedConnector) Status() Snapshot {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return Snapshot{ID: c.cfg.ID, Name: c.cfg.Name, Namespace: c.cfg.Namespace, Transport: c.cfg.Transport, Status: c.status, LastError: c.lastError, ToolCount: c.toolCount}
}

func (c *managedConnector) ListTools(ctx context.Context) ([]protocol.Tool, error) {
	c.mu.RLock()
	cl := c.client
	c.mu.RUnlock()
	if cl == nil {
		return nil, fmt.Errorf("connector %s is not connected", c.cfg.Name)
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
		if err := c.store.ReplaceConnectorTools(ctx, c.cfg.ID, tools); err != nil {
			c.logger.Warn("failed to persist connector tools", "connector", c.cfg.Name, "error", err)
		}
	}
	return tools, nil
}

func (c *managedConnector) CallTool(ctx context.Context, req protocol.ToolCallParams) (*protocol.ToolCallResult, error) {
	c.mu.RLock()
	cl := c.client
	c.mu.RUnlock()
	if cl == nil {
		return nil, fmt.Errorf("connector %s is not connected", c.cfg.Name)
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

func (c *managedConnector) newClient(ctx context.Context) (client.Client, error) {
	switch c.cfg.Transport {
	case TransportStdio:
		cl := client.NewStdio(c.cfg.Command, c.cfg.Args, mergeStringMaps(c.cfg.Env, c.cfg.SecretEnv), c.logger)
		if err := cl.Initialize(ctx); err != nil {
			return nil, fmt.Errorf("connector %s: initialize stdio client: %w", c.cfg.Name, err)
		}
		return cl, nil
	case TransportHTTP:
		cl := client.NewHTTP(c.cfg.URL, mergeStringMaps(c.cfg.Headers, c.cfg.SecretHeaders), c.logger)
		if err := cl.Initialize(ctx); err != nil {
			return nil, fmt.Errorf("connector %s: initialize http client: %w", c.cfg.Name, err)
		}
		return cl, nil
	case TransportSSE:
		cl := client.NewSSE(c.cfg.URL, mergeStringMaps(c.cfg.Headers, c.cfg.SecretHeaders), c.logger)
		if err := cl.Initialize(ctx); err != nil {
			return nil, fmt.Errorf("connector %s: initialize sse client: %w", c.cfg.Name, err)
		}
		return cl, nil
	default:
		return nil, fmt.Errorf("unsupported connector transport %q", c.cfg.Transport)
	}
}

func (c *managedConnector) persistState(ctx context.Context) {
	if c.store == nil {
		return
	}
	if err := c.store.UpdateConnectorState(ctx, c.cfg.ID, c.status, c.lastError); err != nil {
		c.logger.Warn("failed to persist connector state", "connector", c.cfg.Name, "error", err)
	}
}

type Manager struct {
	mu         sync.RWMutex
	connectors map[string]Connector
	logger     *slog.Logger
	store      RuntimeStore
}

func NewManager(logger *slog.Logger, store RuntimeStore) *Manager {
	return &Manager{connectors: make(map[string]Connector), logger: logger, store: store}
}

func (m *Manager) Add(cfg Config) Connector {
	connector := New(cfg, m.logger, m.store)
	m.mu.Lock()
	m.connectors[cfg.ID] = connector
	m.mu.Unlock()
	return connector
}

func (m *Manager) Replace(ctx context.Context, cfg Config) error {
	if cfg.ID == "" {
		return fmt.Errorf("connector id is required")
	}
	if current, ok := m.Get(cfg.ID); ok {
		if err := current.Stop(); err != nil {
			m.logger.Warn("connector stop before replace failed", "connector", cfg.Name, "error", err)
		}
	}
	next := New(cfg, m.logger, m.store)
	m.mu.Lock()
	m.connectors[cfg.ID] = next
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

func (m *Manager) Get(id string) (Connector, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	connector, ok := m.connectors[id]
	return connector, ok
}

func (m *Manager) All() []Connector {
	m.mu.RLock()
	defer m.mu.RUnlock()
	out := make([]Connector, 0, len(m.connectors))
	for _, connector := range m.connectors {
		out = append(out, connector)
	}
	return out
}

func (m *Manager) StartAll(ctx context.Context) error {
	var errs []error
	for _, connector := range m.All() {
		if err := connector.Start(ctx); err != nil {
			errs = append(errs, err)
		}
	}
	return errors.Join(errs...)
}

func (m *Manager) StopAll() error {
	var errs []error
	for _, connector := range m.All() {
		if err := connector.Stop(); err != nil {
			errs = append(errs, err)
		}
	}
	return errors.Join(errs...)
}

func (m *Manager) Reconnect(ctx context.Context, id string) error {
	connector, ok := m.Get(id)
	if !ok {
		return fmt.Errorf("connector %q not found", id)
	}
	return connector.Reconnect(ctx)
}

func (m *Manager) Health() []Snapshot {
	connectors := m.All()
	out := make([]Snapshot, 0, len(connectors))
	for _, connector := range connectors {
		out = append(out, connector.Status())
	}
	return out
}

func (m *Manager) SyncRegistry(ctx context.Context, reg *registry.Registry) error {
	var errs []error
	for _, connector := range m.All() {
		status := connector.Status()
		reg.ResetConnectorTools(status.ID)
		if status.Status != StatusConnected {
			continue
		}
		tools, err := connector.ListTools(ctx)
		if err != nil {
			errs = append(errs, fmt.Errorf("connector %s: %w", status.Name, err))
			continue
		}
		reg.RegisterConnectorTools(status.ID, status.Namespace, tools)
	}
	return errors.Join(errs...)
}
