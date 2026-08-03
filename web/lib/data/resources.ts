import type { ConnectorTemplate, Resource } from "@/lib/types";

/**
 * Registered resources. Permission counts shown across the app are derived from
 * these arrays rather than stored, so the resources table, the register wizard,
 * and the detail modal can never disagree.
 */
export const RESOURCES: Resource[] = [
  {
    id: "stripe",
    name: "stripe",
    kind: "rest",
    discoveredVia: "manifest",
    targetUrl: "https://api.stripe.com",
    authMethod: "Bearer token",
    permissions: [
      { name: "refunds", match: "POST /v1/refunds" },
      { name: "read_customers", match: "GET /v1/customers*" },
      { name: "delete_customer", match: "DELETE /v1/customers/*", highRisk: true },
    ],
  },
  {
    id: "sendgrid",
    name: "sendgrid",
    kind: "rest",
    discoveredVia: "manifest",
    targetUrl: "https://api.sendgrid.com",
    authMethod: "Bearer token",
    permissions: [
      { name: "reminders.send", match: "POST /v3/mail/send" },
      { name: "templates.read", match: "GET /v3/templates*" },
    ],
  },
  {
    id: "slack",
    name: "slack",
    kind: "rest",
    discoveredVia: "manifest",
    targetUrl: "https://slack.com/api",
    authMethod: "Bearer token",
    permissions: [
      { name: "chat.post", match: "POST /chat.postMessage" },
      { name: "channels.read", match: "GET /conversations.list" },
      { name: "users.read", match: "GET /users.list" },
    ],
  },
  {
    id: "stripe-mcp",
    name: "stripe-mcp",
    kind: "mcp",
    discoveredVia: "auto",
    transport: "stdio (local subprocess)",
    command: "npx -y @stripe/mcp-server",
    permissions: [
      { name: "stripe_create_refund", source: "discovered" },
      { name: "stripe_list_customers", source: "discovered" },
      { name: "stripe_get_charge", source: "discovered" },
      { name: "stripe_delete_customer", source: "discovered", highRisk: true },
      { name: "stripe_create_payout", source: "discovered", highRisk: true },
    ],
  },
  {
    id: "postgres",
    name: "postgres:invoices",
    kind: "db",
    discoveredVia: "manual",
    connectionHost: "prod-db.company.com/finance",
    roleScope: "Read-only, specific tables",
    tables: ["invoices", "customers"],
    permissions: [{ name: "invoices-readonly" }],
  },
];

/** Pre-built connectors with curated minimal permission sets. */
export const CONNECTOR_TEMPLATES: ConnectorTemplate[] = [
  {
    id: "stripe",
    name: "Stripe",
    permissions: ["refunds", "read_customers", "read_charges", "create_payout"],
  },
  { id: "github", name: "GitHub", permissions: ["pulls.comment", "issues.read", "repos.read"] },
  { id: "slack", name: "Slack", permissions: ["chat.post", "channels.read", "users.read"] },
  { id: "sendgrid", name: "SendGrid", permissions: ["reminders.send", "templates.read"] },
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

/** Database resources expose roles, everything else exposes permissions. */
export function permissionCountLabel(resource: Resource): string {
  const count = resource.permissions.length;
  const noun = resource.kind === "db" ? "role" : "permission";
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}
