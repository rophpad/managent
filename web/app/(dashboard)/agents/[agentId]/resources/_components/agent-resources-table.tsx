"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ResourceIcon } from "@/components/dashboard/resource-icon";
import { Card } from "@/components/ui/card";
import { ResourceName, ROW_LINK_CLASS, Table, Td, Th } from "@/components/ui/table";
import type { ResourceKind } from "@/lib/types";

/**
 * One resource as it relates to a single agent. Every number here is scoped to
 * that agent — `granted` is its slice of the catalog, `rules` are the policies
 * that govern it — so the same resource reads differently on another agent.
 */
export interface AgentResourceRow {
  resourceId: string;
  name: string;
  kind: ResourceKind;
  catalogLabel: string;
  granted: number;
  total: number;
  rules: number;
  calls: number;
  denials: number;
}

export function AgentResourcesTable({
  agentId,
  rows,
}: {
  agentId: string;
  rows: AgentResourceRow[];
}) {
  const router = useRouter();

  return (
    <Card>
      <Table minWidth="min-w-[680px]">
        <thead>
          <tr>
            <Th>Resource</Th>
            <Th>Permissions granted</Th>
            <Th>Policy rules</Th>
            <Th>Calls 24h</Th>
            <Th>Denied 24h</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const href = `/agents/${agentId}/resources/${row.resourceId}`;
            return (
              <tr
                key={row.resourceId}
                className={ROW_LINK_CLASS}
                onClick={(event) => {
                  // The name cell holds a real link for keyboard users; don't
                  // navigate twice when that is what was clicked.
                  if ((event.target as HTMLElement).closest("a")) return;
                  router.push(href);
                }}
              >
                <Td>
                  <Link href={href} className="flex items-center gap-2 hover:text-brand">
                    <ResourceIcon
                      id={row.resourceId}
                      kind={row.kind}
                      className="size-[15px] shrink-0 text-muted"
                    />
                    <ResourceName>{row.name}</ResourceName>
                  </Link>
                </Td>
                <Td muted>
                  <span className="font-mono text-fg">
                    {row.granted}/{row.total}
                  </span>{" "}
                  {row.catalogLabel.toLowerCase()}
                </Td>
                <Td muted>{row.rules}</Td>
                <Td muted>{row.calls}</Td>
                <Td muted className={row.denials > 0 ? "text-deny" : undefined}>
                  {row.denials}
                </Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </Card>
  );
}
