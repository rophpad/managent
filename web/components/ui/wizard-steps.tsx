import { Check } from "lucide-react";
import { Fragment } from "react";
import { cn } from "@/lib/cn";

export interface WizardStep {
  label: string;
  optional?: boolean;
}

export function WizardSteps({
  steps,
  current,
}: {
  steps: readonly WizardStep[];
  /** 1-based index of the step being shown. */
  current: number;
}) {
  return (
    <ol className="mb-6 flex list-none items-center p-0">
      {steps.map((step, index) => {
        const position = index + 1;
        const isCurrent = position === current;
        const isDone = position < current;

        return (
          <Fragment key={step.label}>
            {index > 0 ? <li aria-hidden className="mx-3 h-px flex-1 bg-line-soft" /> : null}
            <li
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap text-[12.5px]",
                isDone ? "text-allow" : isCurrent ? "text-fg" : "text-muted-2",
              )}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px]",
                  isDone
                    ? "border-allow-dim bg-allow/8 text-allow"
                    : isCurrent
                      ? "border-brand bg-panel-2 text-brand"
                      : "border-line bg-panel-2",
                )}
              >
                {isDone ? <Check className="size-3" /> : position}
              </span>
              {step.label}
              {step.optional ? (
                <span className="ml-0.5 rounded-full border border-line px-[7px] py-px text-[10.5px] text-muted-2">
                  optional
                </span>
              ) : null}
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}
