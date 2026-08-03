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
 * Underlined tab bar backed by real routes, so each tab is linkable, shows in
 * the URL, and works with the back button.
 */
export function TabNav({
  basePath,
  tabs,
  label,
}: {
  basePath: string;
  tabs: readonly TabDef[];
  label: string;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label={label} className="mb-6 flex gap-1 overflow-x-auto border-b border-line-soft">
      {tabs.map((tab) => {
        const href = tab.segment ? `${basePath}/${tab.segment}` : basePath;
        const active = pathname === href;
        return (
          <Link
            key={tab.segment || "index"}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-3 pb-2.5 pt-2 text-[13px] transition-colors",
              active
                ? "border-brand text-fg"
                : "border-transparent text-muted hover:text-fg",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
