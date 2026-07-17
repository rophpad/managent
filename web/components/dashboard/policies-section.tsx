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
import type { Overview } from "./types";

type PanelMode = "closed" | "test";

export function PoliciesSection({
  policies,
  agents,
  mcps,
  createPolicy,
  reorderPolicies,
}: {
  policies: Overview["policies"];
  agents: Overview["agents"];
  mcps: Overview["mcps"];
  createPolicy: (formData: FormData) => Promise<void>;
  reorderPolicies: (formData: FormData) => Promise<void>;
}) {
  const [panelMode, setPanelMode] = useState<PanelMode>("closed");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMcpId, setSelectedMcpId] = useState(mcps[0]?.id || "");
  const [selectedToolName, setSelectedToolName] = useState(mcps[0]?.tools?.[0]?.name || "");
  const [testPayload, setTestPayload] = useState('{\n  "amount": 12000\n}');
  const [testResult, setTestResult] = useState<{ action?: string; ruleName?: string; reason?: string } | null>(null);

  const mcpOptions = useMemo(
    () =>
      mcps.map((mcp) => ({
        id: mcp.id,
        name: mcp.name,
        namespace: mcp.namespace,
        agentId: mcp.agentId || "",
        agentName: agents.find((agent) => agent.id === mcp.agentId)?.name || "Unassigned",
        tools: mcp.tools || [],
      })),
    [agents, mcps],
  );
  const activeSelectedMcpId =
    mcpOptions.some((mcp) => mcp.id === selectedMcpId) ? selectedMcpId : mcpOptions[0]?.id || "";
  const selectedMcp = useMemo(
    () => mcpOptions.find((mcp) => mcp.id === activeSelectedMcpId) || mcpOptions[0] || null,
    [activeSelectedMcpId, mcpOptions],
  );
  const toolOptions = useMemo(() => selectedMcp?.tools || [], [selectedMcp]);
  const activeSelectedToolName =
    toolOptions.some((tool) => tool.name === selectedToolName) ? selectedToolName : toolOptions[0]?.name || "";
  const selectedToolValue =
    selectedMcp && activeSelectedToolName ? `${selectedMcp.namespace}.${activeSelectedToolName}` : "";

  async function runTest(formData: FormData) {
    const mcpId = String(formData.get("testMcpId") || "");
    const toolName = String(formData.get("testToolName") || "");
    const selectedMCP = mcpOptions.find((mcp) => mcp.id === mcpId);
    const payload = {
      agentId: selectedMCP?.agentId || "",
      tags: [],
      tool: selectedMCP && toolName ? `${selectedMCP.namespace}.${toolName}` : "",
      action: "call",
      request: JSON.parse(String(formData.get("testPayload") || "{}")),
    };
    const response = await fetch("/api/v1/policies/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setTestResult((await response.json()) as { action?: string; ruleName?: string; reason?: string });
  }

  return (
    <div className="space-y-6">
      <DashboardCard
        title="Policies"
        description="Policies are attached to MCP tools, so you choose the MCP first, then the tool surface you want to govern."
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={() => setPanelMode((value) => (value === "test" ? "closed" : "test"))}
            >
              Test mode
            </button>
            <button type="button" className={primaryButtonClass} onClick={() => setShowCreateModal(true)}>
              Add policy
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <SectionEyebrow>Rule order</SectionEyebrow>
            <p className="mt-2 text-sm leading-6 text-[#6b6b67]">
              No matching rule means deny. Open the policy modal only when you want to define or refine a rule.
            </p>
          </div>
          {policies.length === 0 ? (
            <EmptyState label="No policies configured yet." detail="Add a rule for one of your MCP tools." />
          ) : (
            <DataTable>
              <div className="hidden items-center gap-4 border-b border-[#efefee] px-4 py-3 text-xs font-medium uppercase tracking-wide text-[#8a8a86] lg:flex">
                <span className="min-w-0 flex-1">Rule</span>
                <span className="w-44 shrink-0">MCP</span>
                <span className="min-w-0 flex-1">Tool</span>
                <span className="w-28 shrink-0">Rate</span>
                <span className="w-32 shrink-0">Effect</span>
              </div>
              <div className="divide-y divide-[#efefee] bg-white">
                {policies.map((policy) => {
                  const parsed = splitToolIdentifier(policy.tool);
                  return (
                    <div key={policy.id} className="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-start">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-[#191917]">{policy.name}</p>
                        <p className="mt-1 text-xs text-[#6b6b67]">
                          {policy.condition?.field
                            ? `${policy.condition.field} ${policy.condition.operator} ${String(policy.condition.value)}`
                            : "Always"}
                        </p>
                      </div>
                      <div className="text-sm text-[#191917] lg:w-44 lg:shrink-0">{parsed.namespace || "Global"}</div>
                      <div className="min-w-0 flex-1 text-sm text-[#191917]">{parsed.tool || policy.tool}</div>
                      <div className="text-sm text-[#6b6b67] lg:w-28 lg:shrink-0">
                        {policy.rateLimit || "None"}
                      </div>
                      <div className="lg:w-32 lg:shrink-0">
                        <StatusBadge status={policy.effect} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </DataTable>
          )}
          {policies.length > 1 ? (
            <form action={reorderPolicies}>
              <input type="hidden" name="ids" value={policies.map((policy) => policy.id).join(",")} />
              <button className={secondaryButtonClass}>Persist current order</button>
            </form>
          ) : null}
        </div>
      </DashboardCard>

      {panelMode === "test" ? (
        <DashboardCard title="Policy test mode" description="Paste a request and see which MCP policy would match.">
          <form
            className="grid gap-3 xl:max-w-3xl"
            onSubmit={(event) => {
              event.preventDefault();
              void runTest(new FormData(event.currentTarget));
            }}
          >
            <div className="grid gap-3 md:grid-cols-2">
              <DashboardField label="MCP">
                <select
                  name="testMcpId"
                  className={inputClass}
                  defaultValue={selectedMcp?.id || ""}
                  onChange={(event) => {
                    const nextId = event.target.value;
                    const nextMcp = mcpOptions.find((mcp) => mcp.id === nextId);
                    setSelectedMcpId(nextId);
                    setSelectedToolName(nextMcp?.tools[0]?.name || "");
                  }}
                >
                  {mcpOptions.length === 0 ? (
                    <option value="">No MCPs yet</option>
                  ) : (
                    mcpOptions.map((mcp) => (
                      <option key={mcp.id} value={mcp.id}>
                        {mcp.name} - {mcp.agentName}
                      </option>
                    ))
                  )}
                </select>
              </DashboardField>
              <DashboardField label="Tool">
                <select
                  name="testToolName"
                  className={inputClass}
                  value={activeSelectedToolName}
                  onChange={(event) => setSelectedToolName(event.target.value)}
                >
                  {toolOptions.length === 0 ? (
                    <option value="">No tools yet</option>
                  ) : (
                    toolOptions.map((tool) => (
                      <option key={tool.name} value={tool.name}>
                        {tool.name}
                      </option>
                    ))
                  )}
                </select>
              </DashboardField>
            </div>
            <DashboardField label="Request JSON">
              <textarea
                name="testPayload"
                value={testPayload}
                onChange={(event) => setTestPayload(event.target.value)}
                className={textareaClass}
                rows={8}
              />
            </DashboardField>
            <div className="flex gap-2">
              <button className={secondaryButtonClass}>Run test</button>
              <button type="button" className={secondaryButtonClass} onClick={() => setPanelMode("closed")}>
                Close
              </button>
            </div>
            {testResult ? (
              <div className="rounded-lg border border-[#e7e7e5] bg-[#fbfbfa] p-4 text-sm text-[#6b6b67]">
                <p className="font-medium text-[#191917]">{testResult.action || "deny"}</p>
                <p className="mt-1">{testResult.ruleName || "No matching rule"}</p>
                <p className="mt-1">{testResult.reason || "Fail closed"}</p>
              </div>
            ) : null}
          </form>
        </DashboardCard>
      ) : null}

      <DashboardModal
        open={showCreateModal}
        title="Add policy"
        description="Choose the MCP first, then the tool inside it, and define the rule you want enforced."
        onClose={() => setShowCreateModal(false)}
      >
        <form
          action={createPolicy}
          className="grid gap-3 xl:max-w-3xl"
          onSubmit={() => setShowCreateModal(false)}
        >
          <DashboardField label="Name">
            <input name="name" required className={inputClass} placeholder="high_value_refund" />
          </DashboardField>

          <div className="grid gap-3 sm:grid-cols-2">
            <DashboardField label="MCP">
              <select
                name="mcpId"
                className={inputClass}
                value={activeSelectedMcpId}
                onChange={(event) => {
                  const nextId = event.target.value;
                  const nextMcp = mcpOptions.find((mcp) => mcp.id === nextId);
                  setSelectedMcpId(nextId);
                  setSelectedToolName(nextMcp?.tools[0]?.name || "");
                }}
              >
                {mcpOptions.length === 0 ? (
                  <option value="">No MCPs yet</option>
                ) : (
                  mcpOptions.map((mcp) => (
                    <option key={mcp.id} value={mcp.id}>
                      {mcp.name} - {mcp.agentName}
                    </option>
                  ))
                )}
              </select>
            </DashboardField>
            <DashboardField label="Tool">
              <select
                name="toolName"
                className={inputClass}
                value={activeSelectedToolName}
                onChange={(event) => setSelectedToolName(event.target.value)}
              >
                {toolOptions.length === 0 ? (
                  <option value="">No tools yet</option>
                ) : (
                  toolOptions.map((tool) => (
                    <option key={tool.name} value={tool.name}>
                      {tool.name}
                    </option>
                  ))
                )}
              </select>
            </DashboardField>
          </div>

          <input type="hidden" name="tool" value={selectedToolValue} />

          <DashboardField label="Action">
            <input name="actionName" defaultValue="call" className={inputClass} />
          </DashboardField>
          <div className="grid gap-3 sm:grid-cols-3">
            <DashboardField label="Field" hint="Optional">
              <input name="field" className={inputClass} placeholder="amount" />
            </DashboardField>
            <DashboardField label="Operator">
              <select name="operator" className={inputClass} defaultValue="gt">
                <option value="eq">eq</option>
                <option value="gt">gt</option>
                <option value="gte">gte</option>
                <option value="lt">lt</option>
                <option value="lte">lte</option>
              </select>
            </DashboardField>
            <DashboardField label="Value">
              <input name="value" className={inputClass} placeholder="10000" />
            </DashboardField>
          </div>
          <DashboardField label="Effect">
            <select name="effect" className={inputClass} defaultValue="deny">
              <option value="allow">allow</option>
              <option value="deny">deny</option>
              <option value="require_approval">require approval</option>
            </select>
          </DashboardField>
          <DashboardField label="Rate limit" hint="Optional e.g. 10/m">
            <input name="rateLimit" className={inputClass} placeholder="10/m" />
          </DashboardField>
          <DashboardField label="Approval channel override" hint="Optional">
            <input name="channelOverride" className={inputClass} placeholder="#finance-approvals" />
          </DashboardField>
          <div className="flex justify-end gap-2">
            <button type="button" className={secondaryButtonClass} onClick={() => setShowCreateModal(false)}>
              Cancel
            </button>
            <button className={primaryButtonClass} disabled={!selectedToolValue}>
              Create policy
            </button>
          </div>
        </form>
      </DashboardModal>
    </div>
  );
}

function splitToolIdentifier(value: string) {
  const [namespace, ...rest] = value.split(".");
  if (rest.length === 0) {
    return { namespace: "", tool: value };
  }
  return { namespace, tool: rest.join(".") };
}
