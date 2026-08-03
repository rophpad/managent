"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface PillOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

export function FilterPills<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: ReadonlyArray<PillOption<T>>;
  value: T;
  onChange: (value: T) => void;
  /** Names the group for screen readers, e.g. "Filter by status". */
  label: string;
  className?: string;
}) {
  return (
    <div role="group" aria-label={label} className={cn("flex gap-1.5", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
            option.value === value
              ? "border-brand bg-brand/9 text-brand"
              : "border-line text-muted hover:text-fg",
          )}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}
