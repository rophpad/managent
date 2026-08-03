import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/dashboard/page-header";
import { DECISION_LABEL, DECISION_TONE, Badge } from "@/components/ui/badge";
import { Metric, MetricRow, PanelBlock, SectionTitle } from "@/components/ui/card";
import { formatCoverage } from "@/components/ui/coverage-bar";
import { MutedText, ScopeRow } from "@/components/ui/rows";
import { AGENTS, getAgent } from "@/lib/data/agents";
import { getAgentActivity, toShortTime } from "@/lib/data/audit";
import { getResource, RESOURCES, RESOURCE_KIND_TAG } from "@/lib/data/resources";
import { AgentHeader } from "./_components/agent-header";

type Props = { params: Promise<{ agentId: string }> };

export function generateStaticParams() {
  return AGENTS.map((agent) => ({ agentId: agent.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { agentId } = await params;
  return { title: getAgent(agentId)?.name ?? "Agent" };
}

export default async function AgentDetailPage({ params }: Props) {
  const { agentId } = await params;
  const agent = getAgent(agentId);
  if (!agent) notFound();

  // Scope labels use the resource id (`postgres:invoices-readonly`) rather than
  // its display name, which is how scopes are written in policy and the SDK.
  const scopes = agent.scopes.flatMap((scope) => {
    const resource = getResource(scope.resourceId);
    if (!resource) return [];
    return [
      {
        label: `${resource.id}:${scope.permission}`,
        tag: RESOURCE_KIND_TAG[resource.kind],
        usage: `used ${scope.callsToday}x today`,
      },
    ];
  });

  const activity = getAgentActivity(agent.id);

  return (
    <>
      <Breadcrumb items={[{ label: "Agents", href: "/agents" }, { label: agent.name }]} />

      <AgentHeader
        agent={agent}
        scopes={scopes}
        resources={RESOURCES}
      />

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
          <Link href="/audit-logs" className="text-xs font-normal text-brand hover:underline">
            View full log →
          </Link>
        </SectionTitle>

        {activity.length === 0 ? (
          <MutedText>No governed calls from this agent yet.</MutedText>
        ) : (
          activity.map((entry) => (
            <ScopeRow
              key={entry.id}
              name={`${toShortTime(entry.time)} · ${entry.action}`}
              trailing={
                <Badge tone={DECISION_TONE[entry.outcome]}>{DECISION_LABEL[entry.outcome]}</Badge>
              }
            />
          ))
        )}
      </PanelBlock>
    </>
  );
}
