import { Plug } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PanelBlock, SectionTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Hint } from "@/components/ui/field";
import { MutedText, ScopeRow } from "@/components/ui/rows";
import { RiskTag } from "@/components/ui/scope-chip";
import { getAgentsUsingResource, isPermissionGranted } from "@/lib/data/agents";
import { CATALOG_LABEL, CATALOG_NOUN, getResource } from "@/lib/data/resources";
import { EditCatalogModal } from "./_components/edit-catalog-modal";

/** Short prefix so a body field and a query param of the same name stay distinct. */
const PARAM_LOCATION_LABEL = {
  path: "path",
  query: "query",
  header: "header",
  body: "body",
  argument: "arg",
} as const;

const SOURCE_NOTE = {
  rest: "Endpoints map to HTTP operations. Import an OpenAPI spec to generate them automatically, or add them by hand.",
  mcp: "Tools are the names the server reported from its tools/list method. Re-run discovery from Settings to pick up new tools.",
  db: "Database access is a native role scoped to specific tables, not a per-query permission.",
} as const;

export default async function ResourceCapabilitiesPage({
  params,
}: {
  params: Promise<{ resourceId: string }>;
}) {
  const { resourceId } = await params;
  const resource = getResource(resourceId);
  if (!resource) notFound();

  const label = CATALOG_LABEL[resource.kind];
  const noun = CATALOG_NOUN[resource.kind];
  const agents = getAgentsUsingResource(resource.id);
  const highRiskCount = resource.permissions.filter((permission) => permission.highRisk).length;

  return (
    <PanelBlock>
      <SectionTitle>
        {label}
        <EditCatalogModal resource={resource} />
      </SectionTitle>

      {resource.permissions.length === 0 ? (
        <EmptyState icon={<Plug />}>No {noun}s defined yet for this resource.</EmptyState>
      ) : (
        resource.permissions.map((permission) => {
          // How many agents actually hold this. The same catalog entry can be
          // granted to one agent and withheld from another, so this is a count,
          // not a property of the entry.
          const grantedTo = agents.filter((agent) =>
            isPermissionGranted(agent, resource.id, permission.name),
          ).length;

          return (
            <div key={permission.name} className="border-b border-line-soft last:border-b-0">
              <ScopeRow
                name={permission.name}
                tag={permission.match}
                trailing={
                  <span className="flex shrink-0 items-center gap-2.5">
                    {permission.highRisk ? <RiskTag /> : null}
                    <span className="text-[11.5px] text-muted-2">
                      {grantedTo === 0 ? "no agents" : `${grantedTo} of ${agents.length} agents`}
                    </span>
                  </span>
                }
                className="border-b-0"
              />
              {permission.params?.length ? (
                <ul className="mb-3 flex list-none flex-wrap gap-1.5 p-0">
                  {permission.params.map((param) => (
                    <li
                      key={`${param.location}.${param.name}`}
                      title={param.description}
                      className="flex items-center gap-1.5 rounded border border-line-soft bg-panel-2 px-2 py-1 font-mono text-[11px]"
                    >
                      <span className="text-muted-2">{PARAM_LOCATION_LABEL[param.location]}</span>
                      <span className="text-fg">{param.name}</span>
                      <span className="text-muted-2">{param.type}</span>
                      {param.required ? <span className="text-deny">required</span> : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })
      )}

      {highRiskCount > 0 ? (
        <MutedText className="mt-3 block text-deny">
          {highRiskCount} of these are destructive. Deny them under Default policies, or withhold
          them from individual agents.
        </MutedText>
      ) : null}

      <Hint>
        This is everything {resource.name} exposes, not a grant — which {noun}s an agent may
        actually call is decided per agent, under{" "}
        <Link href={`/resources/${resource.id}/agents`} className="text-brand hover:underline">
          Agents
        </Link>
        . {SOURCE_NOTE[resource.kind]}
      </Hint>
    </PanelBlock>
  );
}
