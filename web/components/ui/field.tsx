import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

const CONTROL =
  "w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-[13.5px] text-fg " +
  "outline-none transition-colors placeholder:text-muted-2 focus:border-brand";

export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4.5", className)}>
      <label htmlFor={htmlFor} className="mb-[7px] block text-[13px] font-medium">
        {label}
      </label>
      {children}
      {hint ? <Hint>{hint}</Hint> : null}
    </div>
  );
}

/** Fieldset-style group for controls that aren't a single labelled input. */
export function FieldGroup({
  label,
  hint,
  children,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={cn("mb-4.5 border-none p-0", className)}>
      <legend className="mb-[7px] block text-[13px] font-medium">{label}</legend>
      {children}
      {hint ? <Hint>{hint}</Hint> : null}
    </fieldset>
  );
}

export function Hint({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("mt-[5px] text-xs text-muted-2", className)}>{children}</p>;
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(CONTROL, className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(CONTROL, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(CONTROL, "resize-y", className)} {...props} />;
}

/** Divider above a form's submit row. */
export function FormActions({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("mt-6 flex gap-2.5 border-t border-line-soft pt-5", className)}>
      {children}
    </div>
  );
}

export function FormCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn("max-w-[640px] rounded-xl border border-line bg-panel px-7 py-[26px]", className)}
    >
      {children}
    </div>
  );
}
