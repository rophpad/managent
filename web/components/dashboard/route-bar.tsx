"use client";

import { usePathname } from "next/navigation";

/** Echoes the current URL above the page, as in the original dashboard design. */
export function RouteBar() {
  const pathname = usePathname();
  return <div className="mb-4.5 font-mono text-[11.5px] text-muted-2">{pathname}</div>;
}
