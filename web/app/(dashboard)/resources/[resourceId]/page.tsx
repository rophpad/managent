import { Sparkles } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PanelBlock, SectionTitle } from "@/components/ui/card";
import { Hint } from "@/components/ui/field";
import { MutedText, StatRow } from "@/components/ui/rows";
import { getGrantSummary, getLinkedResourceIds, listAgents } from "@/lib/data/server";
import { DISCOVERY_LABEL, fetchResource } from "@/lib/data/server";

const TYPE_DESCRIPTION = "MCP server";

export default async function ResourceInformationPage({
  params,
}: {
  params: Promise<{ resourceId: string }>;
}) {
  const { resourceId } = await params;
  const resource = await fetchResource(resourceId);
  if (!resource) notFound();

  const agents = (await listAgents()).filter((agent) =>
    getLinkedResourceIds(agent).includes(resource.id),
  );

  return (
    <>
      <PanelBlock>
        <SectionTitle>Connection</SectionTitle>
        <StatRow label="Type">{TYPE_DESCRIPTION}</StatRow>

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
            <StatRow label="Transport">
              {resource.transport === "http"
                ? "Streamable HTTP"
                : resource.transport === "sse"
                  ? "SSE (legacy)"
                  : resource.transport === "stdio"
                    ? "stdio"
                    : resource.transport}
            </StatRow>
            <StatRow label={resource.transport === "stdio" ? "Executable" : "Server URL"}>
              <span className="font-mono">{resource.url ?? resource.command}</span>
            </StatRow>
            {resource.transport === "stdio" && resource.args?.length ? (
              <StatRow label="Arguments">
                <span className="font-mono">{resource.args.join(" ")}</span>
              </StatRow>
            ) : null}
            {resource.transport === "stdio" && resource.workingDirectory ? (
              <StatRow label="Working directory">
                <span className="font-mono">{resource.workingDirectory}</span>
              </StatRow>
            ) : null}
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
        <SectionTitle>
          Agents using it
          {agents.length > 0 ? (
            <Link
              href={`/resources/${resource.id}/agents`}
              className="text-xs font-normal text-brand hover:underline"
            >
              Compare access →
            </Link>
          ) : null}
        </SectionTitle>
        {agents.length === 0 ? (
          <MutedText>
            No agents are scoped against this resource yet. Link it from an agent&apos;s settings, or{" "}
            <Link href="/agents/new" className="text-brand hover:underline">
              register a new agent
            </Link>
            .
          </MutedText>
        ) : (
          agents.map((agent) => {
            const { granted, total } = getGrantSummary(agent, resource);
            return (
              <StatRow key={agent.id} label={<span className="font-mono">{agent.name}</span>}>
                <span className="text-muted">
                  {granted}/{total} granted
                </span>
                <Link
                  href={`/agents/${agent.id}/resources/${resource.id}`}
                  className="ml-3 text-brand hover:underline"
                >
                  Review →
                </Link>
              </StatRow>
            );
          })
        )}
      </PanelBlock>
    </>
  );
}
