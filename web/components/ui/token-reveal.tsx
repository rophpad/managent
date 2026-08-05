import { AlertTriangle, CircleCheck } from "lucide-react";
import type { ReactNode } from "react";

/** One-time secret display. The token is never retrievable after this render. */
export function TokenReveal({ token }: { token: string }) {
  return (
    <div className="mt-2 rounded-lg border border-allow-dim bg-panel-2 p-4">
      <div className="mb-2 text-[12.5px] text-muted">
        Agent token — shown once, store it securely:
      </div>
      <div className="break-all font-mono text-[13px] text-allow">{token}</div>
      <p className="mt-2 flex items-center gap-1.5 text-xs text-deny">
        <AlertTriangle aria-hidden className="size-[15px] shrink-0" />
        This won&apos;t be shown again. Set it as MANAGENT_TOKEN in your environment.
      </p>
    </div>
  );
}

export function SuccessNote({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-2 rounded-lg border border-allow-dim bg-panel-2 p-4">
      <div className="mb-1 flex items-center gap-1.5 text-[12.5px] text-muted">
        <CircleCheck aria-hidden className="size-[15px] shrink-0 text-allow" />
        {title}
      </div>
      <div className="font-mono text-[12.5px] text-fg">{children}</div>
    </div>
  );
}
