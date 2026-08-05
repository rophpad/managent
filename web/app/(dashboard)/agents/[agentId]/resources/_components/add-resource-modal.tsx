"use client";

import { Plug, Unplug } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ResourceIcon } from "@/components/dashboard/resource-icon";
import { ResourcePicker } from "@/components/dashboard/resource-picker";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FieldGroup, Hint } from "@/components/ui/field";
import { Modal, ModalBody } from "@/components/ui/modal";
import { RiskTag, ScopeChip, ScopeChipGroup } from "@/components/ui/scope-chip";
import type { Resource } from "@/lib/types";

/** What the agent gets on one newly linked resource. */
export interface ResourceLink {
  resourceId: string;
  permissions: string[];
}

/**
 * Links resources to one agent. Permissions are chosen here rather than after
 * the fact because a link with nothing granted is an agent that can't call
 * anything — and because the choice is per (agent, resource), it belongs in a
 * dialog opened from the agent, not from the resource.
 */
export function AddResourceModal({
  open,
  onClose,
  onAdd,
  agentName,
  available,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (links: ResourceLink[]) => void;
  agentName: string;
  /** Resources this agent is not already scoped against. */
  available: Resource[];
}) {
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  const [granted, setGranted] = useState<Record<string, ReadonlySet<string>>>({});

  const selectedResources = available.filter((resource) => selectedIds.has(resource.id));
  const grantedCount = selectedResources.reduce(
    (total, resource) => total + (granted[resource.id]?.size ?? 0),
    0,
  );

  function reset() {
    setSelectedIds(new Set());
    setGranted({});
  }

  function dismiss() {
    reset();
    onClose();
  }

  function toggleResource(id: string, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
    // Deselecting a resource drops its pending grants, so re-adding it doesn't
    // silently bring back permissions the user already backed out of.
    if (!checked) {
      setGranted((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
    }
  }

  function togglePermission(resourceId: string, permission: string, checked: boolean) {
    setGranted((current) => {
      const next = new Set(current[resourceId] ?? []);
      if (checked) next.add(permission);
      else next.delete(permission);
      return { ...current, [resourceId]: next };
    });
  }

  function submit() {
    onAdd(
      selectedResources.map((resource) => ({
        resourceId: resource.id,
        permissions: [...(granted[resource.id] ?? [])],
      })),
    );
    reset();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={dismiss}
      wide
      title="Add resource"
      icon={<Plug />}
      footer={
        <>
          <Button
            variant="primary"
            size="sm"
            onClick={submit}
            disabled={selectedResources.length === 0}
          >
            {selectedResources.length <= 1
              ? "Add resource"
              : `Add ${selectedResources.length} resources`}
          </Button>
          <Button size="sm" onClick={dismiss}>
            Cancel
          </Button>
        </>
      }
    >
      <ModalBody>
        {available.length === 0 ? (
          <EmptyState icon={<Unplug />}>
            {agentName} is already scoped against every registered resource.
            <br />
            <Link href="/resources/new" className="text-brand hover:underline">
              Register a new one →
            </Link>
          </EmptyState>
        ) : (
          <>
            <FieldGroup
              label={
                <>
                  Resources{" "}
                  <span className="font-normal text-muted-2">
                    {agentName} should have access to
                  </span>
                </>
              }
              hint={
                <>
                  Don&apos;t see a resource here?{" "}
                  <Link href="/resources/new" className="text-brand hover:underline">
                    Add one first →
                  </Link>
                </>
              }
            >
              <ResourcePicker
                resources={available}
                selected={selectedIds}
                onToggle={toggleResource}
              />
            </FieldGroup>

            {selectedResources.length > 0 ? (
              <FieldGroup
                className="mb-0"
                label={
                  <>
                    Permissions{" "}
                    <span className="font-normal text-muted-2">
                      per resource · {grantedCount} selected
                    </span>
                  </>
                }
              >
                {selectedResources.map((resource, index) => (
                  <div
                    key={resource.id}
                    className={index === 0 ? "mt-2.5" : "mt-3.5 border-t border-line-soft pt-3.5"}
                  >
                    <div className="mb-2 flex items-center gap-2 text-[12.5px] font-medium">
                      <ResourceIcon
                        id={resource.id}
                        kind={resource.kind}
                        className="size-[15px] text-muted"
                      />
                      {resource.name}
                    </div>
                    <ScopeChipGroup>
                      {resource.permissions.map((permission) => (
                        <ScopeChip
                          key={permission.name}
                          name={`${resource.id}:${permission.name}`}
                          checked={granted[resource.id]?.has(permission.name) ?? false}
                          onChange={(checked) =>
                            togglePermission(resource.id, permission.name, checked)
                          }
                          suffix={permission.highRisk ? <RiskTag className="ml-1" /> : undefined}
                        >
                          {permission.name}
                        </ScopeChip>
                      ))}
                    </ScopeChipGroup>
                  </div>
                ))}
                <Hint className="mt-3">
                  Granting here affects {agentName}{" "}
                  only. The resource&apos;s own default policies apply on top, and you can add
                  rules specific to {agentName} afterwards.
                </Hint>
              </FieldGroup>
            ) : null}
          </>
        )}
      </ModalBody>
    </Modal>
  );
}
