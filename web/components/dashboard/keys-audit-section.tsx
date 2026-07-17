import {
  DashboardCard,
  DataTable,
  EmptyState,
  MetricCard,
  SectionEyebrow,
  StatusBadge,
} from "./primitives";
import type { Overview } from "./types";

export function AuditSection({
  auditLogs,
  agents,
  formatDate,
}: {
  auditLogs: Overview["auditLogs"];
  agents: Overview["agents"];
  formatDate: (value: string) => string;
}) {
  const agentNames = Object.fromEntries(agents.map((agent) => [agent.id, agent.name]));

  return (
    <DashboardCard
      title="Audit logs"
      description="Every request path ends in one immutable audit record tied to the owning agent."
    >
      <div className="space-y-4">
        <div>
          <SectionEyebrow>Activity</SectionEyebrow>
          <p className="mt-2 text-sm leading-6 text-[#6b6b67]">
            Search and CSV export are available from the dedicated logs view.
          </p>
        </div>
        {auditLogs.length === 0 ? (
          <EmptyState
            label="No logs recorded yet."
            detail="Recent agent requests will appear here once the gateway starts handling traffic."
          />
        ) : (
          <DataTable>
            <div className="hidden items-center gap-4 border-b border-[#efefee] px-4 py-3 text-xs font-medium uppercase tracking-wide text-[#8a8a86] lg:flex">
              <span className="min-w-0 flex-1">Agent / tool</span>
              <span className="w-32 shrink-0">Decision</span>
              <span className="w-28 shrink-0">By</span>
              <span className="w-40 shrink-0">Time</span>
            </div>
            <div className="divide-y divide-[#efefee] bg-white">
              {auditLogs.map((entry) => (
                <div key={entry.id} className="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-start">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[#191917]">
                      {agentNames[entry.agentId || ""] || "Unknown agent"}
                    </p>
                    <p className="mt-1 text-sm text-[#191917]">{entry.tool}</p>
                    <p className="mt-1 break-all text-xs text-[#6b6b67]">
                      {JSON.stringify(entry.payloadSummary || entry.request?.arguments || {})}
                    </p>
                  </div>
                  <div className="lg:w-32 lg:shrink-0">
                    <StatusBadge status={entry.decision} />
                  </div>
                  <div className="text-sm text-[#6b6b67] lg:w-28 lg:shrink-0">
                    {entry.decidedBy || "system"}
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
  agents,
  mcps,
  policies,
  auditLogs,
}: {
  agents: number;
  mcps: number;
  policies: number;
  auditLogs: number;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Agents" value={String(agents)} detail="Managed identities" />
      <MetricCard label="MCPs" value={String(mcps)} detail="Installed registry entries" />
      <MetricCard label="Policies" value={String(policies)} detail="Ordered control rules" />
      <MetricCard label="Logs" value={String(auditLogs)} detail="Immutable audit entries" />
    </div>
  );
}
