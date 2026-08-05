import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/dashboard/page-header";
import { TabNav, type TabDef } from "@/components/dashboard/tab-nav";
import { AGENTS, getAgent } from "@/lib/data/agents";
import { getResource, RESOURCES, RESOURCE_KIND_TAG } from "@/lib/data/resources";
import { AgentHeader } from "./_components/agent-header";

const TABS: readonly TabDef[] = [
  { segment: "", label: "Overview" },
  { segment: "resources", label: "Resources" },
  { segment: "activity", label: "Activity" },
];

export function generateStaticParams() {
  return AGENTS.map((agent) => ({ agentId: agent.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ agentId: string }>;
}): Promise<Metadata> {
  const { agentId } = await params;
  return { title: getAgent(agentId)?.name ?? "Agent" };
}

export default async function AgentDetailLayout({
  params,
  children,
}: LayoutProps<"/agents/[agentId]">) {
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
        href: `/agents/${agent.id}/resources/${resource.id}`,
      },
    ];
  });

  return (
    <>
      <Breadcrumb items={[{ label: "Agents", href: "/agents" }, { label: agent.name }]} />

      <AgentHeader agent={agent} scopes={scopes} resources={RESOURCES} />

      <TabNav basePath={`/agents/${agent.id}`} tabs={TABS} label={`${agent.name} sections`} />

      {children}
    </>
  );
}
