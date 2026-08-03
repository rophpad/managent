"use client";

import { ScanSearch } from "lucide-react";
import { useMemo, useState } from "react";
import { DECISION_LABEL, DECISION_TONE, Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterPills } from "@/components/ui/filter-pills";
import { SearchInput, Toolbar } from "@/components/ui/search-input";
import { Table, Td, Th } from "@/components/ui/table";
import type { AuditEntry } from "@/lib/types";

const OUTCOME_FILTERS = [
  { value: "all", label: "All" },
  { value: "allow", label: "Allow" },
  { value: "deny", label: "Deny" },
] as const;

type OutcomeFilter = (typeof OUTCOME_FILTERS)[number]["value"];

export function AuditTable({ entries }: { entries: AuditEntry[] }) {
  const [query, setQuery] = useState("");
  const [outcome, setOutcome] = useState<OutcomeFilter>("all");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return entries.filter((entry) => {
      const matchesOutcome = outcome === "all" || entry.outcome === outcome;
      const matchesQuery =
        !needle ||
        entry.agentId.toLowerCase().includes(needle) ||
        entry.action.toLowerCase().includes(needle);
      return matchesOutcome && matchesQuery;
    });
  }, [entries, query, outcome]);

  return (
    <>
      <Toolbar>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Filter by agent, resource, or scope"
        />
        <FilterPills
          label="Filter by outcome"
          options={OUTCOME_FILTERS}
          value={outcome}
          onChange={setOutcome}
        />
      </Toolbar>

      <Card>
        {visible.length === 0 ? (
          <EmptyState icon={<ScanSearch />}>No calls match this filter.</EmptyState>
        ) : (
          <Table minWidth="min-w-[520px]">
            <thead>
              <tr>
                <Th className="w-[70px]">Time</Th>
                <Th className="w-[140px]">Agent</Th>
                <Th>Action</Th>
                <Th className="w-[90px] text-right">Outcome</Th>
              </tr>
            </thead>
            <tbody>
              {visible.map((entry) => (
                <tr key={entry.id} className="transition-colors hover:bg-surface">
                  <Td className="font-mono text-[11.5px] text-muted-2">{entry.time}</Td>
                  <Td className="font-mono">{entry.agentId}</Td>
                  <Td muted>{entry.action}</Td>
                  <Td className="text-right">
                    <Badge tone={DECISION_TONE[entry.outcome]}>
                      {DECISION_LABEL[entry.outcome]}
                    </Badge>
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
