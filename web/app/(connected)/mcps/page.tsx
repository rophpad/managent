import { MCPsSection } from "@/components/dashboard/mcps-section";
import { SectionEyebrow } from "@/components/dashboard/primitives";

import { connectMCP, createMCP, disconnectMCP, updateMCP } from "../actions";
import { getMarketplace, getOverview } from "../lib";

export default async function DashboardMCPsPage() {
  const [overview, marketplace] = await Promise.all([
    getOverview(),
    getMarketplace(),
  ]);

  return (
    <>
      <section className="space-y-3">
        <SectionEyebrow>MCPs</SectionEyebrow>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-[#191917]">
              Manage MCPs
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6b6b67]">
              Install, manage, and monitor MCPs.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="border border-black/20 rounded-sm px-4 py-2 text-sm">
              Marketplace
            </button>
            <button type="button" className="bg-black rounded-sm px-4 py-2 text-white text-sm">
              Add MCP
            </button>
          </div>
        </div>
      </section>
      <MCPsSection
        mcps={overview.mcps}
        agents={overview.agents}
        marketplace={marketplace}
        createMCP={createMCP}
        updateMCP={updateMCP}
        connectMCP={connectMCP}
        disconnectMCP={disconnectMCP}
      />
    </>
  );
}
