import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-xl border border-line bg-panel", className)}>{children}</div>;
}

/** Card with built-in padding, for prose and stat lists rather than tables. */
export function PanelBlock({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-4 rounded-xl border border-line bg-panel px-5 py-[18px]", className)}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-3 flex items-center justify-between text-[13px] font-medium", className)}>
      {children}
    </div>
  );
}

type MetricTone = "default" | "ok" | "warn";

const METRIC_TONE: Record<MetricTone, string> = {
  default: "",
  ok: "text-allow",
  warn: "text-deny",
};

export function Metric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  tone?: MetricTone;
}) {
  return (
    <div className="rounded-[10px] border border-line bg-panel px-4 py-3.5">
      <div className="mb-1.5 text-xs text-muted">{label}</div>
      <div className={cn("font-display text-[22px] font-semibold", METRIC_TONE[tone])}>{value}</div>
    </div>
  );
}

/** Two-up on narrow screens, four-up once the shell is wide enough. */
export function MetricRow({ children }: { children: ReactNode }) {
  return <div className="mb-6 grid grid-cols-2 gap-3 shell:grid-cols-4">{children}</div>;
}
