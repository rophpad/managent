"use client";

import { Pencil, RefreshCw, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { ResourceIcon } from "@/components/dashboard/resource-icon";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/ui/field";
import { Modal, ModalBody } from "@/components/ui/modal";
import { RiskTag } from "@/components/ui/scope-chip";
import { CATALOG_LABEL, CATALOG_NOUN, RESOURCE_KIND_LABEL } from "@/lib/data/resources";
import type { Resource } from "@/lib/types";


export function EditCatalogModal({ resource }: { resource: Resource }) {
  const label = CATALOG_LABEL[resource.kind];
  const noun = CATALOG_NOUN[resource.kind];
  const initial = resource.permissions.map((permission) => permission.name);
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState<ReadonlySet<string>>(() => new Set(initial));
  const [draft, setDraft] = useState<ReadonlySet<string>>(() => new Set(initial));
  const [refreshing, setRefreshing] = useState(false);

  function openEditor() {
    setDraft(new Set(enabled));
    setOpen(true);
  }

  function toggle(name: string, checked: boolean) {
    setDraft((current) => {
      const next = new Set(current);
      if (checked) next.add(name);
      else next.delete(name);
      return next;
    });
  }

  function refreshDiscovery() {
    setRefreshing(true);
    // Replace with the discovery API when the resource backend is connected.
    window.setTimeout(() => setRefreshing(false), 700);
  }

  return (
    <>
      <Button size="sm" className="font-normal" onClick={openEditor}>
        <Pencil aria-hidden className="size-[15px]" />
        Edit {noun}s
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        wide
        title={`Edit ${label.toLowerCase()}`}
        icon={<ShieldCheck />}
        footer={
          <>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEnabled(new Set(draft));
                setOpen(false);
              }}
            >
              Save {noun}s
            </Button>
            <Button size="sm" onClick={() => setOpen(false)}>Cancel</Button>
          </>
        }
      >
        <ModalBody>
          <div className="mb-4 flex items-center justify-between gap-4 rounded-lg border border-line-soft bg-panel-2 px-3.5 py-3">
            <span className="flex min-w-0 items-center gap-2.5">
              <ResourceIcon id={resource.id} kind={resource.kind} className="size-[17px] shrink-0 text-muted" />
              <span className="min-w-0">
                <span className="block truncate font-mono text-[13px] font-medium">{resource.name}</span>
                <span className="block text-[11.5px] text-muted-2">{RESOURCE_KIND_LABEL[resource.kind]} · resource type is fixed</span>
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <Button size="sm" onClick={refreshDiscovery} disabled={refreshing}>
                <RefreshCw aria-hidden className={`size-[14px] ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Discovering…" : `Refresh ${label.toLowerCase()}`}
              </Button>
              <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs text-brand">{draft.size}/{resource.permissions.length} enabled</span>
            </span>
          </div>

          <div className="overflow-hidden rounded-lg border border-line-soft">
            <div className="border-b border-line-soft bg-panel-2 px-3.5 py-2.5 text-[12px] font-medium capitalize">
              Available {label.toLowerCase()}
            </div>
            {resource.permissions.map((permission) => (
              <label key={permission.name} className="flex cursor-pointer items-start gap-3 border-b border-line-soft px-3.5 py-3 transition-colors last:border-b-0 hover:bg-surface">
                <input
                  type="checkbox"
                  checked={draft.has(permission.name)}
                  onChange={(event) => toggle(permission.name, event.target.checked)}
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

          <Hint className="mt-3">This changes what {resource.name} exposes, for every agent. It does not grant anything — each agent&apos;s permissions are set on that agent.</Hint>
        </ModalBody>
      </Modal>
    </>
  );
}
