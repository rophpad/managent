"use client";

import { useEffect, useMemo, useState } from "react";

import {
  DashboardCard,
  DashboardField,
  DataTable,
  EmptyState,
  SectionEyebrow,
  StatusBadge,
  inputClass,
  primaryButtonClass,
} from "./primitives";
import type { Overview } from "./types";

export function PoliciesSection({
  policies,
  connectors,
  createPolicy,
}: {
  policies: Overview["policies"];
  connectors: Overview["connectors"];
  createPolicy: (formData: FormData) => Promise<void>;
}) {
  const connectorsWithTools = useMemo(
    () => connectors.filter((connector) => (connector.tools?.length || 0) > 0),
    [connectors],
  );
  const [selectedConnectorId, setSelectedConnectorId] = useState(
    connectorsWithTools[0]?.id || "",
  );

  useEffect(() => {
    if (!connectorsWithTools.some((connector) => connector.id === selectedConnectorId)) {
      setSelectedConnectorId(connectorsWithTools[0]?.id || "");
    }
  }, [connectorsWithTools, selectedConnectorId]);

  const selectedConnector =
    connectorsWithTools.find((connector) => connector.id === selectedConnectorId) || null;
  const availableTools = selectedConnector?.tools || [];

  return (
    <DashboardCard
      title="Policies"
      description="Define the rules the gateway applies before a request reaches a downstream tool."
      action={<div className="text-sm text-[#6b6b67]">{policies.length} rules</div>}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr),300px]">
        <div className="space-y-4">
          <div>
            <SectionEyebrow>Rules</SectionEyebrow>
            <p className="mt-2 text-sm leading-6 text-[#6b6b67]">
              Policies can allow, deny, or require approval based on explicit conditions in the request.
            </p>
          </div>

          {policies.length === 0 ? (
            <EmptyState
              label="No policies configured yet."
              detail="Use the create button to add a rule for sensitive calls."
            />
          ) : (
            <DataTable>
              <div className="hidden items-center gap-4 border-b border-[#efefee] px-4 py-3 text-xs font-medium uppercase tracking-wide text-[#8a8a86] lg:flex">
                <span className="min-w-0 flex-1">Rule</span>
                <span className="min-w-0 flex-1">Tool</span>
                <span className="w-32 shrink-0">Action</span>
              </div>
              <div className="divide-y divide-[#efefee] bg-white">
                {policies.map((policy) => (
                  <div
                    key={policy.id}
                    className="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-start"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[#191917]">{policy.name}</p>
                      <p className="mt-1 text-xs leading-5 text-[#6b6b67]">
                        {Object.entries(policy.conditions || {})
                          .map(
                            ([field, rule]) =>
                              `${field}: ${Object.entries(rule)
                                .map(([op, val]) => `${op} ${String(val)}`)
                                .join(", ")}`,
                          )
                          .join(" | ") || "Always"}
                      </p>
                    </div>
                    <div className="min-w-0 flex-1 text-sm text-[#191917]">{policy.tool}</div>
                    <div className="lg:w-32 lg:shrink-0">
                      <StatusBadge status={policy.action} />
                    </div>
                  </div>
                ))}
              </div>
            </DataTable>
          )}
        </div>

        <details className="rounded-lg border border-[#e7e7e5] bg-white open:shadow-sm">
          <summary className="list-none cursor-pointer px-4 py-4">
            <span className={primaryButtonClass}>Create policy</span>
          </summary>
          <form action={createPolicy} className="grid gap-3 border-t border-[#efefee] p-4">
            <div>
              <SectionEyebrow>Add policy</SectionEyebrow>
              <p className="mt-2 text-sm leading-6 text-[#6b6b67]">
                Create a simple rule against one tool and one optional condition field.
              </p>
            </div>
            <DashboardField label="Name">
              <input name="name" required className={inputClass} placeholder="refund_limit" />
            </DashboardField>
            <DashboardField label="Connector">
              <select
                value={selectedConnectorId}
                onChange={(event) => setSelectedConnectorId(event.target.value)}
                className={inputClass}
                disabled={connectorsWithTools.length === 0}
              >
                {connectorsWithTools.length === 0 ? (
                  <option value="">No connectors with tools</option>
                ) : (
                  connectorsWithTools.map((connector) => (
                    <option key={connector.id} value={connector.id}>
                      {connector.namespace}.{connector.name}
                    </option>
                  ))
                )}
              </select>
            </DashboardField>
            <DashboardField label="Tool">
              <select
                name="tool"
                required
                className={inputClass}
                disabled={availableTools.length === 0}
                key={selectedConnectorId || "no-connector"}
                defaultValue={availableTools[0]?.name ? `${selectedConnector?.namespace}.${availableTools[0].name}` : ""}
              >
                {availableTools.length === 0 ? (
                  <option value="">No tools available</option>
                ) : (
                  availableTools.map((tool) => {
                    const fullToolName = `${selectedConnector?.namespace}.${tool.name}`;
                    return (
                      <option key={fullToolName} value={fullToolName}>
                        {fullToolName}
                      </option>
                    );
                  })
                )}
              </select>
            </DashboardField>
            <DashboardField label="Action">
              <select name="action" className={inputClass} defaultValue="deny">
                <option value="allow">allow</option>
                <option value="deny">deny</option>
                <option value="require_approval">require_approval</option>
              </select>
            </DashboardField>
            <DashboardField label="Condition field" hint="Optional">
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
              <input name="value" className={inputClass} placeholder="100" />
            </DashboardField>
            <button className={primaryButtonClass} disabled={availableTools.length === 0}>
              Create policy
            </button>
          </form>
        </details>
      </div>
    </DashboardCard>
  );
}
