"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/cn";

export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "flex max-w-[320px] flex-1 items-center gap-2 rounded-lg border border-line bg-panel px-3 py-2",
        "focus-within:border-brand",
        className,
      )}
    >
      <Search aria-hidden className="size-[15px] shrink-0 text-muted-2" />
      <span className="sr-only">{placeholder}</span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full border-none bg-transparent text-[13px] text-fg outline-none placeholder:text-muted-2"
      />
    </label>
  );
}

/** Search on the left, filters on the right. */
export function Toolbar({ children }: { children: React.ReactNode }) {
  return <div className="mb-4 flex items-center justify-between gap-3">{children}</div>;
}
