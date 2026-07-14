"use client";

import { useMemo, useState, type KeyboardEvent, type SyntheticEvent } from "react";

import {
  DashboardCard,
  DashboardField,
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

function getDefaultTransportOption(listing: MarketplaceListing) {
  return (
    listing.transportOptions.find((option) => option.recommended) ||
    listing.transportOptions[0] ||
    null
  );
}

function stringifyKeyValueLines(values?: Record<string, string>) {
  if (!values || Object.keys(values).length === 0) {
    return "";
  }

  return Object.entries(values)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
}

function stopEventPropagation(event: SyntheticEvent) {
  event.stopPropagation();
}

type PanelMode = "idle" | "create" | "edit";

export function ConnectorsSection({
  connectors,
  marketplace,
  createConnector,
  updateConnector,
  connectConnector,
  disconnectConnector,
  installMarketplaceListing,
  reconnectConnector,
}: {
  connectors: Overview["connectors"];
  marketplace: MarketplaceListing[];
  createConnector: (formData: FormData) => Promise<void>;
  updateConnector: (formData: FormData) => Promise<void>;
  connectConnector: (formData: FormData) => Promise<void>;
  disconnectConnector: (formData: FormData) => Promise<void>;
  installMarketplaceListing: (formData: FormData) => Promise<void>;
  reconnectConnector: (formData: FormData) => Promise<void>;
}) {
  const [panelMode, setPanelMode] = useState<PanelMode>("idle");
  const [transport, setTransport] = useState("stdio");
  const [editTransport, setEditTransport] = useState("stdio");
  const [selectedConnectorId, setSelectedConnectorId] = useState<string | null>(null);
  const [selectedMarketplaceOptions, setSelectedMarketplaceOptions] = useState<Record<string, string>>({});

  const selectedConnector = useMemo(
    () => connectors.find((connector) => connector.id === selectedConnectorId) || null,
    [connectors, selectedConnectorId],
  );
  const activePanelMode: PanelMode =
    panelMode === "edit" && !selectedConnector ? "idle" : panelMode;

  const resolvedMarketplace = useMemo(
    () =>
      marketplace.map((listing) => {
        const selectedId = selectedMarketplaceOptions[listing.slug];
        const selectedOption =
          listing.transportOptions.find((option) => option.id === selectedId) ||
          getDefaultTransportOption(listing);
        return { listing, selectedOption };
      }),
    [marketplace, selectedMarketplaceOptions],
  );

  const isCreateStdio = transport === "stdio";
  const isCreateRemote = transport === "http" || transport === "sse";
  const isEditStdio = editTransport === "stdio";
  const isEditRemote = editTransport === "http" || editTransport === "sse";

  function openCreatePanel() {
    setPanelMode("create");
    setSelectedConnectorId(null);
    setTransport("stdio");
  }

  function openEditPanel(connector: Overview["connectors"][number]) {
    setPanelMode("edit");
    setSelectedConnectorId(connector.id);
    setEditTransport(connector.transport);
  }

  function handleConnectorKeyDown(
    event: KeyboardEvent<HTMLDivElement>,
    connector: Overview["connectors"][number],
  ) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault();
    openEditPanel(connector);
  }

  return (
    <div className="space-y-6">
      <DashboardCard
        title="Connectors"
        description="Manage downstream MCP servers and their runtime state."
        action={
          <div className="text-sm text-[#6b6b67]">
            {connectors.length} configured
          </div>
        }
      >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr),320px]">
          <div className="space-y-4">
            <div>
              <SectionEyebrow>Overview</SectionEyebrow>
              <p className="mt-2 text-sm leading-6 text-[#6b6b67]">
                Connectors contribute namespaced tools to the gateway. Click a
                connector row to update its configuration, or disconnect it
                directly from the table.
              </p>
            </div>

            {connectors.length === 0 ? (
              <EmptyState
                label="No connectors configured yet."
                detail="Add a connector manually or install a preconfigured MCP server from the marketplace."
              />
            ) : (
              <DataTable>
                <div className="hidden items-center gap-4 border-b border-[#efefee] px-4 py-3 text-xs font-medium uppercase tracking-wide text-[#8a8a86] lg:flex">
                  <span className="min-w-0 flex-1">Connector</span>
                  <span className="w-24 shrink-0">Transport</span>
                  <span className="w-28 shrink-0">Status</span>
                  <span className="w-28 shrink-0">Tools</span>
                  <span className="w-36 shrink-0">Actions</span>
                </div>
                <div className="divide-y divide-[#efefee] bg-white">
                  {connectors.map((connector) => {
                    const isSelected =
                      activePanelMode === "edit" && selectedConnectorId === connector.id;

                    return (
                      <div
                        key={connector.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => openEditPanel(connector)}
                        onKeyDown={(event) => handleConnectorKeyDown(event, connector)}
                        className={`flex cursor-pointer flex-col gap-4 px-4 py-4 transition hover:bg-[#fbfbfa] lg:flex-row lg:items-start ${
                          isSelected ? "bg-[#f7f7f5]" : ""
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate font-medium text-[#191917]">
                              {connector.namespace}.{connector.name}
                            </p>
                            {!connector.enabled ? (
                              <span className="rounded-md bg-[#f3f3f1] px-2 py-1 text-[11px] font-medium text-[#5f5f5b]">
                                Disabled
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 truncate text-xs text-[#6b6b67]">
                            {connector.command || connector.url || "No command configured"}
                          </p>
                          {connector.args && connector.args.length > 0 ? (
                            <p className="mt-2 text-xs text-[#8a8a86]">
                              Args: {connector.args.join(" ")}
                            </p>
                          ) : null}
                          {connector.headers && Object.keys(connector.headers).length > 0 ? (
                            <p className="mt-2 text-xs text-[#8a8a86]">
                              Headers: {Object.keys(connector.headers).join(", ")}
                            </p>
                          ) : null}
                          {connector.env && Object.keys(connector.env).length > 0 ? (
                            <p className="mt-2 text-xs text-[#8a8a86]">
                              Env: {Object.keys(connector.env).join(", ")}
                            </p>
                          ) : null}
                          {connector.secretEnvKeys && connector.secretEnvKeys.length > 0 ? (
                            <p className="mt-2 text-xs text-[#8a8a86]">
                              Secret env: {connector.secretEnvKeys.join(", ")}
                            </p>
                          ) : null}
                          {connector.secretHeaderKeys && connector.secretHeaderKeys.length > 0 ? (
                            <p className="mt-2 text-xs text-[#8a8a86]">
                              Secret headers: {connector.secretHeaderKeys.join(", ")}
                            </p>
                          ) : null}
                          {connector.lastError ? (
                            <p className="mt-2 text-xs text-[#a14637]">
                              {connector.lastError}
                            </p>
                          ) : null}
                        </div>
                        <div className="text-sm text-[#6b6b67] lg:w-24 lg:shrink-0">
                          {connector.transport}
                        </div>
                        <div className="lg:w-28 lg:shrink-0">
                          <StatusBadge status={connector.status} />
                        </div>
                        <div className="flex items-start justify-between gap-2 lg:w-28 lg:shrink-0 lg:block">
                          <div className="text-sm font-medium text-[#191917]">
                            {connector.tools?.length || 0}
                          </div>
                        </div>
                        <div
                          className="flex flex-wrap items-start gap-2 lg:w-36 lg:shrink-0"
                          onClick={stopEventPropagation}
                        >
                          {connector.enabled ? (
                            <>
                              <form action={reconnectConnector} onClick={stopEventPropagation}>
                                <input type="hidden" name="id" value={connector.id} />
                                <button className={secondaryButtonClass}>Reconnect</button>
                              </form>
                              <form action={disconnectConnector} onClick={stopEventPropagation}>
                                <input type="hidden" name="id" value={connector.id} />
                                <button className={secondaryButtonClass}>Disconnect</button>
                              </form>
                            </>
                          ) : (
                            <form action={connectConnector} onClick={stopEventPropagation}>
                              <input type="hidden" name="id" value={connector.id} />
                              <button className={secondaryButtonClass}>Connect</button>
                            </form>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </DataTable>
            )}
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={openCreatePanel}
              className={`${primaryButtonClass} w-full`}
            >
              Add connector
            </button>

            {activePanelMode === "idle" ? (
              <EmptyState
                label="No connector form open."
                detail="Click Add connector to create one, or click any connector row to update it."
              />
            ) : null}

            {activePanelMode === "create" ? (
              <div className="rounded-lg border border-[#e7e7e5] bg-white">
                <form action={createConnector} className="grid gap-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <SectionEyebrow>Add connector</SectionEyebrow>
                      <p className="mt-2 text-sm leading-6 text-[#6b6b67]">
                        Manual connector creation supports stdio, HTTP, and SSE.
                        Provide only the fields that apply to the selected transport.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPanelMode("idle")}
                      className={secondaryButtonClass}
                    >
                      Close
                    </button>
                  </div>
                  <DashboardField label="Name">
                    <input name="name" required className={inputClass} placeholder="hello" />
                  </DashboardField>
                  <DashboardField label="Namespace" hint="Client-facing prefix">
                    <input
                      name="namespace"
                      required
                      className={inputClass}
                      placeholder="hello"
                    />
                  </DashboardField>
                  <DashboardField label="Transport">
                    <select
                      name="transport"
                      value={transport}
                      onChange={(event) => setTransport(event.target.value)}
                      className={inputClass}
                    >
                      <option value="stdio">stdio</option>
                      <option value="http">http</option>
                      <option value="sse">sse</option>
                    </select>
                  </DashboardField>

                  {isCreateStdio ? (
                    <>
                      <DashboardField label="Command" hint="Required for stdio connectors">
                        <input
                          name="command"
                          required
                          className={inputClass}
                          placeholder="/app/bin/hello-mcp"
                        />
                      </DashboardField>
                      <DashboardField label="Args" hint="One per line, used for stdio">
                        <textarea
                          name="args"
                          className={`${textareaClass} min-h-24`}
                          placeholder="stdio"
                        />
                      </DashboardField>
                      <DashboardField label="Env" hint="KEY=value per line">
                        <textarea
                          name="env"
                          className={`${textareaClass} min-h-24`}
                          placeholder="LOG_LEVEL=debug"
                        />
                      </DashboardField>
                      <DashboardField label="Secret env" hint="Encrypted at rest">
                        <textarea
                          name="secretEnv"
                          className={`${textareaClass} min-h-24`}
                          placeholder="API_TOKEN=secret"
                        />
                      </DashboardField>
                    </>
                  ) : null}

                  {isCreateRemote ? (
                    <>
                      <DashboardField label="URL" hint={`Required for ${transport.toUpperCase()} connectors`}>
                        <input
                          name="url"
                          required
                          className={inputClass}
                          placeholder="https://example.com/mcp"
                        />
                      </DashboardField>
                      <DashboardField label="Headers" hint="KEY=value per line">
                        <textarea
                          name="headers"
                          className={`${textareaClass} min-h-24`}
                          placeholder={"Accept=application/json\nAuthorization=Bearer token"}
                        />
                      </DashboardField>
                      <DashboardField label="Secret headers" hint="Encrypted at rest">
                        <textarea
                          name="secretHeaders"
                          className={`${textareaClass} min-h-24`}
                          placeholder="Authorization=Bearer secret"
                        />
                      </DashboardField>
                    </>
                  ) : null}

                  <button className={primaryButtonClass}>Create connector</button>
                </form>
              </div>
            ) : null}

            {activePanelMode === "edit" && selectedConnector ? (
              <div className="rounded-lg border border-[#e7e7e5] bg-white">
                <form
                  key={`${selectedConnector.id}-${editTransport}`}
                  action={updateConnector}
                  className="grid gap-3 p-4"
                >
                  <input type="hidden" name="id" value={selectedConnector.id} />
                  <input
                    type="hidden"
                    name="enabled"
                    value={selectedConnector.enabled ? "true" : "false"}
                  />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <SectionEyebrow>Edit connector</SectionEyebrow>
                      <p className="mt-2 text-sm leading-6 text-[#6b6b67]">
                        Update the selected connector. Secret values are never
                        shown again, so leave secret fields blank to keep the
                        current encrypted values.
                      </p>
                    </div>
                    <div className="shrink-0">
                      <StatusBadge status={selectedConnector.status} />
                    </div>
                  </div>
                  <DashboardField label="Name">
                    <input
                      name="name"
                      required
                      defaultValue={selectedConnector.name}
                      className={inputClass}
                    />
                  </DashboardField>
                  <DashboardField label="Namespace" hint="Client-facing prefix">
                    <input
                      name="namespace"
                      required
                      defaultValue={selectedConnector.namespace}
                      className={inputClass}
                    />
                  </DashboardField>
                  <DashboardField label="Transport">
                    <select
                      name="transport"
                      value={editTransport}
                      onChange={(event) => setEditTransport(event.target.value)}
                      className={inputClass}
                    >
                      <option value="stdio">stdio</option>
                      <option value="http">http</option>
                      <option value="sse">sse</option>
                    </select>
                  </DashboardField>

                  {isEditStdio ? (
                    <>
                      <DashboardField label="Command" hint="Required for stdio connectors">
                        <input
                          name="command"
                          required
                          defaultValue={selectedConnector.transport === "stdio" ? selectedConnector.command || "" : ""}
                          className={inputClass}
                          placeholder="/app/bin/hello-mcp"
                        />
                      </DashboardField>
                      <DashboardField label="Args" hint="One per line, used for stdio">
                        <textarea
                          name="args"
                          defaultValue={selectedConnector.transport === "stdio" ? (selectedConnector.args || []).join("\n") : ""}
                          className={`${textareaClass} min-h-24`}
                          placeholder="stdio"
                        />
                      </DashboardField>
                      <DashboardField label="Env" hint="KEY=value per line">
                        <textarea
                          name="env"
                          defaultValue={selectedConnector.transport === "stdio" ? stringifyKeyValueLines(selectedConnector.env) : ""}
                          className={`${textareaClass} min-h-24`}
                          placeholder="LOG_LEVEL=debug"
                        />
                      </DashboardField>
                      <DashboardField
                        label="Secret env"
                        hint={
                          selectedConnector.secretEnvKeys && selectedConnector.secretEnvKeys.length > 0
                            ? `Current keys: ${selectedConnector.secretEnvKeys.join(", ")}`
                            : "Leave blank to keep existing encrypted values"
                        }
                      >
                        <textarea
                          name="secretEnv"
                          className={`${textareaClass} min-h-24`}
                          placeholder="API_TOKEN=secret"
                        />
                      </DashboardField>
                    </>
                  ) : null}

                  {isEditRemote ? (
                    <>
                      <DashboardField label="URL" hint={`Required for ${editTransport.toUpperCase()} connectors`}>
                        <input
                          name="url"
                          required
                          defaultValue={selectedConnector.transport !== "stdio" ? selectedConnector.url || "" : ""}
                          className={inputClass}
                          placeholder="https://example.com/mcp"
                        />
                      </DashboardField>
                      <DashboardField label="Headers" hint="KEY=value per line">
                        <textarea
                          name="headers"
                          defaultValue={selectedConnector.transport !== "stdio" ? stringifyKeyValueLines(selectedConnector.headers) : ""}
                          className={`${textareaClass} min-h-24`}
                          placeholder={"Accept=application/json\nAuthorization=Bearer token"}
                        />
                      </DashboardField>
                      <DashboardField
                        label="Secret headers"
                        hint={
                          selectedConnector.secretHeaderKeys && selectedConnector.secretHeaderKeys.length > 0
                            ? `Current keys: ${selectedConnector.secretHeaderKeys.join(", ")}`
                            : "Leave blank to keep existing encrypted values"
                        }
                      >
                        <textarea
                          name="secretHeaders"
                          className={`${textareaClass} min-h-24`}
                          placeholder="Authorization=Bearer secret"
                        />
                      </DashboardField>
                    </>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    <button className={primaryButtonClass}>Save changes</button>
                    <button
                      type="button"
                      onClick={() => {
                        setPanelMode("idle");
                        setSelectedConnectorId(null);
                      }}
                      className={secondaryButtonClass}
                    >
                      Close
                    </button>
                  </div>
                </form>
              </div>
            ) : null}
          </div>
        </div>
      </DashboardCard>

      <DashboardCard
        title="Marketplace"
        description="Install preconfigured MCP servers instead of assembling their transport details by hand. Marketplace listings can target stdio, HTTP, or SSE."
        action={
          <div className="text-sm text-[#6b6b67]">
            {marketplace.length} listings
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <SectionEyebrow>Preconfigured connectors</SectionEyebrow>
            <p className="mt-2 text-sm leading-6 text-[#6b6b67]">
              Marketplace listings ship with the common command, transport,
              headers, or environment wiring already filled in. You only enter
              the account-specific values they still require.
            </p>
          </div>

          {resolvedMarketplace.length === 0 ? (
            <EmptyState
              label="No marketplace listings available."
              detail="Add catalog entries to expose preconfigured MCP servers here."
            />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {resolvedMarketplace.map(({ listing, selectedOption }) => {
                if (!selectedOption) {
                  return null;
                }
                return (
                  <details
                    key={listing.slug}
                    className="rounded-lg border border-[#e7e7e5] bg-white open:shadow-sm"
                  >
                    <summary className="list-none cursor-pointer px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-[#191917]">{listing.name}</p>
                          <p className="mt-1 text-xs uppercase tracking-wide text-[#8a8a86]">
                            {listing.provider}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-[#6b6b67]">
                            {listing.description}
                          </p>
                          <p className="mt-2 text-xs text-[#8a8a86]">
                            Selected transport: {selectedOption.label}
                            {selectedOption.recommended ? " (Recommended)" : ""}
                          </p>
                          {selectedOption.command ? (
                            <p className="mt-2 text-xs text-[#8a8a86]">
                              Command: {selectedOption.command}
                              {selectedOption.args && selectedOption.args.length > 0
                                ? ` ${selectedOption.args.join(" ")}`
                                : ""}
                            </p>
                          ) : null}
                          {selectedOption.url ? (
                            <p className="mt-2 text-xs text-[#8a8a86]">
                              URL: {selectedOption.url}
                            </p>
                          ) : null}
                        </div>
                        <div className="shrink-0">
                          <StatusBadge status={selectedOption.transport} />
                        </div>
                      </div>
                      <div className="mt-3">
                        <span className={primaryButtonClass}>Install {listing.name}</span>
                      </div>
                    </summary>
                    <form
                      action={installMarketplaceListing}
                      className="grid gap-3 border-t border-[#efefee] p-4"
                    >
                      <input type="hidden" name="slug" value={listing.slug} />
                      <input type="hidden" name="transportOption" value={selectedOption.id} />
                      {listing.transportOptions.length > 1 ? (
                        <DashboardField label="Transport option">
                          <select
                            value={selectedOption.id}
                            onChange={(event) =>
                              setSelectedMarketplaceOptions((current) => ({
                                ...current,
                                [listing.slug]: event.target.value,
                              }))
                            }
                            className={inputClass}
                          >
                            {listing.transportOptions.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.label}
                                {option.recommended ? " (Recommended)" : ""}
                              </option>
                            ))}
                          </select>
                        </DashboardField>
                      ) : null}
                      {selectedOption.description ? (
                        <p className="text-xs text-[#8a8a86]">{selectedOption.description}</p>
                      ) : null}
                      <DashboardField label="Name">
                        <input
                          name="name"
                          required
                          defaultValue={listing.defaultConnectorName}
                          className={inputClass}
                        />
                      </DashboardField>
                      <DashboardField label="Namespace">
                        <input
                          name="namespace"
                          required
                          defaultValue={listing.defaultNamespace}
                          className={inputClass}
                        />
                      </DashboardField>
                      {selectedOption.fields.map((field) => (
                        <DashboardField
                          key={`${listing.slug}-${selectedOption.id}-${field.name}`}
                          label={field.label}
                          hint={field.description || undefined}
                        >
                          <input
                            name={field.name}
                            required={field.required}
                            type={field.secret ? "password" : "text"}
                            className={inputClass}
                            placeholder={field.placeholder || ""}
                          />
                        </DashboardField>
                      ))}
                      {selectedOption.headers && Object.keys(selectedOption.headers).length > 0 ? (
                        <p className="text-xs text-[#8a8a86]">
                          Common headers: {Object.entries(selectedOption.headers)
                            .map(([key, value]) => `${key}=${value}`)
                            .join(", ")}
                        </p>
                      ) : null}
                      {selectedOption.env && Object.keys(selectedOption.env).length > 0 ? (
                        <p className="text-xs text-[#8a8a86]">
                          Common env: {Object.entries(selectedOption.env)
                            .map(([key, value]) => `${key}=${value}`)
                            .join(", ")}
                        </p>
                      ) : null}
                      <button className={primaryButtonClass}>Install connector</button>
                    </form>
                  </details>
                );
              })}
            </div>
          )}
        </div>
      </DashboardCard>
    </div>
  );
}
