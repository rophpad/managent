"use client";

import { ENFORCEMENT_MODES } from "@/lib/data/agents";
import type { EnforcementMode } from "@/lib/types";
import { cn } from "@/lib/cn";

/** Segmented control exposed as a radio group so arrow keys and SR labels work. */
export function EnforcementSelector({
  value,
  onChange,
  label,
  className,
}: {
  value: EnforcementMode;
  onChange: (mode: EnforcementMode) => void;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("flex rounded-full border border-line bg-panel-2 p-[3px]", className)}
    >
      {ENFORCEMENT_MODES.map((mode) => {
        const selected = mode.value === value;
        return (
          <button
            key={mode.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(mode.value)}
            className={cn(
              "flex-1 rounded-full py-[7px] text-center text-xs transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
              selected ? "bg-surface text-fg" : "text-muted hover:text-fg",
            )}
          >
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}
