"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  CURRENT_ORG,
  NAV_ITEMS,
  isNavItemActive,
  navAriaCurrent,
} from "@/components/dashboard/nav";
import { cn } from "@/lib/cn";

/**
 * Below the `shell` breakpoint the sidebar is hidden, which in the original
 * design left no navigation at all. This is the same nav laid out horizontally
 * so the dashboard stays usable on a phone.
 */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-50 border-b border-line-soft bg-panel-2 shell:hidden">
      <div className="flex items-center justify-between px-4 pb-2 pt-3">
        {/*<Link href="/agents" className="flex items-center gap-2">
          <span
            aria-hidden
            className="size-[18px] shrink-0 rounded-[5px] bg-gradient-to-br from-brand to-allow"
          />
          <span className="font-display text-base font-semibold">Managent</span>
        </Link>*/}

        <Link href="/agents" className="flex items-center gap-2">
          {/* The wordmark is solid black artwork; brightness-0 + invert renders
              it white on the dark surface without needing a second asset. */}
          <Image
            src="/logo1.svg"
            alt=""
            width={100}
            height={100}
            className="h-auto w-21.5 brightness-0 invert sm:w-25"
            priority
          />
        </Link>
        <span className="flex items-center gap-2 text-[12.5px] text-muted">
          <span
            aria-hidden
            className="flex size-6.5 items-center justify-center rounded-full bg-surface text-[11px] font-medium"
          >
            {CURRENT_ORG.initials}
          </span>
          {CURRENT_ORG.name}
        </span>
      </div>

      <nav
        aria-label="Primary"
        className="flex gap-1 overflow-x-auto px-3 pb-2"
      >
        {NAV_ITEMS.map((item) => {
          const active = isNavItemActive(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={navAriaCurrent(item.href, pathname)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] transition-colors",
                active
                  ? "bg-brand/9 text-brand"
                  : "text-muted hover:bg-panel hover:text-fg",
              )}
            >
              <item.icon aria-hidden className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
