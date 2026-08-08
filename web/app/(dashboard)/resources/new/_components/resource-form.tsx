"use client";

import { Check, Layers, PlugZap, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
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
  Textarea,
} from "@/components/ui/field";
import { FilterPills } from "@/components/ui/filter-pills";
import { ScopeChip, ScopeChipGroup } from "@/components/ui/scope-chip";
import { ScopeRow } from "@/components/ui/rows";
import { SuccessNote } from "@/components/ui/token-reveal";
import { cn } from "@/lib/cn";
import { saveDashboardEntity } from "@/lib/client-api";
import type {
  MarketplaceTemplate,
  MarketplaceTransportOption,
  Permission,
  Resource,
} from "@/lib/types";

/** `template` is a form mode that produces a configured MCP resource. */
type FormType = "mcp" | "template";
type MCPTransport = "stdio" | "http" | "sse";

function normalizeTransport(value?: string): MCPTransport {
  if (value === "http" || value === "sse" || value === "stdio") return value;
  if (value?.toLowerCase().includes("sse")) return "sse";
  if (value?.toLowerCase().includes("http")) return "http";
  return "stdio";
}

function namespaceFromName(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function parseLines(value: string): string[] {
  return value.split("\n").map((line) => line.trim()).filter(Boolean);
}

function parseEnvironment(value: string): Record<string, string> {
  return Object.fromEntries(parseLines(value).map((line) => {
    const separator = line.indexOf("=");
    return [line.slice(0, separator).trim(), line.slice(separator + 1)];
  }));
}

const TYPE_OPTIONS = [
  { value: "mcp", label: "MCP server", icon: <PlugZap aria-hidden className="size-3.25" /> },
  { value: "template", label: "MCP templates", icon: <Layers aria-hidden className="size-3.25" /> },
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

function mcpErrorMessage(message: string) {
  if (message.includes("mcp secret key is required")) {
    return "MCP secret encryption is not configured. Set MANAGENT_MCP_SECRET_KEY to a persistent 32-byte raw or base64-encoded key, then restart the gateway.";
  }
  return message;
}

async function responseJSON<T>(response: Response): Promise<T> {
  const payload = await response.json() as T & { error?: string; message?: string };
  if (!response.ok) throw new Error(mcpErrorMessage(payload.error ?? "The MCP request failed"));
  if (payload.error) throw new Error(mcpErrorMessage(payload.error));
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
  const [transport, setTransport] = useState<MCPTransport>(
    editing?.kind === "mcp" ? normalizeTransport(editing.transport) : "http",
  );
  const [command, setCommand] = useState(
    editing?.kind === "mcp" ? editing.url ?? editing.command : "",
  );
  const [argsText, setArgsText] = useState(
    editing?.kind === "mcp" ? (editing.args ?? []).join("\n") : "",
  );
  const [workingDirectory, setWorkingDirectory] = useState(
    editing?.kind === "mcp" ? editing.workingDirectory ?? "" : "",
  );
  const [environmentText, setEnvironmentText] = useState(
    editing?.kind === "mcp"
      ? Object.entries(editing.env ?? {}).map(([key, value]) => `${key}=${value}`).join("\n")
      : "",
  );
  const [credentialName, setCredentialName] = useState("");
  const [credentialValue, setCredentialValue] = useState("");
  const [discovering, setDiscovering] = useState(false);
  const [tools, setTools] = useState<Permission[]>(
    editing?.kind === "mcp" ? editing.permissions : [],
  );
  const [enabledTools, setEnabledTools] = useState<ReadonlySet<string>>(
    new Set(editing?.kind === "mcp" ? editing.permissions.map((p) => p.name) : []),
  );

  // Marketplace template
  const [templates, setTemplates] = useState<MarketplaceTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [existingNamespaces, setExistingNamespaces] = useState<ReadonlySet<string>>(new Set());
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [transportOptionId, setTransportOptionId] = useState("");
  const [templateValues, setTemplateValues] = useState<Record<string, string>>({});
  const template = templates.find((entry) => entry.slug === templateId) ?? null;
  const templateOption = template?.transportOptions.find((entry) => entry.id === transportOptionId) ?? null;
  const remote = transport !== "stdio";
  const generatedNamespace = type === "template" ? template?.defaultNamespace ?? "" : namespaceFromName(name);
  const hasCredentialName = credentialName.trim().length > 0;
  const hasCredentialValue = credentialValue.length > 0;
  const credentialIsValid = hasCredentialName === hasCredentialValue;
  const fieldErrors = {
    name: name.trim().length < 2
      ? "Use at least 2 characters for the resource name."
      : !generatedNamespace
        ? "Use at least one letter or number so a namespace can be generated."
        : type === "mcp" && !isEditing && existingNamespaces.has(generatedNamespace)
          ? `The namespace ${generatedNamespace} is already in use.`
          : null,
    command: type === "mcp" && !command.trim()
      ? remote
        ? "Enter the MCP server URL."
        : "Enter the executable used to start the MCP server."
      : null,
    workingDirectory: type === "mcp" && !remote && workingDirectory.trim() && !workingDirectory.trim().startsWith("/")
      ? "Use an absolute path inside the gateway runtime, such as /workspace."
      : null,
    environment: type === "mcp" && !remote && parseLines(environmentText).some((line) => {
      const separator = line.indexOf("=");
      return separator < 1 || !line.slice(0, separator).trim();
    })
      ? "Use one KEY=value environment variable per line."
      : null,
    credential: !credentialIsValid
      ? "Enter both the credential name and value, or leave both empty."
      : null,
    template: type === "template" && (!template || !templateOption)
      ? "Choose an MCP template and transport."
      : null,
    templateValues: type === "template"
      ? templateOption?.fields.find((field) => field.required && !templateValues[field.name]?.trim())?.label ?? null
      : null,
    tools: type === "mcp"
      ? tools.length === 0
        ? "Discover the MCP tools before saving."
        : enabledTools.size === 0
          ? "Enable at least one discovered tool."
          : null
      : null,
  };

  useEffect(() => {
    let active = true;
    fetch("/api/mcps")
      .then((response) => responseJSON<{ items: Array<{ namespace: string }> }>(response))
      .then((result) => {
        if (active) setExistingNamespaces(new Set(result.items.map((item) => item.namespace)));
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : "Unable to validate the MCP namespace");
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (isEditing || type !== "template" || templates.length > 0) return;
    let active = true;
    fetch("/api/marketplace")
      .then((response) => responseJSON<{ items: MarketplaceTemplate[] }>(response))
      .then((result) => {
        if (active) setTemplates(result.items);
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : "Unable to load MCP templates");
      })
      .finally(() => {
        if (active) setTemplatesLoading(false);
      });
    return () => { active = false; };
  }, [isEditing, templates.length, type]);

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
    if (fieldErrors.credential || fieldErrors.workingDirectory || fieldErrors.environment) {
      setError("Correct the highlighted fields before discovering tools.");
      return;
    }
    setDiscovering(true);
    setError(null);
    try {
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
          transport,
          command: remote ? undefined : command.trim(),
          args: remote ? undefined : parseLines(argsText),
          workingDirectory: remote ? undefined : workingDirectory.trim() || undefined,
          env: remote ? undefined : parseEnvironment(environmentText),
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

  function selectTemplate(id: string) {
    const selected = templates.find((entry) => entry.slug === id);
    if (!selected) return;
    const option = selected.transportOptions.find((entry) => entry.recommended)
      ?? selected.transportOptions[0];
    setTemplateId(id);
    setTransportOptionId(option?.id ?? "");
    setTemplateValues({});
    setName(selected.defaultMCPName);
    setTools([]);
    setEnabledTools(new Set());
    setShowErrors(false);
    setError(null);
  }

  function selectTransportOption(option: MarketplaceTransportOption) {
    setTransportOptionId(option.id);
    setTemplateValues({});
    setTools([]);
    setEnabledTools(new Set());
    setShowErrors(false);
    setError(null);
  }

  async function saveResource() {
    setShowErrors(true);
    setError(null);
    if (fieldErrors.name) {
      setError("Correct the highlighted fields before saving the resource.");
      return;
    }
    if (fieldErrors.command || fieldErrors.workingDirectory || fieldErrors.environment || fieldErrors.template) {
      setError("Correct the highlighted fields before saving the resource.");
      return;
    }
    if (fieldErrors.templateValues) {
      setError(`Enter a value for ${fieldErrors.templateValues}.`);
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
      let resourceTools = tools;
      let resourceTransport: string = transport;
      let resourceCommand = command;
      let resourceURL = remote ? command.trim() : undefined;
      let resourceArgs = remote ? undefined : parseLines(argsText);
      let resourceWorkingDirectory = remote ? undefined : workingDirectory.trim() || undefined;
      let resourceEnv = remote ? undefined : parseEnvironment(environmentText);
      let mcpId = editing?.kind === "mcp" ? editing.mcpId : undefined;
      if (type === "template" && template && templateOption) {
        type InstalledMCP = {
          name: string;
          namespace: string;
          status: string;
          lastError?: string;
          tools?: MCPTool[];
        };
        const registered = await responseJSON<{ items: InstalledMCP[] }>(await fetch("/api/mcps"));
        let installed = registered.items.find((item) => item.namespace === template.defaultNamespace);
        if (!installed) {
          installed = await responseJSON<InstalledMCP>(await fetch("/api/marketplace", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              slug: template.slug,
              transportOption: templateOption.id,
              name: name.trim(),
              namespace: template.defaultNamespace,
              values: templateValues,
            }),
          }));
        }
        if (installed.status !== "connected") {
          throw new Error(installed.lastError || `${template.name} is installed but could not connect`);
        }
        resourceTools = (installed.tools ?? []).map(permissionFromTool);
        if (resourceTools.length === 0) throw new Error(`${template.name} returned no tools`);
        setTools(resourceTools);
        setEnabledTools(new Set(resourceTools.map((tool) => tool.name)));
        resourceTransport = templateOption.transport;
        resourceCommand = templateOption.command ?? templateOption.url ?? "";
        resourceURL = templateOption.transport === "stdio" ? undefined : templateOption.url;
        resourceArgs = undefined;
        resourceWorkingDirectory = undefined;
        resourceEnv = undefined;
      }
      if (type === "mcp" && !isEditing) {
        const registered = await responseJSON<{
          id: string;
          status: string;
          lastError?: string;
        }>(await fetch("/api/mcps", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            namespace: generatedNamespace,
            transport,
            command: remote ? undefined : command.trim(),
            args: remote ? undefined : parseLines(argsText),
            workingDirectory: remote ? undefined : workingDirectory.trim() || undefined,
            env: remote ? undefined : parseEnvironment(environmentText),
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
        if (registered.status !== "connected") {
          throw new Error(registered.lastError || "The MCP server was registered but could not connect");
        }
        mcpId = registered.id;
      }
      const id = editing?.id ?? generatedNamespace;
      const resource: Resource = {
        id,
        name: name.trim(),
        kind: "mcp",
        discoveredVia: type === "template" ? "manifest" : "auto",
        transport: resourceTransport,
        command: resourceCommand,
        url: resourceURL,
        args: resourceArgs,
        workingDirectory: resourceWorkingDirectory,
        env: resourceEnv,
        mcpId,
        permissions: type === "template"
          ? resourceTools
          : resourceTools.filter((tool) => enabledTools.has(tool.name)),
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
    <FormCard className="max-w-170">
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
      {type === "mcp" && generatedNamespace ? (
        <Hint className="-mt-3 mb-4.5">
          Tool namespace: <span className="font-mono">{generatedNamespace}</span>
        </Hint>
      ) : null}

      {type === "mcp" ? (
        <>
          <Field label="Transport" htmlFor={`${fieldId}-transport`}>
            <Select
              id={`${fieldId}-transport`}
              value={transport}
              onChange={(event) => {
                setTransport(event.target.value as MCPTransport);
                setTools([]);
                setError(null);
              }}
            >
              <option value="http">Streamable HTTP (remote, recommended)</option>
              <option value="sse">SSE (remote, legacy)</option>
              <option value="stdio">stdio (local subprocess)</option>
            </Select>
            {transport === "sse" ? (
              <Hint>SSE is a legacy MCP transport. Prefer Streamable HTTP for new servers.</Hint>
            ) : null}
          </Field>
          <Field
            label={remote ? "Server URL" : "Executable"}
            htmlFor={`${fieldId}-cmd`}
            error={showErrors ? fieldErrors.command : null}
            hint={remote
              ? transport === "http"
                ? "The Streamable HTTP MCP endpoint, for example https://example.com/mcp."
                : "The legacy SSE endpoint exposed by the MCP server."
              : "Enter only the executable here. Put flags and package names in Arguments below."}
          >
            <Input
              id={`${fieldId}-cmd`}
              value={command}
              aria-invalid={showErrors && Boolean(fieldErrors.command)}
              onChange={(event) => {
                setCommand(event.target.value);
                setTools([]);
                setError(null);
              }}
              placeholder={remote ? "https://example.com/mcp" : "npx"}
              required
            />
          </Field>

          {!remote ? (
            <>
              <Field
                label="Arguments (optional)"
                htmlFor={`${fieldId}-args`}
                hint="Enter one argument per line. Example: -y, package name, then package options."
              >
                <Textarea
                  id={`${fieldId}-args`}
                  value={argsText}
                  rows={4}
                  onChange={(event) => {
                    setArgsText(event.target.value);
                    setTools([]);
                    setError(null);
                  }}
                  placeholder={"-y\n@modelcontextprotocol/server-filesystem\n/workspace"}
                  spellCheck={false}
                />
              </Field>
              <details
                className="mb-4.5 rounded-lg border border-line-soft bg-panel-2 px-4 py-3"
                open={Boolean(workingDirectory || environmentText || (showErrors && (fieldErrors.workingDirectory || fieldErrors.environment)))}
              >
                <summary className="cursor-pointer text-[13px] font-medium">
                  Advanced stdio settings
                </summary>
                <div className="mt-4">
                  <Field
                    label="Process working directory (optional)"
                    htmlFor={`${fieldId}-working-directory`}
                    error={showErrors ? fieldErrors.workingDirectory : null}
                    hint="Absolute directory inside the gateway runtime where the process starts. It does not grant filesystem access; mount directories separately."
                  >
                    <Input
                      id={`${fieldId}-working-directory`}
                      value={workingDirectory}
                      aria-invalid={showErrors && Boolean(fieldErrors.workingDirectory)}
                      onChange={(event) => {
                        setWorkingDirectory(event.target.value);
                        setTools([]);
                      }}
                      placeholder="/workspace"
                      spellCheck={false}
                    />
                  </Field>
                  <Field
                    label="Environment variables (optional)"
                    htmlFor={`${fieldId}-environment`}
                    error={showErrors ? fieldErrors.environment : null}
                    hint="Enter one non-secret KEY=value pair per line. Use the credential fields below for secrets."
                    className="mb-0"
                  >
                    <Textarea
                      id={`${fieldId}-environment`}
                      value={environmentText}
                      rows={3}
                      aria-invalid={showErrors && Boolean(fieldErrors.environment)}
                      onChange={(event) => {
                        setEnvironmentText(event.target.value);
                        setTools([]);
                      }}
                      placeholder={"LOG_LEVEL=info\nFEATURE_FLAG=true"}
                      spellCheck={false}
                    />
                  </Field>
                </div>
              </details>
            </>
          ) : null}

          <Field
            label="Credential name (optional)"
            htmlFor={`${fieldId}-credential-name`}
            error={showErrors ? fieldErrors.credential : null}
            hint={remote
              ? "Secret HTTP header name, for example Authorization."
              : "Secret environment variable name, for example API_TOKEN."}
          >
            <Input
              id={`${fieldId}-credential-name`}
              value={credentialName}
              aria-invalid={showErrors && Boolean(fieldErrors.credential)}
              onChange={(event) => {
                setCredentialName(event.target.value);
                setTools([]);
              }}
              placeholder={remote ? "Authorization" : "API_TOKEN"}
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
                  <Check aria-hidden className="size-3.75" />
                  {tools.length} tools found
                </>
              ) : (
                <>
                  <Sparkles aria-hidden className="size-3.75" />
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
            {templatesLoading ? <Hint>Loading templates…</Hint> : null}
            <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {templates.map((entry) => {
                const selected = entry.slug === templateId;
                return (
                  <button
                    key={entry.slug}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => selectTemplate(entry.slug)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-lg border px-2.5 py-4 text-center transition-colors",
                      selected
                        ? "border-brand bg-brand/9"
                        : "border-line hover:border-line-soft hover:bg-surface",
                    )}
                  >
                    <ResourceIcon
                      id={entry.slug.replace(/-mcp$/, "")}
                      className={cn("size-5.5", selected ? "text-brand" : "text-muted")}
                    />
                    <span className="text-[12.5px] font-medium">{entry.name}</span>
                    <span className="text-[11px] text-muted">{entry.provider}</span>
                  </button>
                );
              })}
            </div>
          </FieldGroup>

          {template ? (
            <>
              <PanelBlock className="mb-4 px-4 py-3.5">
                <p className="text-[12.5px] text-muted-2">{template.description}</p>
              </PanelBlock>

              <Field label="Transport" htmlFor={`${fieldId}-template-transport`}>
                <Select
                  id={`${fieldId}-template-transport`}
                  value={transportOptionId}
                  onChange={(event) => {
                    const option = template.transportOptions.find((entry) => entry.id === event.target.value);
                    if (option) selectTransportOption(option);
                  }}
                >
                  {template.transportOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}{option.recommended ? " (recommended)" : ""}
                    </option>
                  ))}
                </Select>
                {templateOption?.description ? <Hint>{templateOption.description}</Hint> : null}
              </Field>

              {templateOption?.fields.map((field) => (
                <Field
                  key={field.name}
                  label={field.label}
                  htmlFor={`${fieldId}-template-${field.name}`}
                  error={showErrors && field.required && !templateValues[field.name]?.trim()
                    ? `${field.label} is required.`
                    : null}
                  hint={field.description || (field.secret
                    ? "Stored encrypted by Managent and never returned to the browser."
                    : undefined)}
                >
                  <Input
                    id={`${fieldId}-template-${field.name}`}
                    type={field.secret ? "password" : "text"}
                    value={templateValues[field.name] ?? ""}
                    onChange={(event) => {
                      setTemplateValues((current) => ({ ...current, [field.name]: event.target.value }));
                      setError(null);
                    }}
                    placeholder={field.placeholder}
                    autoComplete={field.secret ? "new-password" : "off"}
                    required={field.required}
                  />
                </Field>
              ))}

              {templateOption ? (
                <Field label={templateOption.command ? "Command" : "Endpoint"} htmlFor={`${fieldId}-template-target`}>
                  <Input
                    id={`${fieldId}-template-target`}
                    value={templateOption.command ?? templateOption.url ?? ""}
                    readOnly
                  />
                </Field>
              ) : null}

              <Hint>
                Saving installs the server, connects it, and discovers its tools with
                <span className="font-mono"> tools/list</span>.
              </Hint>
              {tools.length > 0 ? (
                <FieldGroup label="Discovered tools">
                  <PanelBlock className="mb-0 px-4 py-3.5">
                    {tools.map((tool) => (
                      <ScopeRow key={tool.name} name={tool.name} tag="verified by tools/list" />
                    ))}
                  </PanelBlock>
                </FieldGroup>
              ) : null}
            </>
          ) : null}
        </>
      ) : null}

      <FormActions>
        <Button variant="primary" onClick={saveResource} disabled={saving || discovering}>
          <Check aria-hidden className="size-3.75" />
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
