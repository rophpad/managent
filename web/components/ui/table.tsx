import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Wide tables scroll inside the card on narrow screens rather than being
 * clipped by it — `minWidth` is the point below which squeezing columns stops
 * being readable and scrolling should take over.
 */
export function Table({
  children,
  className,
  minWidth = "min-w-[600px]",
}: {
  children: ReactNode;
  className?: string;
  minWidth?: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table
        className={cn(
          "w-full border-collapse text-[13px] [&_tbody_tr:last-child>td]:border-b-0",
          minWidth,
          className,
        )}
      >
        {children}
      </table>
    </div>
  );
}

export function Th({ children, className, ...props }: ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "border-b border-line px-3.5 py-2.5 text-left text-[11px] font-normal uppercase text-muted",
        className,
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  muted,
  ...props
}: ComponentProps<"td"> & { muted?: boolean }) {
  return (
    <td
      className={cn(
        "border-b border-line-soft px-3.5 py-3 align-middle",
        muted && "text-[12.5px] text-muted",
        className,
      )}
      {...props}
    >
      {children}
    </td>
  );
}

/** Applied to a `<tr>` that navigates or opens a detail view on click. */
export const ROW_LINK_CLASS = "cursor-pointer transition-colors hover:bg-surface";

/** Monospaced primary identifier in the first column of a table. */
export function ResourceName({ children }: { children: ReactNode }) {
  return <span className="font-mono text-[13px] text-fg">{children}</span>;
}
