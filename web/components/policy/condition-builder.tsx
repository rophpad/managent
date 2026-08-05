"use client";

import { Plus, X } from "lucide-react";
import { Button, IconButton } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import {
  OPERATORS,
  findField,
  groupFields,
  insertNode,
  newGroup,
  newRule,
  operatorsForType,
  removeNode,
  updateNode,
  type ConditionField,
} from "@/lib/policy/conditions";
import type { ConditionGroup, ConditionNode, ConditionOperator } from "@/lib/types";

/** Nesting past this reads worse than an expression would. */
const MAX_DEPTH = 3;

export function ConditionBuilder({
  root,
  fields,
  onChange,
}: {
  root: ConditionGroup;
  fields: ConditionField[];
  onChange: (root: ConditionGroup) => void;
}) {
  return <GroupEditor group={root} root={root} fields={fields} onChange={onChange} depth={0} />;
}

function GroupEditor({
  group,
  root,
  fields,
  onChange,
  depth,
  onRemove,
}: {
  group: ConditionGroup;
  root: ConditionGroup;
  fields: ConditionField[];
  onChange: (root: ConditionGroup) => void;
  depth: number;
  onRemove?: () => void;
}) {
  const isRoot = depth === 0;

  function setMatch(match: ConditionGroup["match"]) {
    if (isRoot) onChange({ ...root, match });
    else
      onChange(
        updateNode(root, group.id, (node) => (node.kind === "group" ? { ...node, match } : node)),
      );
  }

  return (
    <div
      className={cn(
        !isRoot && "rounded-lg border border-line-soft bg-panel-2/60 p-3",
        !isRoot && "mt-2",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[12px] text-muted">
          <span>Match</span>
          <div
            role="radiogroup"
            aria-label="Match mode"
            className="flex rounded-full border border-line bg-panel-2 p-[3px]"
          >
            {(["all", "any"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                role="radio"
                aria-checked={group.match === mode}
                tabIndex={group.match === mode ? 0 : -1}
                onClick={() => setMatch(mode)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11.5px] transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                  group.match === mode ? "bg-surface text-fg" : "text-muted hover:text-fg",
                )}
              >
                {mode === "all" ? "ALL" : "ANY"}
              </button>
            ))}
          </div>
          <span>of the following</span>
        </div>

        {onRemove ? (
          <IconButton label="Remove group" onClick={onRemove}>
            <X className="size-3.5" />
          </IconButton>
        ) : null}
      </div>

      {group.children.length === 0 ? (
        <p className="mt-2.5 text-[12px] text-muted-2">
          No conditions — the rule matches every call to this permission.
        </p>
      ) : (
        <ul className="mt-2.5 list-none space-y-2 p-0">
          {group.children.map((child) => (
            <li key={child.id}>
              {child.kind === "rule" ? (
                <RuleEditor
                  rule={child}
                  root={root}
                  fields={fields}
                  onChange={onChange}
                  onRemove={() => onChange(removeNode(root, child.id))}
                />
              ) : (
                <GroupEditor
                  group={child}
                  root={root}
                  fields={fields}
                  onChange={onChange}
                  depth={depth + 1}
                  onRemove={() => onChange(removeNode(root, child.id))}
                />
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-2.5 flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() => onChange(insertNode(root, group.id, newRule(fields[0])))}
        >
          <Plus aria-hidden className="size-[15px]" />
          Add condition
        </Button>
        {depth < MAX_DEPTH - 1 ? (
          <Button size="sm" onClick={() => onChange(insertNode(root, group.id, newGroup()))}>
            <Plus aria-hidden className="size-[15px]" />
            Add group
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function RuleEditor({
  rule,
  root,
  fields,
  onChange,
  onRemove,
}: {
  rule: Extract<ConditionNode, { kind: "rule" }>;
  root: ConditionGroup;
  fields: ConditionField[];
  onChange: (root: ConditionGroup) => void;
  onRemove: () => void;
}) {
  const field = findField(fields, rule.field);
  const operators = operatorsForType(field?.type ?? "string");
  const spec = OPERATORS[rule.operator];

  function patch(change: Partial<typeof rule>) {
    onChange(
      updateNode(root, rule.id, (node) => (node.kind === "rule" ? { ...node, ...change } : node)),
    );
  }

  function setField(id: string) {
    const next = findField(fields, id);
    const allowed = operatorsForType(next?.type ?? "string");
    // Keep the operator when it still applies, otherwise fall back to the first
    // valid one — switching amount→reason must not leave "greater than" set.
    const operator: ConditionOperator = allowed.includes(rule.operator)
      ? rule.operator
      : (allowed[0] ?? "eq");
    patch({ field: id, operator, value: "" });
  }

  return (
    <div className="flex flex-wrap items-start gap-2 rounded-lg border border-line-soft bg-panel-2/60 p-2">
      <Select
        aria-label="Field"
        value={rule.field}
        onChange={(event) => setField(event.target.value)}
        className="min-w-[9.5rem] flex-1 py-2 font-mono text-[12px]"
      >
        {groupFields(fields).map(([groupName, groupItems]) => (
          <optgroup key={groupName} label={groupName}>
            {groupItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </optgroup>
        ))}
      </Select>

      <Select
        aria-label="Operator"
        value={rule.operator}
        onChange={(event) => patch({ operator: event.target.value as ConditionOperator, value: "" })}
        className="min-w-[8.5rem] flex-1 py-2 text-[12px]"
      >
        {operators.map((operator) => (
          <option key={operator} value={operator}>
            {OPERATORS[operator].label}
          </option>
        ))}
      </Select>

      {spec?.value === "none" ? null : field?.type === "enum" && spec?.value === "single" ? (
        <Select
          aria-label="Value"
          value={rule.value ?? ""}
          onChange={(event) => patch({ value: event.target.value })}
          className="min-w-[9rem] flex-1 py-2 font-mono text-[12px]"
        >
          <option value="">Select…</option>
          {(field.enumValues ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      ) : (
        <Input
          aria-label="Value"
          value={rule.value ?? ""}
          onChange={(event) => patch({ value: event.target.value })}
          inputMode={
            field?.type === "integer" || field?.type === "number" ? "numeric" : undefined
          }
          placeholder={
            spec?.value === "list"
              ? "comma, separated, values"
              : (field?.example ?? "value")
          }
          className="min-w-[9rem] flex-1 py-2 font-mono text-[12px]"
        />
      )}

      <IconButton label="Remove condition" onClick={onRemove} className="mt-1.5">
        <X className="size-3.5" />
      </IconButton>
    </div>
  );
}

/** Field reference plus its description, shown under the builder. */
export function FieldLegend({ fields }: { fields: ConditionField[] }) {
  const documented = fields.filter((field) => field.description);
  if (documented.length === 0) return null;

  return (
    <dl className="mt-3 space-y-1 border-t border-line-soft pt-3 text-[11.5px]">
      {documented.map((field) => (
        <div key={field.id} className="flex gap-2">
          <dt className="shrink-0 font-mono text-muted">{field.id}</dt>
          <dd className="min-w-0 text-muted-2">{field.description}</dd>
        </div>
      ))}
    </dl>
  );
}
