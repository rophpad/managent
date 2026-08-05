import type {
  ConditionOperator,
  ConditionRule,
  EffectivePolicy,
  PolicyCondition,
  PolicyEffect,
  Policy,
} from "@/lib/types";

/** Terse fixture helpers — the shapes themselves are verbose to write by hand. */
function test(id: string, field: string, operator: ConditionOperator, value?: string): ConditionRule {
  return { kind: "rule", id, field, operator, value };
}

function when(id: string, ...children: ConditionRule[]): PolicyCondition {
  return { mode: "builder", root: { kind: "group", id, match: "all", children } };
}

/**
 * Policy rules per resource, in evaluation order. First match wins, which is
 * why the narrow allows sit above the broad denies.
 */
export const POLICIES: Policy[] = [
  { id: "p-stripe-mcp-1", resourceId: "stripe-mcp", order: 1, effect: "allow", subject: "agent:support-bot", permission: "stripe_list_customers", enabled: true },
  { id: "p-stripe-mcp-2", resourceId: "stripe-mcp", order: 2, effect: "require_approval", subject: "agent:*", permission: "stripe_create_refund", condition: when("c-mcp-2", test("r-mcp-2", "argument.amount", "gt", "10000")), enabled: true },
  { id: "p-stripe-mcp-3", resourceId: "stripe-mcp", order: 3, effect: "deny", subject: "agent:*", permission: "stripe_delete_customer", enabled: true },
  { id: "p-github-mcp-1", resourceId: "github-mcp", order: 1, effect: "allow", subject: "agent:code-reviewer", permission: "get_file_contents", enabled: true },
  { id: "p-linear-mcp-1", resourceId: "linear-mcp", order: 1, effect: "allow", subject: "agent:invoice-agent", permission: "list_issues", enabled: true },
  { id: "p-slack-mcp-1", resourceId: "slack-mcp", order: 1, effect: "allow", subject: "agent:invoice-agent", permission: "slack_post_message", rateLimit: "60 / minute", enabled: true },
];

export function getResourcePolicies(resourceId: string): Policy[] {
  return POLICIES.filter((policy) => policy.resourceId === resourceId).sort(
    (a, b) => a.order - b.order,
  );
}

/** `agent:*` — a default every agent on the resource inherits. */
export function isResourceDefault(policy: Policy): boolean {
  return policy.subject.endsWith("*");
}

/**
 * Rules an agent owns outright, and rules it inherits, are both authored as
 * `subject`; a trailing `*` is the only difference.
 */
export function policyAppliesToAgent(policy: Policy, agentId: string): boolean {
  if (!isResourceDefault(policy)) return policy.subject === `agent:${agentId}`;
  return `agent:${agentId}`.startsWith(policy.subject.slice(0, -1));
}

/** Rules that apply to every agent on the resource, authored on the resource itself. */
export function getResourceDefaultPolicies(resourceId: string): Policy[] {
  return getResourcePolicies(resourceId).filter(isResourceDefault);
}

/**
 * The rule list as it actually governs one agent on one resource, in evaluation
 * order. Inherited defaults keep their position in that order rather than being
 * grouped separately — first match wins, so where a default sits relative to an
 * agent's own rules is exactly what decides the outcome.
 */
export function getAgentResourcePolicies(
  agentId: string,
  resourceId: string,
): EffectivePolicy[] {
  return getResourcePolicies(resourceId)
    .filter((policy) => policyAppliesToAgent(policy, agentId))
    .map((policy) => ({ ...policy, inherited: isResourceDefault(policy) }));
}

/** Rule count for the agent/resource cells in the cross-reference tables. */
export function countAgentResourcePolicies(agentId: string, resourceId: string): number {
  return getAgentResourcePolicies(agentId, resourceId).length;
}

export const POLICY_EFFECT_LABEL: Record<PolicyEffect, string> = {
  allow: "Allow",
  deny: "Deny",
  require_approval: "Require approval",
};
