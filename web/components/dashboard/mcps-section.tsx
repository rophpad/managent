"use client";

import { useMemo, useState } from "react";

import {
  DashboardCard,
  DashboardField,
  DashboardModal,
  DataTable,
  EmptyState,
  SectionEyebrow,
  StatusBadge,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
  textareaClass,
} from "./primitives";
import type { MarketplaceListing, Overview } from "./types";

type MCPModalState =
  | { mode: "closed" }
  | { mode: "create"; preset?: PresetDraft | null }
  | { mode: "edit"; mcpId: string };

type TestState = { status: string; message: string } | null;

type PresetDraft = {
  listingName?: string;
  mcpName?: string;
  namespace?: string;
  transport?: string;
  command?: string;
  args?: string[];
  url?: string;
  endpoint?: string;
  method?: string;
  urlTemplate?: string;
  headers?: Record<string, string>;
  env?: Record<string, string>;
  credentialName?: string;
};

export function MCPsSection({
  mcps,
  agents,
  marketplace,
  createMCP,
  updateMCP,
  connectMCP,
  disconnectMCP,
}: {
  mcps: Overview["mcps"];
  agents: Overview["agents"];
  marketplace: MarketplaceListing[];
  createMCP: (formData: FormData) => Promise<void>;
  updateMCP: (formData: FormData) => Promise<void>;
  connectMCP: (formData: FormData) => Promise<void>;
  disconnectMCP: (formData: FormData) => Promise<void>;
}) {
  const [selectedId, setSelectedId] = useState(mcps[0]?.id || "");
  const [modalState, setModalState] = useState<MCPModalState>({ mode: "closed" });
  const [draftTransport, setDraftTransport] = useState("stdio");
  const [testState, setTestState] = useState<TestState>(null);

  const activeSelectedId =
    mcps.some((mcp) => mcp.id === selectedId) ? selectedId : mcps[0]?.id || "";

  const selectedMCP = useMemo(
    () => mcps.find((mcp) => mcp.id === activeSelectedId) || null,
    [activeSelectedId, mcps],
  );
  const editingMCP = useMemo(
    () =>
      modalState.mode === "edit"
        ? mcps.find((mcp) => mcp.id === modalState.mcpId) || null
        : null,
    [mcps, modalState],
  );
  const agentById = useMemo(
    () => Object.fromEntries(agents.map((agent) => [agent.id, agent.name])),
    [agents],
  );
  const modalDefaults = useMemo(
    () => getMCPFormDefaults(editingMCP, modalState.mode === "create" ? modalState.preset : null),
    [editingMCP, modalState],
  );

  async function handleTestConnection(formData: FormData) {
    const payload = Object.fromEntries(formData.entries());
    const response = await fetch("/api/v1/mcps/preview/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        args: String(payload.args || "")
          .split("\n")
          .map((value) => value.trim())
          .filter(Boolean),
        headers: parseKeyValueLines(String(payload.headers || "")),
        env: parseKeyValueLines(String(payload.env || "")),
        secretEnv: parseKeyValueLines(String(payload.secretEnv || "")),
        secretHeaders: parseKeyValueLines(String(payload.secretHeaders || "")),
        inputSchema: parseJSONField(String(payload.inputSchema || "")),
        outputSchema: parseJSONField(String(payload.outputSchema || "")),
      }),
    });
    const data = (await response.json()) as { status?: string; message?: string };
    setTestState({
      status: String(data.status || "error"),
      message: String(data.message || "Connection failed"),
    });
  }

  function openCreateModal(preset?: PresetDraft | null) {
    setModalState({ mode: "create", preset: preset || null });
    setDraftTransport(getMCPFormDefaults(null, preset || null).transport);
    setTestState(null);
  }

  function openEditModal(mcp: Overview["mcps"][number]) {
    setModalState({ mode: "edit", mcpId: mcp.id });
    setDraftTransport(getMCPFormDefaults(mcp, null).transport);
    setTestState(null);
  }

  function closeModal() {
    setModalState({ mode: "closed" });
    setTestState(null);
  }

  return (
    <div className="space-y-6">
      <DashboardCard
        title="MCPs"
        description="Install MCP servers from the marketplace, connect each one to an agent, and expose its tools through a single registry entry."
        action={
          <div className="flex items-center gap-2">
            <button type="button" className={secondaryButtonClass} onClick={() => setSelectedId(mcps[0]?.id || "")}>
              Registry
            </button>
            <button type="button" className={primaryButtonClass} onClick={() => openCreateModal()}>
              Add MCP
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <SectionEyebrow>MCP registry</SectionEyebrow>
            <p className="mt-2 text-sm leading-6 text-[#6b6b67]">
              Pick an MCP to inspect its attached agent, runtime, and published tools.
            </p>
          </div>
          {mcps.length === 0 ? (
            <EmptyState
              label="No MCPs installed yet."
              detail="Install one from the marketplace or add a custom MCP to connect an agent."
            />
          ) : (
            <DataTable>
              <div className="hidden items-center gap-4 border-b border-[#efefee] px-4 py-3 text-xs font-medium uppercase tracking-wide text-[#8a8a86] lg:flex">
                <span className="min-w-0 flex-1">MCP</span>
                <span className="w-36 shrink-0">Agent</span>
                <span className="w-24 shrink-0">Transport</span>
                <span className="w-28 shrink-0">Status</span>
                <span className="w-40 shrink-0">Actions</span>
              </div>
              <div className="divide-y divide-[#efefee] bg-white">
                {mcps.map((mcp) => (
                  <div
                    key={mcp.id}
                    className={`flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-start ${
                      selectedId === mcp.id ? "bg-[#f7f7f5]" : ""
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedId(mcp.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="font-medium text-[#191917]">{mcp.name}</p>
                      <p className="mt-1 text-xs text-[#6b6b67]">
                        {mcp.namespace} · {mcp.tools?.length || 0} tools
                      </p>
                    </button>
                    <div className="text-sm text-[#6b6b67] lg:w-36 lg:shrink-0">
                      {agentById[mcp.agentId || ""] || "Unassigned"}
                    </div>
                    <div className="text-sm text-[#6b6b67] lg:w-24 lg:shrink-0">{mcp.transport}</div>
                    <div className="lg:w-28 lg:shrink-0">
                      <StatusBadge status={mcp.status} />
                    </div>
                    <div className="flex flex-wrap gap-2 lg:w-40 lg:shrink-0">
                      <button type="button" className={secondaryButtonClass} onClick={() => openEditModal(mcp)}>
                        Edit
                      </button>
                      {mcp.enabled ? (
                        <form action={disconnectMCP}>
                          <input type="hidden" name="id" value={mcp.id} />
                          <button className={secondaryButtonClass}>Disable</button>
                        </form>
                      ) : (
                        <form action={connectMCP}>
                          <input type="hidden" name="id" value={mcp.id} />
                          <button className={secondaryButtonClass}>Enable</button>
                        </form>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </DataTable>
          )}
        </div>
      </DashboardCard>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr),360px]">
        <DashboardCard
          title={selectedMCP ? selectedMCP.name : "MCP detail"}
          description={
            selectedMCP
              ? "Connected agent, runtime location, and the tool surface exposed by this MCP."
              : "Select an MCP to inspect its connection details."
          }
        >
          {!selectedMCP ? (
            <EmptyState label="Select an MCP" detail="Its tools and connection details will appear here." />
          ) : (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <Info label="Agent" value={agentById[selectedMCP.agentId || ""] || "Unassigned"} />
                <Info label="Transport" value={selectedMCP.transport} />
                <Info
                  label="Runtime"
                  value={
                    selectedMCP.endpoint ||
                    selectedMCP.url ||
                    selectedMCP.command ||
                    selectedMCP.urlTemplate ||
                    "None"
                  }
                />
                <Info label="Credential ref" value={selectedMCP.credentialRef || "Stored in vault"} />
              </div>

              <div className="rounded-lg border border-[#e7e7e5] bg-[#fbfbfa] p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-[#8a8a86]">Published tools</p>
                {selectedMCP.tools?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedMCP.tools.map((tool) => (
                      <span
                        key={tool.name}
                        className="inline-flex h-8 items-center rounded-md border border-[#ddddda] bg-white px-3 text-sm text-[#191917]"
                      >
                        {tool.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-[#6b6b67]">No tools published yet. Connect the MCP to fetch its tool list.</p>
                )}
              </div>
            </div>
          )}
        </DashboardCard>

        <DashboardCard title="MCP marketplace" description="Browse install-ready servers and open the add flow with a template prefilled.">
          <div className="space-y-3">
            {marketplace.length === 0 ? (
              <EmptyState label="No marketplace entries available." detail="Custom MCP setup is still available from Add MCP." />
            ) : (
              marketplace.map((listing) => (
                <div key={listing.slug} className="rounded-lg border border-[#e7e7e5] bg-[#fbfbfa] p-4">
                  <p className="font-medium text-[#191917]">{listing.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-[#8a8a86]">{listing.provider}</p>
                  <p className="mt-2 text-sm leading-6 text-[#6b6b67]">{listing.description}</p>
                  <div className="mt-3 space-y-2">
                    {listing.transportOptions.map((option) => (
                      <div
                        key={option.id}
                        className="rounded-md border border-[#e1e1de] bg-white p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#191917]">
                              {option.label}
                              {option.recommended ? " · Recommended" : ""}
                            </p>
                            {option.description ? (
                              <p className="mt-1 text-sm leading-6 text-[#6b6b67]">{option.description}</p>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            className={secondaryButtonClass}
                            onClick={() => openCreateModal(buildMarketplacePreset(listing, option))}
                          >
                            Install
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </DashboardCard>
      </div>

      <DashboardModal
        open={modalState.mode !== "closed"}
        title={modalState.mode === "edit" ? `Edit ${editingMCP?.name || "MCP"}` : "Add MCP"}
        description="Connect the MCP to an agent, test the runtime, and save it only when it looks right."
        onClose={closeModal}
      >
        <form
          key={modalState.mode === "edit" ? editingMCP?.id || "edit" : modalDefaults.mcpName}
          action={modalState.mode === "edit" ? updateMCP : createMCP}
          className="grid gap-3"
          onSubmit={() => setTestState(null)}
        >
          {modalState.mode === "edit" && editingMCP ? (
            <input type="hidden" name="id" value={editingMCP.id} />
          ) : null}

          <div className="grid gap-3 md:grid-cols-2">
            <DashboardField label="Linked agent">
              <select
                name="agentId"
                required
                className={inputClass}
                defaultValue={editingMCP?.agentId || agents[0]?.id || ""}
              >
                {agents.length === 0 ? (
                  <option value="">Create an agent first</option>
                ) : (
                  agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))
                )}
              </select>
            </DashboardField>
            <DashboardField label="MCP name">
              <input
                name="name"
                required
                defaultValue={modalDefaults.mcpName}
                className={inputClass}
                placeholder="Stripe MCP"
              />
            </DashboardField>
            <DashboardField label="Namespace">
              <input
                name="namespace"
                defaultValue={modalDefaults.namespace}
                className={inputClass}
                placeholder="stripe"
              />
            </DashboardField>
            <DashboardField label="Transport">
              <select
                name="transport"
                className={inputClass}
                value={draftTransport}
                onChange={(event) => setDraftTransport(event.target.value)}
              >
                <option value="stdio">stdio</option>
                <option value="sse">sse</option>
                <option value="http">http</option>
                <option value="rest">rest adapter</option>
              </select>
            </DashboardField>
          </div>

          <DashboardField label="Endpoint">
            <input
              name="endpoint"
              defaultValue={modalDefaults.endpoint}
              className={inputClass}
              placeholder="https://example.com/mcp"
            />
          </DashboardField>
          <DashboardField label={draftTransport === "rest" ? "URL template" : "Command"}>
            <input
              name={draftTransport === "rest" ? "urlTemplate" : "command"}
              defaultValue={draftTransport === "rest" ? modalDefaults.urlTemplate : modalDefaults.command}
              className={inputClass}
              placeholder={draftTransport === "rest" ? "https://api.example.com/refunds" : "/usr/local/bin/server"}
            />
          </DashboardField>

          <div className="grid gap-3 md:grid-cols-2">
            <DashboardField label="Credential header" hint="Stored once">
              <input
                name="credentialName"
                defaultValue={modalDefaults.credentialName || "Authorization"}
                className={inputClass}
                placeholder="Authorization"
              />
            </DashboardField>
            <DashboardField label="Credential value">
              <input name="credentialValue" type="password" className={inputClass} placeholder="Bearer ..." />
            </DashboardField>
            <DashboardField label="HTTP method" hint="REST only">
              <input name="method" defaultValue={modalDefaults.method || "POST"} className={inputClass} />
            </DashboardField>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <DashboardField label="Arguments" hint="One per line">
              <textarea name="args" defaultValue={(modalDefaults.args || []).join("\n")} className={textareaClass} rows={4} />
            </DashboardField>
            <DashboardField label="Headers" hint="key=value">
              <textarea
                name="headers"
                defaultValue={formatPairs(modalDefaults.headers)}
                className={textareaClass}
                rows={4}
              />
            </DashboardField>
            <DashboardField label="Env" hint="key=value">
              <textarea
                name="env"
                defaultValue={formatPairs(modalDefaults.env)}
                className={textareaClass}
                rows={4}
              />
            </DashboardField>
            <DashboardField label="Input schema" hint="JSON">
              <textarea
                name="inputSchema"
                defaultValue={modalDefaults.inputSchema}
                className={textareaClass}
                rows={4}
              />
            </DashboardField>
            <DashboardField label="Output schema" hint="JSON">
              <textarea
                name="outputSchema"
                defaultValue={modalDefaults.outputSchema}
                className={textareaClass}
                rows={4}
              />
            </DashboardField>
          </div>

          {modalState.mode === "create" && modalState.preset?.listingName ? (
            <div className="rounded-md border border-[#e7e7e5] bg-[#fbfbfa] px-3 py-3 text-sm text-[#6b6b67]">
              Installing from <span className="font-medium text-[#191917]">{modalState.preset.listingName}</span>.
            </div>
          ) : null}

          {testState ? (
            <div className="rounded-md border border-[#e7e7e5] bg-[#fbfbfa] px-3 py-3 text-sm text-[#6b6b67]">
              <p className="font-medium text-[#191917]">{testState.status}</p>
              <p className="mt-1">{testState.message}</p>
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" className={secondaryButtonClass} onClick={closeModal}>
              Cancel
            </button>
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={(event) => {
                const form = event.currentTarget.closest("form");
                if (form) {
                  void handleTestConnection(new FormData(form));
                }
              }}
            >
              Test connection
            </button>
            <button className={primaryButtonClass} disabled={agents.length === 0}>
              {modalState.mode === "edit" ? "Save MCP" : "Create MCP"}
            </button>
          </div>
        </form>
      </DashboardModal>
    </div>
  );
}

function buildMarketplacePreset(
  listing: MarketplaceListing,
  option: MarketplaceListing["transportOptions"][number],
): PresetDraft {
  return {
    listingName: listing.name,
    mcpName: listing.defaultMCPName || listing.name,
    namespace: listing.defaultNamespace,
    transport: option.transport,
    command: option.command,
    args: option.args,
    url: option.url,
    endpoint: option.url,
    method: option.transport === "rest" ? "POST" : undefined,
    headers: option.headers,
    env: option.env,
    credentialName: option.fields[0]?.key || "Authorization",
  };
}

function getMCPFormDefaults(
  mcp: Overview["mcps"][number] | null,
  preset?: PresetDraft | null,
) {
  return {
    mcpName: mcp?.name || preset?.mcpName || "",
    namespace: mcp?.namespace || preset?.namespace || "",
    transport: mcp?.transport || preset?.transport || "stdio",
    endpoint: mcp?.endpoint || mcp?.url || mcp?.command || preset?.endpoint || preset?.url || "",
    command: mcp?.command || preset?.command || "",
    urlTemplate: mcp?.urlTemplate || preset?.urlTemplate || "",
    method: mcp?.method || preset?.method || "POST",
    args: mcp?.args || preset?.args || [],
    headers: mcp?.headers || preset?.headers || {},
    env: mcp?.env || preset?.env || {},
    credentialName: mcp?.credentialName || preset?.credentialName || "Authorization",
    inputSchema: mcp?.inputSchema ? JSON.stringify(mcp.inputSchema, null, 2) : "",
    outputSchema: mcp?.outputSchema ? JSON.stringify(mcp.outputSchema, null, 2) : "",
  };
}

function parseKeyValueLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, line) => {
      const [key, ...rest] = line.split("=");
      if (key && rest.length > 0) {
        acc[key.trim()] = rest.join("=").trim();
      }
      return acc;
    }, {});
}

function parseJSONField(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  return JSON.parse(trimmed);
}

function formatPairs(values?: Record<string, string>) {
  if (!values) {
    return "";
  }
  return Object.entries(values)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#e7e7e5] bg-[#fbfbfa] p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-[#8a8a86]">{label}</p>
      <p className="mt-2 break-words text-sm text-[#191917]">{value}</p>
    </div>
  );
}
