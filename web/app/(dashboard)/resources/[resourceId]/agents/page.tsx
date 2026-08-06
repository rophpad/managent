import { Bot } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Hint } from "@/components/ui/field";
import {
  AGENT_STATUS_LABEL,
  getAgentResourceCalls,
  getGrantSummary,
  listAgents,
} from "@/lib/data/server";
import { listAuditEntries } from "@/lib/data/server";
import { listPolicies, policyAppliesToAgent } from "@/lib/data/server";
import { CATALOG_NOUN, fetchResource } from "@/lib/data/server";
import { ResourceAgentsTable, type ResourceAgentRow } from "./_components/resource-agents-table";

export default async function ResourceAgentsPage({
  params,
}: {
  params: Promise<{ resourceId: string }>;
}) {
  const { resourceId } = await params;
  const resource = await fetchResource(resourceId);
  if (!resource) notFound();
  const [agents, policies, auditEntries] = await Promise.all([
    listAgents(),
    listPolicies(),
    listAuditEntries(),
  ]);

  const rows: ResourceAgentRow[] = agents.filter((agent) =>
    agent.scopes.some((scope) => scope.resourceId === resource.id),
  ).map((agent) => {
    const { granted, total } = getGrantSummary(agent, resource);
    return {
      agentId: agent.id,
      name: agent.name,
      owner: agent.owner,
      status: agent.status,
      statusLabel: AGENT_STATUS_LABEL[agent.status],
      granted,
      total,
      rules: policies.filter((policy) =>
        policy.resourceId === resource.id && policyAppliesToAgent(policy, agent.id)
      ).length,
      calls: getAgentResourceCalls(agent, resource.id),
      denials: auditEntries.filter((entry) =>
        entry.agentId === agent.id && entry.resourceId === resource.id && entry.outcome === "deny"
      ).length,
    };
  });

  if (rows.length === 0) {
    return (
      <Card className="px-5 py-[18px]">
        <EmptyState icon={<Bot />}>
          No agents are scoped against this resource yet. Link it from an agent&apos;s settings, or{" "}
          <Link href="/agents/new" className="text-brand hover:underline">
            register a new agent
          </Link>
          .
        </EmptyState>
      </Card>
    );
  }

  return (
    <>
      <ResourceAgentsTable resourceId={resource.id} rows={rows} />
      <Hint className="mt-3">
        Each agent holds its own set of {CATALOG_NOUN[resource.kind]}s on {resource.name}{" "}
        and is governed by its own rules. Open a row to review or change that agent&apos;s access —
        it won&apos;t affect the others.
      </Hint>
    </>
  );
}
