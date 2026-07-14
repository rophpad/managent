package database

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rophpad/managent/internal/authz"
	"github.com/rophpad/managent/internal/config"
	"github.com/rophpad/managent/internal/connector"
	"github.com/rophpad/managent/internal/mcp/protocol"
	policyengine "github.com/rophpad/managent/internal/policy"
	"github.com/rophpad/managent/internal/secrets"
)

type Store struct {
	pool   *pgxpool.Pool
	cipher *secrets.Cipher
}

const (
	secretScopeEnv    = "env"
	secretScopeHeader = "header"
)

type Workspace struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
}

type APIKeyRecord struct {
	ID          string    `json:"id"`
	WorkspaceID string    `json:"workspaceId"`
	CreatedAt   time.Time `json:"createdAt"`
}

type APIKeyCreateResult struct {
	Record   APIKeyRecord `json:"record"`
	RawToken string       `json:"rawToken"`
}

type ConnectorRecord struct {
	ID               string            `json:"id"`
	WorkspaceID      string            `json:"workspaceId"`
	Name             string            `json:"name"`
	Namespace        string            `json:"namespace"`
	Transport        string            `json:"transport"`
	Command          string            `json:"command,omitempty"`
	Args             []string          `json:"args,omitempty"`
	URL              string            `json:"url,omitempty"`
	Headers          map[string]string `json:"headers,omitempty"`
	Env              map[string]string `json:"env,omitempty"`
	SecretEnvKeys    []string          `json:"secretEnvKeys,omitempty"`
	SecretHeaderKeys []string          `json:"secretHeaderKeys,omitempty"`
	Enabled          bool              `json:"enabled"`
	Status           string            `json:"status"`
	LastError        string            `json:"lastError,omitempty"`
	CreatedAt        time.Time         `json:"createdAt"`
	UpdatedAt        time.Time         `json:"updatedAt"`
	Tools            []ToolRecord      `json:"tools,omitempty"`
	RawConfig        map[string]any    `json:"rawConfig,omitempty"`
}

type ToolRecord struct {
	Name   string         `json:"name"`
	Schema map[string]any `json:"schema"`
}

type PolicyRecord struct {
	ID          string                            `json:"id"`
	WorkspaceID string                            `json:"workspaceId"`
	Name        string                            `json:"name"`
	Tool        string                            `json:"tool"`
	Action      string                            `json:"action"`
	Conditions  map[string]config.ConditionConfig `json:"conditions,omitempty"`
	CreatedAt   time.Time                         `json:"createdAt"`
}

type AuditLogRecord struct {
	ID          string         `json:"id"`
	WorkspaceID string         `json:"workspaceId"`
	Tool        string         `json:"tool"`
	Request     map[string]any `json:"request"`
	Response    map[string]any `json:"response,omitempty"`
	Decision    string         `json:"decision"`
	CreatedAt   time.Time      `json:"createdAt"`
}

func Open(ctx context.Context, cfg config.DatabaseConfig, cipher *secrets.Cipher) (*Store, error) {
	if strings.TrimSpace(cfg.URL) == "" {
		return nil, fmt.Errorf("MANAGENT_DATABASE_URL is required")
	}
	pool, err := pgxpool.New(ctx, cfg.URL)
	if err != nil {
		return nil, fmt.Errorf("connect postgres: %w", err)
	}
	return &Store{pool: pool, cipher: cipher}, nil
}

func (s *Store) Close() {
	if s != nil && s.pool != nil {
		s.pool.Close()
	}
}

func (s *Store) Migrate(ctx context.Context, schemaPath string) error {
	data, err := os.ReadFile(filepath.Clean(schemaPath))
	if err != nil {
		return fmt.Errorf("read schema: %w", err)
	}
	if _, err := s.pool.Exec(ctx, string(data)); err != nil {
		return fmt.Errorf("apply schema: %w", err)
	}
	return nil
}

func (s *Store) EnsureWorkspace(ctx context.Context, name string) (Workspace, error) {
	var ws Workspace
	err := s.pool.QueryRow(ctx, `
		insert into workspaces (name)
		values ($1)
		on conflict (name) do update set name = excluded.name
		returning id, name
	`, name).Scan(&ws.ID, &ws.Name)
	return ws, err
}

func (s *Store) SeedFromConfig(ctx context.Context, workspace Workspace, cfg *config.Config) error {
	if err := s.seedAPIKeys(ctx, workspace, cfg.Auth.APIKeys); err != nil {
		return err
	}
	if err := s.seedPolicies(ctx, workspace, cfg.Policies); err != nil {
		return err
	}
	if err := s.seedConnectors(ctx, workspace, cfg.Connectors); err != nil {
		return err
	}
	return nil
}

func (s *Store) seedAPIKeys(ctx context.Context, workspace Workspace, keys []config.APIKeyConfig) error {
	var count int
	if err := s.pool.QueryRow(ctx, `select count(*) from api_keys where workspace_id = $1`, workspace.ID).Scan(&count); err != nil {
		return err
	}
	if count > 0 {
		return nil
	}
	for _, key := range keys {
		if strings.TrimSpace(key.Key) == "" {
			continue
		}
		if _, err := s.pool.Exec(ctx, `insert into api_keys (workspace_id, hash) values ($1, $2)`, workspace.ID, authz.HashKey(key.Key)); err != nil {
			return err
		}
	}
	return nil
}

func (s *Store) seedPolicies(ctx context.Context, workspace Workspace, rules []config.PolicyConfig) error {
	var count int
	if err := s.pool.QueryRow(ctx, `select count(*) from policies where workspace_id = $1`, workspace.ID).Scan(&count); err != nil {
		return err
	}
	if count > 0 {
		return nil
	}
	for _, rule := range rules {
		ruleJSON, err := json.Marshal(map[string]any{"name": rule.Name, "tool": rule.Tool, "conditions": rule.Conditions})
		if err != nil {
			return err
		}
		if _, err := s.pool.Exec(ctx, `insert into policies (workspace_id, rule, action) values ($1, $2, $3)`, workspace.ID, ruleJSON, rule.Action); err != nil {
			return err
		}
	}
	return nil
}

func (s *Store) seedConnectors(ctx context.Context, workspace Workspace, connectors []config.ConnectorConfig) error {
	var count int
	if err := s.pool.QueryRow(ctx, `select count(*) from connectors where workspace_id = $1`, workspace.ID).Scan(&count); err != nil {
		return err
	}
	if count > 0 {
		return nil
	}
	for _, cfgConnector := range connectors {
		cfgJSON, err := json.Marshal(map[string]any{
			"id":        cfgConnector.ID,
			"namespace": cfgConnector.Namespace,
			"command":   cfgConnector.Command,
			"args":      cfgConnector.Args,
			"url":       cfgConnector.URL,
			"headers":   cfgConnector.Headers,
			"env":       cfgConnector.Env,
			"enabled":   connectorEnabled(cfgConnector.Enabled),
		})
		if err != nil {
			return err
		}
		var connectorID int64
		if err := s.pool.QueryRow(ctx, `insert into connectors (workspace_id, name, transport, configuration, status) values ($1, $2, $3, $4, $5) returning id`, workspace.ID, cfgConnector.Name, cfgConnector.Transport, cfgJSON, "disconnected").Scan(&connectorID); err != nil {
			return err
		}
		if err := s.replaceConnectorSecrets(ctx, connectorID, cfgConnector.SecretEnv, cfgConnector.SecretHeaders); err != nil {
			return err
		}
	}
	return nil
}

func (s *Store) ValidateAPIKey(ctx context.Context, rawKey string) (authz.APIKey, bool, error) {
	row := s.pool.QueryRow(ctx, `select id, workspace_id, hash from api_keys where hash = $1`, authz.HashKey(rawKey))
	var id int64
	var workspaceID int64
	var hash string
	if err := row.Scan(&id, &workspaceID, &hash); err != nil {
		if err == pgx.ErrNoRows {
			return authz.APIKey{}, false, nil
		}
		return authz.APIKey{}, false, err
	}
	return authz.APIKey{ID: strconv.FormatInt(id, 10), WorkspaceID: strconv.FormatInt(workspaceID, 10), HashedKey: hash}, true, nil
}

func (s *Store) ListAPIKeys(ctx context.Context, workspaceID int64) ([]APIKeyRecord, error) {
	rows, err := s.pool.Query(ctx, `select id, workspace_id, created_at from api_keys where workspace_id = $1 order by created_at desc`, workspaceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []APIKeyRecord
	for rows.Next() {
		var id int64
		var wsID int64
		var createdAt time.Time
		if err := rows.Scan(&id, &wsID, &createdAt); err != nil {
			return nil, err
		}
		out = append(out, APIKeyRecord{ID: strconv.FormatInt(id, 10), WorkspaceID: strconv.FormatInt(wsID, 10), CreatedAt: createdAt})
	}
	return out, rows.Err()
}

func (s *Store) CreateAPIKey(ctx context.Context, workspaceID int64, rawToken string) (APIKeyRecord, error) {
	var id int64
	var createdAt time.Time
	if err := s.pool.QueryRow(ctx, `insert into api_keys (workspace_id, hash) values ($1, $2) returning id, created_at`, workspaceID, authz.HashKey(rawToken)).Scan(&id, &createdAt); err != nil {
		return APIKeyRecord{}, err
	}
	return APIKeyRecord{ID: strconv.FormatInt(id, 10), WorkspaceID: strconv.FormatInt(workspaceID, 10), CreatedAt: createdAt}, nil
}

func (s *Store) ListConnectorConfigs(ctx context.Context, workspaceID int64) ([]connector.Config, error) {
	rows, err := s.pool.Query(ctx, `select id, name, transport, configuration from connectors where workspace_id = $1 order by created_at asc`, workspaceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []connector.Config
	for rows.Next() {
		var id int64
		var name, transport string
		var raw []byte
		if err := rows.Scan(&id, &name, &transport, &raw); err != nil {
			return nil, err
		}
		var cfg struct {
			ID        string            `json:"id"`
			Namespace string            `json:"namespace"`
			Command   string            `json:"command"`
			Args      []string          `json:"args"`
			URL       string            `json:"url"`
			Headers   map[string]string `json:"headers"`
			Env       map[string]string `json:"env"`
			Enabled   bool              `json:"enabled"`
		}
		if len(raw) > 0 {
			if err := json.Unmarshal(raw, &cfg); err != nil {
				return nil, err
			}
		}
		secretEnv, secretHeaders, err := s.listConnectorSecrets(ctx, id)
		if err != nil {
			return nil, err
		}
		out = append(out, connector.Config{ID: strconv.FormatInt(id, 10), Name: name, Namespace: cfg.Namespace, Transport: connector.Transport(transport), Command: cfg.Command, Args: cfg.Args, URL: cfg.URL, Headers: cfg.Headers, Env: cfg.Env, SecretEnv: secretEnv, SecretHeaders: secretHeaders, Enabled: cfg.Enabled})
	}
	return out, rows.Err()
}

func (s *Store) ListConnectors(ctx context.Context, workspaceID int64) ([]ConnectorRecord, error) {
	rows, err := s.pool.Query(ctx, `select id, workspace_id, name, transport, configuration, status, coalesce(last_error, ''), created_at, updated_at from connectors where workspace_id = $1 order by created_at asc`, workspaceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []ConnectorRecord
	for rows.Next() {
		var id, wsID int64
		var name, transport, status, lastError string
		var raw []byte
		var createdAt, updatedAt time.Time
		if err := rows.Scan(&id, &wsID, &name, &transport, &raw, &status, &lastError, &createdAt, &updatedAt); err != nil {
			return nil, err
		}
		record, err := decodeConnectorRecord(id, wsID, name, transport, status, lastError, createdAt, updatedAt, raw)
		if err != nil {
			return nil, err
		}
		envKeys, headerKeys, err := s.listConnectorSecretKeys(ctx, id)
		if err != nil {
			return nil, err
		}
		record.SecretEnvKeys = envKeys
		record.SecretHeaderKeys = headerKeys
		tools, err := s.listToolsByConnector(ctx, id)
		if err != nil {
			return nil, err
		}
		record.Tools = tools
		out = append(out, record)
	}
	return out, rows.Err()
}

func decodeConnectorRecord(id, wsID int64, name, transport, status, lastError string, createdAt, updatedAt time.Time, raw []byte) (ConnectorRecord, error) {
	var configMap map[string]any
	if len(raw) > 0 {
		if err := json.Unmarshal(raw, &configMap); err != nil {
			return ConnectorRecord{}, err
		}
	}
	args, _ := toStringSlice(configMap["args"])
	env, _ := toStringMap(configMap["env"])
	headers, _ := toStringMap(configMap["headers"])
	namespace, _ := configMap["namespace"].(string)
	command, _ := configMap["command"].(string)
	url, _ := configMap["url"].(string)
	enabled, _ := configMap["enabled"].(bool)
	return ConnectorRecord{ID: strconv.FormatInt(id, 10), WorkspaceID: strconv.FormatInt(wsID, 10), Name: name, Namespace: namespace, Transport: transport, Command: command, Args: args, URL: url, Headers: headers, Env: env, Enabled: enabled, Status: status, LastError: lastError, CreatedAt: createdAt, UpdatedAt: updatedAt, RawConfig: configMap}, nil
}

func (s *Store) CreateConnector(ctx context.Context, workspaceID int64, cfg connector.Config) (ConnectorRecord, error) {
	configJSON, err := json.Marshal(map[string]any{"namespace": cfg.Namespace, "command": cfg.Command, "args": cfg.Args, "url": cfg.URL, "headers": cfg.Headers, "env": cfg.Env, "enabled": cfg.Enabled})
	if err != nil {
		return ConnectorRecord{}, err
	}
	var record ConnectorRecord
	err = withTx(ctx, s.pool, func(tx pgx.Tx) error {
		var id int64
		var createdAt, updatedAt time.Time
		if err := tx.QueryRow(ctx, `insert into connectors (workspace_id, name, transport, configuration, status, updated_at) values ($1, $2, $3, $4, $5, now()) returning id, created_at, updated_at`, workspaceID, cfg.Name, string(cfg.Transport), configJSON, "disconnected").Scan(&id, &createdAt, &updatedAt); err != nil {
			return err
		}
		if err := s.replaceConnectorSecretsTx(ctx, tx, id, cfg.SecretEnv, cfg.SecretHeaders); err != nil {
			return err
		}
		record = ConnectorRecord{ID: strconv.FormatInt(id, 10), WorkspaceID: strconv.FormatInt(workspaceID, 10), Name: cfg.Name, Namespace: cfg.Namespace, Transport: string(cfg.Transport), Command: cfg.Command, Args: cfg.Args, URL: cfg.URL, Headers: cfg.Headers, Env: cfg.Env, SecretEnvKeys: sortedKeys(cfg.SecretEnv), SecretHeaderKeys: sortedKeys(cfg.SecretHeaders), Enabled: cfg.Enabled, Status: "disconnected", CreatedAt: createdAt, UpdatedAt: updatedAt}
		return nil
	})
	return record, err
}

func (s *Store) GetConnectorConfig(ctx context.Context, workspaceID int64, id string) (connector.Config, error) {
	connID, err := strconv.ParseInt(id, 10, 64)
	if err != nil {
		return connector.Config{}, err
	}
	var name, transport string
	var raw []byte
	if err := s.pool.QueryRow(ctx, `select name, transport, configuration from connectors where workspace_id = $1 and id = $2`, workspaceID, connID).Scan(&name, &transport, &raw); err != nil {
		return connector.Config{}, err
	}
	var cfg struct {
		Namespace string            `json:"namespace"`
		Command   string            `json:"command"`
		Args      []string          `json:"args"`
		URL       string            `json:"url"`
		Headers   map[string]string `json:"headers"`
		Env       map[string]string `json:"env"`
		Enabled   bool              `json:"enabled"`
	}
	if len(raw) > 0 {
		if err := json.Unmarshal(raw, &cfg); err != nil {
			return connector.Config{}, err
		}
	}
	secretEnv, secretHeaders, err := s.listConnectorSecrets(ctx, connID)
	if err != nil {
		return connector.Config{}, err
	}
	return connector.Config{ID: id, Name: name, Namespace: cfg.Namespace, Transport: connector.Transport(transport), Command: cfg.Command, Args: cfg.Args, URL: cfg.URL, Headers: cfg.Headers, Env: cfg.Env, SecretEnv: secretEnv, SecretHeaders: secretHeaders, Enabled: cfg.Enabled}, nil
}

func (s *Store) UpdateConnector(ctx context.Context, workspaceID int64, cfg connector.Config) (ConnectorRecord, error) {
	connID, err := strconv.ParseInt(cfg.ID, 10, 64)
	if err != nil {
		return ConnectorRecord{}, err
	}
	configJSON, err := json.Marshal(map[string]any{"namespace": cfg.Namespace, "command": cfg.Command, "args": cfg.Args, "url": cfg.URL, "headers": cfg.Headers, "env": cfg.Env, "enabled": cfg.Enabled})
	if err != nil {
		return ConnectorRecord{}, err
	}
	var record ConnectorRecord
	err = withTx(ctx, s.pool, func(tx pgx.Tx) error {
		var createdAt, updatedAt time.Time
		if err := tx.QueryRow(ctx, `update connectors set name = $3, transport = $4, configuration = $5, status = $6, last_error = null, updated_at = now() where id = $1 and workspace_id = $2 returning created_at, updated_at`, connID, workspaceID, cfg.Name, string(cfg.Transport), configJSON, "disconnected").Scan(&createdAt, &updatedAt); err != nil {
			return err
		}
		if err := s.replaceConnectorSecretsTx(ctx, tx, connID, cfg.SecretEnv, cfg.SecretHeaders); err != nil {
			return err
		}
		record = ConnectorRecord{ID: cfg.ID, WorkspaceID: strconv.FormatInt(workspaceID, 10), Name: cfg.Name, Namespace: cfg.Namespace, Transport: string(cfg.Transport), Command: cfg.Command, Args: cfg.Args, URL: cfg.URL, Headers: cfg.Headers, Env: cfg.Env, SecretEnvKeys: sortedKeys(cfg.SecretEnv), SecretHeaderKeys: sortedKeys(cfg.SecretHeaders), Enabled: cfg.Enabled, Status: "disconnected", CreatedAt: createdAt, UpdatedAt: updatedAt}
		return nil
	})
	return record, err
}

func (s *Store) UpdateConnectorState(ctx context.Context, id string, status connector.Status, lastError string) error {
	_, err := s.pool.Exec(ctx, `update connectors set status = $2, last_error = nullif($3, ''), updated_at = now() where id = $1`, id, string(status), lastError)
	return err
}

func (s *Store) ReplaceConnectorTools(ctx context.Context, id string, tools []protocol.Tool) error {
	connID, err := strconv.ParseInt(id, 10, 64)
	if err != nil {
		return err
	}
	return withTx(ctx, s.pool, func(tx pgx.Tx) error {
		if _, err := tx.Exec(ctx, `delete from tools where connector_id = $1`, connID); err != nil {
			return err
		}
		for _, tool := range tools {
			schemaJSON, err := json.Marshal(tool.InputSchema)
			if err != nil {
				return err
			}
			if _, err := tx.Exec(ctx, `insert into tools (connector_id, name, schema) values ($1, $2, $3)`, connID, tool.Name, schemaJSON); err != nil {
				return err
			}
		}
		return nil
	})
}

func (s *Store) listToolsByConnector(ctx context.Context, connectorID int64) ([]ToolRecord, error) {
	rows, err := s.pool.Query(ctx, `select name, schema from tools where connector_id = $1 order by name asc`, connectorID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []ToolRecord
	for rows.Next() {
		var name string
		var raw []byte
		if err := rows.Scan(&name, &raw); err != nil {
			return nil, err
		}
		schema := map[string]any{}
		if len(raw) > 0 {
			if err := json.Unmarshal(raw, &schema); err != nil {
				return nil, err
			}
		}
		out = append(out, ToolRecord{Name: name, Schema: schema})
	}
	return out, rows.Err()
}

func (s *Store) ListPolicies(ctx context.Context, workspaceID int64) ([]PolicyRecord, error) {
	rows, err := s.pool.Query(ctx, `select id, workspace_id, rule, action, created_at from policies where workspace_id = $1 order by created_at desc`, workspaceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []PolicyRecord
	for rows.Next() {
		var id, wsID int64
		var raw []byte
		var action string
		var createdAt time.Time
		if err := rows.Scan(&id, &wsID, &raw, &action, &createdAt); err != nil {
			return nil, err
		}
		var rule struct {
			Name       string                            `json:"name"`
			Tool       string                            `json:"tool"`
			Conditions map[string]config.ConditionConfig `json:"conditions"`
		}
		if err := json.Unmarshal(raw, &rule); err != nil {
			return nil, err
		}
		out = append(out, PolicyRecord{ID: strconv.FormatInt(id, 10), WorkspaceID: strconv.FormatInt(wsID, 10), Name: rule.Name, Tool: rule.Tool, Action: action, Conditions: rule.Conditions, CreatedAt: createdAt})
	}
	return out, rows.Err()
}

func (s *Store) CreatePolicy(ctx context.Context, workspaceID int64, record PolicyRecord) (PolicyRecord, error) {
	ruleJSON, err := json.Marshal(map[string]any{"name": record.Name, "tool": record.Tool, "conditions": record.Conditions})
	if err != nil {
		return PolicyRecord{}, err
	}
	var id int64
	var createdAt time.Time
	if err := s.pool.QueryRow(ctx, `insert into policies (workspace_id, rule, action) values ($1, $2, $3) returning id, created_at`, workspaceID, ruleJSON, record.Action).Scan(&id, &createdAt); err != nil {
		return PolicyRecord{}, err
	}
	record.ID = strconv.FormatInt(id, 10)
	record.WorkspaceID = strconv.FormatInt(workspaceID, 10)
	record.CreatedAt = createdAt
	return record, nil
}

func (s *Store) LoadPolicyRules(ctx context.Context, workspaceID int64) ([]policyengine.Rule, error) {
	policies, err := s.ListPolicies(ctx, workspaceID)
	if err != nil {
		return nil, err
	}
	out := make([]policyengine.Rule, 0, len(policies))
	for _, policy := range policies {
		action, err := policyengine.ParseAction(policy.Action)
		if err != nil {
			return nil, err
		}
		conditions := make(map[string]policyengine.Condition, len(policy.Conditions))
		for field, condition := range policy.Conditions {
			conditions[field] = policyengine.Condition{GT: condition.GT, GTE: condition.GTE, LT: condition.LT, LTE: condition.LTE, EQ: condition.EQ, Exists: condition.Exists}
		}
		out = append(out, policyengine.Rule{Name: policy.Name, ToolPattern: policy.Tool, Action: action, Conditions: conditions})
	}
	return out, nil
}

func (s *Store) CreateAuditLog(ctx context.Context, record AuditLogRecord) error {
	workspaceID, err := strconv.ParseInt(record.WorkspaceID, 10, 64)
	if err != nil {
		return err
	}
	requestJSON, err := json.Marshal(record.Request)
	if err != nil {
		return err
	}
	responseJSON, err := json.Marshal(record.Response)
	if err != nil {
		return err
	}
	_, err = s.pool.Exec(ctx, `insert into audit_logs (workspace_id, tool, request, response, decision, created_at) values ($1, $2, $3, $4, $5, $6)`, workspaceID, record.Tool, requestJSON, responseJSON, record.Decision, record.CreatedAt)
	return err
}

func (s *Store) ListAuditLogs(ctx context.Context, workspaceID int64, limit int) ([]AuditLogRecord, error) {
	if limit <= 0 {
		limit = 50
	}
	rows, err := s.pool.Query(ctx, `select id, workspace_id, tool, request, response, decision, created_at from audit_logs where workspace_id = $1 order by created_at desc limit $2`, workspaceID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []AuditLogRecord
	for rows.Next() {
		var id, wsID int64
		var tool, decision string
		var requestRaw, responseRaw []byte
		var createdAt time.Time
		if err := rows.Scan(&id, &wsID, &tool, &requestRaw, &responseRaw, &decision, &createdAt); err != nil {
			return nil, err
		}
		requestBody := map[string]any{}
		responseBody := map[string]any{}
		_ = json.Unmarshal(requestRaw, &requestBody)
		if len(responseRaw) > 0 {
			_ = json.Unmarshal(responseRaw, &responseBody)
		}
		out = append(out, AuditLogRecord{ID: strconv.FormatInt(id, 10), WorkspaceID: strconv.FormatInt(wsID, 10), Tool: tool, Request: requestBody, Response: responseBody, Decision: decision, CreatedAt: createdAt})
	}
	return out, rows.Err()
}

func withTx(ctx context.Context, pool *pgxpool.Pool, fn func(pgx.Tx) error) error {
	tx, err := pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()
	if err := fn(tx); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func connectorEnabled(enabled *bool) bool {
	if enabled == nil {
		return true
	}
	return *enabled
}

func (s *Store) listConnectorSecrets(ctx context.Context, connectorID int64) (map[string]string, map[string]string, error) {
	rows, err := s.pool.Query(ctx, `select scope, name, value from connector_secrets where connector_id = $1 order by scope asc, name asc`, connectorID)
	if err != nil {
		return nil, nil, err
	}
	defer rows.Close()
	secretEnv := make(map[string]string)
	secretHeaders := make(map[string]string)
	for rows.Next() {
		var scope, name, encrypted string
		if err := rows.Scan(&scope, &name, &encrypted); err != nil {
			return nil, nil, err
		}
		if s.cipher == nil {
			return nil, nil, fmt.Errorf("connector secret key is required to load encrypted connector secrets")
		}
		value, err := s.cipher.DecryptString(encrypted)
		if err != nil {
			return nil, nil, err
		}
		switch scope {
		case secretScopeEnv:
			secretEnv[name] = value
		case secretScopeHeader:
			secretHeaders[name] = value
		}
	}
	return secretEnv, secretHeaders, rows.Err()
}

func (s *Store) listConnectorSecretKeys(ctx context.Context, connectorID int64) ([]string, []string, error) {
	rows, err := s.pool.Query(ctx, `select scope, name from connector_secrets where connector_id = $1 order by scope asc, name asc`, connectorID)
	if err != nil {
		return nil, nil, err
	}
	defer rows.Close()
	var envKeys []string
	var headerKeys []string
	for rows.Next() {
		var scope, name string
		if err := rows.Scan(&scope, &name); err != nil {
			return nil, nil, err
		}
		switch scope {
		case secretScopeEnv:
			envKeys = append(envKeys, name)
		case secretScopeHeader:
			headerKeys = append(headerKeys, name)
		}
	}
	sort.Strings(envKeys)
	sort.Strings(headerKeys)
	return envKeys, headerKeys, rows.Err()
}

func (s *Store) replaceConnectorSecrets(ctx context.Context, connectorID int64, secretEnv, secretHeaders map[string]string) error {
	return withTx(ctx, s.pool, func(tx pgx.Tx) error {
		return s.replaceConnectorSecretsTx(ctx, tx, connectorID, secretEnv, secretHeaders)
	})
}

func (s *Store) replaceConnectorSecretsTx(ctx context.Context, tx pgx.Tx, connectorID int64, secretEnv, secretHeaders map[string]string) error {
	if _, err := tx.Exec(ctx, `delete from connector_secrets where connector_id = $1`, connectorID); err != nil {
		return err
	}
	for name, value := range secretEnv {
		if err := s.insertConnectorSecret(ctx, tx, connectorID, secretScopeEnv, name, value); err != nil {
			return err
		}
	}
	for name, value := range secretHeaders {
		if err := s.insertConnectorSecret(ctx, tx, connectorID, secretScopeHeader, name, value); err != nil {
			return err
		}
	}
	return nil
}

func (s *Store) insertConnectorSecret(ctx context.Context, tx pgx.Tx, connectorID int64, scope, name, value string) error {
	if strings.TrimSpace(name) == "" || value == "" {
		return nil
	}
	if s.cipher == nil {
		return fmt.Errorf("connector secret key is required to store encrypted connector secrets")
	}
	encrypted, err := s.cipher.EncryptString(value)
	if err != nil {
		return err
	}
	_, err = tx.Exec(ctx, `insert into connector_secrets (connector_id, scope, name, value, updated_at) values ($1, $2, $3, $4, now())`, connectorID, scope, name, encrypted)
	return err
}

func sortedKeys(source map[string]string) []string {
	out := make([]string, 0, len(source))
	for key := range source {
		out = append(out, key)
	}
	sort.Strings(out)
	return out
}

func toStringSlice(value any) ([]string, bool) {
	items, ok := value.([]any)
	if !ok {
		if typed, ok := value.([]string); ok {
			return typed, true
		}
		return nil, false
	}
	out := make([]string, 0, len(items))
	for _, item := range items {
		if text, ok := item.(string); ok {
			out = append(out, text)
		}
	}
	return out, true
}

func toStringMap(value any) (map[string]string, bool) {
	source, ok := value.(map[string]any)
	if !ok {
		if typed, ok := value.(map[string]string); ok {
			return typed, true
		}
		return map[string]string{}, false
	}
	out := make(map[string]string, len(source))
	for key, raw := range source {
		if text, ok := raw.(string); ok {
			out[key] = text
		}
	}
	return out, true
}
