"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/ui/field";
import { MutedText } from "@/components/ui/rows";
import { RiskTag } from "@/components/ui/scope-chip";
import { cn } from "@/lib/cn";
import { saveDashboardEntity } from "@/lib/client-api";
import type { Agent } from "@/lib/types";

/** A catalog entry plus this agent's relationship to it. */
export interface GrantRow {
  name: string;
  /** Wire-level form — `POST /v1/refunds` for REST, absent for MCP and roles. */
  match?: string;
  highRisk?: boolean;
  paramCount: number;
  granted: boolean;
  /** Only meaningful when granted. */
  callsToday: number;
}

export function AgentPermissionList({
  agent,
  resourceId,
  agentName,
  catalogNoun,
  rows,
}: {
  agent: Agent;
  resourceId: string;
  agentName: string;
  /** `endpoint`, `tool` or `role` — what this resource's catalog entries are. */
  catalogNoun: string;
  rows: GrantRow[];
}) {
  const initial = rows.filter((row) => !row.granted).map((row) => row.name);
  const [denied, setDenied] = useState<ReadonlySet<string>>(() => new Set(initial));
  const [saved, setSaved] = useState<ReadonlySet<string>>(() => new Set(initial));

  const dirty = denied.size !== saved.size || [...denied].some((name) => !saved.has(name));
  const allAllowed = denied.size === 0;

  function toggleAll() {
    setDenied(allAllowed ? new Set(rows.map((row) => row.name)) : new Set());
  }

  function toggle(name: string, checked: boolean) {
    setDenied((current) => {
      const next = new Set(current);
      if (checked) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  async function savePermissions() {
    const linkedResources = agent.permissionMode === "denylist"
      ? [...new Set([...(agent.linkedResources ?? []), resourceId])]
      : [...new Set([...agent.scopes.map((scope) => scope.resourceId), resourceId])];
    const retained = (agent.deniedPermissions ?? []).filter((entry) => entry.resourceId !== resourceId);
    const deniedPermissions = [
      ...retained,
      ...[...denied].map((permission) => ({ resourceId, permission, callsToday: 0 })),
    ];
    await saveDashboardEntity("agents", {
      ...agent,
      permissionMode: "denylist",
      linkedResources,
      deniedPermissions,
    });
    setSaved(new Set(denied));
  }

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-4">
        <MutedText>
          {rows.length - denied.size} of {rows.length} allowed
        </MutedText>
        <div className="flex gap-2">
          <Button size="sm" onClick={toggleAll}>
            {allAllowed ? "Remove all permission to all" : "Add permission to all"}
          </Button>
          {dirty ? (
            <>
              <Button size="sm" onClick={() => setDenied(new Set(saved))}>
                Reset
              </Button>
              <Button variant="primary" size="sm" onClick={savePermissions}>
                Save permissions
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-line-soft">
        {rows.map((row) => {
          const isDenied = denied.has(row.name);
          return (
            <label
              key={row.name}
              className={cn(
                "flex cursor-pointer items-start gap-3 border-b border-line-soft px-3.5 py-3 transition-colors last:border-b-0 hover:bg-surface",
                isDenied && "opacity-60",
              )}
            >
              <input
                type="checkbox"
                name={row.name}
                checked={!isDenied}
                onChange={(event) => toggle(row.name, event.target.checked)}
                className="mt-0.5 size-4 accent-brand"
              />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-1.5 font-mono text-[12.5px]">
                  {row.match ?? row.name}
                  {row.highRisk ? <RiskTag className="ml-0" /> : null}
                </span>
                {row.match ? (
                  <span className="mt-0.5 block text-[11.5px] text-muted-2">{row.name}</span>
                ) : null}
              </span>
              <span className="shrink-0 text-right text-[11px] text-muted-2">
                {!isDenied ? <span className="block">allowed</span> : <span className="block">denied</span>}
                {row.paramCount > 0 ? (
                  <span className="block">{row.paramCount} inputs</span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>

      <Hint className="mt-3">
        Checked {catalogNoun}s are allowed. Uncheck only the tools that {agentName}{" "}
        must not call. Policies can add conditions or approval requirements to allowed tools.
      </Hint>
    </>
  );
}
