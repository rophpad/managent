import type { ConnectorTemplate, Resource } from "@/lib/types";

/**
 * Registered resources. Permission counts shown across the app are derived from
 * these arrays rather than stored, so the resources table, the register wizard,
 * and the detail modal can never disagree.
 */
export const RESOURCES: Resource[] = [
  { id: "stripe-mcp", name: "Stripe MCP", kind: "mcp", discoveredVia: "auto", transport: "stdio (local subprocess)", command: "npx -y @stripe/mcp --tools=all", permissions: [
    { name: "stripe_create_refund", source: "discovered", params: [{ name: "charge", location: "argument", type: "string", required: true }, { name: "amount", location: "argument", type: "integer", example: "50000" }] },
    { name: "stripe_list_customers", source: "discovered", params: [{ name: "limit", location: "argument", type: "integer", example: "25" }] },
    { name: "stripe_get_charge", source: "discovered" },
    { name: "stripe_delete_customer", source: "discovered", highRisk: true },
  ] },
  { id: "github-mcp", name: "GitHub MCP", kind: "mcp", discoveredVia: "auto", transport: "stdio (local subprocess)", command: "docker run -i --rm ghcr.io/github/github-mcp-server", permissions: [
    { name: "get_file_contents", source: "discovered" }, { name: "list_issues", source: "discovered" }, { name: "create_pull_request", source: "discovered", highRisk: true },
  ] },
  { id: "linear-mcp", name: "Linear MCP", kind: "mcp", discoveredVia: "auto", transport: "HTTP + SSE (remote server)", command: "https://mcp.linear.app/sse", permissions: [
    { name: "list_issues", source: "discovered" }, { name: "get_issue", source: "discovered" }, { name: "create_issue", source: "discovered" },
  ] },
  { id: "slack-mcp", name: "Slack MCP", kind: "mcp", discoveredVia: "auto", transport: "stdio (local subprocess)", command: "npx -y @modelcontextprotocol/server-slack", permissions: [
    { name: "slack_list_channels", source: "discovered" }, { name: "slack_post_message", source: "discovered" }, { name: "slack_get_thread_replies", source: "discovered" },
  ] },
];

/** Known MCP server configurations. Tools are confirmed through tools/list. */
export const CONNECTOR_TEMPLATES: ConnectorTemplate[] = [
  {
    id: "hello",
    name: "Hello MCP",
    transport: "stdio (local subprocess)",
    command: "/app/bin/hello-mcp",
    credentialName: "",
    credentialPlaceholder: "",
    tools: ["greet", "check_injected_credential"],
  },
];

export function getResource(id: string): Resource | undefined {
  return RESOURCES.find((resource) => resource.id === id);
}


export const RESOURCE_KIND_LABEL = {
  rest: "REST",
  mcp: "MCP",
  db: "Database",
} as const;

/** Short tag used inside scope rows, where `Database` is too wide. */
export const RESOURCE_KIND_TAG = {
  rest: "REST",
  mcp: "MCP",
  db: "DB",
} as const;

export const DISCOVERY_LABEL = {
  manifest: "Manifest",
  auto: "Auto-discovered",
  manual: "Manual",
} as const;

/**
 * What a resource's catalog entries are called in the interface. The catalog is
 * global to the resource, so it's named after what it physically is — endpoints,
 * tools, roles — and the word "permission" is reserved for what an agent has
 * been granted from it.
 */
export const CATALOG_LABEL = {
  rest: "Endpoints",
  mcp: "Tools",
  db: "Roles",
} as const;

export const CATALOG_NOUN = {
  rest: "endpoint",
  mcp: "tool",
  db: "role",
} as const;

/** e.g. `3 endpoints`, `5 tools` — the size of the catalog, not of any grant. */
export function catalogCountLabel(resource: Resource): string {
  const count = resource.permissions.length;
  return `${count} ${CATALOG_NOUN[resource.kind]}${count === 1 ? "" : "s"}`;
}
