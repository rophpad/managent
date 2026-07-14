package config

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
)

type Config struct {
	Gateway             GatewayConfig          `json:"gateway"`
	Log                 LogConfig              `json:"log"`
	Database            DatabaseConfig         `json:"database"`
	Admin               AdminConfig            `json:"admin"`
	Security            SecurityConfig         `json:"security"`
	Auth                AuthConfig             `json:"auth"`
	Connectors          []ConnectorConfig      `json:"connectors"`
	Policies            []PolicyConfig         `json:"policies"`
	CredentialInjection []CredentialRuleConfig `json:"credential_injection"`
}

type GatewayConfig struct {
	Host     string `json:"host"`
	Port     int    `json:"port"`
	Endpoint string `json:"endpoint"`
}

type LogConfig struct {
	Level  string `json:"level"`
	Format string `json:"format"`
}

type DatabaseConfig struct {
	URL            string `json:"url"`
	SchemaPath     string `json:"schema_path"`
	WorkspaceName  string `json:"workspace_name"`
	AutoMigrate    bool   `json:"auto_migrate"`
	SeedFromConfig bool   `json:"seed_from_config"`
}

type AdminConfig struct {
	Token string `json:"token"`
}

type SecurityConfig struct {
	ConnectorSecretKey string `json:"connector_secret_key"`
}

type AuthConfig struct {
	APIKeys []APIKeyConfig `json:"api_keys"`
}

type APIKeyConfig struct {
	ID          string `json:"id"`
	WorkspaceID string `json:"workspace_id"`
	Key         string `json:"key"`
}

type ConnectorConfig struct {
	ID            string            `json:"id"`
	Name          string            `json:"name"`
	Namespace     string            `json:"namespace"`
	Transport     string            `json:"transport"`
	Command       string            `json:"command,omitempty"`
	Args          []string          `json:"args,omitempty"`
	URL           string            `json:"url,omitempty"`
	Headers       map[string]string `json:"headers,omitempty"`
	Env           map[string]string `json:"env,omitempty"`
	SecretEnv     map[string]string `json:"secret_env,omitempty"`
	SecretHeaders map[string]string `json:"secret_headers,omitempty"`
	Enabled       *bool             `json:"enabled,omitempty"`
}

type PolicyConfig struct {
	Name       string                     `json:"name"`
	Tool       string                     `json:"tool"`
	Action     string                     `json:"action"`
	Conditions map[string]ConditionConfig `json:"conditions,omitempty"`
}

type ConditionConfig struct {
	GT     *float64 `json:"gt,omitempty"`
	GTE    *float64 `json:"gte,omitempty"`
	LT     *float64 `json:"lt,omitempty"`
	LTE    *float64 `json:"lte,omitempty"`
	EQ     any      `json:"eq,omitempty"`
	Exists *bool    `json:"exists,omitempty"`
}

type CredentialRuleConfig struct {
	Name        string         `json:"name"`
	ToolPattern string         `json:"tool_pattern"`
	Arguments   map[string]any `json:"arguments"`
}

func (g GatewayConfig) Addr() string {
	return fmt.Sprintf("%s:%d", g.Host, g.Port)
}

func Load() (*Config, error) {
	cfg := defaultConfig()
	configPath := os.Getenv("MANAGENT_CONFIG")
	if configPath != "" {
		data, err := os.ReadFile(configPath)
		if err != nil {
			return nil, fmt.Errorf("read MANAGENT_CONFIG: %w", err)
		}
		if err := json.Unmarshal(data, &cfg); err != nil {
			return nil, fmt.Errorf("parse MANAGENT_CONFIG: %w", err)
		}
		if cfg.Database.SchemaPath == "" {
			cfg.Database.SchemaPath = filepath.Join(filepath.Dir(configPath), "..", "database", "schema.sql")
		}
	}

	if v := os.Getenv("MANAGENT_PORT"); v != "" {
		port, err := strconv.Atoi(v)
		if err != nil {
			return nil, fmt.Errorf("invalid MANAGENT_PORT: %w", err)
		}
		cfg.Gateway.Port = port
	}
	if v := os.Getenv("MANAGENT_HOST"); v != "" {
		cfg.Gateway.Host = v
	}
	if v := os.Getenv("MANAGENT_LOG_LEVEL"); v != "" {
		cfg.Log.Level = v
	}
	if v := os.Getenv("MANAGENT_LOG_FORMAT"); v != "" {
		cfg.Log.Format = v
	}
	if v := os.Getenv("MANAGENT_DATABASE_URL"); v != "" {
		cfg.Database.URL = v
	}
	if v := os.Getenv("MANAGENT_DATABASE_SCHEMA_PATH"); v != "" {
		cfg.Database.SchemaPath = v
	}
	if v := os.Getenv("MANAGENT_WORKSPACE_NAME"); v != "" {
		cfg.Database.WorkspaceName = v
	}
	if v := os.Getenv("MANAGENT_ADMIN_TOKEN"); v != "" {
		cfg.Admin.Token = v
	}
	if v := os.Getenv("MANAGENT_CONNECTOR_SECRET_KEY"); v != "" {
		cfg.Security.ConnectorSecretKey = v
	}
	if cfg.Gateway.Endpoint == "" {
		cfg.Gateway.Endpoint = "/mcp"
	}
	if cfg.Database.SchemaPath == "" {
		cfg.Database.SchemaPath = filepath.Join("database", "schema.sql")
	}
	if cfg.Database.WorkspaceName == "" {
		cfg.Database.WorkspaceName = "Default Workspace"
	}

	return &cfg, nil
}

func defaultConfig() Config {
	return Config{
		Gateway:  GatewayConfig{Host: "", Port: 8080, Endpoint: "/mcp"},
		Log:      LogConfig{Level: "info", Format: "json"},
		Database: DatabaseConfig{SchemaPath: filepath.Join("database", "schema.sql"), WorkspaceName: "Default Workspace", AutoMigrate: true, SeedFromConfig: true},
	}
}
