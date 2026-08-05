import { notFound } from "next/navigation";
import {
  getAgent,
  getAgentResourceCalls,
  getGrantSummary,
  getLinkedResourceIds,
} from "@/lib/data/agents";
import { countAgentResourceDenials } from "@/lib/data/audit";
import { countAgentResourcePolicies, getResourceDefaultPolicies } from "@/lib/data/policies";
import { CATALOG_LABEL, RESOURCES, getResource } from "@/lib/data/resources";
import { AgentResourcesView } from "./_components/agent-resources-view";
import type { AgentResourceRow } from "./_components/agent-resources-table";

export default async function AgentResourcesPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  const agent = getAgent(agentId);
  if (!agent) notFound();

  const linkedIds = getLinkedResourceIds(agent);

  const rows: AgentResourceRow[] = linkedIds.flatMap((resourceId) => {
    const resource = getResource(resourceId);
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
        rules: countAgentResourcePolicies(agent.id, resource.id),
        calls: getAgentResourceCalls(agent, resource.id),
        denials: countAgentResourceDenials(agent.id, resource.id),
      },
    ];
  });

  const available = RESOURCES.filter((resource) => !linkedIds.includes(resource.id));

  // What each linkable resource would contribute in rules the moment it's
  // linked, so a newly added row shows a truthful count rather than zero.
  const inheritedRules = Object.fromEntries(
    available.map((resource) => [resource.id, getResourceDefaultPolicies(resource.id).length]),
  );

  return (
    <AgentResourcesView
      agentId={agent.id}
      agentName={agent.name}
      initialRows={rows}
      available={available}
      inheritedRules={inheritedRules}
    />
  );
}
