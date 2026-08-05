import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Metric, MetricRow } from "@/components/ui/card";
import { AGENTS, getRegistryMetrics } from "@/lib/data/agents";
import { AgentsTable } from "./_components/agents-table";

export const metadata: Metadata = { title: "Agents" };

export default function AgentsPage() {
  const metrics = getRegistryMetrics(AGENTS);

  return (
    <>
      <PageHeader
        title="Agents"
        description="Every agent registered in your org, with live coverage and access status."
        actions={
          <ButtonLink href="/agents/new" variant="primary">
            <Plus aria-hidden className="size-3.75" />
            Register agent
          </ButtonLink>
        }
      />

      <MetricRow>
        <Metric label="Active agents" value={metrics.activeAgents} />
        <Metric label="Calls, 24h" value={metrics.calls24h} />
        <Metric
          label="Denied, 24h"
          value={metrics.denied24h}
          tone={metrics.denied24h > 0 ? "warn" : "default"}
        />
        <Metric
          label="Avg. coverage"
          value={metrics.averageCoverage === null ? "—" : `${metrics.averageCoverage}%`}
          tone="ok"
        />
      </MetricRow>

      <AgentsTable agents={AGENTS} />
    </>
  );
}
