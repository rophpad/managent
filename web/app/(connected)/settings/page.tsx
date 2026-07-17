import {
  DashboardCard,
  DashboardField,
  inputClass,
  primaryButtonClass,
} from "@/components/dashboard/primitives";

import { saveApprovalIntegration } from "../actions";
import { getOverview, getSettingsSummary } from "../lib";

export default async function DashboardSettingsPage() {
  const overview = await getOverview();
  const summary = getSettingsSummary(overview);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr),300px]">
        <DashboardCard
          title="Approval channels"
          description="Connect Slack or Discord once at the org level, store the secrets in the vault, and choose the default channel."
        >
          <div className="grid gap-6 md:grid-cols-2">
            {["slack", "discord"].map((provider) => {
              const existing = overview.approvalIntegrations.find((item) => item.provider === provider);
              return (
                <form key={provider} action={saveApprovalIntegration} className="grid gap-3 rounded-lg border border-[#e7e7e5] bg-[#fbfbfa] p-4">
                  <input type="hidden" name="provider" value={provider} />
                  <p className="text-sm font-medium text-[#191917]">
                    {provider === "slack" ? "Slack" : "Discord"}
                  </p>
                  <DashboardField label="Team name" hint="Optional">
                    <input name="teamName" className={inputClass} placeholder="Acme Ops" />
                  </DashboardField>
                  <DashboardField label="Default channel">
                    <input
                      name="defaultChannel"
                      className={inputClass}
                      defaultValue={existing?.defaultChannel || ""}
                      placeholder="#agent-approvals"
                    />
                  </DashboardField>
                  <DashboardField label="Webhook URL">
                    <input name="webhookUrl" className={inputClass} placeholder="https://hooks.slack.com/..." />
                  </DashboardField>
                  <DashboardField label="OAuth access token">
                    <input name="accessToken" type="password" className={inputClass} placeholder="xoxb-..." />
                  </DashboardField>
                  <DashboardField label="Signing secret">
                    <input name="signingSecret" type="password" className={inputClass} placeholder="stored once" />
                  </DashboardField>
                  <button className={primaryButtonClass}>
                    {existing ? "Update connection" : "Connect"}
                  </button>
                </form>
              );
            })}
          </div>
        </DashboardCard>

        <DashboardCard title="Workspace" description="Current org-level summary.">
          <div className="grid gap-3">
            <Summary label="Workspace ID" value={String(summary.workspaceId)} />
            <Summary label="Agents" value={String(summary.agentCount)} />
            <Summary label="MCPs" value={String(summary.mcpCount)} />
            <Summary label="Approval integrations" value={String(summary.approvalIntegrationCount)} />
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#e7e7e5] bg-[#fbfbfa] p-4">
      <p className="text-sm font-medium text-[#191917]">{label}</p>
      <p className="mt-2 text-lg font-semibold text-[#191917]">{value}</p>
    </div>
  );
}
