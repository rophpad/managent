"use client";

import { Check, Layers, PlugZap, Sparkles } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { ResourceIcon } from "@/components/dashboard/resource-icon";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button";
import { PanelBlock } from "@/components/ui/card";
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
import { ScopeChip, ScopeChipGroup } from "@/components/ui/scope-chip";
import { ScopeRow } from "@/components/ui/rows";
import { SuccessNote } from "@/components/ui/token-reveal";
import { cn } from "@/lib/cn";
import { CONNECTOR_TEMPLATES } from "@/lib/data/resources";
import type { Permission, Resource } from "@/lib/types";

/** `template` is a form mode that produces a configured MCP resource. */
type FormType = "mcp" | "template";

const TYPE_OPTIONS = [
  { value: "mcp", label: "MCP server", icon: <PlugZap aria-hidden className="size-[13px]" /> },
  { value: "template", label: "MCP templates", icon: <Layers aria-hidden className="size-[13px]" /> },
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


function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** TODO: replace with the MCP `tools/list` call once the backend exists. */
async function discoverMcpTools(): Promise<Permission[]> {
  await delay(DISCOVERY_DELAY_MS);
  return SAMPLE_MCP_TOOLS;
}


/* ------------------------------------------------------------------------- */


export function ResourceForm({ editing }: { editing?: Resource }) {
  const fieldId = useId();
  const isEditing = Boolean(editing);

  const [type, setType] = useState<FormType>("mcp");
  const [name, setName] = useState(editing?.name ?? "");
  const [saved, setSaved] = useState(false);

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

  // Template
  const [templateId, setTemplateId] = useState<string | null>(null);
  const template = CONNECTOR_TEMPLATES.find((entry) => entry.id === templateId) ?? null;


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
          placeholder="e.g. stripe-mcp, github-mcp"
          autoComplete="off"
        />
      </Field>


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


      {type === "template" ? (
        <>
          <FieldGroup
            label={
              <>
                Choose a known MCP server{" "}
                <span className="font-normal text-muted-2">
                  — pre-filled transport, command and credential configuration
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
                      setName(entry.id + "-mcp");
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
                      {entry.tools.length} known tools
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
                    Credential · <span className="font-mono">{template.credentialName}</span>
                  </>
                }
                htmlFor={`${fieldId}-template-cred`}
                hint="Permissions are pre-mapped from the template — you're only providing the credential."
              >
                <Input
                  id={`${fieldId}-template-cred`}
                  type="password"
                  placeholder={template.credentialPlaceholder}
                  autoComplete="off"
                />
              </Field>

              <Field label="Transport" htmlFor={fieldId + "-template-transport"}>
                <Input id={fieldId + "-template-transport"} value={template.transport} readOnly />
              </Field>
              <Field label="Command" htmlFor={fieldId + "-template-command"}>
                <Input id={fieldId + "-template-command"} value={template.command} readOnly />
              </Field>
              <FieldGroup label="Known tools">
                <PanelBlock className="mb-0 px-4 py-3.5">
                  {template.tools.map((tool) => (
                    <ScopeRow key={tool} name={tool} tag="verified by tools/list" />
                  ))}
                </PanelBlock>
                <Hint>The final tool list is discovered from the server before access is granted.</Hint>
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
