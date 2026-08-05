"use client";

import { ArrowLeft, ArrowRight, Check, Unplug } from "lucide-react";
import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { ResourceIcon } from "@/components/dashboard/resource-icon";
import { ResourcePicker } from "@/components/dashboard/resource-picker";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Field,
  FieldGroup,
  FormActions,
  FormCard,
  Hint,
  Input,
  Textarea,
} from "@/components/ui/field";
import { RiskTag, ScopeChip, ScopeChipGroup } from "@/components/ui/scope-chip";
import { TokenReveal } from "@/components/ui/token-reveal";
import { WizardSteps } from "@/components/ui/wizard-steps";
import type { Resource } from "@/lib/types";

const STEPS = [
  { label: "Basic info" },
  { label: "Resources", optional: true },
  { label: "Permissions", optional: true },
] as const;

/** Placeholder for the create-agent API call. */
function issueAgentToken(agentName: string): string {
  const slug = agentName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_") || "agent";
  const suffix = Math.random().toString(16).slice(2, 8);
  return `mg_live_${slug}_${suffix}`;
}

export function RegisterWizard({ resources }: { resources: Resource[] }) {
  const fieldId = useId();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  const [granted, setGranted] = useState<Record<string, ReadonlySet<string>>>({});
  const [token, setToken] = useState<string | null>(null);

  const selectedResources = useMemo(
    () => resources.filter((resource) => selectedIds.has(resource.id)),
    [resources, selectedIds],
  );

  function toggleResource(id: string, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function togglePermission(resourceId: string, permission: string, checked: boolean) {
    setGranted((current) => {
      const next = new Set(current[resourceId] ?? []);
      if (checked) next.add(permission);
      else next.delete(permission);
      return { ...current, [resourceId]: next };
    });
  }

  function createAgent({ withoutResources = false } = {}) {
    if (withoutResources) {
      setSelectedIds(new Set());
      setGranted({});
    }
    setToken(issueAgentToken(name));
  }

  return (
    <FormCard>
      <WizardSteps steps={STEPS} current={step} />

      {step === 1 ? (
        <div>
          <Field label="Agent name" htmlFor={`${fieldId}-name`}>
            <Input
              id={`${fieldId}-name`}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. invoice-agent"
              autoComplete="off"
            />
          </Field>
          <Field label="Owner email" htmlFor={`${fieldId}-owner`}>
            <Input
              id={`${fieldId}-owner`}
              type="email"
              value={ownerEmail}
              onChange={(event) => setOwnerEmail(event.target.value)}
              placeholder="you@company.com"
            />
          </Field>
          <Field label="Description" htmlFor={`${fieldId}-desc`} className="mb-0">
            <Textarea
              id={`${fieldId}-desc`}
              rows={2}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What does this agent do?"
            />
          </Field>
        </div>
      ) : null}

      {step === 2 ? (
        <FieldGroup
          className="mb-0"
          label={
            <>
              Select resources{" "}
              <span className="font-normal text-muted-2">
                this agent needs access to — or skip and add them later
              </span>
            </>
          }
        >
          <ResourcePicker
            resources={resources}
            selected={selectedIds}
            onToggle={toggleResource}
          />
          <Hint>
            Don&apos;t see a resource here?{" "}
            <Link href="/resources/new" className="text-brand hover:underline">
              Add one first →
            </Link>
          </Hint>
        </FieldGroup>
      ) : null}

      {step === 3 ? (
        <FieldGroup
          className="mb-0"
          label={
            <>
              Set permissions <span className="font-normal text-muted-2">per selected resource</span>
            </>
          }
        >
          {selectedResources.length === 0 ? (
            <EmptyState icon={<Unplug />}>
              No resources selected — this agent will start with zero access.
              <br />
              You can assign scopes anytime from its detail page.
            </EmptyState>
          ) : (
            selectedResources.map((resource, index) => (
              <div
                key={resource.id}
                className={
                  index === 0 ? "mt-2.5" : "mt-3.5 border-t border-line-soft pt-3.5"
                }
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
            ))
          )}
        </FieldGroup>
      ) : null}

      {step === 1 ? (
        <FormActions>
          <Button variant="primary" onClick={() => setStep(2)}>
            Continue
            <ArrowRight aria-hidden className="size-[15px]" />
          </Button>
          <Button onClick={() => createAgent({ withoutResources: true })}>
            Skip resources &amp; create agent
          </Button>
          <ButtonLink href="/agents" className="ml-auto">
            Cancel
          </ButtonLink>
        </FormActions>
      ) : null}

      {step === 2 ? (
        <FormActions>
          <Button onClick={() => setStep(1)}>
            <ArrowLeft aria-hidden className="size-[15px]" />
            Back
          </Button>
          <Button variant="primary" onClick={() => setStep(3)}>
            Continue
            <ArrowRight aria-hidden className="size-[15px]" />
          </Button>
          <Button onClick={() => createAgent()}>Skip permissions &amp; create agent</Button>
        </FormActions>
      ) : null}

      {step === 3 ? (
        <FormActions>
          <Button onClick={() => setStep(2)}>
            <ArrowLeft aria-hidden className="size-[15px]" />
            Back
          </Button>
          <Button variant="primary" onClick={() => createAgent()}>
            <Check aria-hidden className="size-[15px]" />
            Create agent
          </Button>
        </FormActions>
      ) : null}

      {token ? <TokenReveal token={token} /> : null}
    </FormCard>
  );
}
