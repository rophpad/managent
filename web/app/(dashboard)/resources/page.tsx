import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { ButtonLink } from "@/components/ui/button";
import { listAgents } from "@/lib/data/server";
import { listResources } from "@/lib/data/server";
import { ResourcesTable } from "./_components/resources-table";

export const metadata: Metadata = { title: "Resources" };

export default async function ResourcesPage() {
  const [resources, agents] = await Promise.all([listResources(), listAgents()]);
  // Derived from the agents' scopes, so the count can't drift from reality.
  const agentsByResource = Object.fromEntries(
    resources.map((resource) => [
      resource.id,
      agents.filter((agent) => agent.scopes.some((scope) => scope.resourceId === resource.id)).map((agent) => agent.name),
    ]),
  );

  return (
    <>
      <PageHeader
        title="Resources"
        description="MCP servers your agents can be scoped against."
        actions={
          <ButtonLink href="/resources/new" variant="primary">
            <Plus aria-hidden className="size-[15px]" />
            Add resource
          </ButtonLink>
        }
      />
      <ResourcesTable resources={resources} agentsByResource={agentsByResource} />
    </>
  );
}
