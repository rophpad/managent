import type {
  ConditionGroup,
  ConditionNode,
  ConditionOperator,
  ConditionRule,
  ParamLocation,
  ParamType,
  Permission,
  PermissionParam,
  PolicyCondition,
} from "@/lib/types";

/* ---------------------------------------------------------------------------
   Operators
   --------------------------------------------------------------------------- */

interface OperatorSpec {
  label: string;
  /** How the rule reads in prose, e.g. `amount is greater than 500`. */
  phrase: string;
  /** `none` renders no value input; `list` accepts comma-separated values. */
  value: "single" | "list" | "none";
  types: ParamType[];
}

const ANY_TYPE: ParamType[] = ["string", "number", "integer", "boolean", "enum", "array"];
const NUMERIC: ParamType[] = ["number", "integer"];
const TEXTUAL: ParamType[] = ["string", "enum", "array"];

export const OPERATORS: Record<ConditionOperator, OperatorSpec> = {
  eq: { label: "is", phrase: "is", value: "single", types: ["string", "number", "integer", "enum"] },
  neq: {
    label: "is not",
    phrase: "is not",
    value: "single",
    types: ["string", "number", "integer", "enum"],
  },
  gt: { label: "greater than", phrase: "is greater than", value: "single", types: NUMERIC },
  gte: { label: "at least", phrase: "is at least", value: "single", types: NUMERIC },
  lt: { label: "less than", phrase: "is less than", value: "single", types: NUMERIC },
  lte: { label: "at most", phrase: "is at most", value: "single", types: NUMERIC },
  contains: { label: "contains", phrase: "contains", value: "single", types: TEXTUAL },
  not_contains: {
    label: "does not contain",
    phrase: "does not contain",
    value: "single",
    types: TEXTUAL,
  },
  starts_with: { label: "starts with", phrase: "starts with", value: "single", types: ["string"] },
  ends_with: { label: "ends with", phrase: "ends with", value: "single", types: ["string"] },
  matches: { label: "matches regex", phrase: "matches", value: "single", types: ["string"] },
  in: { label: "is one of", phrase: "is one of", value: "list", types: TEXTUAL.concat(NUMERIC) },
  not_in: {
    label: "is none of",
    phrase: "is none of",
    value: "list",
    types: TEXTUAL.concat(NUMERIC),
  },
  present: { label: "is present", phrase: "is present", value: "none", types: ANY_TYPE },
  absent: { label: "is absent", phrase: "is absent", value: "none", types: ANY_TYPE },
  is_true: { label: "is true", phrase: "is true", value: "none", types: ["boolean"] },
  is_false: { label: "is false", phrase: "is false", value: "none", types: ["boolean"] },
};

const OPERATOR_ORDER = Object.keys(OPERATORS) as ConditionOperator[];

/** Operators that make sense for a field of this type, in a stable order. */
export function operatorsForType(type: ParamType): ConditionOperator[] {
  return OPERATOR_ORDER.filter((operator) => OPERATORS[operator].types.includes(type));
}

/* ---------------------------------------------------------------------------
   Fields
   --------------------------------------------------------------------------- */

export interface ConditionField {
  /** Qualified reference stored on the rule, e.g. `body.amount`. */
  id: string;
  label: string;
  type: ParamType;
  group: string;
  description?: string;
  enumValues?: string[];
  example?: string;
}

const LOCATION_GROUP: Record<ParamLocation, string> = {
  path: "Path parameters",
  query: "Query parameters",
  header: "Headers",
  body: "Request body",
  argument: "Tool arguments",
};

/**
 * Request metadata available on every call, whatever the resource. These are
 * what make time- and volume-based rules possible.
 */
export const CONTEXT_FIELDS: ConditionField[] = [
  {
    id: "context.agent",
    label: "agent",
    type: "string",
    group: "Request context",
    description: "Name of the calling agent.",
    example: "invoice-agent",
  },
  {
    id: "context.enforcement_mode",
    label: "enforcement_mode",
    type: "enum",
    group: "Request context",
    description: "The agent's mode at call time.",
    enumValues: ["monitor", "shadow", "strict"],
  },
  {
    id: "context.hour_utc",
    label: "hour_utc",
    type: "integer",
    group: "Request context",
    description: "Hour of day, 0–23, for business-hours rules.",
    example: "18",
  },
  {
    id: "context.day_of_week",
    label: "day_of_week",
    type: "enum",
    group: "Request context",
    description: "Day of the week at call time.",
    enumValues: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
  },
  {
    id: "context.calls_last_hour",
    label: "calls_last_hour",
    type: "integer",
    group: "Request context",
    description: "This agent's calls to this permission in the past hour.",
    example: "100",
  },
];

function paramToField(param: PermissionParam): ConditionField {
  return {
    id: `${param.location}.${param.name}`,
    label: param.name,
    type: param.type,
    group: LOCATION_GROUP[param.location],
    description: param.description,
    enumValues: param.enumValues,
    example: param.example,
  };
}

/**
 * Fields a rule may bind to. With a specific permission selected these are its
 * own parameters plus request context; with `*` only context is knowable, since
 * different permissions take different inputs.
 */
export function fieldsForPermission(permission: Permission | null): ConditionField[] {
  const params = permission?.params ?? [];
  return [...params.map(paramToField), ...CONTEXT_FIELDS];
}

export function findField(fields: ConditionField[], id: string): ConditionField | undefined {
  return fields.find((field) => field.id === id);
}

/** Fields bucketed by group, preserving first-seen group order. */
export function groupFields(fields: ConditionField[]): [string, ConditionField[]][] {
  const groups = new Map<string, ConditionField[]>();
  for (const field of fields) {
    const bucket = groups.get(field.group);
    if (bucket) bucket.push(field);
    else groups.set(field.group, [field]);
  }
  return [...groups.entries()];
}

/* ---------------------------------------------------------------------------
   Construction
   --------------------------------------------------------------------------- */

let sequence = 0;

/** Ids only need to be unique within one editing session, not stable across reloads. */
function nextId(prefix: string): string {
  sequence += 1;
  return `${prefix}-${sequence}`;
}

export function newRule(field: ConditionField | undefined): ConditionRule {
  const type = field?.type ?? "string";
  return {
    kind: "rule",
    id: nextId("rule"),
    field: field?.id ?? "",
    operator: operatorsForType(type)[0] ?? "eq",
    value: "",
  };
}

export function newGroup(children: ConditionNode[] = []): ConditionGroup {
  return { kind: "group", id: nextId("group"), match: "all", children };
}

/* ---------------------------------------------------------------------------
   Immutable tree edits
   --------------------------------------------------------------------------- */

export function updateNode(
  node: ConditionGroup,
  id: string,
  change: (node: ConditionNode) => ConditionNode,
): ConditionGroup {
  return {
    ...node,
    children: node.children.map((child) => {
      if (child.id === id) return change(child);
      if (child.kind === "group") return updateNode(child, id, change);
      return child;
    }),
  };
}

export function insertNode(
  node: ConditionGroup,
  parentId: string,
  child: ConditionNode,
): ConditionGroup {
  if (node.id === parentId) return { ...node, children: [...node.children, child] };
  return {
    ...node,
    children: node.children.map((existing) =>
      existing.kind === "group" ? insertNode(existing, parentId, child) : existing,
    ),
  };
}

export function removeNode(node: ConditionGroup, id: string): ConditionGroup {
  return {
    ...node,
    children: node.children
      .filter((child) => child.id !== id)
      .map((child) => (child.kind === "group" ? removeNode(child, id) : child)),
  };
}

/** A group with no leaf rules anywhere contributes nothing and is dropped on save. */
export function countRules(node: ConditionGroup): number {
  return node.children.reduce(
    (total, child) => total + (child.kind === "rule" ? 1 : countRules(child)),
    0,
  );
}

/* ---------------------------------------------------------------------------
   Description
   --------------------------------------------------------------------------- */

function describeRule(rule: ConditionRule, fields: ConditionField[]): string {
  const field = findField(fields, rule.field);
  const name = field?.label ?? rule.field.split(".").slice(1).join(".") ?? rule.field;
  const spec = OPERATORS[rule.operator];
  if (!spec) return name;
  if (spec.value === "none") return `${name} ${spec.phrase}`;
  return `${name} ${spec.phrase} ${rule.value || "…"}`;
}

function describeNode(node: ConditionNode, fields: ConditionField[], depth: number): string {
  if (node.kind === "rule") return describeRule(node, fields);

  const joiner = node.match === "all" ? " and " : " or ";
  const body = node.children
    .map((child) => describeNode(child, fields, depth + 1))
    .filter(Boolean)
    .join(joiner);

  if (!body) return "";
  // Only nested groups need parentheses; the root reads fine without them.
  return depth > 0 && node.children.length > 1 ? `(${body})` : body;
}

/** Human-readable rendering for the policy list. */
export function describeCondition(
  condition: PolicyCondition | undefined,
  fields: ConditionField[],
): string {
  if (!condition) return "";
  if (condition.mode === "expression") return condition.source;
  return describeNode(condition.root, fields, 0);
}
