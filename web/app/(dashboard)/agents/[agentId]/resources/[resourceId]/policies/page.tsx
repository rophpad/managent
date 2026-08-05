import { notFound } from "next/navigation";
import { PanelBlock, SectionTitle } from "@/components/ui/card";
import { getAgent } from "@/lib/data/agents";
import { getAgentResourcePolicies } from "@/lib/data/policies";
import { getResource } from "@/lib/data/resources";
import { AgentPolicyList } from "../_components/agent-policy-list";

export default async function AgentResourcePoliciesPage({
  params,
}: {
  params: Promise<{ agentId: string; resourceId: string }>;
}) {
  const { agentId, resourceId } = await params;
  const agent = getAgent(agentId);
  const resource = getResource(resourceId);
  if (!agent || !resource) notFound();

  return (
    <PanelBlock>
      <SectionTitle>Effective rules for {agent.name}</SectionTitle>
      <AgentPolicyList
        agentId={agent.id}
        agentName={agent.name}
        resource={resource}
        policies={getAgentResourcePolicies(agent.id, resource.id)}
      />
    </PanelBlock>
  );
}
