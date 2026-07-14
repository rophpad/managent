import type { ReactNode } from "react";

export function DashboardCard({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-[#e7e7e5] bg-white">
      <div className="flex flex-col gap-3 border-b border-[#efefee] px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#191917]">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm leading-6 text-[#6b6b67]">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-lg border border-[#e7e7e5] bg-white px-4 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-[#8a8a86]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#191917]">{value}</p>
      {detail ? <p className="mt-1 text-sm text-[#6b6b67]">{detail}</p> : null}
    </div>
  );
}

export function DashboardField({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium text-[#2b2b28]">{label}</span>
        {hint ? <span className="text-xs text-[#8a8a86]">{hint}</span> : null}
      </div>
      {children}
    </label>
  );
}

export function SectionEyebrow({ children }: { children: ReactNode }) {
  return <p className="text-xs font-medium uppercase tracking-wide text-[#8a8a86]">{children}</p>;
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const classes =
    normalized === "connected"
      ? "border-[#d8e7d8] bg-[#f3f8f3] text-[#2f6b3d]"
      : normalized === "error"
        ? "border-[#efd8d6] bg-[#fcf4f3] text-[#a14637]"
        : normalized === "blocked" || normalized === "deny"
          ? "border-[#efe3cf] bg-[#faf6ef] text-[#8a5a17]"
          : "border-[#e4e4e2] bg-[#f7f7f5] text-[#5f5f5b]";

  return (
    <span
      className={`inline-flex h-7 items-center rounded-md border px-2.5 text-xs font-medium capitalize ${classes}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

export function EmptyState({
  label,
  detail,
}: {
  label: string;
  detail?: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-[#dfdfdc] bg-[#fbfbfa] px-4 py-8 text-sm text-[#6b6b67]">
      <p className="font-medium text-[#2b2b28]">{label}</p>
      {detail ? <p className="mt-1 leading-6 text-[#6b6b67]">{detail}</p> : null}
    </div>
  );
}

export function DataTable({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#e7e7e5] bg-white">
      {children}
    </div>
  );
}

export const inputClass =
  "h-10 rounded-md border border-[#ddddda] bg-white px-3 text-sm text-[#191917] outline-none transition focus:border-[#b9b9b5] focus:ring-2 focus:ring-[#ececeb]";
export const textareaClass =
  "rounded-md border border-[#ddddda] bg-white px-3 py-2 text-sm text-[#191917] outline-none transition focus:border-[#b9b9b5] focus:ring-2 focus:ring-[#ececeb]";
export const primaryButtonClass =
  "inline-flex h-9 items-center justify-center rounded-md bg-[#191917] px-3.5 text-sm font-medium text-white transition hover:bg-[#2a2a27]";
export const secondaryButtonClass =
  "inline-flex h-9 items-center justify-center rounded-md border border-[#ddddda] bg-white px-3 text-sm font-medium text-[#191917] transition hover:bg-[#f7f7f5]";
