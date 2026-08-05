"use client";

import { useState } from "react";
import { PanelBlock, SectionTitle } from "@/components/ui/card";
import { EnforcementSelector } from "@/components/ui/enforcement-selector";
import { Hint } from "@/components/ui/field";
import { Toggle } from "@/components/ui/toggle";
import type { EnforcementMode } from "@/lib/types";

/** The two org-wide defaults that are editable; the panels below them are read-only. */
export function OrgDefaults({
  initialMode,
  initialFailOpen,
}: {
  initialMode: EnforcementMode;
  initialFailOpen: boolean;
}) {
  const [mode, setMode] = useState<EnforcementMode>(initialMode);
  const [failOpen, setFailOpen] = useState(initialFailOpen);

  return (
    <>
      <PanelBlock>
        <SectionTitle className="mb-3.5">Default enforcement mode for new agents</SectionTitle>
        <EnforcementSelector
          value={mode}
          onChange={setMode}
          label="Default enforcement mode for new agents"
          className="max-w-[340px]"
        />
        <Hint className="mt-2.5">
          New agents always start here regardless of this default; strict mode always requires
          passing through shadow first.
        </Hint>
      </PanelBlock>

      <PanelBlock>
        <div className="flex items-center justify-between gap-4">
          <div>
            <SectionTitle className="mb-1">Default fail-open behavior</SectionTitle>
            <Hint className="mt-0">
              If Managent&apos;s scope-check is unreachable, allow calls through by default rather
              than blocking them. Applies to new agents; can be overridden per agent.
            </Hint>
          </div>
          <Toggle
            checked={failOpen}
            onChange={setFailOpen}
            label="Allow calls through by default when the scope-check is unreachable"
          />
        </div>
      </PanelBlock>
    </>
  );
}
