import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { PanelBlock, SectionTitle } from "@/components/ui/card";
import { MutedText, StatRow } from "@/components/ui/rows";
import { OrgDefaults } from "./_components/org-defaults";

export const metadata: Metadata = { title: "Settings" };

const SLACK_ALERTS = [
  { label: "Notify on denied action", enabled: true },
  { label: "Notify on unscoped resource detected", enabled: true },
  { label: "Notify on scope-check failure", enabled: false },
];

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Org-wide defaults and notification preferences." />

      <OrgDefaults initialMode="monitor" initialFailOpen />

      <PanelBlock>
        <SectionTitle className="mb-1.5">Slack alerts</SectionTitle>
        {SLACK_ALERTS.map((alert) => (
          <StatRow key={alert.label} label={alert.label}>
            {alert.enabled ? (
              <span className="text-allow">Enabled</span>
            ) : (
              <MutedText>Disabled</MutedText>
            )}
          </StatRow>
        ))}
      </PanelBlock>

      <PanelBlock>
        <SectionTitle className="mb-1.5">Audit log retention</SectionTitle>
        <StatRow label="Current plan">Team — 90 days</StatRow>
        <StatRow label="Field-level logging">
          <MutedText>Opt-in per scope</MutedText>
        </StatRow>
      </PanelBlock>
    </>
  );
}
