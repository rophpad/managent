import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Long-form documentation primitives. Measure is capped so lines stay readable. */
const MEASURE = "max-w-[640px]";

export function DocHeading({ children }: { children: ReactNode }) {
  return <h2 className="mb-2.5 font-display text-lg font-semibold">{children}</h2>;
}

export function DocParagraph({ children }: { children: ReactNode }) {
  return <p className={cn("mb-3.5 text-[13.5px] leading-[1.65] text-muted", MEASURE)}>{children}</p>;
}

export function DocList({ children }: { children: ReactNode }) {
  return (
    <ul
      className={cn(
        "mb-3.5 list-disc pl-[18px] text-[13.5px] leading-[1.7] text-muted",
        "[&_strong]:font-medium [&_strong]:text-fg [&>li]:mb-1",
        MEASURE,
      )}
    >
      {children}
    </ul>
  );
}

export function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="rounded border border-line bg-panel-2 px-1.5 py-px font-mono text-xs text-allow">
      {children}
    </code>
  );
}

export function CodeBlock({ children }: { children: ReactNode }) {
  return (
    <pre
      className={cn(
        "mb-3.5 overflow-x-auto rounded-lg border border-line bg-panel-2 px-4 py-3.5",
        "font-mono text-[12.5px] leading-[1.7] text-fg",
        MEASURE,
      )}
    >
      {children}
    </pre>
  );
}

/** A comment line inside a `CodeBlock`. */
export function Comment({ children }: { children: ReactNode }) {
  return <span className="text-muted-2">{children}</span>;
}

export function DocTable({ children }: { children: ReactNode }) {
  return (
    <table className="mb-3.5 w-full max-w-[560px] border-collapse text-[12.5px]">{children}</table>
  );
}

export function DocTh({ children }: { children: ReactNode }) {
  return (
    <th className="border-b border-line-soft px-3 pb-2 text-left text-[11px] uppercase text-muted-2">
      {children}
    </th>
  );
}

export function DocTd({ children, mono }: { children: ReactNode; mono?: boolean }) {
  return (
    <td
      className={cn(
        "border-b border-line-soft px-3 py-2.5 text-muted",
        mono && "font-mono text-allow",
      )}
    >
      {children}
    </td>
  );
}
