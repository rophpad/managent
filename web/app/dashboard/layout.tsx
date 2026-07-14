import { DashboardSidebar } from "@/components/dashboard/sidebar";

import { getDashboardStats, getOverview } from "./lib";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const overview = await getOverview();

  return (
    <div className="min-h-screen bg-[#fcfcfb] text-[#191917]">
      <div className="mx-auto flex h-screen max-w-[1600px] flex-col lg:flex-row">
        <DashboardSidebar
          workspaceName={overview.workspace.name}
          stats={getDashboardStats(overview)}
        />
        <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-8 h-full overflow-y-auto">
            {children}
        </main>
      </div>
    </div>
  );
}
