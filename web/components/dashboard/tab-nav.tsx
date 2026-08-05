"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export interface TabDef {
  /** Path segment appended to `basePath`; empty string is the index tab. */
  segment: string;
  label: string;
}

/**
 * `underline` is the primary bar at the top of a detail page. `pill` is for a
 * second, nested bar — an agent's tabs above a specific resource's tabs — where
 * repeating the underline style would make the two levels hard to tell apart.
 */
type TabVariant = "underline" | "pill";

const CONTAINER: Record<TabVariant, string> = {
  underline: "mb-6 flex gap-1 overflow-x-auto border-b border-line-soft",
  pill: "mb-5 flex gap-1.5 overflow-x-auto",
};

const TAB: Record<TabVariant, string> = {
  underline: "-mb-px shrink-0 border-b-2 px-3 pb-2.5 pt-2 text-[13px] transition-colors",
  pill: "shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors",
};

const ACTIVE: Record<TabVariant, string> = {
  underline: "border-brand text-fg",
  pill: "border-brand bg-brand/9 text-brand",
};

const INACTIVE: Record<TabVariant, string> = {
  underline: "border-transparent text-muted hover:text-fg",
  pill: "border-line text-muted hover:text-fg",
};

/**
 * Underlined tab bar backed by real routes, so each tab is linkable, shows in
 * the URL, and works with the back button.
 */
export function TabNav({
  basePath,
  tabs,
  label,
  variant = "underline",
}: {
  basePath: string;
  tabs: readonly TabDef[];
  label: string;
  variant?: TabVariant;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label={label} className={CONTAINER[variant]}>
      {tabs.map((tab) => {
        const href = tab.segment ? `${basePath}/${tab.segment}` : basePath;
        // A tab owns its whole subtree, so it stays lit on nested routes such as
        // `/agents/x/resources/stripe`. The index tab has no subtree of its own
        // — everything below `basePath` belongs to one of its siblings.
        const active = tab.segment
          ? pathname === href || pathname.startsWith(`${href}/`)
          : pathname === basePath;
        return (
          <Link
            key={tab.segment || "index"}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(TAB[variant], active ? ACTIVE[variant] : INACTIVE[variant])}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
