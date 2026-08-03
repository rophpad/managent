import { Pencil, Plug } from "lucide-react";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { PanelBlock, SectionTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Hint } from "@/components/ui/field";
import { MutedText, ScopeRow } from "@/components/ui/rows";
import { RiskTag } from "@/components/ui/scope-chip";
import { getResource } from "@/lib/data/resources";

const SOURCE_NOTE = {
  rest: "Permissions map to HTTP operations. Import an OpenAPI spec to generate them automatically, or add them by hand.",
  mcp: "Permissions are the tool names the server reported from its tools/list method. Re-run discovery from Settings to pick up new tools.",
  db: "Database access is a native role scoped to specific tables, not a per-query permission.",
} as const;

export default async function ResourcePermissionsPage({
  params,
}: {
  params: Promise<{ resourceId: string }>;
}) {
  const { resourceId } = await params;
  const resource = getResource(resourceId);
  if (!resource) notFound();

  const noun = resource.kind === "db" ? "Roles" : "Permissions";
  const highRiskCount = resource.permissions.filter((permission) => permission.highRisk).length;

  return (
    <PanelBlock>
      <SectionTitle>
        {noun}
        <ButtonLink href={`/resources/new?edit=${resource.id}`} size="sm" className="font-normal">
          <Pencil aria-hidden className="size-[15px]" />
          Edit
        </ButtonLink>
      </SectionTitle>

      {resource.permissions.length === 0 ? (
        <EmptyState icon={<Plug />}>
          No {noun.toLowerCase()} defined yet for this resource.
        </EmptyState>
      ) : (
        resource.permissions.map((permission) => (
          <ScopeRow
            key={permission.name}
            name={permission.name}
            tag={permission.match}
            trailing={permission.highRisk ? <RiskTag /> : null}
          />
        ))
      )}

      {highRiskCount > 0 ? (
        <MutedText className="mt-3 block text-deny">
          {highRiskCount} of these are destructive. Deny them explicitly under Policies unless an
          agent genuinely needs them.
        </MutedText>
      ) : null}

      <Hint>{SOURCE_NOTE[resource.kind]}</Hint>
    </PanelBlock>
  );
}
