import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ResourceIcon } from "@/components/dashboard/resource-icon";
import { TabNav, type TabDef } from "@/components/dashboard/tab-nav";
import { AGENTS, getAgent, getGrantSummary, getLinkedResourceIds } from "@/lib/data/agents";
import { CATALOG_LABEL, RESOURCE_KIND_LABEL, getResource } from "@/lib/data/resources";

const TABS: readonly TabDef[] = [
  { segment: "", label: "Permissions" },
  { segment: "policies", label: "Policies" },
  { segment: "activity", label: "Activity" },
];

/** Every (agent, resource) pair that exists — generated bottom-up, from the child. */
export function generateStaticParams() {
  return AGENTS.flatMap((agent) =>
    getLinkedResourceIds(agent).map((resourceId) => ({ agentId: agent.id, resourceId })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ agentId: string; resourceId: string }>;
}): Promise<Metadata> {
  const { agentId, resourceId } = await params;
  const agent = getAgent(agentId);
  const resource = getResource(resourceId);
  if (!agent || !resource) return { title: "Access" };
  return { title: `${agent.name} · ${resource.name}` };
}

export default async function AgentResourceLayout({
  params,
  children,
}: LayoutProps<"/agents/[agentId]/resources/[resourceId]">) {
  const { agentId, resourceId } = await params;
  const agent = getAgent(agentId);
  const resource = getResource(resourceId);
  if (!agent || !resource) notFound();

  const { granted, total } = getGrantSummary(agent, resource);

  return (
    <>
      <div className="mb-5 rounded-xl border border-line bg-panel px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ResourceIcon
              id={resource.id}
              kind={resource.kind}
              className="size-[18px] shrink-0 text-muted"
            />
            <div>
              <h2 className="font-mono text-[15px] font-semibold">{resource.name}</h2>
              <p className="mt-0.5 text-[12.5px] text-muted">
                {RESOURCE_KIND_LABEL[resource.kind]} · {granted} of {total}{" "}
                {CATALOG_LABEL[resource.kind].toLowerCase()} granted to {agent.name}
              </p>
            </div>
          </div>

          <Link
            href={`/resources/${resource.id}`}
            className="text-xs text-brand hover:underline"
          >
            View resource →
          </Link>
        </div>
      </div>

      <TabNav
        basePath={`/agents/${agent.id}/resources/${resource.id}`}
        tabs={TABS}
        label={`${agent.name} access to ${resource.name}`}
        variant="pill"
      />

      {children}
    </>
  );
}
