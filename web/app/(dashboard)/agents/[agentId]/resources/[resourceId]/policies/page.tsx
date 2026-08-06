import { notFound } from "next/navigation";
import { PanelBlock, SectionTitle } from "@/components/ui/card";
import { fetchAgent } from "@/lib/data/server";
import { fetchAgentResourcePolicies } from "@/lib/data/server";
import { fetchResource } from "@/lib/data/server";
import { AgentPolicyList } from "../_components/agent-policy-list";

export default async function AgentResourcePoliciesPage({
  params,
}: {
  params: Promise<{ agentId: string; resourceId: string }>;
}) {
  const { agentId, resourceId } = await params;
  const [agent, resource] = await Promise.all([fetchAgent(agentId), fetchResource(resourceId)]);
  if (!agent || !resource) notFound();

  return (
    <PanelBlock>
      <SectionTitle>Effective rules for {agent.name}</SectionTitle>
      <AgentPolicyList
        agentId={agent.id}
        agentName={agent.name}
        resource={resource}
        policies={await fetchAgentResourcePolicies(agent.id, resource.id)}
      />
    </PanelBlock>
  );
}
