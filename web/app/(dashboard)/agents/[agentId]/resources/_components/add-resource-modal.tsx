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

/** A newly linked resource and its explicit tool denials. */
export interface ResourceLink {
  resourceId: string;
  permissions: string[];
}

/**
 * Links resources to one agent. Tools are allowed by default; selected
 * permissions are explicit denials for this agent-resource pair.
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
  const [denied, setDenied] = useState<Record<string, ReadonlySet<string>>>({});

  const selectedResources = available.filter((resource) => selectedIds.has(resource.id));
  const allowedCount = selectedResources.reduce(
    (total, resource) => total + resource.permissions.length - (denied[resource.id]?.size ?? 0),
    0,
  );

  function reset() {
    setSelectedIds(new Set());
    setDenied({});
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
      setDenied((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
    }
  }

  function togglePermission(resourceId: string, permission: string, checked: boolean) {
    setDenied((current) => {
      const next = new Set(current[resourceId] ?? []);
      if (checked) next.delete(permission);
      else next.add(permission);
      return { ...current, [resourceId]: next };
    });
  }

  function submit() {
    onAdd(
      selectedResources.map((resource) => ({
        resourceId: resource.id,
        permissions: [...(denied[resource.id] ?? [])],
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
                    Allowed tools{" "}
                    <span className="font-normal text-muted-2">
                      per resource · {allowedCount} allowed
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
                        className="size-3.75 text-muted"
                      />
                      {resource.name}
                    </div>
                    <ScopeChipGroup>
                      {resource.permissions.map((permission) => (
                        <ScopeChip
                          key={permission.name}
                          name={`${resource.id}:${permission.name}`}
                          checked={!(denied[resource.id]?.has(permission.name) ?? false)}
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
                  All tools start checked and allowed for {agentName}. Uncheck a tool to deny it.
                  Resource and agent policies can add conditions or approval requirements.
                </Hint>
              </FieldGroup>
            ) : null}
          </>
        )}
      </ModalBody>
    </Modal>
  );
}
