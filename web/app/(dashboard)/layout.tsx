import type { Metadata } from "next";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { RouteBar } from "@/components/dashboard/route-bar";
import { Sidebar } from "@/components/dashboard/sidebar";
import { inter } from "@/app/fonts";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser, SESSION_COOKIE } from "@/lib/backend";

export const metadata: Metadata = {
  title: { default: "Managent", template: "%s — Managent" },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!process.env.MANAGENT_ADMIN_TOKEN && !(await cookies()).has(SESSION_COOKIE)) {
    redirect("/login");
  }
  const user = await getCurrentUser().catch(() => redirect("/login"));
  return (
    // Only the body font is set here — the marketing page keeps Figtree, while
    // the display and mono variables come from the root layout.
    <div
      className={`grid h-dvh grid-cols-1 overflow-hidden bg-ink text-fg shell:grid-cols-[220px_1fr] ${inter.className}`}
    >
      <Sidebar user={user} />
      <div className="flex min-h-0 min-w-0 flex-col">
        <MobileNav user={user} />
        <main className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-15 pt-7 shell:px-9">
          <RouteBar />
          {children}
        </main>
      </div>
    </div>
  );
}
