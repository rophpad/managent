"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AGENT_STATUS_TONE, Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ResourceName, ROW_LINK_CLASS, Table, Td, Th } from "@/components/ui/table";
import type { AgentStatus } from "@/lib/types";

/**
 * One agent's relationship to this resource. `granted` and `rules` vary from row
 * to row over the same resource — which is the whole point of showing them here.
 */
export interface ResourceAgentRow {
  agentId: string;
  name: string;
  owner: string;
  status: AgentStatus;
  statusLabel: string;
  granted: number;
  total: number;
  rules: number;
  calls: number;
  denials: number;
}

export function ResourceAgentsTable({
  resourceId,
  rows,
}: {
  resourceId: string;
  rows: ResourceAgentRow[];
}) {
  const router = useRouter();

  return (
    <Card>
      <Table minWidth="min-w-[760px]">
        <thead>
          <tr>
            <Th>Agent</Th>
            <Th>Owner</Th>
            <Th>Status</Th>
            <Th>Permissions granted</Th>
            <Th>Policy rules</Th>
            <Th>Calls 24h</Th>
            <Th>Denied 24h</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const href = `/agents/${row.agentId}/resources/${resourceId}`;
            return (
              <tr
                key={row.agentId}
                className={ROW_LINK_CLASS}
                onClick={(event) => {
                  // The name cell holds a real link for keyboard users; don't
                  // navigate twice when that is what was clicked.
                  if ((event.target as HTMLElement).closest("a")) return;
                  router.push(href);
                }}
              >
                <Td>
                  <Link href={href} className="hover:text-brand">
                    <ResourceName>{row.name}</ResourceName>
                  </Link>
                </Td>
                <Td muted>{row.owner}</Td>
                <Td>
                  <Badge tone={AGENT_STATUS_TONE[row.status]}>{row.statusLabel}</Badge>
                </Td>
                <Td muted>
                  <span className="font-mono text-fg">
                    {row.granted}/{row.total}
                  </span>
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
