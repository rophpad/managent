import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * Website brand: managent mark + "managent" on the first line,
 * "mcpool" smaller below it. Used in headers and sidebar only.
 * Footers keep "Managent" alone.
 */
export function Brand({
  markSize = 30,
  className,
  titleClassName,
  subtitleClassName,
}: {
  markSize?: number;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
}) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <Image
        src="/managent-logo-white.png"
        alt=""
        width={markSize}
        height={markSize}
        className="shrink-0 rounded-[7px]"
        priority
      />
      <span className="flex flex-col justify-center leading-none">
        <span
          className={cn(
            "font-display text-[15px] font-semibold tracking-tight text-fg",
            titleClassName,
          )}
        >
          managent
        </span>
        <span
          className={cn(
            "mt-1 text-[11px] font-medium tracking-[0.04em] text-muted",
            subtitleClassName,
          )}
        >
          mcpool
        </span>
      </span>
    </span>
  );
}
