import { Bot, BookOpen, Plug, ScanSearch, Settings, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/resources", label: "Resources", icon: Plug },
  { href: "/audit-logs", label: "Audit logs", icon: ScanSearch },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/docs", label: "Documentation", icon: BookOpen },
];

/**
 * A nav item owns its whole subtree, so `/agents/new` and `/agents/invoice-agent`
 * both keep "Agents" highlighted without a hand-maintained list of sub-routes.
 */
export function isNavItemActive(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * `page` only when the link *is* the current URL. On a sub-route the nav item
 * is the current item in a set, not the page itself — otherwise several
 * elements on screen would each claim to be the page.
 */
export function navAriaCurrent(href: string, pathname: string): "page" | "true" | undefined {
  if (pathname === href) return "page";
  return pathname.startsWith(`${href}/`) ? "true" : undefined;
}

/** The signed-in organisation. Replace with the session once auth lands. */
export const CURRENT_ORG = {
  name: "finance-eng",
  initials: "FE",
};
