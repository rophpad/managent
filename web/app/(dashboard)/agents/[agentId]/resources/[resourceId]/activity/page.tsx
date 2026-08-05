import { ScanSearch } from "lucide-react";
import { notFound } from "next/navigation";
import { DECISION_LABEL, DECISION_TONE, Badge } from "@/components/ui/badge";
import { PanelBlock, SectionTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Hint } from "@/components/ui/field";
import { ScopeRow } from "@/components/ui/rows";
import { getAgent } from "@/lib/data/agents";
import { getAgentResourceActivity } from "@/lib/data/audit";
import { getResource } from "@/lib/data/resources";

export default async function AgentResourceActivityPage({
  params,
}: {
  params: Promise<{ agentId: string; resourceId: string }>;
}) {
  const { agentId, resourceId } = await params;
  const agent = getAgent(agentId);
  const resource = getResource(resourceId);
  if (!agent || !resource) notFound();

  const entries = getAgentResourceActivity(agent.id, resource.id);

  return (
    <PanelBlock>
      <SectionTitle>
        {agent.name} → {resource.name}
      </SectionTitle>

      {entries.length === 0 ? (
        <EmptyState icon={<ScanSearch />}>
          No governed calls from {agent.name} to {resource.name} yet.
        </EmptyState>
      ) : (
        entries.map((entry) => (
          <ScopeRow
            key={entry.id}
            name={`${entry.time} · ${entry.action}`}
            tag={entry.permission}
            trailing={
              <Badge tone={DECISION_TONE[entry.outcome]}>{DECISION_LABEL[entry.outcome]}</Badge>
            }
          />
        ))
      )}

      <Hint>
        Only this agent&apos;s calls to this resource. Other agents using {resource.name} have their
        own logs.
      </Hint>
    </PanelBlock>
  );
}
