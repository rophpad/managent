import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "default" | "primary" | "danger";
type Size = "md" | "sm";

const VARIANT: Record<Variant, string> = {
  default: "border-line bg-panel text-fg hover:border-line-soft hover:bg-surface",
  primary: "border-brand bg-brand font-medium text-ink hover:brightness-110",
  danger: "border-danger-dim bg-panel text-danger hover:bg-danger/8",
};

const SIZE: Record<Size, string> = {
  md: "px-3.5 py-[9px] text-[13px]",
  sm: "px-[11px] py-1.5 text-[12.5px]",
};

const BASE =
  "inline-flex items-center gap-[7px] whitespace-nowrap rounded-lg border transition-colors " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand " +
  "disabled:pointer-events-none disabled:opacity-60";

function buttonClass(variant: Variant, size: Size, className?: string) {
  return cn(BASE, VARIANT[variant], SIZE[size], className);
}

type ButtonProps = ComponentProps<"button"> & { variant?: Variant; size?: Size };

export function Button({ variant = "default", size = "md", className, type, ...props }: ButtonProps) {
  return <button type={type ?? "button"} className={buttonClass(variant, size, className)} {...props} />;
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size };

/** A `<Link>` styled as a button — for navigation, where a `<button>` would be wrong. */
export function ButtonLink({ variant = "default", size = "md", className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

type IconButtonProps = ComponentProps<"button"> & { label: string; children: ReactNode };

/** Compact circular action. `label` is required — the icon carries no text. */
export function IconButton({ label, className, type, children, ...props }: IconButtonProps) {
  return (
    <button
      type={type ?? "button"}
      aria-label={label}
      className={cn(
        "inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-line",
        "bg-panel text-muted transition-colors hover:border-line-soft hover:bg-surface hover:text-fg",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
