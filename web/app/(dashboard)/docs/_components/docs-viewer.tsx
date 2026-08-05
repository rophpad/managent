"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface DocSection {
  id: string;
  label: string;
  content: ReactNode;
}

/**
 * The prose itself is rendered on the server and handed over as `content`, so
 * only the section switch ships JavaScript.
 */
export function DocsViewer({ sections }: { sections: DocSection[] }) {
  const [activeId, setActiveId] = useState(sections[0]?.id);
  const active = sections.find((section) => section.id === activeId) ?? sections[0];

  return (
    <div className="grid grid-cols-1 items-start gap-8 docs:grid-cols-[190px_1fr]">
      <nav
        aria-label="Documentation sections"
        className="flex flex-row flex-wrap gap-0.5 docs:sticky docs:top-5 docs:flex-col"
      >
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            aria-current={section.id === active?.id ? "page" : undefined}
            onClick={() => setActiveId(section.id)}
            className={cn(
              "rounded-lg px-2.5 py-[7px] text-left text-[13px] transition-colors",
              section.id === active?.id
                ? "bg-brand/9 text-brand"
                : "text-muted hover:bg-panel hover:text-fg",
            )}
          >
            {section.label}
          </button>
        ))}
      </nav>

      <div className="min-w-0">{active?.content}</div>
    </div>
  );
}
