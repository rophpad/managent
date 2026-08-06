"use client";

import { Plus, ScanSearch } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Hint } from "@/components/ui/field";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/cn";
import { POLICY_EFFECT_LABEL } from "@/lib/data/policies";
import { describeCondition, fieldsForPermission } from "@/lib/policy/conditions";
import type { EffectivePolicy, PolicyEffect, Resource } from "@/lib/types";
import { AddRuleModal, type NewRule } from "@/components/policy/add-rule-modal";
import { saveDashboardEntity } from "@/lib/client-api";
import type { Policy } from "@/lib/types";

const EFFECT_TONE: Record<PolicyEffect, BadgeTone> = {
  allow: "allow",
  deny: "danger",
  require_approval: "warn",
};

/**
 * The rules governing one agent on one resource, in evaluation order. Inherited
 * defaults are shown in place rather than in a separate list — first match wins,
 * so their position relative to the agent's own rules is what decides outcomes —
 * but they're read-only here, because editing one would change every agent.
 */
export function AgentPolicyList({
  agentId,
  agentName,
  resource,
  policies,
}: {
  agentId: string;
  agentName: string;
  resource: Resource;
  policies: EffectivePolicy[];
}) {
  // Rules and their enabled state live here until there's an API to persist to.
  const [rules, setRules] = useState<EffectivePolicy[]>(policies);
  const [addOpen, setAddOpen] = useState(false);

  const ownCount = rules.filter((rule) => !rule.inherited).length;

  async function addRule(rule: NewRule) {
    const policy: Policy = {
      ...rule,
      id: `p-${resource.id}-${agentId}-${crypto.randomUUID()}`,
      resourceId: resource.id,
      order: rules.length + 1,
    };
    await saveDashboardEntity("policies", policy, true);
    setRules((current) => [...current, { ...policy, inherited: false }]);
  }

  /** Condition labels resolve against the targeted permission's own fields. */
  function conditionText(policy: EffectivePolicy): string {
    const permission =
      resource.permissions.find((entry) => entry.name === policy.permission) ?? null;
    return describeCondition(policy.condition, fieldsForPermission(permission));
  }

  async function setEnabled(id: string, enabled: boolean) {
    const policy = rules.find((rule) => rule.id === id && !rule.inherited);
    if (!policy) return;
    const { inherited, ...stored } = policy;
    void inherited;
    await saveDashboardEntity("policies", { ...stored, enabled });
    setRules((current) => current.map((rule) => (rule.id === id ? { ...rule, enabled } : rule)));
  }

  return (
    <>
      {rules.length === 0 ? (
        <EmptyState icon={<ScanSearch />}>
          No rules govern {agentName} on this resource — every call falls through to the
          permissions granted above.
        </EmptyState>
      ) : (
        <ol className="list-none p-0">
          {rules.map((policy, index) => (
            <li
              key={policy.id}
              className={cn(
                "flex items-start gap-3 border-b border-line-soft py-3.5 last:border-b-0",
                !policy.enabled && "opacity-50",
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
                  <span className="font-mono text-[12.5px]">{policy.permission}</span>
                  {policy.inherited ? (
                    <Link
                      href={`/resources/${resource.id}/policies`}
                      className="rounded-full border border-line px-2 py-0.5 text-[10.5px] text-muted-2 transition-colors hover:text-fg"
                      title={`Inherited from ${resource.name}'s defaults — applies to every agent. Edit it on the resource.`}
                    >
                      inherited
                    </Link>
                  ) : null}
                </div>

                {policy.condition || policy.rateLimit ? (
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-muted-2">
                    {policy.condition ? (
                      <span>
                        when <span className="font-mono text-muted">{conditionText(policy)}</span>
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

              {policy.inherited ? (
                <span className="mt-0.5 shrink-0 text-[11px] text-muted-2">resource default</span>
              ) : (
                <Toggle
                  checked={policy.enabled}
                  onChange={(next) => setEnabled(policy.id, next)}
                  label={`Enable rule ${index + 1}: ${POLICY_EFFECT_LABEL[policy.effect]} ${policy.permission}`}
                  className="mt-0.5"
                />
              )}
            </li>
          ))}
        </ol>
      )}

      <Button size="sm" className="mt-4" onClick={() => setAddOpen(true)}>
        <Plus aria-hidden className="size-[15px]" />
        Add rule for {agentName}
      </Button>
      <Hint>
        {ownCount === 0
          ? `${agentName} has no rules of its own here — only ${resource.name}'s defaults apply.`
          : `${ownCount} ${ownCount === 1 ? "rule is" : "rules are"} specific to ${agentName}.`}{" "}
        Rules are evaluated top to bottom and the first match wins. Inherited defaults are edited on{" "}
        <Link href={`/resources/${resource.id}/policies`} className="text-brand hover:underline">
          the resource
        </Link>
        , where they apply to every agent.
      </Hint>

      <AddRuleModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={addRule}
        resource={resource}
        nextPosition={rules.length + 1}
        subject={`agent:${agentId}`}
      />
    </>
  );
}
