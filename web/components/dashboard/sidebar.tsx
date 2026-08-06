"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  NAV_ITEMS,
  isNavItemActive,
  navAriaCurrent,
} from "@/components/dashboard/nav";
import { cn } from "@/lib/cn";

export function Sidebar({ user }: { user: { name: string; email: string } }) {
  const pathname = usePathname();
  const displayName = user.name || user.email;
  const initials = displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <nav
      aria-label="Primary"
      className="hidden flex-col gap-0.5 border-r border-line-soft bg-panel-2 px-3.5 py-5 shell:flex "
    >
      <Link href="/agents" className="flex items-center gap-2 px-2.5 pb-5.5 pt-1">
        <span
          aria-hidden
          className="size-4.5 shrink-0 rounded-[5px] bg-linear-to-br from-brand to-allow"
        />
        <span className="font-display text-base font-semibold">Managent</span>
      </Link>

      {/* <Link
        href="/agents"
        className="flex items-center gap-2 px-2.5 pb-5.5 pt-1"
      >
        <Image
          src="/logo1.svg"
          alt=""
          width={100}
          height={100}
          className="h-auto w-21.5 brightness-0 invert sm:w-25"
          priority
        />
      </Link> */}

      {NAV_ITEMS.map((item) => {
        const active = isNavItemActive(item.href, pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={navAriaCurrent(item.href, pathname)}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-2.5 py-2.25 text-[13.5px] transition-colors",
              active
                ? "bg-brand/9 text-brand"
                : "text-muted hover:bg-panel hover:text-fg",
            )}
          >
            <item.icon aria-hidden className="size-4.25 shrink-0" />
            {item.label}
          </Link>
        );
      })}

      <div className="mt-auto border-t border-line-soft pt-2.5">
        <Link
          href="/profile"
          aria-current={pathname === "/profile" ? "page" : undefined}
          className={cn(
            "flex items-center gap-2.25 rounded-lg px-2.5 py-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
            pathname === "/profile"
              ? "bg-brand/9 text-brand"
              : "text-muted hover:bg-panel hover:text-fg",
          )}
        >
          <span
            aria-hidden
            className="flex size-6.5 shrink-0 items-center justify-center rounded-full bg-surface text-[11px] font-medium"
          >
            {initials}
          </span>
          <span className="min-w-0 truncate text-[12.5px]">
            {displayName}
          </span>
        </Link>
      </div>
    </nav>
  );
}
