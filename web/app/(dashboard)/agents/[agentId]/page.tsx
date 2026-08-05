import Link from "next/link";
import { notFound } from "next/navigation";
import { DECISION_LABEL, DECISION_TONE, Badge } from "@/components/ui/badge";
import { Metric, MetricRow, PanelBlock, SectionTitle } from "@/components/ui/card";
import { formatCoverage } from "@/components/ui/coverage-bar";
import { MutedText, ScopeRow } from "@/components/ui/rows";
import { getAgent, getLinkedResourceIds } from "@/lib/data/agents";
import { getAgentActivity, toShortTime } from "@/lib/data/audit";

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  const agent = getAgent(agentId);
  if (!agent) notFound();

  const activity = getAgentActivity(agent.id);
  const resourceCount = getLinkedResourceIds(agent).length;

  return (
    <>
      <MetricRow>
        <Metric label="Calls, 24h" value={agent.calls24h} />
        <Metric
          label="Denied, 24h"
          value={agent.denied24h}
          tone={agent.denied24h > 0 ? "warn" : "default"}
        />
        <Metric label="REST coverage" value={formatCoverage(agent.coverage.rest)} />
        <Metric label="MCP coverage" value={formatCoverage(agent.coverage.mcp)} />
      </MetricRow>

      <PanelBlock>
        <SectionTitle>
          Recent activity
          <Link
            href={`/agents/${agent.id}/activity`}
            className="text-xs font-normal text-brand hover:underline"
          >
            View all →
          </Link>
        </SectionTitle>

        {activity.length === 0 ? (
          <MutedText>No governed calls from this agent yet.</MutedText>
        ) : (
          activity.map((entry) => (
            <ScopeRow
              key={entry.id}
              name={`${toShortTime(entry.time)} · ${entry.action}`}
              tag={entry.resourceId}
              trailing={
                <Badge tone={DECISION_TONE[entry.outcome]}>{DECISION_LABEL[entry.outcome]}</Badge>
              }
            />
          ))
        )}
      </PanelBlock>

      <PanelBlock>
        <SectionTitle>
          Access
          <Link
            href={`/agents/${agent.id}/resources`}
            className="text-xs font-normal text-brand hover:underline"
          >
            Manage →
          </Link>
        </SectionTitle>
        <MutedText>
          {resourceCount === 0
            ? "This agent is not scoped against any resource yet."
            : `Scoped against ${resourceCount} resource${resourceCount === 1 ? "" : "s"}. Permissions and policies are set per resource for this agent — open one to review what it may call.`}
        </MutedText>
      </PanelBlock>
    </>
  );
}
