"use client";

import { Check, Database, Layers, Plug, PlugZap, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { ResourceIcon } from "@/components/dashboard/resource-icon";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button";
import { PanelBlock } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Field,
  FieldGroup,
  FormActions,
  FormCard,
  Hint,
  Input,
  Select,
} from "@/components/ui/field";
import { FilterPills } from "@/components/ui/filter-pills";
import { RiskTag, ScopeChip, ScopeChipGroup } from "@/components/ui/scope-chip";
import { MutedText, ScopeRow } from "@/components/ui/rows";
import { SuccessNote } from "@/components/ui/token-reveal";
import { cn } from "@/lib/cn";
import { CONNECTOR_TEMPLATES } from "@/lib/data/resources";
import type { Permission, Resource } from "@/lib/types";

/** `template` is a form mode, not a resource kind — it produces a REST resource. */
type FormType = "rest" | "mcp" | "db" | "template";

const TYPE_OPTIONS = [
  { value: "rest", label: "REST API", icon: <Plug aria-hidden className="size-[13px]" /> },
  { value: "mcp", label: "MCP server", icon: <PlugZap aria-hidden className="size-[13px]" /> },
  { value: "db", label: "Database", icon: <Database aria-hidden className="size-[13px]" /> },
  {
    value: "template",
    label: "From template",
    icon: <Layers aria-hidden className="size-[13px]" />,
  },
] as const;

/* ---------------------------------------------------------------------------
   Backend stand-ins. Each returns what the real endpoint will return, so
   swapping in `fetch` is a one-function change with no component edits.
   --------------------------------------------------------------------------- */

const DISCOVERY_DELAY_MS = 700;

const SAMPLE_MCP_TOOLS: Permission[] = [
  { name: "stripe_create_refund", source: "discovered" },
  { name: "stripe_list_customers", source: "discovered" },
  { name: "stripe_get_charge", source: "discovered" },
  { name: "stripe_delete_customer", source: "discovered", highRisk: true },
  { name: "stripe_create_payout", source: "discovered", highRisk: true },
];

const SAMPLE_REST_PERMISSIONS: Permission[] = [
  { name: "refunds", match: "POST /v1/refunds" },
  { name: "read_customers", match: "GET /v1/customers*" },
  { name: "delete_customer", match: "DELETE /v1/customers/*", highRisk: true },
];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** TODO: replace with the MCP `tools/list` call once the backend exists. */
async function discoverMcpTools(): Promise<Permission[]> {
  await delay(DISCOVERY_DELAY_MS);
  return SAMPLE_MCP_TOOLS;
}

/** TODO: replace with the OpenAPI import endpoint once the backend exists. */
async function importOpenApiSpec(specUrl: string): Promise<Permission[]> {
  await delay(DISCOVERY_DELAY_MS);
  const source = specUrl ? "spec" : "manual";
  return SAMPLE_REST_PERMISSIONS.map((permission) => ({ ...permission, source }));
}

/* ------------------------------------------------------------------------- */

function permissionSourceLabel(source: Permission["source"]): string {
  switch (source) {
    case "spec":
      return "from spec";
    case "template":
      return "from template";
    case "existing":
      return "existing";
    default:
      return "manual";
  }
}

export function ResourceForm({ editing }: { editing?: Resource }) {
  const fieldId = useId();
  const isEditing = Boolean(editing);

  const [type, setType] = useState<FormType>(editing?.kind ?? "rest");
  const [name, setName] = useState(editing?.name ?? "");
  const [saved, setSaved] = useState(false);

  // REST
  const [targetUrl, setTargetUrl] = useState(
    editing?.kind === "rest" ? editing.targetUrl : "",
  );
  const [authMethod, setAuthMethod] = useState(
    editing?.kind === "rest" ? editing.authMethod : "Bearer token",
  );
  const [specUrl, setSpecUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [restPermissions, setRestPermissions] = useState<Permission[]>(
    editing?.kind === "rest"
      ? editing.permissions.map((permission) => ({ ...permission, source: "existing" }))
      : [],
  );

  // MCP
  const [transport, setTransport] = useState(
    editing?.kind === "mcp" ? editing.transport : "stdio (local subprocess)",
  );
  const [command, setCommand] = useState(editing?.kind === "mcp" ? editing.command : "");
  const [discovering, setDiscovering] = useState(false);
  const [tools, setTools] = useState<Permission[]>(
    editing?.kind === "mcp" ? editing.permissions : [],
  );
  const [enabledTools, setEnabledTools] = useState<ReadonlySet<string>>(
    new Set(editing?.kind === "mcp" ? editing.permissions.map((p) => p.name) : []),
  );

  // Database
  const [connectionHost, setConnectionHost] = useState(
    editing?.kind === "db" ? editing.connectionHost : "",
  );
  const [roleScope, setRoleScope] = useState(
    editing?.kind === "db" ? editing.roleScope : "Read-only, specific tables",
  );
  const [tables, setTables] = useState(editing?.kind === "db" ? editing.tables.join(", ") : "");

  // Template
  const [templateId, setTemplateId] = useState<string | null>(null);
  const template = CONNECTOR_TEMPLATES.find((entry) => entry.id === templateId) ?? null;

  async function handleImportSpec() {
    setImporting(true);
    setRestPermissions(await importOpenApiSpec(specUrl.trim()));
    setImporting(false);
  }

  async function handleDiscoverTools() {
    setDiscovering(true);
    const discovered = await discoverMcpTools();
    setTools(discovered);
    setEnabledTools(new Set(discovered.filter((tool) => !tool.highRisk).map((tool) => tool.name)));
    setDiscovering(false);
  }

  return (
    <FormCard className="max-w-[680px]">
      <FieldGroup label="Resource type">
        <FilterPills
          label="Resource type"
          options={TYPE_OPTIONS}
          value={type}
          onChange={setType}
          className="mt-1 flex-wrap"
        />
      </FieldGroup>

      <Field label="Resource name" htmlFor={`${fieldId}-name`}>
        <Input
          id={`${fieldId}-name`}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. stripe, stripe-mcp, invoices-db"
          autoComplete="off"
        />
      </Field>

      {type === "rest" ? (
        <>
          <Field label="Target URL" htmlFor={`${fieldId}-url`}>
            <Input
              id={`${fieldId}-url`}
              value={targetUrl}
              onChange={(event) => setTargetUrl(event.target.value)}
              placeholder="https://api.stripe.com"
            />
          </Field>
          <Field label="Authentication method" htmlFor={`${fieldId}-auth`}>
            <Select
              id={`${fieldId}-auth`}
              value={authMethod}
              onChange={(event) => setAuthMethod(event.target.value)}
            >
              <option>Bearer token</option>
              <option>Basic auth</option>
              <option>API key header</option>
              <option>Query parameter</option>
            </Select>
          </Field>
          <Field
            label="Credential"
            htmlFor={`${fieldId}-cred`}
            hint="Encrypted at rest in the vault. Agents never see this value directly — it's injected only for allowed calls."
          >
            <Input
              id={`${fieldId}-cred`}
              type="password"
              placeholder={isEditing ? "Leave blank to keep the current credential" : "sk_live_..."}
              autoComplete="off"
            />
          </Field>

          <FieldGroup
            label={
              <>
                OpenAPI spec URL <span className="font-normal text-muted-2">(optional)</span>
              </>
            }
          >
            <div className="flex gap-2">
              <Input
                value={specUrl}
                onChange={(event) => setSpecUrl(event.target.value)}
                placeholder="https://api.stripe.com/openapi.json"
                className="flex-1"
                aria-label="OpenAPI spec URL"
              />
              <Button size="sm" onClick={handleImportSpec} disabled={importing}>
                <Sparkles aria-hidden className="size-[15px]" />
                {importing ? "Importing…" : "Import"}
              </Button>
            </div>
            <Hint>
              If the API publishes a spec, permissions are generated automatically from it — one per
              operation. No spec? Add permissions manually below, or check whether a{" "}
              <button
                type="button"
                onClick={() => setType("template")}
                className="text-brand hover:underline"
              >
                community template
              </button>{" "}
              already exists for this API.
            </Hint>

            <PanelBlock className="mb-0 mt-3.5 px-4 py-3.5">
              {restPermissions.length === 0 ? (
                <EmptyState icon={<Plug />} className="py-5">
                  No permissions yet — import a spec above, or add one manually.
                </EmptyState>
              ) : (
                restPermissions.map((permission) => (
                  <ScopeRow
                    key={permission.name}
                    name={permission.name}
                    tag={permission.match}
                    trailing={
                      permission.highRisk ? (
                        <RiskTag />
                      ) : (
                        <MutedText>{permissionSourceLabel(permission.source)}</MutedText>
                      )
                    }
                  />
                ))
              )}
            </PanelBlock>

            <Button
              size="sm"
              className="mt-2.5"
              onClick={() =>
                setRestPermissions((current) => [
                  ...current,
                  { name: `permission_${current.length + 1}`, match: "GET /", source: "manual" },
                ])
              }
            >
              <Plus aria-hidden className="size-[15px]" />
              Add permission manually
            </Button>
          </FieldGroup>
        </>
      ) : null}

      {type === "mcp" ? (
        <>
          <Field label="Transport" htmlFor={`${fieldId}-transport`}>
            <Select
              id={`${fieldId}-transport`}
              value={transport}
              onChange={(event) => setTransport(event.target.value)}
            >
              <option>stdio (local subprocess)</option>
              <option>HTTP + SSE (remote server)</option>
            </Select>
          </Field>
          <Field label="Command" htmlFor={`${fieldId}-cmd`}>
            <Input
              id={`${fieldId}-cmd`}
              value={command}
              onChange={(event) => setCommand(event.target.value)}
              placeholder="npx -y @stripe/mcp-server"
            />
          </Field>

          <div className="mb-4.5">
            <Button size="sm" onClick={handleDiscoverTools} disabled={discovering}>
              {tools.length > 0 && !discovering ? (
                <>
                  <Check aria-hidden className="size-[15px]" />
                  {tools.length} tools found
                </>
              ) : (
                <>
                  <Sparkles aria-hidden className="size-[15px]" />
                  {discovering ? "Discovering…" : "Discover tools"}
                </>
              )}
            </Button>
            <Hint>
              Calls the server&apos;s <span className="font-mono">tools/list</span> method to
              auto-populate available permissions below — no manual mapping needed.
            </Hint>
          </div>

          {tools.length > 0 ? (
            <FieldGroup
              label={
                <>
                  Discovered tools{" "}
                  <span className="font-normal text-muted-2">— review before saving</span>
                </>
              }
            >
              <ScopeChipGroup>
                {tools.map((tool) => (
                  <ScopeChip
                    key={tool.name}
                    name={`tool-${tool.name}`}
                    checked={enabledTools.has(tool.name)}
                    onChange={(checked) =>
                      setEnabledTools((current) => {
                        const next = new Set(current);
                        if (checked) next.add(tool.name);
                        else next.delete(tool.name);
                        return next;
                      })
                    }
                  >
                    {tool.name}
                  </ScopeChip>
                ))}
              </ScopeChipGroup>
            </FieldGroup>
          ) : null}
        </>
      ) : null}

      {type === "db" ? (
        <>
          <Field label="Connection host" htmlFor={`${fieldId}-host`}>
            <Input
              id={`${fieldId}-host`}
              value={connectionHost}
              onChange={(event) => setConnectionHost(event.target.value)}
              placeholder="prod-db.company.com/finance"
            />
          </Field>
          <Field label="Role scope" htmlFor={`${fieldId}-role`}>
            <Select
              id={`${fieldId}-role`}
              value={roleScope}
              onChange={(event) => setRoleScope(event.target.value)}
            >
              <option>Read-only, specific tables</option>
              <option>Read-write, specific tables</option>
              <option>Connect only (coarse)</option>
            </Select>
          </Field>
          <Field
            label="Tables"
            htmlFor={`${fieldId}-tables`}
            hint="Managent provisions a short-lived native role scoped to these tables — it doesn't parse or intercept SQL."
          >
            <Input
              id={`${fieldId}-tables`}
              value={tables}
              onChange={(event) => setTables(event.target.value)}
              placeholder="invoices, customers"
            />
          </Field>
        </>
      ) : null}

      {type === "template" ? (
        <>
          <FieldGroup
            label={
              <>
                Choose a pre-built connector{" "}
                <span className="font-normal text-muted-2">
                  — maintained in the open-source registry, curated minimal permission sets
                </span>
              </>
            }
          >
            <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {CONNECTOR_TEMPLATES.map((entry) => {
                const selected = entry.id === templateId;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      setTemplateId(entry.id);
                      setName(entry.id);
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-lg border px-2.5 py-4 text-center transition-colors",
                      selected
                        ? "border-brand bg-brand/9"
                        : "border-line hover:border-line-soft hover:bg-surface",
                    )}
                  >
                    <ResourceIcon
                      id={entry.id}
                      className={cn("size-[22px]", selected ? "text-brand" : "text-muted")}
                    />
                    <span className="text-[12.5px] font-medium">{entry.name}</span>
                    <span className="text-[11px] text-muted">
                      {entry.permissions.length} permissions
                    </span>
                  </button>
                );
              })}
            </div>
          </FieldGroup>

          {template ? (
            <>
              <Field
                label={
                  <>
                    Credential for <span className="font-mono">{template.id}</span>
                  </>
                }
                htmlFor={`${fieldId}-template-cred`}
                hint="Permissions are pre-mapped from the template — you're only providing the credential."
              >
                <Input
                  id={`${fieldId}-template-cred`}
                  type="password"
                  placeholder="Paste your API key"
                  autoComplete="off"
                />
              </Field>

              <FieldGroup label="Included permissions">
                <PanelBlock className="mb-0 px-4 py-3.5">
                  {template.permissions.map((permission) => (
                    <ScopeRow key={permission} name={permission} tag="from template" />
                  ))}
                </PanelBlock>
              </FieldGroup>
            </>
          ) : null}
        </>
      ) : null}

      <FormActions>
        <Button variant="primary" onClick={() => setSaved(true)}>
          <Check aria-hidden className="size-[15px]" />
          {isEditing ? "Save changes" : "Save resource"}
        </Button>
        <ButtonLink href="/resources">Cancel</ButtonLink>
      </FormActions>

      {saved ? (
        <SuccessNote title={isEditing ? "Changes saved" : "Resource saved"}>
          You can now assign scopes from this resource to any agent from its{" "}
          <Link href="/agents" className="text-brand hover:underline">
            detail page
          </Link>
          .
        </SuccessNote>
      ) : null}
    </FormCard>
  );
}
