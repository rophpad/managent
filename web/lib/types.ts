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

export interface Permission {
  name: string;
  /**
   * What the permission matches: an HTTP method + path for REST resources, the
   * tool name for MCP, absent for database roles.
   */
  match?: string;
  highRisk?: boolean;
  source?: PermissionSource;
}

interface ResourceBase {
  /** URL-safe identifier, e.g. `stripe-mcp`. */
  id: string;
  /** Display name, which may differ from the id, e.g. `postgres:invoices`. */
  name: string;
  discoveredVia: DiscoverySource;
  permissions: Permission[];
}

export interface RestResource extends ResourceBase {
  kind: "rest";
  targetUrl: string;
  authMethod: string;
}

export interface McpResource extends ResourceBase {
  kind: "mcp";
  transport: string;
  command: string;
}

export interface DbResource extends ResourceBase {
  kind: "db";
  connectionHost: string;
  roleScope: string;
  tables: string[];
}

export type Resource = RestResource | McpResource | DbResource;

/** A permission on a resource that a specific agent has been granted. */
export interface AgentScope {
  resourceId: string;
  permission: string;
  /** Usage over the last 24h, shown beside the scope in agent settings. */
  callsToday: number;
}

export interface Agent {
  /** URL-safe identifier; also the agent's name in practice. */
  id: string;
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
  scopes: AgentScope[];
}

export interface AuditEntry {
  id: string;
  /** `HH:MM:SS`, local to the org. */
  time: string;
  agentId: string;
  action: string;
  outcome: Decision;
}

/**
 * What a matching call does. `require_approval` holds the call and routes it to
 * a human; the agent stays blocked until someone resolves it.
 */
export type PolicyEffect = "allow" | "deny" | "require_approval";

/**
 * One rule in a resource's policy. Rules are evaluated top to bottom and the
 * first match wins, so `order` is meaningful rather than cosmetic.
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
  condition?: string;
  /** Throughput cap applied when the rule matches. */
  rateLimit?: string;
  enabled: boolean;
}

/** A pre-built connector from the open-source registry. */
export interface ConnectorTemplate {
  id: string;
  name: string;
  permissions: string[];
}
