import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Key/value line used in modals and settings panels. Consecutive rows are
 * separated by a rule; the last one in a group drops it.
 */
export function StatRow({
  label,
  children,
  className,
}: {
  label: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 border-b border-line-soft py-2 text-[12.5px] last:border-b-0",
        className,
      )}
    >
      <span className="text-muted">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}

/** Monospaced permission or activity line, optionally with a trailing status. */
export function ScopeRow({
  name,
  tag,
  trailing,
  className,
}: {
  name: ReactNode;
  tag?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 border-b border-line-soft py-[9px] last:border-b-0",
        className,
      )}
    >
      <span className="font-mono text-[12.5px]">
        {name}
        {tag ? <span className="ml-2 text-[10.5px] text-muted-2">{tag}</span> : null}
      </span>
      {trailing}
    </div>
  );
}

export function MutedText({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("text-[12.5px] text-muted", className)}>{children}</span>;
}
