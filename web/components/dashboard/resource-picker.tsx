"use client";

import { ResourceIcon } from "@/components/dashboard/resource-icon";
import { catalogCountLabel, RESOURCE_KIND_LABEL } from "@/lib/data/resources";
import type { Resource } from "@/lib/types";
import { cn } from "@/lib/cn";

/** Multi-select grid of resources. Shared by the register wizard and agent settings. */
export function ResourcePicker({
  resources,
  selected,
  onToggle,
}: {
  resources: Resource[];
  selected: ReadonlySet<string>;
  onToggle: (id: string, checked: boolean) => void;
}) {
  return (
    <div className="mt-2 grid gap-2 sm:grid-cols-2">
      {resources.map((resource) => {
        const isSelected = selected.has(resource.id);
        return (
          <label key={resource.id} className="block cursor-pointer">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(event) => onToggle(resource.id, event.target.checked)}
              className="peer sr-only"
            />
            <span
              className={cn(
                "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 transition-colors",
                "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand",
                isSelected ? "border-brand-dim bg-brand/9" : "border-line",
              )}
            >
              <ResourceIcon
                id={resource.id}
                kind={resource.kind}
                className={cn("size-[18px] shrink-0", isSelected ? "text-brand" : "text-muted")}
              />
              <span className="min-w-0">
                <span className="block truncate font-mono text-[12.5px]">{resource.name}</span>
                <span className="block text-[11.5px] text-muted">
                  {RESOURCE_KIND_LABEL[resource.kind]} · {catalogCountLabel(resource)}
                </span>
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
