import { AuditSection } from "@/components/dashboard/keys-audit-section";
import { DashboardCard, DashboardField, inputClass, secondaryButtonClass } from "@/components/dashboard/primitives";

import { formatDate, getOverview, request } from "../lib";

export default async function DashboardLogsPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string; decision?: string; agentId?: string }>;
}) {
  const overview = await getOverview();
  const params = (await searchParams) || {};
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.decision) query.set("decision", params.decision);
  if (params.agentId) query.set("agentId", params.agentId);
  const logsResponse = await request<{ items: typeof overview.auditLogs }>(
    `/api/v1/audit-logs?${query.toString()}`,
  );

  return (
    <div className="space-y-6">
      <DashboardCard title="Filters" description="Search by tool or decision, then export the current slice to CSV.">
        <form className="grid gap-3 md:grid-cols-[minmax(0,1fr),180px,220px,auto,auto]">
          <DashboardField label="Search">
            <input name="search" defaultValue={params.search || ""} className={inputClass} placeholder="refund" />
          </DashboardField>
          <DashboardField label="Decision">
            <select name="decision" defaultValue={params.decision || ""} className={inputClass}>
              <option value="">All</option>
              <option value="auto_allowed">auto allowed</option>
              <option value="approved">approved</option>
              <option value="denied">denied</option>
              <option value="blocked_by_policy">blocked by policy</option>
            </select>
          </DashboardField>
          <DashboardField label="Agent">
            <select name="agentId" defaultValue={params.agentId || ""} className={inputClass}>
              <option value="">All agents</option>
              {overview.agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </DashboardField>
          <button className={secondaryButtonClass}>Apply</button>
          <a
            className={secondaryButtonClass}
            href={`/api/v1/audit-logs?${query.toString()}${query.toString() ? "&" : ""}format=csv`}
          >
            Export CSV
          </a>
        </form>
      </DashboardCard>

      <AuditSection auditLogs={logsResponse.items || []} agents={overview.agents} formatDate={formatDate} />
    </div>
  );
}
