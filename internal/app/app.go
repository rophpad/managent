package app

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/rophpad/managent/internal/audit"
	"github.com/rophpad/managent/internal/authz"
	"github.com/rophpad/managent/internal/config"
	"github.com/rophpad/managent/internal/connector"
	"github.com/rophpad/managent/internal/database"
	"github.com/rophpad/managent/internal/gateway"
	"github.com/rophpad/managent/internal/marketplace"
	"github.com/rophpad/managent/internal/mcp/protocol"
	mcpserver "github.com/rophpad/managent/internal/mcp/server"
	"github.com/rophpad/managent/internal/middleware"
	authmiddleware "github.com/rophpad/managent/internal/middleware/auth"
	credentialmiddleware "github.com/rophpad/managent/internal/middleware/credential"
	logmiddleware "github.com/rophpad/managent/internal/middleware/logger"
	policymiddleware "github.com/rophpad/managent/internal/middleware/policy"
	validatormiddleware "github.com/rophpad/managent/internal/middleware/validator"
	"github.com/rophpad/managent/internal/policy"
	"github.com/rophpad/managent/internal/registry"
	"github.com/rophpad/managent/internal/router"
	"github.com/rophpad/managent/internal/secrets"
)

type Runtime struct {
	cfg        *config.Config
	logger     *slog.Logger
	audit      *audit.Logger
	registry   *registry.Registry
	connectors *connector.Manager
	httpServer *gateway.Server
	handler    *mcpserver.Handler
	db         *database.Store
	workspace  database.Workspace
	policies   *policy.Engine
}

type overviewResponse struct {
	Workspace  database.Workspace         `json:"workspace"`
	APIKeys    []database.APIKeyRecord    `json:"apiKeys"`
	Connectors []database.ConnectorRecord `json:"connectors"`
	Policies   []database.PolicyRecord    `json:"policies"`
	AuditLogs  []database.AuditLogRecord  `json:"auditLogs"`
}

func New(ctx context.Context, cfg *config.Config) (*Runtime, error) {
	logger := newLogger(cfg)
	secretCipher, err := secrets.NewCipher(cfg.Security.ConnectorSecretKey)
	if err != nil {
		return nil, fmt.Errorf("connector secret key: %w", err)
	}
	db, err := database.Open(ctx, cfg.Database, secretCipher)
	if err != nil {
		return nil, err
	}
	if cfg.Database.AutoMigrate {
		if err := db.Migrate(ctx, cfg.Database.SchemaPath); err != nil {
			return nil, err
		}
	}
	workspace, err := db.EnsureWorkspace(ctx, cfg.Database.WorkspaceName)
	if err != nil {
		return nil, fmt.Errorf("ensure workspace: %w", err)
	}
	if cfg.Database.SeedFromConfig {
		if err := db.SeedFromConfig(ctx, workspace, cfg); err != nil {
			return nil, fmt.Errorf("seed config: %w", err)
		}
	}

	logger = logger.With("workspace_id", workspace.ID)
	auditLogger := audit.NewLogger(logger, audit.NewStore(db))
	reg := registry.New()
	connMgr := connector.NewManager(logger, db)

	persistedConnectors, err := db.ListConnectorConfigs(ctx, workspace.ID)
	if err != nil {
		return nil, fmt.Errorf("load connectors: %w", err)
	}
	for _, cfgConnector := range persistedConnectors {
		connMgr.Add(cfgConnector)
	}
	if err := connMgr.StartAll(ctx); err != nil {
		logger.Warn("one or more connectors failed to start", "error", err)
	}
	if err := connMgr.SyncRegistry(ctx, reg); err != nil {
		logger.Warn("failed to synchronize connector tools", "error", err)
	}

	policyEngine := policy.NewEngine(logger)
	persistedRules, err := db.LoadPolicyRules(ctx, workspace.ID)
	if err != nil {
		return nil, fmt.Errorf("load policies: %w", err)
	}
	policyEngine.ReplaceRules(persistedRules)

	credentialStore := credentialmiddleware.NewStore()
	for _, rule := range cfg.CredentialInjection {
		credentialStore.AddRule(credentialmiddleware.Rule{Name: rule.Name, ToolPattern: rule.ToolPattern, Arguments: rule.Arguments})
	}

	rtr := router.New(reg, connMgr, logger)
	pipeline := middleware.Chain(
		[]middleware.Middleware{
			authmiddleware.NewMiddleware(db),
			logmiddleware.New(logger, auditLogger),
			policymiddleware.NewMiddleware(policyEngine, logger),
			validatormiddleware.New(reg),
			credentialmiddleware.NewMiddleware(credentialStore),
		},
		func(ctx context.Context, req middleware.Request) middleware.Response {
			result, err := rtr.CallTool(ctx, req.ToolCall())
			if err != nil {
				return middleware.Response{Error: err, Decision: "error", DecisionReason: err.Error()}
			}
			return middleware.Response{Result: result, Decision: "allow"}
		},
	)

	provider := &pipelineProvider{registry: reg, pipeline: pipeline}
	handler := mcpserver.NewHandler(provider, logger)
	httpServer := gateway.New(cfg, logger)
	httpServer.RegisterHandler(cfg.Gateway.Endpoint, withBearerContext(handler))
	httpServer.RegisterHandler(cfg.Gateway.Endpoint+"/sse", withBearerContext(http.HandlerFunc(handler.ServeSSE)))

	runtime := &Runtime{cfg: cfg, logger: logger, audit: auditLogger, registry: reg, connectors: connMgr, httpServer: httpServer, handler: handler, db: db, workspace: workspace, policies: policyEngine}
	runtime.registerControlPlaneRoutes()
	return runtime, nil
}

func (r *Runtime) registerControlPlaneRoutes() {
	r.httpServer.RegisterHandler("/api/v1/overview", r.adminOnly(http.HandlerFunc(r.handleOverview)))
	r.httpServer.RegisterHandler("/api/v1/api-keys", r.adminOnly(http.HandlerFunc(r.handleAPIKeys)))
	r.httpServer.RegisterHandler("/api/v1/connectors", r.adminOnly(http.HandlerFunc(r.handleConnectors)))
	r.httpServer.RegisterHandler("/api/v1/connectors/", r.adminOnly(http.HandlerFunc(r.handleConnectorActions)))
	r.httpServer.RegisterHandler("/api/v1/marketplace", r.adminOnly(http.HandlerFunc(r.handleMarketplace)))
	r.httpServer.RegisterHandler("/api/v1/policies", r.adminOnly(http.HandlerFunc(r.handlePolicies)))
	r.httpServer.RegisterHandler("/api/v1/audit-logs", r.adminOnly(http.HandlerFunc(r.handleAuditLogs)))
}

func (r *Runtime) StartHTTP() error {
	r.logger.Info("starting Managent gateway", "addr", r.cfg.Gateway.Addr(), "endpoint", r.cfg.Gateway.Endpoint)
	return r.httpServer.Start()
}

func (r *Runtime) ServeStdio(ctx context.Context, stdin io.Reader, stdout io.Writer) error {
	r.logger.Info("starting Managent stdio transport")
	return mcpserver.NewStdioServer(r.handler, r.logger).Serve(ctx, stdin, stdout)
}

func (r *Runtime) Shutdown(ctx context.Context) error {
	var errs []error
	if err := r.httpServer.Shutdown(ctx); err != nil {
		errs = append(errs, err)
	}
	if err := r.connectors.StopAll(); err != nil {
		errs = append(errs, err)
	}
	if r.db != nil {
		r.db.Close()
	}
	return errors.Join(errs...)
}

func (r *Runtime) Logger() *slog.Logger { return r.logger }
func (r *Runtime) Audit() *audit.Logger { return r.audit }

type pipelineProvider struct {
	registry *registry.Registry
	pipeline middleware.Handler
}

func (p *pipelineProvider) ListTools(_ context.Context) ([]protocol.Tool, error) {
	return p.registry.ListTools(), nil
}

func (p *pipelineProvider) CallTool(ctx context.Context, params protocol.ToolCallParams) (*protocol.ToolCallResult, error) {
	resp := p.pipeline(ctx, middleware.Request{Tool: params.Name, Arguments: params.Arguments})
	return resp.Result, resp.Error
}

func (r *Runtime) adminOnly(next http.Handler) http.Handler {
	if strings.TrimSpace(r.cfg.Admin.Token) == "" {
		return next
	}
	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		token := strings.TrimSpace(strings.TrimPrefix(req.Header.Get("Authorization"), "Bearer "))
		if token != r.cfg.Admin.Token {
			writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
			return
		}
		next.ServeHTTP(w, req)
	})
}

func (r *Runtime) handleOverview(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"error": "method not allowed"})
		return
	}
	apiKeys, err := r.db.ListAPIKeys(req.Context(), r.workspace.ID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}
	connectors, err := r.db.ListConnectors(req.Context(), r.workspace.ID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}
	policies, err := r.db.ListPolicies(req.Context(), r.workspace.ID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}
	auditLogs, err := r.db.ListAuditLogs(req.Context(), r.workspace.ID, 50)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, overviewResponse{Workspace: r.workspace, APIKeys: apiKeys, Connectors: connectors, Policies: policies, AuditLogs: auditLogs})
}

func (r *Runtime) handleAPIKeys(w http.ResponseWriter, req *http.Request) {
	switch req.Method {
	case http.MethodGet:
		apiKeys, err := r.db.ListAPIKeys(req.Context(), r.workspace.ID)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"items": apiKeys})
	case http.MethodPost:
		rawToken, err := authz.GenerateAPIKey()
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
			return
		}
		record, err := r.db.CreateAPIKey(req.Context(), r.workspace.ID, rawToken)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusCreated, database.APIKeyCreateResult{Record: record, RawToken: rawToken})
	default:
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"error": "method not allowed"})
	}
}

type connectorPayload struct {
	Name          string            `json:"name"`
	Namespace     string            `json:"namespace"`
	Transport     string            `json:"transport"`
	Command       string            `json:"command"`
	Args          []string          `json:"args"`
	URL           string            `json:"url"`
	Headers       map[string]string `json:"headers"`
	Env           map[string]string `json:"env"`
	SecretEnv     map[string]string `json:"secretEnv"`
	SecretHeaders map[string]string `json:"secretHeaders"`
	Enabled       bool              `json:"enabled"`
}

func buildConnectorConfigFromPayload(payload connectorPayload) (connector.Config, error) {
	cfg := connector.Config{
		Name:          strings.TrimSpace(payload.Name),
		Namespace:     strings.TrimSpace(payload.Namespace),
		Transport:     connector.Transport(strings.TrimSpace(payload.Transport)),
		Command:       strings.TrimSpace(payload.Command),
		Args:          append([]string{}, payload.Args...),
		URL:           strings.TrimSpace(payload.URL),
		Headers:       payload.Headers,
		Env:           payload.Env,
		SecretEnv:     payload.SecretEnv,
		SecretHeaders: payload.SecretHeaders,
		Enabled:       payload.Enabled,
	}
	switch cfg.Transport {
	case connector.TransportStdio:
		if cfg.Command == "" {
			return connector.Config{}, fmt.Errorf("stdio connectors require a command")
		}
		cfg.URL = ""
		cfg.Headers = nil
		cfg.SecretHeaders = nil
	case connector.TransportHTTP, connector.TransportSSE:
		if cfg.URL == "" {
			return connector.Config{}, fmt.Errorf("%s connectors require a url", payload.Transport)
		}
		cfg.Command = ""
		cfg.Args = nil
		cfg.Env = nil
		cfg.SecretEnv = nil
	default:
		return connector.Config{}, fmt.Errorf("unsupported connector transport %q", payload.Transport)
	}
	return cfg, nil
}

func mergeConnectorSecrets(current, update map[string]string) map[string]string {
	if len(current) == 0 && len(update) == 0 {
		return nil
	}
	out := make(map[string]string, len(current)+len(update))
	for key, value := range current {
		if strings.TrimSpace(key) == "" || value == "" {
			continue
		}
		out[key] = value
	}
	for key, value := range update {
		trimmedKey := strings.TrimSpace(key)
		if trimmedKey == "" || value == "" {
			continue
		}
		out[trimmedKey] = value
	}
	if len(out) == 0 {
		return nil
	}
	return out
}

func (r *Runtime) refreshedConnectorRecord(ctx context.Context, fallback database.ConnectorRecord) database.ConnectorRecord {
	updated, err := r.db.ListConnectors(ctx, r.workspace.ID)
	if err != nil {
		return fallback
	}
	for _, item := range updated {
		if item.ID == fallback.ID {
			return item
		}
	}
	return fallback
}

func (r *Runtime) applyConnectorConfig(ctx context.Context, cfg connector.Config, syncWarning string) (database.ConnectorRecord, error) {
	record, err := r.db.UpdateConnector(ctx, r.workspace.ID, cfg)
	if err != nil {
		return database.ConnectorRecord{}, err
	}
	if err := r.db.ReplaceConnectorTools(ctx, record.ID, nil); err != nil {
		return database.ConnectorRecord{}, err
	}
	if startErr := r.connectors.Replace(ctx, cfg); startErr != nil {
		record.Status = string(connector.StatusError)
		record.LastError = startErr.Error()
	}
	if err := r.connectors.SyncRegistry(ctx, r.registry); err != nil {
		r.logger.Warn(syncWarning, "error", err)
	}
	return r.refreshedConnectorRecord(ctx, record), nil
}

func (r *Runtime) handleConnectors(w http.ResponseWriter, req *http.Request) {
	switch req.Method {
	case http.MethodGet:
		connectors, err := r.db.ListConnectors(req.Context(), r.workspace.ID)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"items": connectors})
	case http.MethodPost:
		var payload connectorPayload
		if err := json.NewDecoder(req.Body).Decode(&payload); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]any{"error": err.Error()})
			return
		}
		cfg, err := buildConnectorConfigFromPayload(payload)
		if err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]any{"error": err.Error()})
			return
		}
		record, err := r.db.CreateConnector(req.Context(), r.workspace.ID, cfg)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
			return
		}
		cfg.ID = record.ID
		if startErr := r.connectors.Replace(req.Context(), cfg); startErr != nil {
			record.Status = string(connector.StatusError)
			record.LastError = startErr.Error()
		}
		if err := r.connectors.SyncRegistry(req.Context(), r.registry); err != nil {
			r.logger.Warn("registry sync failed after connector create", "error", err)
		}
		writeJSON(w, http.StatusCreated, r.refreshedConnectorRecord(req.Context(), record))
	default:
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"error": "method not allowed"})
	}
}

func (r *Runtime) handleConnectorActions(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"error": "method not allowed"})
		return
	}
	path := strings.TrimPrefix(req.URL.Path, "/api/v1/connectors/")
	parts := strings.Split(strings.Trim(path, "/"), "/")
	if len(parts) != 2 {
		writeJSON(w, http.StatusNotFound, map[string]any{"error": "not found"})
		return
	}
	id := parts[0]
	action := parts[1]
	switch action {
	case "reconnect":
		if err := r.db.ReplaceConnectorTools(req.Context(), id, nil); err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
			return
		}
		if err := r.connectors.Reconnect(req.Context(), id); err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
			return
		}
		if err := r.connectors.SyncRegistry(req.Context(), r.registry); err != nil {
			r.logger.Warn("registry sync failed after connector reconnect", "error", err)
		}
		writeJSON(w, http.StatusOK, map[string]any{"status": "reconnected"})
	case "connect":
		cfg, err := r.db.GetConnectorConfig(req.Context(), r.workspace.ID, id)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
			return
		}
		cfg.Enabled = true
		record, err := r.applyConnectorConfig(req.Context(), cfg, "registry sync failed after connector connect")
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, record)
	case "disconnect":
		cfg, err := r.db.GetConnectorConfig(req.Context(), r.workspace.ID, id)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
			return
		}
		cfg.Enabled = false
		record, err := r.applyConnectorConfig(req.Context(), cfg, "registry sync failed after connector disconnect")
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, record)
	case "update":
		var payload connectorPayload
		if err := json.NewDecoder(req.Body).Decode(&payload); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]any{"error": err.Error()})
			return
		}
		current, err := r.db.GetConnectorConfig(req.Context(), r.workspace.ID, id)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
			return
		}
		cfg, err := buildConnectorConfigFromPayload(payload)
		if err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]any{"error": err.Error()})
			return
		}
		cfg.ID = id
		cfg.Enabled = current.Enabled
		if cfg.Transport == connector.TransportStdio {
			cfg.SecretEnv = mergeConnectorSecrets(current.SecretEnv, payload.SecretEnv)
			cfg.SecretHeaders = nil
		} else {
			cfg.SecretHeaders = mergeConnectorSecrets(current.SecretHeaders, payload.SecretHeaders)
			cfg.SecretEnv = nil
		}
		record, err := r.applyConnectorConfig(req.Context(), cfg, "registry sync failed after connector update")
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, record)
	default:
		writeJSON(w, http.StatusNotFound, map[string]any{"error": "not found"})
	}
}

func (r *Runtime) handleMarketplace(w http.ResponseWriter, req *http.Request) {
	switch req.Method {
	case http.MethodGet:
		writeJSON(w, http.StatusOK, map[string]any{"items": marketplace.Catalog()})
	case http.MethodPost:
		var payload struct {
			Slug            string            `json:"slug"`
			TransportOption string            `json:"transportOption"`
			Name            string            `json:"name"`
			Namespace       string            `json:"namespace"`
			Values          map[string]string `json:"values"`
		}
		if err := json.NewDecoder(req.Body).Decode(&payload); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]any{"error": err.Error()})
			return
		}
		listing, ok := marketplace.Get(payload.Slug)
		if !ok {
			writeJSON(w, http.StatusNotFound, map[string]any{"error": "marketplace listing not found"})
			return
		}
		cfg, err := marketplace.BuildConnector(listing, payload.TransportOption, payload.Name, payload.Namespace, payload.Values)
		if err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]any{"error": err.Error()})
			return
		}
		record, err := r.db.CreateConnector(req.Context(), r.workspace.ID, cfg)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
			return
		}
		cfg.ID = record.ID
		r.connectors.Add(cfg)
		startErr := r.connectors.Reconnect(req.Context(), record.ID)
		if err := r.connectors.SyncRegistry(req.Context(), r.registry); err != nil {
			r.logger.Warn("registry sync failed after marketplace install", "error", err)
		}
		if startErr != nil {
			record.Status = string(connector.StatusError)
			record.LastError = startErr.Error()
		}
		updated, err := r.db.ListConnectors(req.Context(), r.workspace.ID)
		if err == nil {
			for _, item := range updated {
				if item.ID == record.ID {
					record = item
					break
				}
			}
		}
		writeJSON(w, http.StatusCreated, record)
	default:
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"error": "method not allowed"})
	}
}

func (r *Runtime) handlePolicies(w http.ResponseWriter, req *http.Request) {
	switch req.Method {
	case http.MethodGet:
		policies, err := r.db.ListPolicies(req.Context(), r.workspace.ID)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"items": policies})
	case http.MethodPost:
		var payload struct {
			Name       string                            `json:"name"`
			Tool       string                            `json:"tool"`
			Action     string                            `json:"action"`
			Conditions map[string]config.ConditionConfig `json:"conditions"`
		}
		if err := json.NewDecoder(req.Body).Decode(&payload); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]any{"error": err.Error()})
			return
		}
		record, err := r.db.CreatePolicy(req.Context(), r.workspace.ID, database.PolicyRecord{Name: payload.Name, Tool: payload.Tool, Action: payload.Action, Conditions: payload.Conditions})
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
			return
		}
		rules, err := r.db.LoadPolicyRules(req.Context(), r.workspace.ID)
		if err == nil {
			r.policies.ReplaceRules(rules)
		}
		writeJSON(w, http.StatusCreated, record)
	default:
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"error": "method not allowed"})
	}
}

func (r *Runtime) handleAuditLogs(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"error": "method not allowed"})
		return
	}
	limit := 50
	if raw := req.URL.Query().Get("limit"); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil && parsed > 0 {
			limit = parsed
		}
	}
	logs, err := r.db.ListAuditLogs(req.Context(), r.workspace.ID, limit)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": logs})
}

func withBearerContext(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		bearer := strings.TrimSpace(strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer "))
		ctx := authmiddleware.ContextWithBearer(r.Context(), bearer)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func newLogger(cfg *config.Config) *slog.Logger {
	level := slog.LevelInfo
	switch cfg.Log.Level {
	case "debug":
		level = slog.LevelDebug
	case "warn":
		level = slog.LevelWarn
	case "error":
		level = slog.LevelError
	}
	opts := &slog.HandlerOptions{Level: level}
	if cfg.Log.Format == "text" {
		return slog.New(slog.NewTextHandler(os.Stdout, opts))
	}
	return slog.New(slog.NewJSONHandler(os.Stdout, opts))
}
