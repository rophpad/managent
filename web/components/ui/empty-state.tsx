import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function EmptyState({
  icon,
  children,
  className,
}: {
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-5 py-[50px] text-center text-muted", className)}>
      <span aria-hidden className="mb-2.5 block text-muted-2 [&>svg]:mx-auto [&>svg]:size-[26px]">
        {icon}
      </span>
      {children}
    </div>
  );
}
