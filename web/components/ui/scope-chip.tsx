"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Toggleable permission pill. Wraps a real checkbox for keyboard support. */
export function ScopeChip({
  name,
  checked,
  onChange,
  children,
  suffix,
}: {
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  suffix?: ReactNode;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-[7px] rounded-full border px-3 py-[7px]",
        "font-mono text-xs transition-colors",
        "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand",
        checked ? "border-brand-dim bg-brand/9 text-brand" : "border-line text-muted",
      )}
    >
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-3.5 accent-brand"
      />
      {children}
      {suffix}
    </label>
  );
}

export function ScopeChipGroup({ children }: { children: ReactNode }) {
  return <div className="mt-2 flex flex-wrap gap-2">{children}</div>;
}

export function RiskTag({ className }: { className?: string }) {
  return <span className={cn("ml-2 text-[11px] text-deny", className)}>high risk</span>;
}
