import { Bot } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Hint } from "@/components/ui/field";
import {
  AGENT_STATUS_LABEL,
  getAgentResourceCalls,
  getAgentsUsingResource,
  getGrantSummary,
} from "@/lib/data/agents";
import { countAgentResourceDenials } from "@/lib/data/audit";
import { countAgentResourcePolicies } from "@/lib/data/policies";
import { CATALOG_NOUN, getResource } from "@/lib/data/resources";
import { ResourceAgentsTable, type ResourceAgentRow } from "./_components/resource-agents-table";

export default async function ResourceAgentsPage({
  params,
}: {
  params: Promise<{ resourceId: string }>;
}) {
  const { resourceId } = await params;
  const resource = getResource(resourceId);
  if (!resource) notFound();

  const rows: ResourceAgentRow[] = getAgentsUsingResource(resource.id).map((agent) => {
    const { granted, total } = getGrantSummary(agent, resource);
    return {
      agentId: agent.id,
      name: agent.name,
      owner: agent.owner,
      status: agent.status,
      statusLabel: AGENT_STATUS_LABEL[agent.status],
      granted,
      total,
      rules: countAgentResourcePolicies(agent.id, resource.id),
      calls: getAgentResourceCalls(agent, resource.id),
      denials: countAgentResourceDenials(agent.id, resource.id),
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
