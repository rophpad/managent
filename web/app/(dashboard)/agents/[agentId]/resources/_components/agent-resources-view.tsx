"use client";

import { Plug, Plus } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Hint } from "@/components/ui/field";
import { MutedText } from "@/components/ui/rows";
import { CATALOG_LABEL } from "@/lib/data/resources";
import type { Resource } from "@/lib/types";
import type { Agent } from "@/lib/types";
import { saveDashboardEntity } from "@/lib/client-api";
import { AgentResourcesTable, type AgentResourceRow } from "./agent-resources-table";
import { AddResourceModal, type ResourceLink } from "./add-resource-modal";

export function AgentResourcesView({
  agent,
  agentId,
  agentName,
  initialRows,
  available,
  inheritedRules,
}: {
  agent: Agent;
  agentId: string;
  agentName: string;
  initialRows: AgentResourceRow[];
  /** Resources not yet linked to this agent. */
  available: Resource[];
  /** Default rules each resource contributes to any agent that links it. */
  inheritedRules: Record<string, number>;
}) {
  // Links live here until there's an API to persist to, matching the rest of
  // the dashboard's editing surfaces.
  const [rows, setRows] = useState<AgentResourceRow[]>(initialRows);
  const [addOpen, setAddOpen] = useState(false);
  const [linked, setLinked] = useState<ReadonlySet<string>>(
    () => new Set(initialRows.map((row) => row.resourceId)),
  );

  async function addLinks(links: ResourceLink[]) {
    const added = links.flatMap((link) => {
      const resource = available.find((entry) => entry.id === link.resourceId);
      if (!resource) return [];
      return [
        {
          resourceId: resource.id,
          name: resource.name,
          kind: resource.kind,
          catalogLabel: CATALOG_LABEL[resource.kind],
          granted: link.permissions.length,
          total: resource.permissions.length,
          // A brand-new link inherits the resource's defaults and has no rules
          // of its own yet, so this is the whole rule count.
          rules: inheritedRules[resource.id] ?? 0,
          calls: 0,
          denials: 0,
        } satisfies AgentResourceRow,
      ];
    });

    setRows((current) => [...current, ...added]);
    setLinked((current) => new Set([...current, ...added.map((row) => row.resourceId)]));
    const scopes = [
      ...agent.scopes,
      ...links.flatMap((link) =>
        link.permissions.map((permission) => ({
          resourceId: link.resourceId,
          permission,
          callsToday: 0,
        })),
      ),
    ];
    await saveDashboardEntity("agents", { ...agent, scopes });
  }

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-4">
        <MutedText>
          {rows.length === 0
            ? "No resources linked"
            : `${rows.length} resource${rows.length === 1 ? "" : "s"} linked`}
        </MutedText>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus aria-hidden className="size-[15px]" />
          Add resource
        </Button>
      </div>

      {rows.length === 0 ? (
        <Card className="px-5 py-[18px]">
          <EmptyState icon={<Plug />}>
            {agentName}{" "}
            isn&apos;t scoped against any resource yet. Add one to choose exactly what it may call.
          </EmptyState>
        </Card>
      ) : (
        <>
          <AgentResourcesTable agentId={agentId} rows={rows} />
          <Hint className="mt-3">
            Permissions and policies here are specific to {agentName}. Another agent on the same
            resource can hold a different set of permissions and be governed by different rules.
          </Hint>
        </>
      )}

      <AddResourceModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={addLinks}
        agentName={agentName}
        available={available.filter((resource) => !linked.has(resource.id))}
      />
    </>
  );
}
