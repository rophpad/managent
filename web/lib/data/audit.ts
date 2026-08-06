import type { AuditEntry } from "@/lib/types";

/**
 * One stream for the whole org. Every other activity view — per agent, per
 * resource, or per (agent, resource) pair — is a filter over this array rather
 * than a second list, so the numbers can't drift apart.
 *
 * `resourceId` and `permission` reference real entries in `RESOURCES`, which is
 * what lets a log be narrowed to one agent's use of one resource.
 */
export const AUDIT_ENTRIES: AuditEntry[] = [
  { id: "a1", time: "14:12:03", agentId: "invoice-agent", resourceId: "slack-mcp", permission: "slack_post_message", action: "tools/call slack_post_message", outcome: "allow" },
  { id: "a2", time: "14:09:47", agentId: "invoice-agent", resourceId: "linear-mcp", permission: "list_issues", action: "tools/call list_issues", outcome: "allow" },
  { id: "a3", time: "14:04:12", agentId: "invoice-agent", resourceId: "stripe-mcp", permission: "stripe_create_refund", action: "tools/call stripe_create_refund", outcome: "allow" },
  { id: "a4", time: "13:55:30", agentId: "support-bot", resourceId: "stripe-mcp", permission: "stripe_list_customers", action: "tools/call stripe_list_customers", outcome: "allow" },
  { id: "a5", time: "13:40:02", agentId: "support-bot", resourceId: "stripe-mcp", permission: "stripe_create_refund", action: "tools/call stripe_create_refund", outcome: "deny" },
  { id: "a6", time: "12:47:05", agentId: "invoice-agent", resourceId: "slack-mcp", permission: "slack_post_message", action: "tools/call slack_post_message", outcome: "allow" },
  { id: "a7", time: "09:12:44", agentId: "code-reviewer", resourceId: "github-mcp", permission: "get_file_contents", action: "tools/call get_file_contents", outcome: "allow" },
];


export function getAgentActivity(agentId: string, limit = 5): AuditEntry[] {
  return AUDIT_ENTRIES.filter((entry) => entry.agentId === agentId).slice(0, limit);
}

/** Everything that touched one resource, across every agent using it. */
export function getResourceActivity(resourceId: string, limit?: number): AuditEntry[] {
  const entries = AUDIT_ENTRIES.filter((entry) => entry.resourceId === resourceId);
  return limit === undefined ? entries : entries.slice(0, limit);
}

/** One agent's calls to one resource — the log for a single grant. */
export function getAgentResourceActivity(
  agentId: string,
  resourceId: string,
  limit?: number,
): AuditEntry[] {
  const entries = AUDIT_ENTRIES.filter(
    (entry) => entry.agentId === agentId && entry.resourceId === resourceId,
  );
  return limit === undefined ? entries : entries.slice(0, limit);
}

/** Denials for one agent on one resource, surfaced in cross-reference tables. */
export function countAgentResourceDenials(agentId: string, resourceId: string): number {
  return getAgentResourceActivity(agentId, resourceId).filter(
    (entry) => entry.outcome === "deny",
  ).length;
}

/** `14:09:47` → `14:09`, for the condensed activity list on the agent page. */
export function toShortTime(time: string): string {
  return time.slice(0, 5);
}
