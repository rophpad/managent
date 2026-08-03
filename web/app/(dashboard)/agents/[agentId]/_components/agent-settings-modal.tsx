"use client";

import { Plus, Settings } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ResourcePicker } from "@/components/dashboard/resource-picker";
import { Button } from "@/components/ui/button";
import { EnforcementSelector } from "@/components/ui/enforcement-selector";
import { Hint } from "@/components/ui/field";
import { Modal, ModalBody, ModalTabs } from "@/components/ui/modal";
import { MutedText, ScopeRow } from "@/components/ui/rows";
import { Toggle } from "@/components/ui/toggle";
import type { EnforcementMode, Resource } from "@/lib/types";

const TABS = [
  { value: "enforcement", label: "Enforcement mode" },
  { value: "resources", label: "Resources & permissions" },
] as const;

type Tab = (typeof TABS)[number]["value"];

const FAIL_OPEN_COPY = {
  on: "On: if Managent's scope-check is unreachable, this agent's calls are allowed through and a warning is logged — a Managent outage never breaks this agent. Recommended for most teams.",
  off: "Off: if Managent's scope-check is unreachable, this agent's calls are blocked until the check succeeds. Only recommended if your risk posture requires fail-closed behavior.",
};

export interface ScopeRowData {
  label: string;
  tag: string;
  usage: string;
}

export function AgentSettingsModal({
  open,
  onClose,
  scopes,
  linkableResources,
  initialMode,
  initialFailOpen,
}: {
  open: boolean;
  onClose: () => void;
  scopes: ScopeRowData[];
  /** Resources this agent is not yet scoped against. */
  linkableResources: Resource[];
  initialMode: EnforcementMode;
  initialFailOpen: boolean;
}) {
  const [tab, setTab] = useState<Tab>("enforcement");
  const [mode, setMode] = useState<EnforcementMode>(initialMode);
  const [failOpen, setFailOpen] = useState(initialFailOpen);
  const [linkPanelOpen, setLinkPanelOpen] = useState(false);
  const [pendingLinks, setPendingLinks] = useState<ReadonlySet<string>>(new Set());

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title="Agent settings"
      icon={<Settings />}
      footer={
        <>
          <Button variant="primary" size="sm" onClick={onClose}>
            Save changes
          </Button>
          <Button size="sm" onClick={onClose}>
            Cancel
          </Button>
        </>
      }
    >
      <ModalTabs tabs={TABS} value={tab} onChange={setTab} />

      <ModalBody>
        {tab === "enforcement" ? (
          <>
            <span className="mb-2 block text-[13px] font-medium">Mode</span>
            <EnforcementSelector value={mode} onChange={setMode} label="Enforcement mode" />
            <Hint className="mt-2.5">
              Strict mode requires 3 days in shadow mode first.{" "}
              <Link href="/audit-logs" className="text-brand hover:underline">
                See what would be blocked →
              </Link>
            </Hint>

            <div className="mt-5 border-t border-line-soft pt-4.5">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[13px] font-medium">Fail-open behavior</span>
                <Toggle
                  checked={failOpen}
                  onChange={setFailOpen}
                  label="Allow calls through when the scope-check is unreachable"
                />
              </div>
              <Hint className="mt-1.5">{failOpen ? FAIL_OPEN_COPY.on : FAIL_OPEN_COPY.off}</Hint>
            </div>
          </>
        ) : (
          <>
            {scopes.length === 0 ? (
              <MutedText>This agent has no scopes yet.</MutedText>
            ) : (
              scopes.map((scope) => (
                <ScopeRow
                  key={scope.label}
                  name={scope.label}
                  tag={scope.tag}
                  trailing={<MutedText>{scope.usage}</MutedText>}
                />
              ))
            )}

            {linkPanelOpen ? (
              <div className="mt-4 border-t border-line-soft pt-4">
                <span className="mb-2 block text-[13px] font-medium">Link a resource</span>
                {linkableResources.length === 0 ? (
                  <MutedText>Every resource is already linked to this agent.</MutedText>
                ) : (
                  <ResourcePicker
                    resources={linkableResources}
                    selected={pendingLinks}
                    onToggle={(id, checked) =>
                      setPendingLinks((current) => {
                        const next = new Set(current);
                        if (checked) next.add(id);
                        else next.delete(id);
                        return next;
                      })
                    }
                  />
                )}
                <Hint>
                  Don&apos;t see a resource here?{" "}
                  <Link href="/resources/new" className="text-brand hover:underline">
                    Add one first →
                  </Link>
                </Hint>
              </div>
            ) : null}

            <Button
              size="sm"
              className="mt-3.5"
              aria-expanded={linkPanelOpen}
              onClick={() => setLinkPanelOpen((open) => !open)}
            >
              <Plus aria-hidden className="size-[15px]" />
              Link a resource
            </Button>
          </>
        )}
      </ModalBody>
    </Modal>
  );
}
