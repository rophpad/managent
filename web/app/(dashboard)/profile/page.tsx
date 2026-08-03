import type { Metadata } from "next";
import { LogOut, UserRound } from "lucide-react";
import { CURRENT_ORG } from "@/components/dashboard/nav";
import { PageHeader } from "@/components/dashboard/page-header";
import { ButtonLink } from "@/components/ui/button";
import { PanelBlock, SectionTitle } from "@/components/ui/card";
import { Hint } from "@/components/ui/field";

export const metadata: Metadata = { title: "Profile" };

export default function ProfilePage() {
  return (
    <div className="max-w-160">
      <PageHeader
        title="Profile"
        description="View your account and manage your current session."
      />

      <PanelBlock>
        <div className="flex items-center gap-4">
          <span
            aria-hidden
            className="flex size-12 shrink-0 items-center justify-center rounded-full border border-line bg-surface font-display text-sm font-semibold text-brand"
          >
            {CURRENT_ORG.initials}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <UserRound aria-hidden className="size-4 text-muted" />
              <h2 className="truncate text-[14px] font-medium">{CURRENT_ORG.name}</h2>
            </div>
            <p className="mt-1 text-[12.5px] text-muted">Workspace administrator</p>
          </div>
        </div>
      </PanelBlock>

      <PanelBlock>
        <SectionTitle className="mb-1.5">Session</SectionTitle>
        <Hint className="mt-0">
          Log out of Managent on this device. You will need to authenticate again to access the
          dashboard.
        </Hint>
        <ButtonLink href="/login" variant="danger" size="sm" className="mt-4">
          <LogOut aria-hidden className="size-3.75" />
          Log out
        </ButtonLink>
      </PanelBlock>
    </div>
  );
}
