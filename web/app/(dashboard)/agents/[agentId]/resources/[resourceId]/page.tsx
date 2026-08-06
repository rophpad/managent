import { Plug } from "lucide-react";
import { notFound } from "next/navigation";
import { PanelBlock, SectionTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { fetchAgent, getAgentScopesForResource } from "@/lib/data/server";
import { CATALOG_NOUN, fetchResource } from "@/lib/data/server";
import { AgentPermissionList, type GrantRow } from "./_components/agent-permission-list";

export default async function AgentResourcePermissionsPage({
  params,
}: {
  params: Promise<{ agentId: string; resourceId: string }>;
}) {
  const { agentId, resourceId } = await params;
  const [agent, resource] = await Promise.all([fetchAgent(agentId), fetchResource(resourceId)]);
  if (!agent || !resource) notFound();

  const scopes = getAgentScopesForResource(agent, resource.id);

  const rows: GrantRow[] = resource.permissions.map((permission) => {
    const scope = scopes.find((entry) => entry.permission === permission.name);
    return {
      name: permission.name,
      match: permission.match,
      highRisk: permission.highRisk,
      paramCount: permission.params?.length ?? 0,
      granted: scope !== undefined,
      callsToday: scope?.callsToday ?? 0,
    };
  });

  return (
    <PanelBlock>
      <SectionTitle>Permissions for {agent.name}</SectionTitle>

      {rows.length === 0 ? (
        <EmptyState icon={<Plug />}>
          This resource exposes nothing yet, so there is nothing to grant.
        </EmptyState>
      ) : (
        <AgentPermissionList
          agent={agent}
          resourceId={resource.id}
          agentName={agent.name}
          catalogNoun={CATALOG_NOUN[resource.kind]}
          rows={rows}
        />
      )}
    </PanelBlock>
  );
}
