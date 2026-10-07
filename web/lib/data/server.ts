import "server-only";

import { backendRequest } from "@/lib/backend";
import { isResourceDefault, policyAppliesToAgent } from "@/lib/data/policies";
import type { Agent, AuditEntry, EffectivePolicy, Policy, Resource } from "@/lib/types";

export * from "@/lib/data/agents";
export * from "@/lib/data/audit";
export * from "@/lib/data/policies";
export * from "@/lib/data/resources";

export const listAgents = () => backendRequest<Agent[]>("/api/v1/dashboard/agents");
export async function fetchAgent(id: string) {
  return (await listAgentsWithUsage()).find((agent) => agent.id === id);
}

export const listResources = () => backendRequest<Resource[]>("/api/v1/dashboard/resources");
export async function fetchResource(id: string) {
  return (await listResources()).find((resource) => resource.id === id);
}

export const listPolicies = () => backendRequest<Policy[]>("/api/v1/dashboard/policies");
export async function fetchResourcePolicies(resourceId: string) {
  return (await listPolicies())
    .filter((policy) => policy.resourceId === resourceId)
    .sort((a, b) => a.order - b.order);
}
export async function fetchResourceDefaultPolicies(resourceId: string) {
  return (await fetchResourcePolicies(resourceId)).filter(isResourceDefault);
}
export async function fetchAgentResourcePolicies(
  agentId: string,
  resourceId: string,
): Promise<EffectivePolicy[]> {
  return (await fetchResourcePolicies(resourceId))
    .filter((policy) => policyAppliesToAgent(policy, agentId))
    .map((policy) => ({ ...policy, inherited: isResourceDefault(policy) }));
}

interface GatewayAgent {
  id: string;
  name: string;
}

interface GatewayAuditLog {
  id: string;
  agentId?: string;
  tool: string;
  action?: string;
  decision: string;
  createdAt: string;
}

function auditOutcome(decision: string): AuditEntry["outcome"] {
  const normalized = decision.toLowerCase();
  return normalized.includes("deny") || normalized.includes("block") ||
    normalized.includes("reject") || normalized === "error"
    ? "deny"
    : "allow";
}

export async function listAuditEntries(): Promise<AuditEntry[]> {
  const [logs, gatewayAgents, dashboardAgents, resources] = await Promise.all([
    backendRequest<{ items: GatewayAuditLog[] }>("/api/v1/audit-logs?limit=250"),
    backendRequest<{ items: GatewayAgent[] }>("/api/v1/agents"),
    listAgents(),
    listResources(),
  ]);

  const agentNameById = new Map((gatewayAgents.items ?? []).map((agent) => [agent.id, agent.name]));
  const dashboardAgentId = new Map<string, string>();
  for (const agent of dashboardAgents ?? []) {
    if (agent.gatewayAgentId) dashboardAgentId.set(agent.gatewayAgentId, agent.id);
    dashboardAgentId.set(agent.name.trim().toLowerCase(), agent.id);
  }
  const resourceId = new Map(
    (resources ?? []).flatMap((resource) => [
      [resource.id.toLowerCase(), resource.id] as const,
      [resource.name.trim().toLowerCase(), resource.id] as const,
    ]),
  );

  return (logs.items ?? []).map((log) => {
    const gatewayAgentName = log.agentId ? agentNameById.get(log.agentId) : undefined;
    const agentId =
      (log.agentId && dashboardAgentId.get(log.agentId)) ||
      (gatewayAgentName && dashboardAgentId.get(gatewayAgentName.trim().toLowerCase())) ||
      log.agentId ||
      "unknown";
    const separator = log.tool.indexOf(".");
    const namespace = separator >= 0 ? log.tool.slice(0, separator) : "builtin";
    const permission = separator >= 0 ? log.tool.slice(separator + 1) : log.tool;
    const timestamp = new Date(log.createdAt);

    return {
      id: log.id,
      occurredAt: log.createdAt,
      time: Number.isNaN(timestamp.valueOf())
        ? log.createdAt
        : timestamp.toLocaleTimeString(undefined, { hour12: false }),
      agentId,
      resourceId: resourceId.get(namespace.toLowerCase()) ?? namespace,
      permission,
      action: log.action || permission,
      outcome: auditOutcome(log.decision),
    };
  });
}
/** Replace persisted usage rollups with counts from the live audit stream. */
export async function listAgentsWithUsage(now = new Date()): Promise<Agent[]> {
  const [agents, entries] = await Promise.all([listAgents(), listAuditEntries()]);
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const last24Hours = now.valueOf() - 24 * 60 * 60 * 1000;

  return agents.map((agent) => {
    const agentEntries = entries.filter((entry) => entry.agentId === agent.id);
    const recentEntries = agentEntries.filter((entry) => {
      const timestamp = new Date(entry.occurredAt ?? "").valueOf();
      return Number.isFinite(timestamp) && timestamp >= last24Hours && timestamp <= now.valueOf();
    });
    const todayEntries = agentEntries.filter((entry) => {
      const timestamp = new Date(entry.occurredAt ?? "").valueOf();
      return Number.isFinite(timestamp) && timestamp >= dayStart.valueOf() && timestamp <= now.valueOf();
    });

    return {
      ...agent,
      calls24h: recentEntries.length,
      denied24h: recentEntries.filter((entry) => entry.outcome === "deny").length,
      // Coverage remains sourced from the agent record: audit logs contain only
      // governed calls and cannot provide the total-call denominator.
      scopes: agent.scopes.map((scope) => ({
        ...scope,
        callsToday: todayEntries.filter(
          (entry) =>
            entry.resourceId === scope.resourceId && entry.permission === scope.permission,
        ).length,
      })),
    };
  });
}

export async function fetchAgentActivity(agentId: string, limit = 5) {
  return (await listAuditEntries()).filter((entry) => entry.agentId === agentId).slice(0, limit);
}
export async function fetchAgentResourceActivity(
  agentId: string,
  resourceId: string,
  limit?: number,
) {
  const entries = (await listAuditEntries()).filter(
    (entry) => entry.agentId === agentId && entry.resourceId === resourceId,
  );
  return limit === undefined ? entries : entries.slice(0, limit);
}
