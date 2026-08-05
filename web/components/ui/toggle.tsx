"use client";

import { cn } from "@/lib/cn";

/** Switch built on a real checkbox, so it is keyboard- and label-addressable. */
export function Toggle({
  checked,
  onChange,
  label,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Accessible name. Visually hidden — render your own visible label beside it. */
  label: string;
  className?: string;
}) {
  return (
    <label className={cn("inline-flex shrink-0 cursor-pointer", className)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span className="sr-only">{label}</span>
      <span
        className={cn(
          "relative h-5 w-9 rounded-full border border-line bg-panel-2 transition-colors",
          "peer-checked:border-allow-dim peer-checked:bg-allow/8",
          "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand",
        )}
      >
        <span
          className={cn(
            "absolute left-px top-px size-4 rounded-full transition-transform",
            checked ? "translate-x-4 bg-allow" : "bg-muted",
          )}
        />
      </span>
    </label>
  );
}
