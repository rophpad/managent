"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Rendered inline rather than portalled to `<body>` so it stays inside the
 * dashboard shell, inheriting the font variables and dark `color-scheme`.
 */
export function Modal({
  open,
  onClose,
  title,
  icon,
  wide,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  icon?: ReactNode;
  wide?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const titleId = useId();
  const boxRef = useRef<HTMLDivElement>(null);

  // `onClose` is an inline arrow at every call site, so it changes identity on
  // each parent render. Reading it through a ref keeps the effect below keyed
  // on `open` alone — otherwise it would tear down and re-run mid-dialog,
  // re-capturing the element to restore focus to.
  // Effects run in declaration order, so this is current before the Escape
  // handler below is ever registered — and long before it can fire.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };

    document.addEventListener("keydown", handleKeyDown);
    const restoreOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    boxRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = restoreOverflow;
      previouslyFocused?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-[rgba(5,7,12,0.6)] p-5"
      // mousedown rather than click, so releasing a drag that started inside the
      // dialog does not dismiss it.
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={boxRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "no-scrollbar max-h-[80vh] w-full overflow-y-auto rounded-xl border border-line bg-panel outline-none",
          wide ? "max-w-[560px]" : "max-w-[420px]",
        )}
      >
        <div className="flex items-center justify-between border-b border-line-soft px-5 py-4">
          <span id={titleId} className="flex items-center gap-[9px] text-[14.5px] font-medium">
            {icon ? (
              <span aria-hidden className="text-brand [&>svg]:size-[17px]">
                {icon}
              </span>
            ) : null}
            {title}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex rounded-md p-1 text-muted transition-colors hover:bg-surface hover:text-fg"
          >
            <X className="size-[17px]" />
          </button>
        </div>

        {children}

        {footer ? (
          <div className="flex gap-2 border-t border-line-soft px-5 py-3.5">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}

export function ModalBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>;
}

export function ModalTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex gap-1 border-b border-line-soft px-5 pt-3">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          aria-pressed={tab.value === value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "-mb-px border-b-2 px-3 pb-2.5 pt-2 text-[13px] transition-colors",
            tab.value === value
              ? "border-brand text-fg"
              : "border-transparent text-muted hover:text-fg",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
