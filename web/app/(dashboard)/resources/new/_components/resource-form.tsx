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
import { saveDashboardEntity } from "@/lib/client-api";
import { CONNECTOR_TEMPLATES } from "@/lib/data/resources";
import type { Permission, Resource } from "@/lib/types";

/** `template` is a form mode that produces a configured MCP resource. */
type FormType = "mcp" | "template";

const TYPE_OPTIONS = [
  { value: "mcp", label: "MCP server", icon: <PlugZap aria-hidden className="size-[13px]" /> },
  { value: "template", label: "MCP templates", icon: <Layers aria-hidden className="size-[13px]" /> },
] as const;

type MCPTool = {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
  schema?: Record<string, unknown>;
};

function permissionFromTool(tool: MCPTool): Permission {
  const schema = tool.inputSchema ?? tool.schema ?? {};
  const properties = (schema.properties ?? {}) as Record<string, Record<string, unknown>>;
  const required = new Set(Array.isArray(schema.required) ? schema.required : []);
  return {
    name: tool.name,
    source: "discovered",
    params: Object.entries(properties).map(([paramName, definition]) => ({
      name: paramName,
      location: "argument",
      type: definition.enum
        ? "enum"
        : definition.type === "integer" || definition.type === "number" ||
            definition.type === "boolean" || definition.type === "array"
          ? definition.type
          : "string",
      description: typeof definition.description === "string" ? definition.description : undefined,
      enumValues: Array.isArray(definition.enum) ? definition.enum.map(String) : undefined,
      required: required.has(paramName),
    })),
  };
}

async function responseJSON<T>(response: Response): Promise<T> {
  const payload = await response.json() as T & { error?: string; message?: string };
  if (!response.ok) throw new Error(payload.error ?? "The MCP request failed");
  if (payload.error) throw new Error(payload.error);
  return payload;
}


export function ResourceForm({ editing }: { editing?: Resource }) {
  const fieldId = useId();
  const isEditing = Boolean(editing);

  const [type, setType] = useState<FormType>("mcp");
  const [name, setName] = useState(editing?.name ?? "");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  // MCP
  const [transport, setTransport] = useState(
    editing?.kind === "mcp" ? editing.transport : "stdio (local subprocess)",
  );
  const [command, setCommand] = useState(editing?.kind === "mcp" ? editing.command : "");
  const [credentialName, setCredentialName] = useState("");
  const [credentialValue, setCredentialValue] = useState("");
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
  const hasCredentialName = credentialName.trim().length > 0;
  const hasCredentialValue = credentialValue.length > 0;
  const credentialIsValid = hasCredentialName === hasCredentialValue;
  const fieldErrors = {
    name: name.trim().length < 2 ? "Use at least 2 characters for the resource name." : null,
    command: type === "mcp" && !command.trim()
      ? transport.startsWith("HTTP")
        ? "Enter the MCP server URL."
        : "Enter the command used to start the MCP server."
      : null,
    credential: !credentialIsValid
      ? "Enter both the credential name and value, or leave both empty."
      : null,
    template: type === "template" && !template ? "Choose an MCP template." : null,
    tools: tools.length === 0
      ? "Discover the MCP tools before saving."
      : enabledTools.size === 0
        ? "Enable at least one discovered tool."
        : null,
  };

  async function handleDiscoverTools() {
    setShowErrors(true);
    if (fieldErrors.name) {
      setError("Correct the highlighted fields before discovering tools.");
      return;
    }
    if (!command.trim()) {
      setError("Command or server URL is required before discovery");
      return;
    }
    if (fieldErrors.credential) {
      setError("Correct the highlighted fields before saving the resource.");
      return;
    }
    setDiscovering(true);
    setError(null);
    try {
      const remote = transport.startsWith("HTTP");
      const result = await responseJSON<{
        status: string;
        message?: string;
        tools?: MCPTool[];
      }>(await fetch("/api/mcps/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || "mcp-preview",
          namespace: "preview",
          transport: remote ? "sse" : "stdio",
          command: remote ? undefined : command.trim(),
          url: remote ? command.trim() : undefined,
          secretEnv: !remote && hasCredentialValue
            ? { [credentialName.trim()]: credentialValue }
            : undefined,
          secretHeaders: remote && hasCredentialValue
            ? { [credentialName.trim()]: credentialValue }
            : undefined,
          enabled: true,
        }),
      }));
      if (result.status !== "connected") throw new Error(result.message ?? "Unable to connect");
      const discovered = (result.tools ?? []).map(permissionFromTool);
      if (discovered.length === 0) throw new Error("The MCP server returned no tools");
      setTools(discovered);
      setEnabledTools(new Set(discovered.map((tool) => tool.name)));
    } catch (cause) {
      setTools([]);
      setEnabledTools(new Set());
      setError(cause instanceof Error ? cause.message : "Unable to discover MCP tools");
    } finally {
      setDiscovering(false);
    }
  }

  async function selectTemplate(id: string) {
    const selected = CONNECTOR_TEMPLATES.find((entry) => entry.id === id);
    if (!selected) return;
    setTemplateId(id);
    setName(id + "-mcp");
    setDiscovering(true);
    setError(null);
    try {
      const result = await responseJSON<{ items: Array<{
        name: string;
        namespace: string;
        status: string;
        lastError?: string;
        tools?: MCPTool[];
      }> }>(await fetch("/api/mcps"));
      const server = result.items.find((item) => item.namespace === id || item.name === id);
      if (!server) throw new Error(`${selected.name} is not installed in the gateway`);
      if (server.status !== "connected") throw new Error(server.lastError || `${selected.name} is not connected`);
      const discovered = (server.tools ?? []).map(permissionFromTool);
      if (discovered.length === 0) throw new Error(`${selected.name} returned no tools`);
      setTools(discovered);
      setEnabledTools(new Set(discovered.map((tool) => tool.name)));
    } catch (cause) {
      setTools([]);
      setEnabledTools(new Set());
      setError(cause instanceof Error ? cause.message : "Unable to load the MCP template");
    } finally {
      setDiscovering(false);
    }
  }

  async function saveResource() {
    setShowErrors(true);
    setError(null);
    if (fieldErrors.name) {
      setError("Correct the highlighted fields before saving the resource.");
      return;
    }
    if (fieldErrors.command || fieldErrors.template) {
      setError("Correct the highlighted fields before saving the resource.");
      return;
    }
    if (fieldErrors.credential) {
      setError("Correct the highlighted fields before saving the resource.");
      return;
    }
    if (fieldErrors.tools) {
      setError(fieldErrors.tools);
      return;
    }
    setSaving(true);
    try {
      const id = editing?.id ?? name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const resource: Resource = {
        id,
        name: name.trim(),
        kind: "mcp",
        discoveredVia: type === "template" ? "manifest" : "auto",
        transport: template?.transport ?? transport,
        command: template?.command ?? command,
        permissions: tools.filter((tool) => enabledTools.has(tool.name)),
      };
      await saveDashboardEntity("resources", resource, !isEditing);
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save the resource");
    } finally {
      setSaving(false);
    }
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

      <Field label="Resource name" htmlFor={`${fieldId}-name`} error={showErrors ? fieldErrors.name : null}>
        <Input
          id={`${fieldId}-name`}
              value={name}
          aria-invalid={showErrors && Boolean(fieldErrors.name)}
          onChange={(event) => {
            setName(event.target.value);
            setTools([]);
            setError(null);
          }}
          placeholder="e.g. stripe-mcp, github-mcp"
          autoComplete="off"
          required
        />
      </Field>


      {type === "mcp" ? (
        <>
          <Field label="Transport" htmlFor={`${fieldId}-transport`}>
            <Select
              id={`${fieldId}-transport`}
              value={transport}
              onChange={(event) => {
                setTransport(event.target.value);
                setTools([]);
                setError(null);
              }}
            >
              <option>stdio (local subprocess)</option>
              <option>HTTP + SSE (remote server)</option>
            </Select>
          </Field>
          <Field label="Command" htmlFor={`${fieldId}-cmd`} error={showErrors ? fieldErrors.command : null}>
            <Input
              id={`${fieldId}-cmd`}
              value={command}
              aria-invalid={showErrors && Boolean(fieldErrors.command)}
              onChange={(event) => {
                setCommand(event.target.value);
                setTools([]);
                setError(null);
              }}
              placeholder="npx -y @stripe/mcp-server"
              required
            />
          </Field>

          <Field
            label="Credential name (optional)"
            htmlFor={`${fieldId}-credential-name`}
            error={showErrors ? fieldErrors.credential : null}
            hint={transport.startsWith("HTTP")
              ? "Header name, for example Authorization."
              : "Environment variable name, for example API_TOKEN."}
          >
            <Input
              id={`${fieldId}-credential-name`}
              value={credentialName}
              aria-invalid={showErrors && Boolean(fieldErrors.credential)}
              onChange={(event) => {
                setCredentialName(event.target.value);
                setTools([]);
              }}
              placeholder={transport.startsWith("HTTP") ? "Authorization" : "API_TOKEN"}
              autoComplete="off"
            />
          </Field>

          <Field
            label="Credential value (optional)"
            htmlFor={`${fieldId}-credential-value`}
            error={showErrors ? fieldErrors.credential : null}
            hint="Used for the connection test and never stored in the dashboard resource."
          >
            <Input
              id={`${fieldId}-credential-value`}
              type="password"
              value={credentialValue}
              aria-invalid={showErrors && Boolean(fieldErrors.credential)}
              onChange={(event) => {
                setCredentialValue(event.target.value);
                setTools([]);
              }}
              placeholder="Enter the secret value"
              autoComplete="new-password"
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
            error={showErrors ? fieldErrors.template : null}
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
                    onClick={() => selectTemplate(entry.id)}
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
                      {entry.tools.length} tools
                    </span>
                  </button>
                );
              })}
            </div>
          </FieldGroup>

          {template ? (
            <>
              {template.credentialName ? <Field
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
              </Field> : null}

              <Field label="Transport" htmlFor={fieldId + "-template-transport"}>
                <Input id={fieldId + "-template-transport"} value={template.transport} readOnly />
              </Field>
              <Field label="Command" htmlFor={fieldId + "-template-command"}>
                <Input id={fieldId + "-template-command"} value={template.command} readOnly />
              </Field>
              <FieldGroup label="Known tools">
                <PanelBlock className="mb-0 px-4 py-3.5">
                  {discovering ? <Hint className="mt-0">Connecting and calling tools/list…</Hint> : null}
                  {tools.map((tool) => (
                    <ScopeRow key={tool.name} name={tool.name} tag="verified by tools/list" />
                  ))}
                </PanelBlock>
                <Hint>The final tool list is discovered from the server before access is granted.</Hint>
              </FieldGroup>
            </>
          ) : null}
        </>
      ) : null}

      <FormActions>
        <Button variant="primary" onClick={saveResource} disabled={saving || discovering}>
          <Check aria-hidden className="size-[15px]" />
          {saving ? "Saving…" : isEditing ? "Save changes" : "Save resource"}
        </Button>
        <ButtonLink href="/resources">Cancel</ButtonLink>
      </FormActions>

      {showErrors && fieldErrors.tools && tools.length > 0 ? <p role="alert" className="mt-3 text-[12.5px] text-deny">{fieldErrors.tools}</p> : null}

      {error ? <p role="alert" className="mt-3 text-[12.5px] text-deny">{error}</p> : null}

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
