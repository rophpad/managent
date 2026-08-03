"use client";

import { Bot } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AGENT_STATUS_TONE, Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CoverageBar } from "@/components/ui/coverage-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterPills } from "@/components/ui/filter-pills";
import {
  ResourceName,
  ROW_LINK_CLASS,
  Table,
  Td,
  Th,
} from "@/components/ui/table";
import { SearchInput, Toolbar } from "@/components/ui/search-input";
import { AGENT_STATUS_LABEL } from "@/lib/data/agents";
import type { Agent, AgentStatus } from "@/lib/types";

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "idle", label: "Idle" },
  { value: "revoked", label: "Revoked" },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number]["value"];

export function AgentsTable({ agents }: { agents: Agent[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return agents.filter((agent) => {
      const matchesStatus = status === "all" || agent.status === status;
      const matchesQuery =
        !needle ||
        agent.name.toLowerCase().includes(needle) ||
        agent.owner.toLowerCase().includes(needle);
      return matchesStatus && matchesQuery;
    });
  }, [agents, query, status]);

  return (
    <>
      <Toolbar>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search agents by name or owner"
        />
        <FilterPills
          label="Filter agents by status"
          options={STATUS_FILTERS}
          value={status}
          onChange={setStatus}
        />
      </Toolbar>

      <Card>
        {visible.length === 0 ? (
          <EmptyState icon={<Bot />}>No agents match this filter.</EmptyState>
        ) : (
          <Table>
            <thead>
              <tr className="">
                <Th>Agent</Th>
                <Th>Owner</Th>
                <Th>Status</Th>
                <Th>Coverage</Th>
                <Th>Calls, 24h</Th>
                <Th>Denied, 24h</Th>
              </tr>
            </thead>
            <tbody>
              {visible.map((agent) => (
                <tr
                  key={agent.id}
                  className={ROW_LINK_CLASS}
                  onClick={(event) => {
                    // The name cell holds a real link for keyboard users; don't
                    // navigate twice when that is what was clicked.
                    if ((event.target as HTMLElement).closest("a")) return;
                    router.push(`/agents/${agent.id}`);
                  }}
                >
                  <Td>
                    <Link
                      href={`/agents/${agent.id}`}
                      className="hover:text-brand"
                    >
                      <ResourceName>{agent.name}</ResourceName>
                    </Link>
                  </Td>
                  <Td muted>{agent.owner}</Td>
                  <Td>
                    <Badge tone={AGENT_STATUS_TONE[agent.status]}>
                      {AGENT_STATUS_LABEL[agent.status as AgentStatus]}
                    </Badge>
                  </Td>
                  <Td>
                    <CoverageBar coverage={agent.coverage} />
                  </Td>
                  <Td>{agent.calls24h}</Td>
                  <Td
                    className={
                      agent.denied24h > 0
                        ? "text-deny"
                        : "text-[12.5px] text-muted"
                    }
                  >
                    {agent.denied24h}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
