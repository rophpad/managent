import type { MarketplaceListing, Overview } from "@/components/dashboard/types";

const API_BASE_URL =
  process.env.MANAGENT_API_BASE_URL || "http://127.0.0.1:8080";
const ADMIN_TOKEN = process.env.MANAGENT_ADMIN_TOKEN || "";
const OVERVIEW_TIMEOUT_MS = 1500;
const FALLBACK_MARKETPLACE: MarketplaceListing[] = [
  {
    slug: "github-mcp",
    name: "GitHub MCP",
    provider: "Official GitHub MCP Server",
    description:
      "Choose between GitHub's recommended remote server and the official local stdio server.",
    defaultConnectorName: "github",
    defaultNamespace: "github",
    transportOptions: [
      {
        id: "remote-http",
        label: "Remote HTTP",
        description: "GitHub-hosted remote MCP server. Recommended by GitHub for most users.",
        transport: "http",
        recommended: true,
        url: "https://api.githubcopilot.com/mcp/",
        headers: {
          Accept: "application/json",
        },
        fields: [
          {
            name: "token",
            label: "Personal access token",
            placeholder: "ghp_xxx",
            required: true,
            secret: true,
            target: "header",
            key: "Authorization",
            template: "Bearer {{value}}",
          },
        ],
      },
      {
        id: "local-stdio",
        label: "Local stdio",
        description: "Official local GitHub MCP server process for customized or local-only setups.",
        transport: "stdio",
        recommended: false,
        command: "/app/bin/github-mcp-server",
        args: ["stdio"],
        fields: [
          {
            name: "token",
            label: "Personal access token",
            placeholder: "ghp_xxx",
            required: true,
            secret: true,
            target: "env",
            key: "GITHUB_PERSONAL_ACCESS_TOKEN",
          },
        ],
      },
    ],
  },
  {
    slug: "linear-mcp",
    name: "Linear",
    provider: "Official Linear MCP Server",
    description: "Linear's official server is a remote MCP endpoint over Streamable HTTP.",
    defaultConnectorName: "linear",
    defaultNamespace: "linear",
    transportOptions: [
      {
        id: "remote-http",
        label: "Remote HTTP",
        description: "Official Linear endpoint. OAuth is supported, and direct bearer-token auth is available for MCP clients that need to connect non-interactively.",
        transport: "http",
        recommended: true,
        url: "https://mcp.linear.app/mcp",
        fields: [
          {
            name: "token",
            label: "Linear API key or OAuth access token",
            placeholder: "lin_api_xxx",
            required: true,
            secret: true,
            target: "header",
            key: "Authorization",
            template: "Bearer {{value}}",
          },
        ],
      },
    ],
  },
  {
    slug: "stripe-mcp",
    name: "Stripe",
    provider: "Official Stripe MCP Server",
    description:
      "Stripe's official MCP server is a remote endpoint. OAuth is preferred, and bearer-token auth is also documented for agent software.",
    defaultConnectorName: "stripe",
    defaultNamespace: "stripe",
    transportOptions: [
      {
        id: "remote-http",
        label: "Remote HTTP",
        description: "Official Stripe remote MCP server.",
        transport: "http",
        recommended: true,
        url: "https://mcp.stripe.com",
        headers: {
          "Content-Type": "application/json",
        },
        fields: [
          {
            name: "token",
            label: "Restricted API key",
            placeholder: "rk_live_xxx",
            required: true,
            secret: true,
            target: "header",
            key: "Authorization",
            template: "Bearer {{value}}",
          },
        ],
      },
    ],
  },
];

function createEmptyOverview(): Overview {
  return {
    workspace: { id: 0, name: "Default Workspace" },
    apiKeys: [],
    connectors: [],
    policies: [],
    auditLogs: [],
  };
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");

  if (ADMIN_TOKEN) {
    headers.set("Authorization", `Bearer ${ADMIN_TOKEN}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.text();
    const error = new Error(payload || `Request failed: ${response.status}`) as Error & {
      status?: number;
      path?: string;
    };
    error.status = response.status;
    error.path = path;
    throw error;
  }

  return response.json() as Promise<T>;
}

export async function getOverview(): Promise<Overview> {
  try {
    const overview = await request<Partial<Overview>>("/api/v1/overview", {
      signal: AbortSignal.timeout(OVERVIEW_TIMEOUT_MS),
    });

    return {
      workspace: overview.workspace || { id: 0, name: "Default Workspace" },
      apiKeys: overview.apiKeys || [],
      connectors: overview.connectors || [],
      policies: overview.policies || [],
      auditLogs: overview.auditLogs || [],
    };
  } catch (error) {
    console.error("Failed to load dashboard overview.", error);
    return createEmptyOverview();
  }
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function getConnectorHealth(connectors: Overview["connectors"]) {
  const connected = connectors.filter(
    (connector) => connector.status === "connected",
  ).length;

  return `${connected}/${connectors.length || 0} connected`;
}

export function getLatestAudit(overview: Overview) {
  return overview.auditLogs[0] || null;
}

export function getDashboardStats(overview: Overview) {
  return {
    connectors: overview.connectors.length,
    policies: overview.policies.length,
    auditLogs: overview.auditLogs.length,
  };
}

export function getSettingsSummary(overview: Overview) {
  return {
    workspaceId: overview.workspace.id,
    keyCount: overview.apiKeys.length,
    connectorCount: overview.connectors.length,
  };
}

export async function getMarketplace(): Promise<MarketplaceListing[]> {
  try {
    const response = await request<{ items?: MarketplaceListing[] }>("/api/v1/marketplace", {
      signal: AbortSignal.timeout(OVERVIEW_TIMEOUT_MS),
    });

    return response.items || [];
  } catch (error) {
    const status = typeof error === "object" && error !== null && "status" in error
      ? Number((error as { status?: number }).status)
      : undefined;

    if (status === 404) {
      return FALLBACK_MARKETPLACE;
    }

    console.error("Failed to load marketplace listings.", error);
    return [];
  }
}
