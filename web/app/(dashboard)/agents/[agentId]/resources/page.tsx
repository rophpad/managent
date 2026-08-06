import { notFound } from "next/navigation";
import {
  fetchAgent,
  getAgentResourceCalls,
  getGrantSummary,
  getLinkedResourceIds,
} from "@/lib/data/server";
import { listAuditEntries } from "@/lib/data/server";
import { isResourceDefault, listPolicies, policyAppliesToAgent } from "@/lib/data/server";
import { CATALOG_LABEL, listResources } from "@/lib/data/server";
import { AgentResourcesView } from "./_components/agent-resources-view";
import type { AgentResourceRow } from "./_components/agent-resources-table";

export default async function AgentResourcesPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  const agent = await fetchAgent(agentId);
  if (!agent) notFound();
  const [resources, policies, auditEntries] = await Promise.all([
    listResources(),
    listPolicies(),
    listAuditEntries(),
  ]);

  const linkedIds = getLinkedResourceIds(agent);

  const rows: AgentResourceRow[] = linkedIds.flatMap((resourceId) => {
    const resource = resources.find((entry) => entry.id === resourceId);
    if (!resource) return [];
    const { granted, total } = getGrantSummary(agent, resource);
    return [
      {
        resourceId: resource.id,
        name: resource.name,
        kind: resource.kind,
        catalogLabel: CATALOG_LABEL[resource.kind],
        granted,
        total,
        rules: policies.filter((policy) =>
          policy.resourceId === resource.id && policyAppliesToAgent(policy, agent.id)
        ).length,
        calls: getAgentResourceCalls(agent, resource.id),
        denials: auditEntries.filter((entry) =>
          entry.agentId === agent.id && entry.resourceId === resource.id && entry.outcome === "deny"
        ).length,
      },
    ];
  });

  const available = resources.filter((resource) => !linkedIds.includes(resource.id));

  // What each linkable resource would contribute in rules the moment it's
  // linked, so a newly added row shows a truthful count rather than zero.
  const inheritedRules = Object.fromEntries(
    available.map((resource) => [
      resource.id,
      policies.filter((policy) => policy.resourceId === resource.id && isResourceDefault(policy)).length,
    ]),
  );

  return (
    <AgentResourcesView
      agent={agent}
      agentId={agent.id}
      agentName={agent.name}
      initialRows={rows}
      available={available}
      inheritedRules={inheritedRules}
    />
  );
}
