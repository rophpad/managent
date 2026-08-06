"use client";

import { ArrowLeft, ArrowRight, Check, ListPlus } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { ConditionBuilder, FieldLegend } from "@/components/policy/condition-builder";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, Hint, Input, Textarea } from "@/components/ui/field";
import { Modal, ModalBody } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import { POLICY_EFFECT_LABEL } from "@/lib/data/policies";
import { CATALOG_LABEL, CATALOG_NOUN } from "@/lib/data/resources";
import { countRules, fieldsForPermission, newGroup } from "@/lib/policy/conditions";
import type {
  ConditionGroup,
  Permission,
  Policy,
  PolicyCondition,
  PolicyEffect,
  Resource,
} from "@/lib/types";

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

export type NewRule = Omit<Policy, "id" | "resourceId" | "order">;

export function AddRuleModal({
  open,
  onClose,
  onAdd,
  resource,
  nextPosition,
  subject = "agent:*",
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (rule: NewRule) => void;
  resource: Resource;
  nextPosition: number;
  /**
   * Who the rule governs. `agent:*` is a resource-wide default; authoring from
   * an agent's own page passes `agent:<id>` so the rule binds to that agent
   * alone rather than silently applying to every agent on the resource.
   */
  subject?: string;
}) {
  const fieldId = useId();
  const [step, setStep] = useState<1 | 2>(1);
  const [effect, setEffect] = useState<PolicyEffect>("allow");
  const [permissionName, setPermissionName] = useState(resource.permissions[0]?.name ?? "");
  const [mode, setMode] = useState<"builder" | "expression">("builder");
  const [root, setRoot] = useState<ConditionGroup>(() => newGroup());
  const [expression, setExpression] = useState("");
  const [rateLimit, setRateLimit] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const rateLimitError = rateLimit.trim() && !/^\d+\s*\/\s*(second|minute|hour|day)s?$/i.test(rateLimit.trim())
    ? "Use a limit such as 20 / hour or 5 / minute."
    : null;

  const permission: Permission | null =
    resource.permissions.find((entry) => entry.name === permissionName) ?? null;

  // Databases get a native scoped role rather than intercepted queries, so
  // there is no per-call payload to bind a condition to.
  const supportsConditions = resource.kind !== "db";

  const fields = useMemo(() => fieldsForPermission(permission), [permission]);

  function selectPermission(name: string) {
    setPermissionName(name);
    // Fields are permission-specific, so any existing conditions now point at
    // parameters that may not exist. Reset rather than leave dangling refs.
    setRoot(newGroup());
  }

  function reset() {
    setStep(1);
    setEffect("allow");
    setPermissionName(resource.permissions[0]?.name ?? "");
    setMode("builder");
    setRoot(newGroup());
    setExpression("");
    setRateLimit("");
    setShowErrors(false);
  }

  function buildCondition(): PolicyCondition | undefined {
    if (!supportsConditions) return undefined;
    if (mode === "expression") {
      const source = expression.trim();
      return source ? { mode: "expression", source } : undefined;
    }
    return countRules(root) > 0 ? { mode: "builder", root } : undefined;
  }

  function dismiss() {
    reset();
    onClose();
  }

  function submit() {
    setShowErrors(true);
    if (rateLimitError) return;
    onAdd({
      effect,
      subject,
      permission: permissionName,
      condition: buildCondition(),
      rateLimit: rateLimit.trim() || undefined,
      enabled: true,
    });
    reset();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={dismiss}
      wide
      title="Add policy rule"
      icon={<ListPlus />}
      footer={
        step === 1 ? (
          <>
            <Button variant="primary" size="sm" onClick={() => setStep(2)} disabled={!permission}>
              Continue
              <ArrowRight aria-hidden className="size-[15px]" />
            </Button>
            <Button size="sm" onClick={dismiss}>Cancel</Button>
          </>
        ) : (
          <>
            <Button size="sm" onClick={() => setStep(1)}>
              <ArrowLeft aria-hidden className="size-[15px]" />
              Back
            </Button>
            <Button variant="primary" size="sm" onClick={submit} disabled={!permission}>
              <Check aria-hidden className="size-[15px]" />
              Add rule
            </Button>
            <Button size="sm" onClick={dismiss}>Cancel</Button>
          </>
        )
      }
    >
      <ModalBody>
        <div className="mb-5 flex items-center gap-2" aria-label={`Step ${step} of 2`}>
          {[1, 2].map((number) => (
            <div key={number} className="flex min-w-0 flex-1 items-center gap-2">
              <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-medium", step >= number ? "bg-brand text-ink" : "bg-panel-2 text-muted")}>{number}</span>
              <span className={cn("truncate text-xs", step === number ? "text-fg" : "text-muted-2")}>{number === 1 ? `Select ${CATALOG_NOUN[resource.kind]}` : "Write condition"}</span>
              {number === 1 ? <span className="h-px flex-1 bg-line-soft" /> : null}
            </div>
          ))}
        </div>

        {step === 2 ? (
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
        ) : null}

        {step === 1 ? (
        <FieldGroup label={CATALOG_LABEL[resource.kind]} hint={`Choose what this policy controls on ${resource.name}.`}>
          <div role="radiogroup" aria-label={CATALOG_LABEL[resource.kind]} className="mt-2 grid gap-2">
            {resource.permissions.map((entry) => (
              <label key={entry.name} className={cn("cursor-pointer rounded-lg border px-3 py-2.5 transition-colors", permissionName === entry.name ? "border-brand bg-brand/9" : "border-line hover:bg-surface")}>
                <span className="flex items-center gap-2">
                  <input type="radio" name={`${fieldId}-target`} value={entry.name} checked={permissionName === entry.name} onChange={() => selectPermission(entry.name)} className="accent-brand" />
                  <span className="font-mono text-[12.5px]">{entry.match ?? entry.name}</span>
                  {entry.highRisk ? <Badge tone="danger">High risk</Badge> : null}
                </span>
                {entry.match && entry.match !== entry.name ? <span className="ml-6 mt-1 block text-[11.5px] text-muted-2">{entry.name}</span> : null}
              </label>
            ))}
          </div>
          {permission ? (
            <div className="mt-3">
              <span className="text-[11.5px] text-muted-2">{resource.kind === "mcp" ? "Arguments" : resource.kind === "rest" ? "Parameters" : "Policy target"}</span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {permission.params?.length ? permission.params.map((param) => (
                  <span key={`${param.location}.${param.name}`} className="rounded border border-line-soft bg-panel-2 px-2 py-1 font-mono text-[11px]">
                    <span className="text-muted-2">{param.location}.</span>{param.name}{param.required ? <span className="ml-1 text-deny">required</span> : null}
                  </span>
                )) : <span className="text-[11.5px] text-muted-2">No declared inputs</span>}
              </div>
            </div>
          ) : <Hint>No tools are available for this MCP server.</Hint>}
        </FieldGroup>
        ) : null}

        {step === 2 ? (
        <>
        <div className="mb-4 rounded-lg border border-line-soft bg-panel-2 px-3 py-2.5">
          <span className="block text-[11px] text-muted-2">Selected target</span>
          <span className="font-mono text-[12.5px]">{permission?.match ?? permission?.name}</span>
        </div>
        {supportsConditions ? (
          <FieldGroup
            label={
              <span className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  Conditions <span className="font-normal text-muted-2">(optional)</span>
                </span>
                <span
                  role="radiogroup"
                  aria-label="Condition editor mode"
                  className="flex rounded-full border border-line bg-panel-2 p-[3px]"
                >
                  {(
                    [
                      { value: "builder", label: "Builder" },
                      { value: "expression", label: "Expression" },
                    ] as const
                  ).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={mode === option.value}
                      tabIndex={mode === option.value ? 0 : -1}
                      onClick={() => setMode(option.value)}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[11.5px] font-normal transition-colors",
                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                        mode === option.value ? "bg-surface text-fg" : "text-muted hover:text-fg",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </span>
              </span>
            }
          >
            {mode === "builder" ? (
              <>
                <ConditionBuilder root={root} fields={fields} onChange={setRoot} />
                <FieldLegend fields={fields} />
              </>
            ) : (
              <>
                <Textarea
                  aria-label="Condition expression"
                  rows={3}
                  value={expression}
                  onChange={(event) => setExpression(event.target.value)}
                  placeholder={'body.amount > 50000 && body.reason == "fraudulent"'}
                  className="font-mono text-[12.5px]"
                />
                <Hint>
                  For rules the builder can&apos;t express. Reference fields by their qualified
                  name, e.g.{" "}
                  <span className="font-mono">{fields[0]?.id ?? "context.agent"}</span>. Combine
                  with <span className="font-mono">&amp;&amp;</span>,{" "}
                  <span className="font-mono">||</span>, and parentheses.
                </Hint>
              </>
            )}
          </FieldGroup>
        ) : (
          <Hint className="mb-[18px] mt-0">
            Conditions don&apos;t apply to database resources — Managent provisions a short-lived
            native role scoped to specific tables and never parses or intercepts SQL, so there is no
            per-call payload to test.
          </Hint>
        )}

        <Field
          label={
            <>
              Rate limit <span className="font-normal text-muted-2">(optional)</span>
            </>
          }
          htmlFor={`${fieldId}-rate`}
          className="mb-0"
          error={showErrors ? rateLimitError : null}
        >
          <Input
            id={`${fieldId}-rate`}
            value={rateLimit}
            aria-invalid={showErrors && Boolean(rateLimitError)}
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
        </>
        ) : null}
      </ModalBody>
    </Modal>
  );
}
