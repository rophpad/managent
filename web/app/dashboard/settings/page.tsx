import { KeysSection } from "@/components/dashboard/keys-audit-section";
import { DashboardCard } from "@/components/dashboard/primitives";

import { createApiKey } from "../actions";
import { formatDate, getOverview, getSettingsSummary } from "../lib";

export default async function DashboardSettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ issuedKey?: string }>;
}) {
  const overview = await getOverview();
  const params = (await searchParams) || {};
  const issuedKey = params.issuedKey ? decodeURIComponent(params.issuedKey) : "";
  const summary = getSettingsSummary(overview);

  return (
    <>
      {issuedKey ? (
        <DashboardCard
          title="New API key"
          description="This raw token is shown once. Save it where the client reads its bearer credential."
        >
          <div className="rounded-lg border border-[#e7e7e5] bg-[#fbfbfa] p-4">
            <p className="text-sm font-medium text-[#191917]">Bearer token</p>
            <p className="mt-2 break-all font-mono text-sm text-[#191917]">
              {issuedKey}
            </p>
          </div>
        </DashboardCard>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr),280px]">
        <KeysSection
          apiKeys={overview.apiKeys}
          createApiKey={createApiKey}
          formatDate={formatDate}
        />

        <DashboardCard
          title="Settings"
          description="Workspace access and basic gateway configuration counts."
        >
          <div className="grid gap-3">
            <div className="rounded-lg border border-[#e7e7e5] bg-[#fbfbfa] p-4">
              <p className="text-sm font-medium text-[#191917]">Workspace ID</p>
              <p className="mt-2 text-lg font-semibold text-[#191917]">
                {summary.workspaceId}
              </p>
            </div>
            <div className="rounded-lg border border-[#e7e7e5] bg-[#fbfbfa] p-4">
              <p className="text-sm font-medium text-[#191917]">Issued keys</p>
              <p className="mt-2 text-lg font-semibold text-[#191917]">
                {summary.keyCount}
              </p>
            </div>
            <div className="rounded-lg border border-[#e7e7e5] bg-[#fbfbfa] p-4">
              <p className="text-sm font-medium text-[#191917]">Connectors</p>
              <p className="mt-2 text-lg font-semibold text-[#191917]">
                {summary.connectorCount}
              </p>
            </div>
          </div>
        </DashboardCard>
      </div>
    </>
  );
}
