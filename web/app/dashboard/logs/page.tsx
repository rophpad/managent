import {
  AuditSection,
} from "@/components/dashboard/keys-audit-section";

import { formatDate, getOverview } from "../lib";

export default async function DashboardLogsPage() {
  const overview = await getOverview();
  // const latestAudit = getLatestAudit(overview);

  return (
    <>
      {/*<DashboardCard
        title="Logs"
        description="Review the latest middleware decisions and gateway activity."
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),280px]">
          <div className="rounded-lg border border-[#e7e7e5] bg-[#fbfbfa] p-4">
            <p className="text-sm font-medium text-[#191917]">What you see here</p>
            <p className="mt-2 text-sm leading-6 text-[#6b6b67]">
              This view is dedicated to recent execution history so you can scan decisions without leaving the dashboard.
            </p>
          </div>
          <div className="rounded-lg border border-[#e7e7e5] bg-[#fbfbfa] p-4">
            <p className="text-sm font-medium text-[#191917]">Latest decision</p>
            <p className="mt-2 text-base font-medium text-[#191917]">
              {latestAudit ? latestAudit.tool : "No activity yet"}
            </p>
            <p className="mt-1 text-sm leading-6 text-[#6b6b67]">
              {latestAudit
                ? `${latestAudit.decision} on ${formatDate(latestAudit.createdAt)}`
                : "Recent gateway decisions will appear here once traffic starts flowing."}
            </p>
          </div>
        </div>
      </DashboardCard>*/}

      {/*<MetricsGrid
        connectors={overview.connectors.length}
        policies={overview.policies.length}
        auditLogs={overview.auditLogs.length}
      />*/}

      <AuditSection auditLogs={overview.auditLogs} formatDate={formatDate} />
    </>
  );
}
