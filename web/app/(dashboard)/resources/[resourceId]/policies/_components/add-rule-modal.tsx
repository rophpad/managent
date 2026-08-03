"use client";

import { Check, ListPlus } from "lucide-react";
import { useId, useState } from "react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, Hint, Input, Select } from "@/components/ui/field";
import { Modal, ModalBody } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import { POLICY_EFFECT_LABEL } from "@/lib/data/policies";
import type { Permission, Policy, PolicyEffect } from "@/lib/types";

const EFFECTS: readonly PolicyEffect[] = ["allow", "require_approval", "deny"];

const EFFECT_TONE: Record<PolicyEffect, BadgeTone> = {
  allow: "allow",
  deny: "danger",
  require_approval: "warn",
};

const EFFECT_HINT: Record<PolicyEffect, string> = {
  allow: "Matching calls run immediately, with the real credential injected at the last moment.",
  require_approval:
    "Matching calls are held and routed to a human. The agent stays blocked until someone resolves it.",
  deny: "Matching calls are blocked before they reach the resource. The agent sees a normal error.",
};

/** `agent:*` matches every agent; anything else targets one by name. */
const ALL_AGENTS = "agent:*";
const ALL_PERMISSIONS = "*";

export type NewRule = Omit<Policy, "id" | "resourceId" | "order">;

export function AddRuleModal({
  open,
  onClose,
  onAdd,
  permissions,
  agentNames,
  nextPosition,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (rule: NewRule) => void;
  permissions: Permission[];
  agentNames: string[];
  /** Where the new rule will land in evaluation order. */
  nextPosition: number;
}) {
  const fieldId = useId();
  const [effect, setEffect] = useState<PolicyEffect>("allow");
  const [subject, setSubject] = useState(ALL_AGENTS);
  const [permission, setPermission] = useState(ALL_PERMISSIONS);
  const [condition, setCondition] = useState("");
  const [rateLimit, setRateLimit] = useState("");

  function reset() {
    setEffect("allow");
    setSubject(ALL_AGENTS);
    setPermission(ALL_PERMISSIONS);
    setCondition("");
    setRateLimit("");
  }

  function submit() {
    onAdd({
      effect,
      subject,
      permission,
      condition: condition.trim() || undefined,
      rateLimit: rateLimit.trim() || undefined,
      enabled: true,
    });
    reset();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title="Add policy rule"
      icon={<ListPlus />}
      footer={
        <>
          <Button variant="primary" size="sm" onClick={submit}>
            <Check aria-hidden className="size-[15px]" />
            Add rule
          </Button>
          <Button size="sm" onClick={onClose}>
            Cancel
          </Button>
        </>
      }
    >
      <ModalBody>
        <FieldGroup label="Effect" hint={EFFECT_HINT[effect]}>
          <div role="radiogroup" aria-label="Effect" className="mt-2 flex flex-wrap gap-2">
            {EFFECTS.map((option) => {
              const selected = option === effect;
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setEffect(option)}
                  className={cn(
                    "rounded-lg border px-3 py-2 transition-colors",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                    selected ? "border-brand bg-brand/9" : "border-line hover:bg-surface",
                  )}
                >
                  <Badge tone={EFFECT_TONE[option]}>{POLICY_EFFECT_LABEL[option]}</Badge>
                </button>
              );
            })}
          </div>
        </FieldGroup>

        <Field label="Applies to" htmlFor={`${fieldId}-subject`}>
          <Select
            id={`${fieldId}-subject`}
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
          >
            <option value={ALL_AGENTS}>All agents ({ALL_AGENTS})</option>
            {agentNames.map((name) => (
              <option key={name} value={`agent:${name}`}>
                agent:{name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Permission" htmlFor={`${fieldId}-permission`}>
          <Select
            id={`${fieldId}-permission`}
            value={permission}
            onChange={(event) => setPermission(event.target.value)}
          >
            <option value={ALL_PERMISSIONS}>All permissions ({ALL_PERMISSIONS})</option>
            {permissions.map((entry) => (
              <option key={entry.name} value={entry.name}>
                {entry.name}
                {entry.highRisk ? " — high risk" : ""}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label={
            <>
              Condition <span className="font-normal text-muted-2">(optional)</span>
            </>
          }
          htmlFor={`${fieldId}-condition`}
          hint="Must hold for the rule to match, e.g. amount > $500."
        >
          <Input
            id={`${fieldId}-condition`}
            value={condition}
            onChange={(event) => setCondition(event.target.value)}
            placeholder="amount > $500"
            autoComplete="off"
          />
        </Field>

        <Field
          label={
            <>
              Rate limit <span className="font-normal text-muted-2">(optional)</span>
            </>
          }
          htmlFor={`${fieldId}-rate`}
          className="mb-0"
        >
          <Input
            id={`${fieldId}-rate`}
            value={rateLimit}
            onChange={(event) => setRateLimit(event.target.value)}
            placeholder="20 / hour"
            autoComplete="off"
          />
        </Field>

        <Hint className="mt-4 border-t border-line-soft pt-3">
          This rule is added at position {nextPosition}, last in evaluation order. Rules are checked
          top to bottom and the first match wins — move it above broader rules if it should take
          precedence.
        </Hint>
      </ModalBody>
    </Modal>
  );
}
