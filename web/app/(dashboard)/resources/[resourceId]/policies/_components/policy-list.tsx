"use client";

import { Plus, ScanSearch, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button, IconButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Hint } from "@/components/ui/field";
import { Toggle } from "@/components/ui/toggle";
import { POLICY_EFFECT_LABEL } from "@/lib/data/policies";
import { describeCondition, fieldsForPermission } from "@/lib/policy/conditions";
import type { Policy, PolicyEffect, Resource } from "@/lib/types";
import { cn } from "@/lib/cn";
import { AddRuleModal, type NewRule } from "@/components/policy/add-rule-modal";
import { deleteDashboardEntity, saveDashboardEntity } from "@/lib/client-api";

const EFFECT_TONE: Record<PolicyEffect, BadgeTone> = {
  allow: "allow",
  deny: "danger",
  require_approval: "warn",
};

export function PolicyList({
  resource,
  policies,
}: {
  resource: Resource;
  policies: Policy[];
}) {
  // Rules and their enabled state live here until there's an API to persist to.
  const [rules, setRules] = useState<Policy[]>(policies);
  const [addOpen, setAddOpen] = useState(false);

  async function addRule(rule: NewRule) {
    const policy: Policy = {
      ...rule,
      id: `p-${resource.id}-${crypto.randomUUID()}`,
      resourceId: resource.id,
      order: rules.length + 1,
    };
    await saveDashboardEntity("policies", policy, true);
    setRules((current) => [...current, policy]);
  }

  /** Condition labels resolve against the targeted permission's own fields. */
  function conditionText(policy: Policy): string {
    const permission =
      resource.permissions.find((entry) => entry.name === policy.permission) ?? null;
    return describeCondition(policy.condition, fieldsForPermission(permission));
  }

  async function setEnabled(id: string, enabled: boolean) {
    const policy = rules.find((rule) => rule.id === id);
    if (!policy) return;
    await saveDashboardEntity("policies", { ...policy, enabled });
    setRules((current) =>
      current.map((rule) => (rule.id === id ? { ...rule, enabled } : rule)),
    );
  }

  async function removePolicy(policy: Policy) {
    if (!window.confirm(`Remove the ${POLICY_EFFECT_LABEL[policy.effect]} policy for ${policy.permission}?`)) {
      return;
    }
    await deleteDashboardEntity("policies", policy.id);
    setRules((current) => current.filter((rule) => rule.id !== policy.id));
  }

  return (
    <>
      {rules.length === 0 ? (
        <EmptyState icon={<ScanSearch />}>
          No default rules yet — every call to this resource is governed only by the calling
          agent&apos;s own permissions and rules.
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

              <div className="mt-0.5 flex shrink-0 items-center gap-2">
                <Toggle
                  checked={policy.enabled}
                  onChange={(next) => setEnabled(policy.id, next)}
                  label={`Enable rule ${index + 1}: ${POLICY_EFFECT_LABEL[policy.effect]} ${policy.permission}`}
                />
                <IconButton
                  label={`Remove policy ${index + 1}: ${POLICY_EFFECT_LABEL[policy.effect]} ${policy.permission}`}
                  onClick={() => removePolicy(policy)}
                  className="text-danger hover:text-danger"
                >
                  <Trash2 className="size-3.5" />
                </IconButton>
              </div>
            </li>
          ))}
        </ol>
      )}

      <Button size="sm" className="mt-4" onClick={() => setAddOpen(true)}>
        <Plus aria-hidden className="size-3.75" />
        Add default rule
      </Button>
      <Hint>
        Rules are evaluated top to bottom and the first match wins, so narrower rules belong above
        broader ones. Disabled rules are skipped entirely. Every agent on this resource inherits
        these, and sees them interleaved with its own rules in evaluation order.
      </Hint>

      <AddRuleModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={addRule}
        resource={resource}
        nextPosition={rules.length + 1}
      />
    </>
  );
}
