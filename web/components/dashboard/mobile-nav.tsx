"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "@/components/brand";
import {
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
export function MobileNav({ user }: { user: { name: string; email: string } }) {
  const pathname = usePathname();
  const displayName = user.name || user.email;
  const initials = displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

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

        <Link href="/agents" aria-label="Managent mcpool home" className="flex items-center gap-2">
          <Brand markSize={28} />
        </Link>
        <span className="flex items-center gap-2 text-[12.5px] text-muted">
          <span
            aria-hidden
            className="flex size-6.5 items-center justify-center rounded-full bg-surface text-[11px] font-medium"
          >
            {initials}
          </span>
          {displayName}
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
