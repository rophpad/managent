"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/auth-actions";
import { secondaryButtonClass } from "./primitives";

const navItems = [
  { label: "Overview", href: "/overview" },
  { label: "Agents", href: "/agents" },
  { label: "MCPs", href: "/mcps" },
  { label: "Policies", href: "/policies" },
  { label: "Logs", href: "/logs" },
  { label: "Settings", href: "/settings" },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/overview") {
    return pathname === href;
  }

  return pathname.startsWith(href);
}

export function DashboardSidebar({
  workspaceName,
}: {
  workspaceName: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="w-full shrink-0 border-b border-[#ececea] bg-[#f7f7f5] lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r">
      <div className="flex h-full flex-col px-4 py-5 lg:sticky lg:top-0 lg:px-5 lg:py-8">
        <div className=" flex items-center gap-3">
          <div className=" px-3 min-w-0 space-y-2">
            <Image
              src="/logo.png"
              alt="Managent logo"
              width={100}
              height={100}
              style={{ height: "auto" }}
            />
            <p className="truncate text-xs text-[#8a8a86]">{workspaceName}</p>
          </div>
        </div>

        <nav className="mt-6 grid gap-1">
          {navItems.map((item) => {
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-2 text-sm transition ${
                  active
                    ? "bg-white font-medium text-[#191917] shadow-[inset_0_0_0_1px_#e7e7e5]"
                    : "text-[#5f5f5b] hover:bg-white hover:text-[#191917]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 lg:mt-auto">
          <form action={logoutAction}>
            <button className={`${secondaryButtonClass} w-full`}>Logout</button>
          </form>
        </div>

        {/* <div className="mt-8 rounded-lg border border-[#e7e7e5] bg-white p-4 lg:mt-auto">
          <p className="text-xs font-medium uppercase tracking-wide text-[#8a8a86]">
            Workspace
          </p>
          <dl className="mt-3 grid gap-3 text-sm text-[#5f5f5b]">
            <div className="flex items-center justify-between gap-3">
              <dt>MCPs</dt>
              <dd className="font-medium text-[#191917]">{stats.mcps}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt>Policies</dt>
              <dd className="font-medium text-[#191917]">{stats.policies}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt>Logs</dt>
              <dd className="font-medium text-[#191917]">{stats.auditLogs}</dd>
            </div>
          </dl>
        </div> */}
      </div>
    </aside>
  );
}
