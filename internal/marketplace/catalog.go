package marketplace

import (
	"fmt"
	"sort"
	"strings"

	"github.com/rophpad/managent/internal/mcp"
)

type FieldTarget string

const (
	TargetURL    FieldTarget = "url"
	TargetHeader FieldTarget = "header"
	TargetEnv    FieldTarget = "env"
)

type Field struct {
	Name        string      `json:"name"`
	Label       string      `json:"label"`
	Description string      `json:"description,omitempty"`
	Placeholder string      `json:"placeholder,omitempty"`
	Required    bool        `json:"required"`
	Secret      bool        `json:"secret"`
	Target      FieldTarget `json:"target"`
	Key         string      `json:"key,omitempty"`
	Template    string      `json:"template,omitempty"`
}

type TransportOption struct {
	ID          string            `json:"id"`
	Label       string            `json:"label"`
	Description string            `json:"description,omitempty"`
	Transport   string            `json:"transport"`
	Recommended bool              `json:"recommended"`
	Command     string            `json:"command,omitempty"`
	Args        []string          `json:"args,omitempty"`
	URL         string            `json:"url,omitempty"`
	Headers     map[string]string `json:"headers,omitempty"`
	Env         map[string]string `json:"env,omitempty"`
	Fields      []Field           `json:"fields"`
}

type Listing struct {
	Slug             string            `json:"slug"`
	Name             string            `json:"name"`
	Provider         string            `json:"provider"`
	Description      string            `json:"description"`
	DefaultMCPName   string            `json:"defaultMCPName"`
	DefaultNamespace string            `json:"defaultNamespace"`
	TransportOptions []TransportOption `json:"transportOptions"`
}

func Catalog() []Listing {
	listings := []Listing{
		{
			Slug:             "github-mcp",
			Name:             "GitHub MCP",
			Provider:         "Official GitHub MCP Server",
			Description:      "Choose between GitHub's recommended remote server and the official local stdio server.",
			DefaultMCPName:   "github",
			DefaultNamespace: "github",
			TransportOptions: []TransportOption{
				{
					ID:          "remote-http",
					Label:       "Remote HTTP",
					Description: "GitHub-hosted remote MCP server. Recommended by GitHub for most users.",
					Transport:   string(mcp.TransportHTTP),
					Recommended: true,
					URL:         "https://api.githubcopilot.com/mcp/",
					Headers: map[string]string{
						"Accept": "application/json, text/event-stream",
					},
					Fields: []Field{
						{Name: "token", Label: "Personal access token", Placeholder: "ghp_xxx", Required: true, Secret: true, Target: TargetHeader, Key: "Authorization", Template: "Bearer {{value}}"},
					},
				},
				{
					ID:          "local-stdio",
					Label:       "Local stdio",
					Description: "Official local GitHub MCP server process for customized or local-only setups.",
					Transport:   string(mcp.TransportStdio),
					Recommended: false,
					Command:     "/app/bin/github-mcp-server",
					Args:        []string{"stdio"},
					Fields: []Field{
						{Name: "token", Label: "Personal access token", Placeholder: "ghp_xxx", Required: true, Secret: true, Target: TargetEnv, Key: "GITHUB_PERSONAL_ACCESS_TOKEN"},
					},
				},
			},
		},
		{
			Slug:             "hello-mcp",
			Name:             "Hello MCP",
			Provider:         "Bundled Managent demo server",
			Description:      "A local demo MCP server bundled with the Managent gateway for testing tool discovery and policy enforcement.",
			DefaultMCPName:   "hello",
			DefaultNamespace: "hello",
			TransportOptions: []TransportOption{
				{
					ID:          "local-stdio",
					Label:       "Local stdio",
					Description: "Runs the Hello MCP binary bundled in the gateway image.",
					Transport:   string(mcp.TransportStdio),
					Recommended: true,
					Command:     "/app/bin/hello-mcp",
					Fields:      []Field{},
				},
			},
		},
		{
			Slug:             "linear-mcp",
			Name:             "Linear",
			Provider:         "Official Linear MCP Server",
			Description:      "Linear's official server is a remote MCP endpoint over Streamable HTTP.",
			DefaultMCPName:   "linear",
			DefaultNamespace: "linear",
			TransportOptions: []TransportOption{
				{
					ID:          "remote-http",
					Label:       "Remote HTTP",
					Description: "Official Linear endpoint. OAuth is supported, and direct bearer-token auth is available for MCP clients that need to connect non-interactively.",
					Transport:   string(mcp.TransportHTTP),
					Recommended: true,
					URL:         "https://mcp.linear.app/mcp",
					Fields: []Field{
						{Name: "token", Label: "Linear API key or OAuth access token", Placeholder: "lin_api_xxx", Required: true, Secret: true, Target: TargetHeader, Key: "Authorization", Template: "Bearer {{value}}"},
					},
				},
			},
		},
		{
			Slug:             "stripe-mcp",
			Name:             "Stripe",
			Provider:         "Official Stripe MCP Server",
			Description:      "Stripe's official MCP server is a remote endpoint. OAuth is preferred, and bearer-token auth is also documented for agent software.",
			DefaultMCPName:   "stripe",
			DefaultNamespace: "stripe",
			TransportOptions: []TransportOption{
				{
					ID:          "remote-http",
					Label:       "Remote HTTP",
					Description: "Official Stripe remote MCP server.",
					Transport:   string(mcp.TransportHTTP),
					Recommended: true,
					URL:         "https://mcp.stripe.com",
					Headers: map[string]string{
						"Content-Type": "application/json",
					},
					Fields: []Field{
						{Name: "token", Label: "Restricted API key", Placeholder: "rk_live_xxx", Required: true, Secret: true, Target: TargetHeader, Key: "Authorization", Template: "Bearer {{value}}"},
					},
				},
			},
		},
	}
	sort.Slice(listings, func(i, j int) bool { return listings[i].Name < listings[j].Name })
	return listings
}

func Get(slug string) (Listing, bool) {
	for _, listing := range Catalog() {
		if listing.Slug == slug {
			return listing, true
		}
	}
	return Listing{}, false
}

func BuildMCP(listing Listing, optionID, mcpName, namespace string, values map[string]string) (mcp.Config, error) {
	option, err := listing.transportOption(optionID)
	if err != nil {
		return mcp.Config{}, err
	}
	name := strings.TrimSpace(mcpName)
	if name == "" {
		name = listing.DefaultMCPName
	}
	ns := strings.TrimSpace(namespace)
	if ns == "" {
		ns = listing.DefaultNamespace
	}
	cfg := mcp.Config{
		Name:      name,
		Namespace: ns,
		Transport: mcp.Transport(option.Transport),
		Command:   strings.TrimSpace(option.Command),
		Args:      append([]string{}, option.Args...),
		URL:       strings.TrimSpace(option.URL),
		Headers:   cloneMap(option.Headers),
		Env:       cloneMap(option.Env),
		Enabled:   true,
	}
	for _, field := range option.Fields {
		value := strings.TrimSpace(values[field.Name])
		if field.Required && value == "" {
			return mcp.Config{}, fmt.Errorf("marketplace field %q is required", field.Label)
		}
		if value == "" {
			continue
		}
		value = applyTemplate(field.Template, value)
		switch field.Target {
		case TargetURL:
			cfg.URL = value
		case TargetHeader:
			if strings.TrimSpace(field.Key) == "" {
				return mcp.Config{}, fmt.Errorf("marketplace field %q is missing a header key", field.Label)
			}
			if field.Secret {
				if cfg.SecretHeaders == nil {
					cfg.SecretHeaders = map[string]string{}
				}
				cfg.SecretHeaders[field.Key] = value
			} else {
				if cfg.Headers == nil {
					cfg.Headers = map[string]string{}
				}
				cfg.Headers[field.Key] = value
			}
		case TargetEnv:
			if strings.TrimSpace(field.Key) == "" {
				return mcp.Config{}, fmt.Errorf("marketplace field %q is missing an env key", field.Label)
			}
			if field.Secret {
				if cfg.SecretEnv == nil {
					cfg.SecretEnv = map[string]string{}
				}
				cfg.SecretEnv[field.Key] = value
			} else {
				if cfg.Env == nil {
					cfg.Env = map[string]string{}
				}
				cfg.Env[field.Key] = value
			}
		default:
			return mcp.Config{}, fmt.Errorf("unsupported marketplace field target %q", field.Target)
		}
	}
	switch cfg.Transport {
	case mcp.TransportStdio:
		if strings.TrimSpace(cfg.Command) == "" {
			return mcp.Config{}, fmt.Errorf("marketplace mcp %q requires a command", listing.Name)
		}
	case mcp.TransportHTTP, mcp.TransportSSE:
		if strings.TrimSpace(cfg.URL) == "" {
			return mcp.Config{}, fmt.Errorf("marketplace mcp %q requires a URL", listing.Name)
		}
	default:
		return mcp.Config{}, fmt.Errorf("unsupported marketplace transport %q", option.Transport)
	}
	return cfg, nil
}

func (l Listing) transportOption(optionID string) (TransportOption, error) {
	trimmed := strings.TrimSpace(optionID)
	if trimmed != "" {
		for _, option := range l.TransportOptions {
			if option.ID == trimmed {
				return option, nil
			}
		}
		return TransportOption{}, fmt.Errorf("marketplace transport option %q not found", optionID)
	}
	for _, option := range l.TransportOptions {
		if option.Recommended {
			return option, nil
		}
	}
	if len(l.TransportOptions) == 0 {
		return TransportOption{}, fmt.Errorf("marketplace listing %q has no transport options", l.Name)
	}
	return l.TransportOptions[0], nil
}

func cloneMap(source map[string]string) map[string]string {
	if len(source) == 0 {
		return nil
	}
	out := make(map[string]string, len(source))
	for key, value := range source {
		out[key] = value
	}
	return out
}

func applyTemplate(template, value string) string {
	if strings.TrimSpace(template) == "" {
		return value
	}
	return strings.ReplaceAll(template, "{{value}}", value)
}
