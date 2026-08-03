import { Sparkles } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PanelBlock, SectionTitle } from "@/components/ui/card";
import { Hint } from "@/components/ui/field";
import { MutedText, StatRow } from "@/components/ui/rows";
import { getAgentsUsingResource } from "@/lib/data/agents";
import { DISCOVERY_LABEL, getResource } from "@/lib/data/resources";

const TYPE_DESCRIPTION = {
  rest: "REST API",
  mcp: "MCP server",
  db: "Database",
} as const;

export default async function ResourceInformationPage({
  params,
}: {
  params: Promise<{ resourceId: string }>;
}) {
  const { resourceId } = await params;
  const resource = getResource(resourceId);
  if (!resource) notFound();

  const agents = getAgentsUsingResource(resource.id);

  return (
    <>
      <PanelBlock>
        <SectionTitle>Connection</SectionTitle>
        <StatRow label="Type">{TYPE_DESCRIPTION[resource.kind]}</StatRow>

        {resource.kind === "rest" ? (
          <>
            <StatRow label="Target URL">
              <span className="font-mono">{resource.targetUrl}</span>
            </StatRow>
            <StatRow label="Auth method">{resource.authMethod}</StatRow>
          </>
        ) : null}

        {resource.kind === "mcp" ? (
          <>
            <StatRow label="Transport">{resource.transport}</StatRow>
            <StatRow label="Command">
              <span className="font-mono">{resource.command}</span>
            </StatRow>
          </>
        ) : null}

        {resource.kind === "db" ? (
          <>
            <StatRow label="Connection host">
              <span className="font-mono">{resource.connectionHost}</span>
            </StatRow>
            <StatRow label="Role scope">{resource.roleScope}</StatRow>
            <StatRow label="Tables">{resource.tables.join(", ")}</StatRow>
          </>
        ) : null}

        <StatRow label="Discovered via">
          {resource.discoveredVia === "auto" ? (
            <span className="inline-flex items-center gap-1.5">
              <Sparkles aria-hidden className="size-3 text-allow" />
              Auto-discovered {resource.kind === "mcp" ? "(tools/list)" : null}
            </span>
          ) : (
            DISCOVERY_LABEL[resource.discoveredVia]
          )}
        </StatRow>

        {resource.kind === "db" ? (
          <Hint className="mt-3">
            Managent provisions a short-lived native role scoped to these tables — it doesn&apos;t
            parse or intercept SQL.
          </Hint>
        ) : null}
      </PanelBlock>

      <PanelBlock>
        <SectionTitle>Agents using it</SectionTitle>
        {agents.length === 0 ? (
          <MutedText>
            No agents are scoped against this resource yet. Link it from an agent&apos;s settings, or{" "}
            <Link href="/agents/new" className="text-brand hover:underline">
              register a new agent
            </Link>
            .
          </MutedText>
        ) : (
          agents.map((agent) => (
            <StatRow key={agent.id} label={<span className="font-mono">{agent.name}</span>}>
              <Link href={`/agents/${agent.id}`} className="text-brand hover:underline">
                View agent →
              </Link>
            </StatRow>
          ))
        )}
      </PanelBlock>
    </>
  );
}
