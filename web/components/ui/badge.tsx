import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { AgentStatus, Decision } from "@/lib/types";

/** Semantic colour, not a status — `deny` decisions and `revoked` agents share one. */
export type BadgeTone = "allow" | "warn" | "danger";

const TONE: Record<BadgeTone, string> = {
  allow: "border-allow-dim bg-allow/8 text-allow",
  warn: "border-deny-dim bg-deny/8 text-deny",
  danger: "border-danger-dim bg-danger/8 text-danger",
};

export function Badge({
  tone,
  children,
  className,
}: {
  tone: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[5px] rounded-full border px-[9px] py-[3px] text-[11px] font-medium",
        TONE[tone],
        className,
      )}
    >
      <span aria-hidden className="size-[5px] rounded-full bg-current" />
      {children}
    </span>
  );
}

export const AGENT_STATUS_TONE: Record<AgentStatus, BadgeTone> = {
  active: "allow",
  idle: "warn",
  revoked: "danger",
};

export const DECISION_TONE: Record<Decision, BadgeTone> = {
  allow: "allow",
  deny: "danger",
};

export const DECISION_LABEL: Record<Decision, string> = {
  allow: "Allow",
  deny: "Deny",
};
