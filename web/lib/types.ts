/** Domain model for the Managent control plane. */

export type AgentStatus = "active" | "idle" | "revoked";

export type Decision = "allow" | "deny";

/**
 * How strictly an agent's calls are checked against its declared scope.
 * `strict` requires the agent to have spent time in `shadow` first.
 */
export type EnforcementMode = "monitor" | "shadow" | "strict";

export type ResourceKind = "rest" | "mcp" | "db";

/** How a resource's permission list came to exist. */
export type DiscoverySource = "manifest" | "auto" | "manual";

/** Provenance of a single permission, surfaced next to it in the resource form. */
export type PermissionSource = "manual" | "spec" | "template" | "discovered" | "existing";

/**
 * Where a parameter rides on the wire.
 *
 * REST splits by OpenAPI's `in` plus the request body; MCP has a single
 * `arguments` object described by each tool's `inputSchema`, so every MCP
 * parameter is an `argument`.
 */
export type ParamLocation = "path" | "query" | "header" | "body" | "argument";

export type ParamType = "string" | "number" | "integer" | "boolean" | "enum" | "array";

/**
 * One addressable input on a permission — an OpenAPI parameter or body field
 * for REST, a JSON Schema property of a tool's `inputSchema` for MCP. Policy
 * conditions bind to these.
 */
export interface PermissionParam {
  /** Dotted path within its location, e.g. `metadata.region`. */
  name: string;
  location: ParamLocation;
  type: ParamType;
  description?: string;
  /** Allowed values when `type` is `enum`. */
  enumValues?: string[];
  required?: boolean;
  /** Shown as the value input's placeholder. */
  example?: string;
}

/**
 * One capability a resource exposes — an endpoint, an MCP tool, or a database
 * role. This is a property of the resource itself: it describes what *can* be
 * called, not who may call it. Granting it to an agent is a separate record
 * ({@link AgentScope}), which is why the same capability can be granted to one
 * agent and withheld from another.
 */
export interface Permission {
  name: string;
  /**
   * What the permission matches: an HTTP method + path for REST resources, the
   * tool name for MCP, absent for database roles.
   */
  match?: string;
  highRisk?: boolean;
  source?: PermissionSource;
  /** Inputs a policy condition can test. Absent for database roles. */
  params?: PermissionParam[];
}

interface ResourceBase {
  /** URL-safe identifier, e.g. `stripe-mcp`. */
  id: string;
  /** Display name, which may differ from the id, e.g. `postgres:invoices`. */
  name: string;
  discoveredVia: DiscoverySource;
  /**
   * The full catalog of what this resource exposes. Global to the resource —
   * every agent sees the same catalog, and each is granted its own subset.
   */
  permissions: Permission[];
}

export interface RestResource extends ResourceBase {
  kind: "rest";
  targetUrl: string;
  authMethod: string;
}

export interface McpResource extends ResourceBase {
  kind: "mcp";
  transport: "stdio" | "http" | "sse" | string;
  /** Executable for stdio resources; retained for backward compatibility. */
  command: string;
  /** Remote endpoint for HTTP/SSE resources. */
  url?: string;
  args?: string[];
  workingDirectory?: string;
  env?: Record<string, string>;
  mcpId?: string;
}

export interface DbResource extends ResourceBase {
  kind: "db";
  connectionHost: string;
  roleScope: string;
  tables: string[];
}

export type Resource = RestResource | McpResource | DbResource;

/**
 * A grant: one capability on one resource, given to one agent. Grants are the
 * per-(agent, resource) half of the model — a resource's catalog is shared, but
 * which entries an agent holds is decided per agent, so two agents on the same
 * resource routinely have different permissions.
 */
export interface AgentScope {
  resourceId: string;
  /** Name of a {@link Permission} in that resource's catalog. */
  permission: string;
  /** Usage over the last 24h, shown beside the scope in agent settings. */
  callsToday: number;
}

export interface Agent {
  /** URL-safe identifier; also the agent's name in practice. */
  id: string;
  /** Numeric control-plane identity used by gateway audit records. */
  gatewayAgentId?: string;
  name: string;
  /** Owning team. */
  owner: string;
  ownerEmail: string;
  description: string;
  status: AgentStatus;
  /**
   * Share of the agent's calls that are governed, per protocol. `null` means the
   * agent makes no calls of that kind, and renders as an em dash rather than 0%.
   */
  coverage: { rest: number | null; mcp: number | null };
  calls24h: number;
  denied24h: number;
  createdDaysAgo: number;
  lastActive: string;
  /** Masked for display; the full token is only ever shown once, at creation. */
  tokenPreview: string;
  enforcementMode: EnforcementMode;
  failOpen: boolean;
  /** `denylist` allows every tool on linked resources except explicit denials. */
  permissionMode?: "allowlist" | "denylist";
  /** Resources available to this agent independently of per-tool decisions. */
  linkedResources?: string[];
  /** Explicit tool denials used when `permissionMode` is `denylist`. */
  deniedPermissions?: AgentScope[];
  /** Legacy per-tool grants retained for allow-list records and usage data. */
  scopes: AgentScope[];
}

export interface AuditEntry {
  id: string;
  /** Original timestamp, retained for live 24-hour and calendar-day rollups. */
  occurredAt?: string;
  /** `HH:MM:SS`, local to the org. */
  time: string;
  agentId: string;
  /** Resource the call was made against, so logs narrow to one agent-resource pair. */
  resourceId: string;
  /** Capability invoked, matching a {@link Permission} name on that resource. */
  permission: string;
  action: string;
  outcome: Decision;
}

/**
 * What a matching call does. `require_approval` holds the call and routes it to
 * a human; the agent stays blocked until someone resolves it.
 */
export type PolicyEffect = "allow" | "deny" | "require_approval";

export type ConditionOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "matches"
  | "in"
  | "not_in"
  | "present"
  | "absent"
  | "is_true"
  | "is_false";

/** A single `field operator value` test. */
export interface ConditionRule {
  kind: "rule";
  id: string;
  /**
   * Qualified field reference: `<location>.<param>` for call inputs
   * (`body.amount`, `argument.charge`, `query.limit`) or `context.<name>` for
   * request metadata that exists regardless of resource.
   */
  field: string;
  operator: ConditionOperator;
  /** Raw text; coerced against the field's type at evaluation. */
  value?: string;
}

/**
 * Boolean combination of tests. Groups nest, so arbitrarily shaped conditions
 * are expressible without a special case per shape.
 */
export interface ConditionGroup {
  kind: "group";
  id: string;
  match: "all" | "any";
  children: ConditionNode[];
}

export type ConditionNode = ConditionRule | ConditionGroup;

/**
 * Conditions are authored either with the structured builder or, for anything
 * the builder can't express, as a raw expression.
 */
export type PolicyCondition =
  | { mode: "builder"; root: ConditionGroup }
  | { mode: "expression"; source: string };

/**
 * One rule governing calls to a resource. Rules are evaluated top to bottom and
 * the first match wins, so `order` is meaningful rather than cosmetic.
 *
 * A rule is scoped by its `subject`: `agent:invoice-agent` governs that agent
 * alone, while `agent:*` is a resource-wide default inherited by every agent.
 * The effective rule list is therefore per (agent, resource) — see
 * {@link EffectivePolicy}.
 */
export interface Policy {
  id: string;
  resourceId: string;
  /** Lower runs first. Contiguous within a resource. */
  order: number;
  effect: PolicyEffect;
  /** Agent the rule applies to. Supports a trailing `*` glob. */
  subject: string;
  /** Permission on the resource, or `*` for all of them. */
  permission: string;
  /** Extra qualifier that must hold for the rule to match. */
  condition?: PolicyCondition;
  /** Throughput cap applied when the rule matches. */
  rateLimit?: string;
  enabled: boolean;
}

/**
 * A rule as it applies to one specific agent. Inherited rules come from the
 * resource's defaults and are read-only in the per-agent view — they're edited
 * where they're defined, on the resource — so it stays obvious which rules this
 * agent actually owns.
 */
export interface EffectivePolicy extends Policy {
  inherited: boolean;
}

/** A configurable input exposed by an MCP marketplace template. */
export interface MarketplaceField {
  name: string;
  label: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  secret: boolean;
  target: "url" | "header" | "env";
  key?: string;
  template?: string;
}

export interface MarketplaceTransportOption {
  id: string;
  label: string;
  description?: string;
  transport: "stdio" | "http" | "sse";
  recommended: boolean;
  command?: string;
  args?: string[];
  url?: string;
  fields: MarketplaceField[];
}

/** An MCP server configuration supplied by the backend marketplace catalog. */
export interface MarketplaceTemplate {
  slug: string;
  name: string;
  provider: string;
  description: string;
  defaultMCPName: string;
  defaultNamespace: string;
  transportOptions: MarketplaceTransportOption[];
}
