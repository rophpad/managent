import type { Metadata } from "next";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { RouteBar } from "@/components/dashboard/route-bar";
import { Sidebar } from "@/components/dashboard/sidebar";
import { inter } from "@/app/fonts";

export const metadata: Metadata = {
  title: { default: "Managent", template: "%s — Managent" },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    // Only the body font is set here — the marketing page keeps Figtree, while
    // the display and mono variables come from the root layout.
    <div
      className={`grid h-dvh grid-cols-1 overflow-hidden bg-ink text-fg shell:grid-cols-[220px_1fr] ${inter.className}`}
    >
      <Sidebar />
      <div className="flex min-h-0 min-w-0 flex-col">
        <MobileNav />
        <main className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-15 pt-7 shell:px-9">
          <RouteBar />
          {children}
        </main>
      </div>
    </div>
  );
}
