import {
  DashboardCard,
  DataTable,
  EmptyState,
  MetricCard,
  SectionEyebrow,
  StatusBadge,
  primaryButtonClass,
} from "./primitives";
import type { Overview } from "./types";

export function KeysSection({
  apiKeys,
  createApiKey,
  formatDate,
}: {
  apiKeys: Overview["apiKeys"];
  createApiKey: () => Promise<void>;
  formatDate: (value: string) => string;
}) {
  return (
    <DashboardCard
      title="API keys"
      description="Gateway tokens used by clients to authenticate with the control plane."
      action={
        <form action={createApiKey}>
          <button className={primaryButtonClass}>Create key</button>
        </form>
      }
    >
      <div className="space-y-4">
        <div>
          <SectionEyebrow>Access</SectionEyebrow>
          <p className="mt-2 text-sm leading-6 text-[#6b6b67]">
            New keys are shown once when issued. Stored records only keep the hashed value.
          </p>
        </div>
        {apiKeys.length === 0 ? (
          <EmptyState
            label="No API keys issued yet."
            detail="Create a key when you are ready to connect a client to the gateway."
          />
        ) : (
          <div className="space-y-3">
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-[#e7e7e5] bg-[#fbfbfa] px-4 py-4 text-sm"
              >
                <div>
                  <p className="font-medium text-[#191917]">Key #{key.id}</p>
                  <p className="mt-1 text-xs text-[#6b6b67]">
                    Created {formatDate(key.createdAt)}
                  </p>
                </div>
                <StatusBadge status="hashed" />
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardCard>
  );
}

export function AuditSection({
  auditLogs,
  formatDate,
}: {
  auditLogs: Overview["auditLogs"];
  formatDate: (value: string) => string;
}) {
  return (
    <DashboardCard
      title="Logs"
      description="Recent middleware decisions for tool calls routed through the gateway."
    >
      <div className="space-y-4">
        <div>
          <SectionEyebrow>Activity</SectionEyebrow>
          <p className="mt-2 text-sm leading-6 text-[#6b6b67]">
            Each row records the tool, the decision, and the time it was evaluated.
          </p>
        </div>
        {auditLogs.length === 0 ? (
          <EmptyState
            label="No logs recorded yet."
            detail="Recent activity will appear here once requests start flowing through the gateway."
          />
        ) : (
          <DataTable>
            <div className="hidden items-center gap-4 border-b border-[#efefee] px-4 py-3 text-xs font-medium uppercase tracking-wide text-[#8a8a86] lg:flex">
              <span className="min-w-0 flex-1">Tool</span>
              <span className="w-28 shrink-0">Decision</span>
              <span className="w-40 shrink-0">Time</span>
            </div>
            <div className="divide-y divide-[#efefee] bg-white">
              {auditLogs.map((entry) => (
                <div
                  key={entry.id}
                  className="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-start"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-[#191917]">{entry.tool}</p>
                    <p className="mt-1 break-all text-xs text-[#6b6b67]">
                      {JSON.stringify(
                        (entry.request?.arguments as Record<string, unknown>) || {},
                      )}
                    </p>
                  </div>
                  <div className="lg:w-28 lg:shrink-0">
                    <StatusBadge status={entry.decision} />
                  </div>
                  <div className="text-sm text-[#6b6b67] lg:w-40 lg:shrink-0">
                    {formatDate(entry.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          </DataTable>
        )}
      </div>
    </DashboardCard>
  );
}

export function MetricsGrid({
  apiKeys,
  connectors,
  policies,
  auditLogs,
}: {
  apiKeys?: number;
  connectors: number;
  policies: number;
  auditLogs: number;
}) {
  return (
    <div className={`grid gap-3 sm:grid-cols-2 ${apiKeys === undefined ? "xl:grid-cols-3" : "xl:grid-cols-4"}`}>
      {apiKeys !== undefined ? (
        <MetricCard label="API keys" value={String(apiKeys)} detail="Active gateway credentials" />
      ) : null}
      <MetricCard label="Connectors" value={String(connectors)} detail="Configured downstream servers" />
      <MetricCard label="Policies" value={String(policies)} detail="Runtime control rules" />
      <MetricCard label="Logs" value={String(auditLogs)} detail="Recorded middleware decisions" />
    </div>
  );
}
