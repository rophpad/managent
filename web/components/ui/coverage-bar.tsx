import type { Agent } from "@/lib/types";

/** MCP coverage. Agents with no governed calls render an em dash. */
export function CoverageBar({ coverage }: { coverage: Agent["coverage"] }) {
  const percent = coverage.mcp;

  return (
    <div className="flex items-center gap-2">
      <div className="h-[5px] w-[60px] shrink-0 overflow-hidden rounded-full bg-line-soft">
        <div
          className="h-full rounded-full bg-allow"
          style={{ width: `${percent ?? 0}%` }}
        />
      </div>
      <span className="text-[12.5px] text-muted">{percent === null ? "—" : `${percent}%`}</span>
    </div>
  );
}

/** Coverage as a bare metric value, for the agent detail header. */
export function formatCoverage(value: number | null): string {
  return value === null ? "—" : `${value}%`;
}
