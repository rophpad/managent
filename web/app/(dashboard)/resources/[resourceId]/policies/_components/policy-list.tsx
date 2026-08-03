"use client";

import { Plus, ScanSearch } from "lucide-react";
import { useState } from "react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Hint } from "@/components/ui/field";
import { Toggle } from "@/components/ui/toggle";
import { POLICY_EFFECT_LABEL } from "@/lib/data/policies";
import type { Policy, PolicyEffect } from "@/lib/types";
import { cn } from "@/lib/cn";

const EFFECT_TONE: Record<PolicyEffect, BadgeTone> = {
  allow: "allow",
  deny: "danger",
  require_approval: "warn",
};

export function PolicyList({ policies }: { policies: Policy[] }) {
  // Enabled state is local until there's an API to persist it.
  const [disabled, setDisabled] = useState<ReadonlySet<string>>(
    () => new Set(policies.filter((policy) => !policy.enabled).map((policy) => policy.id)),
  );

  if (policies.length === 0) {
    return (
      <EmptyState icon={<ScanSearch />}>
        No policy rules yet — every call to this resource falls through to the agent&apos;s own
        scope.
      </EmptyState>
    );
  }

  return (
    <>
      <ol className="list-none p-0">
        {policies.map((policy, index) => {
          const isOn = !disabled.has(policy.id);
          return (
            <li
              key={policy.id}
              className={cn(
                "flex items-start gap-3 border-b border-line-soft py-3.5 last:border-b-0",
                !isOn && "opacity-50",
              )}
            >
              <span
                aria-hidden
                className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-line bg-panel-2 text-[11px] text-muted"
              >
                {index + 1}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={EFFECT_TONE[policy.effect]}>
                    {POLICY_EFFECT_LABEL[policy.effect]}
                  </Badge>
                  <span className="font-mono text-[12.5px]">
                    {policy.subject} → {policy.permission}
                  </span>
                </div>

                {policy.condition || policy.rateLimit ? (
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-muted-2">
                    {policy.condition ? (
                      <span>
                        when <span className="font-mono text-muted">{policy.condition}</span>
                      </span>
                    ) : null}
                    {policy.rateLimit ? (
                      <span>
                        limit <span className="font-mono text-muted">{policy.rateLimit}</span>
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <Toggle
                checked={isOn}
                onChange={(next) =>
                  setDisabled((current) => {
                    const updated = new Set(current);
                    if (next) updated.delete(policy.id);
                    else updated.add(policy.id);
                    return updated;
                  })
                }
                label={`Enable rule ${index + 1}: ${POLICY_EFFECT_LABEL[policy.effect]} ${policy.subject} on ${policy.permission}`}
                className="mt-0.5"
              />
            </li>
          );
        })}
      </ol>

      <Button size="sm" className="mt-4">
        <Plus aria-hidden className="size-[15px]" />
        Add rule
      </Button>
      <Hint>
        Rules are evaluated top to bottom and the first match wins, so narrower rules belong above
        broader ones. Disabled rules are skipped entirely.
      </Hint>
    </>
  );
}
