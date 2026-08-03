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
      {
        name: "refunds",
        match: "POST /v1/refunds",
        // Body fields mirror the request schema an OpenAPI import would yield.
        params: [
          {
            name: "charge",
            location: "body",
            type: "string",
            required: true,
            description: "Charge being refunded.",
            example: "ch_1AbCdEf",
          },
          {
            name: "amount",
            location: "body",
            type: "integer",
            description: "Refund amount in the smallest currency unit (cents).",
            example: "50000",
          },
          {
            name: "reason",
            location: "body",
            type: "enum",
            enumValues: ["duplicate", "fraudulent", "requested_by_customer"],
          },
          {
            name: "metadata.region",
            location: "body",
            type: "string",
            description: "Free-form metadata key set by the caller.",
            example: "EU",
          },
        ],
      },
      {
        name: "read_customers",
        match: "GET /v1/customers*",
        params: [
          { name: "id", location: "path", type: "string", example: "cus_9aBc" },
          { name: "email", location: "query", type: "string", example: "user@company.com" },
          {
            name: "limit",
            location: "query",
            type: "integer",
            description: "Page size, 1–100.",
            example: "25",
          },
        ],
      },
      {
        name: "delete_customer",
        match: "DELETE /v1/customers/*",
        highRisk: true,
        params: [
          { name: "id", location: "path", type: "string", required: true, example: "cus_9aBc" },
        ],
      },
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
      {
        name: "reminders.send",
        match: "POST /v3/mail/send",
        params: [
          {
            name: "personalizations.to",
            location: "body",
            type: "array",
            required: true,
            description: "Recipient addresses.",
            example: "billing@customer.com",
          },
          { name: "template_id", location: "body", type: "string", example: "d-9f8a2b" },
          { name: "subject", location: "body", type: "string" },
          {
            name: "send_at",
            location: "body",
            type: "integer",
            description: "Unix timestamp for scheduled delivery.",
          },
        ],
      },
      {
        name: "templates.read",
        match: "GET /v3/templates*",
        params: [
          { name: "page_size", location: "query", type: "integer", example: "50" },
          {
            name: "generations",
            location: "query",
            type: "enum",
            enumValues: ["legacy", "dynamic"],
          },
        ],
      },
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
      {
        name: "chat.post",
        match: "POST /chat.postMessage",
        params: [
          {
            name: "channel",
            location: "body",
            type: "string",
            required: true,
            description: "Channel id or name.",
            example: "#finance-alerts",
          },
          { name: "text", location: "body", type: "string" },
          {
            name: "thread_ts",
            location: "body",
            type: "string",
            description: "Set when replying in a thread.",
          },
          {
            name: "unfurl_links",
            location: "body",
            type: "boolean",
            description: "Whether links are expanded in the message.",
          },
        ],
      },
      {
        name: "channels.read",
        match: "GET /conversations.list",
        params: [
          {
            name: "types",
            location: "query",
            type: "enum",
            enumValues: ["public_channel", "private_channel", "mpim", "im"],
          },
          { name: "limit", location: "query", type: "integer", example: "100" },
        ],
      },
      {
        name: "users.read",
        match: "GET /users.list",
        params: [{ name: "limit", location: "query", type: "integer", example: "100" }],
      },
    ],
  },
  {
    id: "stripe-mcp",
    name: "stripe-mcp",
    kind: "mcp",
    discoveredVia: "auto",
    transport: "stdio (local subprocess)",
    command: "npx -y @stripe/mcp-server",
    // Params are the properties of each tool's `inputSchema`, as reported by
    // tools/list — which is why every one of them is an `argument`.
    permissions: [
      {
        name: "stripe_create_refund",
        source: "discovered",
        params: [
          {
            name: "charge",
            location: "argument",
            type: "string",
            required: true,
            example: "ch_1AbCdEf",
          },
          {
            name: "amount",
            location: "argument",
            type: "integer",
            description: "Refund amount in cents.",
            example: "50000",
          },
          {
            name: "reason",
            location: "argument",
            type: "enum",
            enumValues: ["duplicate", "fraudulent", "requested_by_customer"],
          },
        ],
      },
      {
        name: "stripe_list_customers",
        source: "discovered",
        params: [
          { name: "limit", location: "argument", type: "integer", example: "25" },
          { name: "email", location: "argument", type: "string" },
        ],
      },
      {
        name: "stripe_get_charge",
        source: "discovered",
        params: [
          {
            name: "charge_id",
            location: "argument",
            type: "string",
            required: true,
            example: "ch_1AbCdEf",
          },
        ],
      },
      {
        name: "stripe_delete_customer",
        source: "discovered",
        highRisk: true,
        params: [
          {
            name: "customer_id",
            location: "argument",
            type: "string",
            required: true,
            example: "cus_9aBc",
          },
        ],
      },
      {
        name: "stripe_create_payout",
        source: "discovered",
        highRisk: true,
        params: [
          {
            name: "amount",
            location: "argument",
            type: "integer",
            required: true,
            description: "Payout amount in cents.",
            example: "100000",
          },
          {
            name: "currency",
            location: "argument",
            type: "enum",
            required: true,
            enumValues: ["usd", "eur", "gbp"],
          },
          { name: "destination", location: "argument", type: "string", example: "ba_1AbCdEf" },
        ],
      },
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
