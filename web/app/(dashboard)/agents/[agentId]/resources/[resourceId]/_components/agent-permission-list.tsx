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
  const initial = rows.filter((row) => row.granted).map((row) => row.name);
  const [granted, setGranted] = useState<ReadonlySet<string>>(() => new Set(initial));
  const [saved, setSaved] = useState<ReadonlySet<string>>(() => new Set(initial));

  const dirty =
    granted.size !== saved.size || [...granted].some((name) => !saved.has(name));

  function toggle(name: string, checked: boolean) {
    setGranted((current) => {
      const next = new Set(current);
      if (checked) next.add(name);
      else next.delete(name);
      return next;
    });
  }

  async function savePermissions() {
    const retained = agent.scopes.filter((scope) => scope.resourceId !== resourceId);
    const existing = new Map(
      agent.scopes.filter((scope) => scope.resourceId === resourceId).map((scope) => [scope.permission, scope]),
    );
    const scopes = [
      ...retained,
      ...[...granted].map((permission) =>
        existing.get(permission) ?? { resourceId, permission, callsToday: 0 },
      ),
    ];
    await saveDashboardEntity("agents", { ...agent, scopes });
    setSaved(new Set(granted));
  }

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-4">
        <MutedText>
          {granted.size} of {rows.length} granted
        </MutedText>
        {dirty ? (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setGranted(new Set(saved))}>
              Reset
            </Button>
            <Button variant="primary" size="sm" onClick={savePermissions}>
              Save permissions
            </Button>
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-lg border border-line-soft">
        {rows.map((row) => {
          const isGranted = granted.has(row.name);
          return (
            <label
              key={row.name}
              className={cn(
                "flex cursor-pointer items-start gap-3 border-b border-line-soft px-3.5 py-3 transition-colors last:border-b-0 hover:bg-surface",
                !isGranted && "opacity-60",
              )}
            >
              <input
                type="checkbox"
                name={row.name}
                checked={isGranted}
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
                {isGranted ? (
                  <span className="block">used {row.callsToday}x today</span>
                ) : null}
                {row.paramCount > 0 ? (
                  <span className="block">{row.paramCount} inputs</span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>

      <Hint className="mt-3">
        Unchecked {catalogNoun}s exist on the resource but {agentName}{" "}
        can&apos;t call them. This selection applies to {agentName}{" "}
        only — it doesn&apos;t change the resource or any other agent&apos;s access.
      </Hint>
    </>
  );
}
