import type { Metadata } from "next";
import { LogOut, UserRound } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { PanelBlock, SectionTitle } from "@/components/ui/card";
import { Hint } from "@/components/ui/field";
import { getCurrentUser } from "@/lib/backend";
import { logoutAction } from "@/app/(auth)/actions";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  const displayName = user.name || user.email;
  const initials = displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
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
            {initials}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <UserRound aria-hidden className="size-4 text-muted" />
              <h2 className="truncate text-[14px] font-medium">{displayName}</h2>
            </div>
            <p className="mt-1 text-[12.5px] text-muted">{user.email}</p>
          </div>
        </div>
      </PanelBlock>

      <PanelBlock>
        <SectionTitle className="mb-1.5">Session</SectionTitle>
        <Hint className="mt-0">
          Log out of Managent on this device. You will need to authenticate again to access the
          dashboard.
        </Hint>
        <form action={logoutAction}>
          <Button type="submit" variant="danger" size="sm" className="mt-4">
            <LogOut aria-hidden className="size-3.75" />
            Log out
          </Button>
        </form>
      </PanelBlock>
    </div>
  );
}
