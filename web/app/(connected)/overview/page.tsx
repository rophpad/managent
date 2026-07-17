
import {
  DashboardCard,
  SectionEyebrow,
} from "@/components/dashboard/primitives";

import { formatDate, getMCPHealth, getLatestAudit, getOverview } from "../lib";

// const quickLinks = [
//   {
//     href: "/agents",
//     label: "Agents",
//     detail: "Issue identities and rotate keys.",
//   },
//   {
//     href: "/mcps",
//     label: "MCPs",
//     detail: "Install MCPs and manage their tools.",
//   },
//   {
//     href: "/policies",
//     label: "Policies",
//     detail: "Control requests with clear runtime rules.",
//   },
//   {
//     href: "/logs",
//     label: "Logs",
//     detail: "Review recent middleware decisions.",
//   },
//   {
//     href: "/settings",
//     label: "Settings",
//     detail: "Manage workspace access and API keys.",
//   },
// ];

export default async function DashboardPage() {
  const overview = await getOverview();
  const latestAudit = getLatestAudit(overview);

  return (
    <>
      <section className="space-y-3">
        <SectionEyebrow>Overview</SectionEyebrow>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-[#191917]">
              Control plane
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6b6b67]">
              Manage agent identities, installed MCPs, approval policy, and
              audit history.
            </p>
          </div>
          {/*<div className="flex items-center gap-3 text-sm text-[#6b6b67]">
            <span>{getMCPHealth(overview.mcps)}</span>
            <StatusBadge
              status={overview.policies.length > 0 ? "guarded" : "open"}
            />
          </div>*/}
        </div>
      </section>

      {/*<MetricsGrid
        agents={overview.agents.length}
        mcps={overview.mcps.length}
        policies={overview.policies.length}
        auditLogs={overview.auditLogs.length}
      />*/}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr),320px]">
        <DashboardCard
          title="Workspace"
          description="Current control-plane state for the active workspace."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-[#e7e7e5] bg-[#fbfbfa] p-4">
              <p className="text-sm font-medium text-[#191917]">Agents</p>
              <p className="mt-2 text-2xl font-semibold text-[#191917]">
                {overview.agents.length}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#6b6b67]">
                See your agents and their current status.
              </p>
            </div>
            <div className="rounded-lg border border-[#e7e7e5] bg-[#fbfbfa] p-4">
              <p className="text-sm font-medium text-[#191917]">MCPs</p>
              <p className="mt-2 text-2xl font-semibold text-[#191917]">
                {getMCPHealth(overview.mcps)}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#6b6b67]">
                See connected MCPs and reconnect them from the MCPs tab.
              </p>
            </div>

            <div className="rounded-lg border border-[#e7e7e5] bg-[#fbfbfa] p-4 md:col-span-2">
              <p className="text-sm font-medium text-[#191917]">Latest log</p>
              <p className="mt-2 text-base font-medium text-[#191917]">
                {latestAudit ? latestAudit.tool : "No activity yet"}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#6b6b67]">
                {latestAudit
                  ? `${latestAudit.decision} on ${formatDate(latestAudit.createdAt)}`
                  : "The next MCP tool call through the gateway will appear here."}
              </p>
            </div>
          </div>
        </DashboardCard>

        {/*<DashboardCard
          title="Navigate"
          description="Open the area you want to work in."
        >
          <div className="grid gap-2">
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-3 text-sm transition hover:bg-[#f7f7f5]"
              >
                <p className="font-medium text-[#191917]">{item.label}</p>
                <p className="mt-1 text-sm leading-6 text-[#6b6b67]">
                  {item.detail}
                </p>
              </Link>
            ))}
            <Link href="/logs" className={secondaryButtonClass}>
              Open logs
            </Link>
          </div>
        </DashboardCard>*/}
      </div>
    </>
  );
}
