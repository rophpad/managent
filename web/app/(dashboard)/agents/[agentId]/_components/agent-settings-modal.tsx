"use client";

import { Pencil, Settings, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ResourceIcon } from "@/components/dashboard/resource-icon";
import { Button } from "@/components/ui/button";
import { EnforcementSelector } from "@/components/ui/enforcement-selector";
import { Hint } from "@/components/ui/field";
import { Modal, ModalBody, ModalTabs } from "@/components/ui/modal";
import { MutedText, ScopeRow } from "@/components/ui/rows";
import { RiskTag } from "@/components/ui/scope-chip";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/cn";
import { CATALOG_LABEL } from "@/lib/data/resources";
import type { AgentScope, EnforcementMode, Resource } from "@/lib/types";

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
  /** Per-(agent, resource) page, where this grant and its rules are managed. */
  href: string;
}

export function AgentSettingsModal({
  open,
  onClose,
  scopes,
  resources,
  initialScopes,
  initialMode,
  initialFailOpen,
}: {
  open: boolean;
  onClose: () => void;
  scopes: ScopeRowData[];
  resources: Resource[];
  initialScopes: AgentScope[];
  initialMode: EnforcementMode;
  initialFailOpen: boolean;
}) {
  const [tab, setTab] = useState<Tab>("enforcement");
  const [mode, setMode] = useState<EnforcementMode>(initialMode);
  const [failOpen, setFailOpen] = useState(initialFailOpen);
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [granted, setGranted] = useState<ReadonlySet<string>>(
    () => new Set(initialScopes.map((scope) => `${scope.resourceId}:${scope.permission}`)),
  );
  const [permissionDraft, setPermissionDraft] = useState<ReadonlySet<string>>(granted);

  function togglePermission(resourceId: string, permission: string, checked: boolean) {
    const key = `${resourceId}:${permission}`;
    setPermissionDraft((current) => {
      const next = new Set(current);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  return (
    <>
    <Modal
      open={open && !permissionsOpen}
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
                  name={
                    <Link href={scope.href} className="transition-colors hover:text-brand">
                      {scope.label}
                    </Link>
                  }
                  tag={scope.tag}
                  trailing={<MutedText>{scope.usage}</MutedText>}
                />
              ))
            )}

            <Button
              size="sm"
              className="mt-3.5"
              onClick={() => {
                setPermissionDraft(new Set(granted));
                setPermissionsOpen(true);
              }}
            >
              <Pencil aria-hidden className="size-[15px]" />
              Edit permissions
            </Button>
          </>
        )}
      </ModalBody>
    </Modal>

    <Modal
      open={permissionsOpen}
      onClose={() => setPermissionsOpen(false)}
      wide
      title="Edit permissions"
      icon={<ShieldCheck />}
      footer={
        <>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setGranted(new Set(permissionDraft));
              setPermissionsOpen(false);
            }}
          >
            Save permissions
          </Button>
          <Button size="sm" onClick={() => setPermissionsOpen(false)}>
            Cancel
          </Button>
        </>
      }
    >
      <ModalBody>
        <div className="mb-4 flex items-start justify-between gap-4 rounded-lg border border-line-soft bg-panel-2 px-3.5 py-3">
          <div>
            <span className="block text-[13px] font-medium">Agent access</span>
            <Hint className="mt-0.5">Choose the exact MCP tools this agent may call. This applies to this agent only; policies are set per resource, on each one&apos;s page.</Hint>
          </div>
          <span className="shrink-0 rounded-full bg-brand/10 px-2.5 py-1 text-xs text-brand">{permissionDraft.size} selected</span>
        </div>
        {resources.map((resource, index) => (
          <fieldset key={resource.id} className={cn("overflow-hidden rounded-lg border border-line-soft p-0", index > 0 ? "mt-3" : undefined)}>
            <legend className="sr-only">{resource.name}</legend>
            <div className="flex items-center justify-between gap-3 border-b border-line-soft bg-panel-2 px-3.5 py-2.5">
              <span className="flex items-center gap-2 text-[13px] font-medium">
                <ResourceIcon id={resource.id} kind={resource.kind} className="size-[15px] text-muted" />
                {resource.name}
                <span className="font-normal text-muted-2">{CATALOG_LABEL[resource.kind]}</span>
              </span>
              <span className="text-[11.5px] text-muted-2">{resource.permissions.filter((permission) => permissionDraft.has(`${resource.id}:${permission.name}`)).length}/{resource.permissions.length}</span>
            </div>
            <div>
              {resource.permissions.map((permission) => (
                <label
                  key={permission.name}
                  className="flex cursor-pointer items-start gap-3 border-b border-line-soft px-3.5 py-3 transition-colors last:border-b-0 hover:bg-surface"
                >
                  <input
                    type="checkbox"
                    name={`${resource.id}:${permission.name}`}
                    checked={permissionDraft.has(`${resource.id}:${permission.name}`)}
                    onChange={(event) => togglePermission(resource.id, permission.name, event.target.checked)}
                    className="mt-0.5 size-4 accent-brand"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1.5 font-mono text-[12.5px]">
                      {permission.match ?? permission.name}
                      {permission.highRisk ? <RiskTag className="ml-0" /> : null}
                    </span>
                    {permission.match ? <span className="mt-0.5 block text-[11.5px] text-muted-2">{permission.name}</span> : null}
                  </span>
                  {permission.params?.length ? <span className="shrink-0 text-[11px] text-muted-2">{permission.params.length} inputs</span> : null}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </ModalBody>
    </Modal>
    </>
  );
}
