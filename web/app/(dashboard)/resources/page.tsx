import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { ButtonLink } from "@/components/ui/button";
import { getAgentsUsingResource } from "@/lib/data/agents";
import { RESOURCES } from "@/lib/data/resources";
import { ResourcesTable } from "./_components/resources-table";

export const metadata: Metadata = { title: "Resources" };

export default function ResourcesPage() {
  // Derived from the agents' scopes, so the count can't drift from reality.
  const agentsByResource = Object.fromEntries(
    RESOURCES.map((resource) => [
      resource.id,
      getAgentsUsingResource(resource.id).map((agent) => agent.name),
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
      <ResourcesTable resources={RESOURCES} agentsByResource={agentsByResource} />
    </>
  );
}
