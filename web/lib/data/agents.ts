import type { Agent, AgentScope, Resource } from "@/lib/types";

export const AGENTS: Agent[] = [
  {
    id: "invoice-agent",
    name: "invoice-agent",
    owner: "finance-eng",
    ownerEmail: "finance-eng@company.com",
    description: "Reads unpaid invoices, sends reminder emails, flags overdue accounts.",
    status: "active",
    coverage: { rest: null, mcp: 92 },
    calls24h: 142,
    denied24h: 1,
    createdDaysAgo: 34,
    lastActive: "2 min ago",
    tokenPreview: "mg_live_...9f8a2b",
    enforcementMode: "monitor",
    failOpen: true,
    scopes: [
      { resourceId: "stripe-mcp", permission: "stripe_create_refund", callsToday: 12 },
      { resourceId: "slack-mcp", permission: "slack_post_message", callsToday: 130 },
      { resourceId: "linear-mcp", permission: "list_issues", callsToday: 4 },
    ],
  },
  {
    id: "support-bot",
    name: "support-bot",
    owner: "cx-team",
    ownerEmail: "cx-team@company.com",
    description: "Triages inbound tickets, drafts replies, and closes resolved conversations.",
    status: "active",
    coverage: { rest: null, mcp: 85 },
    calls24h: 88,
    denied24h: 0,
    createdDaysAgo: 21,
    lastActive: "18 min ago",
    tokenPreview: "mg_live_...4c1d70",
    enforcementMode: "shadow",
    failOpen: true,
    scopes: [
      { resourceId: "stripe-mcp", permission: "stripe_create_refund", callsToday: 6 },
      { resourceId: "stripe-mcp", permission: "stripe_list_customers", callsToday: 82 },
    ],
  },
  {
    id: "code-reviewer",
    name: "code-reviewer",
    owner: "platform-eng",
    ownerEmail: "platform-eng@company.com",
    description: "Comments on open pull requests and flags risky diffs for a second look.",
    status: "idle",
    coverage: { rest: null, mcp: 78 },
    calls24h: 4,
    denied24h: 0,
    createdDaysAgo: 62,
    lastActive: "6 hours ago",
    tokenPreview: "mg_live_...b30e55",
    enforcementMode: "monitor",
    failOpen: true,
    scopes: [{ resourceId: "github-mcp", permission: "get_file_contents", callsToday: 4 }],
  },
  {
    id: "data-sync",
    name: "data-sync",
    owner: "data-eng",
    ownerEmail: "data-eng@company.com",
    description: "Mirrors finance tables into the warehouse on a nightly schedule.",
    status: "revoked",
    coverage: { rest: null, mcp: null },
    calls24h: 0,
    denied24h: 0,
    createdDaysAgo: 88,
    lastActive: "9 days ago",
    tokenPreview: "mg_live_...7ae214",
    enforcementMode: "monitor",
    failOpen: false,
    scopes: [],
  },
];

export function getAgent(id: string): Agent | undefined {
  return AGENTS.find((agent) => agent.id === id);
}


export function getAgentsUsingResource(resourceId: string): Agent[] {
  return AGENTS.filter((agent) => agent.scopes.some((scope) => scope.resourceId === resourceId));
}

/** Resources explicitly linked to the agent, with legacy scope inference as fallback. */
export function getLinkedResourceIds(agent: Agent): string[] {
  if (agent.permissionMode === "denylist") return agent.linkedResources ?? [];
  return [...new Set(agent.scopes.map((scope) => scope.resourceId))];
}

/** The agent's grants on one resource — its slice of that resource's catalog. */
export function getAgentScopesForResource(agent: Agent, resourceId: string): AgentScope[] {
  return agent.scopes.filter((scope) => scope.resourceId === resourceId);
}

export function isPermissionGranted(
  agent: Agent,
  resourceId: string,
  permission: string,
): boolean {
  if (agent.permissionMode === "denylist") {
    return getLinkedResourceIds(agent).includes(resourceId) &&
      !(agent.deniedPermissions ?? []).some(
        (entry) => entry.resourceId === resourceId &&
          (entry.permission === "*" || entry.permission === permission),
      );
  }
  // Legacy records used scopes as per-tool grants. Treat any resource represented
  // there as linked with all tools allowed; the next permission save converts it
  // to deny-list mode and persists only unchecked tools.
  return agent.scopes.some((scope) => scope.resourceId === resourceId);
}

/**
 * How much of a resource's catalog one agent holds. Rendered as `2/5` wherever
 * an agent and a resource meet, so it's visible at a glance that the grant is
 * per-agent rather than a property of the resource.
 */
export function getGrantSummary(
  agent: Agent,
  resource: Resource,
): { granted: number; total: number } {
  return {
    granted: resource.permissions.filter((permission) =>
      isPermissionGranted(agent, resource.id, permission.name)
    ).length,
    total: resource.permissions.length,
  };
}

/** Calls this agent made against one resource in the last 24h. */
export function getAgentResourceCalls(agent: Agent, resourceId: string): number {
  return getAgentScopesForResource(agent, resourceId).reduce(
    (total, scope) => total + scope.callsToday,
    0,
  );
}

/**
 * Headline numbers for the registry. Derived rather than stored so the metric
 * row and the table below it can never drift apart.
 */
export function getRegistryMetrics(agents: Agent[] = AGENTS) {
  const covered = agents
    .map((agent) => agent.coverage.mcp)
    .filter((value): value is number => value !== null);

  return {
    activeAgents: agents.filter((agent) => agent.status === "active").length,
    calls24h: agents.reduce((total, agent) => total + agent.calls24h, 0),
    denied24h: agents.reduce((total, agent) => total + agent.denied24h, 0),
    averageCoverage: covered.length
      ? Math.round(covered.reduce((total, value) => total + value, 0) / covered.length)
      : null,
  };
}

export const ENFORCEMENT_MODES = [
  { value: "monitor", label: "Monitor" },
  { value: "shadow", label: "Shadow" },
  { value: "strict", label: "Strict" },
] as const;

export const AGENT_STATUS_LABEL = {
  active: "Active",
  idle: "Idle",
  revoked: "Revoked",
} as const;
