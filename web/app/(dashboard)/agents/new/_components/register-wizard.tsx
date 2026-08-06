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
import type { Agent } from "@/lib/types";
import { saveDashboardEntity } from "@/lib/client-api";

const STEPS = [
  { label: "Basic info" },
  { label: "Resources", optional: true },
  { label: "Permissions", optional: true },
] as const;

export function RegisterWizard({ resources }: { resources: Resource[] }) {
  const fieldId = useId();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  const [granted, setGranted] = useState<Record<string, ReadonlySet<string>>>({});
  const [token, setToken] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBasicErrors, setShowBasicErrors] = useState(false);
  const basicErrors = {
    name: name.trim().length < 2 ? "Use at least 2 characters for the agent name." : null,
    ownerEmail: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail.trim())
      ? null
      : "Enter a valid owner email address.",
    description: description.trim().length < 10
      ? "Describe the agent in at least 10 characters."
      : null,
  };
  const basicInfoValid =
    name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail.trim()) &&
    description.trim().length >= 10;

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

  async function createAgent({ withoutResources = false } = {}) {
    if (!basicInfoValid) {
      setShowBasicErrors(true);
      setError("Correct the highlighted fields before creating the agent.");
      setStep(1);
      return;
    }
    setSaving(true);
    setError(null);
    try {
    const agentResponse = await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        owner: ownerEmail.trim(),
        tags: ["dashboard"],
      }),
    });
    const created = await agentResponse.json() as {
      agent?: { id: string };
      rawToken?: string;
      error?: string;
    };
    if (!agentResponse.ok || !created.rawToken) {
      throw new Error(created.error ?? "The gateway did not issue an agent token");
    }
    const rawToken = created.rawToken;
    const selected = withoutResources ? new Set<string>() : selectedIds;
    const scopes = resources.flatMap((resource) =>
      selected.has(resource.id)
        ? [...(granted[resource.id] ?? [])].map((permission) => ({
            resourceId: resource.id,
            permission,
            callsToday: 0,
          }))
        : [],
    );
    const id = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const agent: Agent = {
      id,
      gatewayAgentId: created.agent?.id,
      name: name.trim(),
      owner: ownerEmail.split("@")[0] || ownerEmail,
      ownerEmail,
      description,
      status: "active",
      coverage: { rest: null, mcp: null },
      calls24h: 0,
      denied24h: 0,
      createdDaysAgo: 0,
      lastActive: "Never",
      tokenPreview: `${rawToken.slice(0, 8)}...${rawToken.slice(-6)}`,
      enforcementMode: "monitor",
      failOpen: true,
      scopes,
    };
    await saveDashboardEntity("agents", agent, true);
    if (withoutResources) {
      setSelectedIds(new Set());
      setGranted({});
    }
    setToken(rawToken);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create the agent");
    } finally {
      setSaving(false);
    }
  }

  if (token) {
    const createdAgentId = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return (
      <FormCard>
        <TokenReveal token={token} />
        <FormActions>
          <ButtonLink href={"/agents/" + createdAgentId} variant="primary">
            View agent
          </ButtonLink>
          <ButtonLink href="/agents">Back to agents</ButtonLink>
        </FormActions>
      </FormCard>
    );
  }

  return (
    <FormCard>
      <WizardSteps steps={STEPS} current={step} />

      {step === 1 ? (
        <div>
          <Field label="Agent name" htmlFor={`${fieldId}-name`} error={showBasicErrors ? basicErrors.name : null}>
            <Input
              id={`${fieldId}-name`}
              value={name}
              aria-invalid={showBasicErrors && Boolean(basicErrors.name)}
              onChange={(event) => {
                setName(event.target.value);
                setError(null);
              }}
              placeholder="e.g. invoice-agent"
              autoComplete="off"
              required
              minLength={2}
            />
          </Field>
          <Field label="Owner email" htmlFor={`${fieldId}-owner`} error={showBasicErrors ? basicErrors.ownerEmail : null}>
            <Input
              id={`${fieldId}-owner`}
              type="email"
              value={ownerEmail}
              aria-invalid={showBasicErrors && Boolean(basicErrors.ownerEmail)}
              onChange={(event) => {
                setOwnerEmail(event.target.value);
                setError(null);
              }}
              placeholder="you@company.com"
              required
            />
          </Field>
          <Field label="Description" htmlFor={`${fieldId}-desc`} className="mb-0" error={showBasicErrors ? basicErrors.description : null}>
            <Textarea
              id={`${fieldId}-desc`}
              rows={2}
              value={description}
              aria-invalid={showBasicErrors && Boolean(basicErrors.description)}
              onChange={(event) => {
                setDescription(event.target.value);
                setError(null);
              }}
              placeholder="What does this agent do?"
              required
              minLength={10}
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
          <Button variant="primary" onClick={() => { setShowBasicErrors(true); if (basicInfoValid) setStep(2); }} disabled={saving}>
            Continue
            <ArrowRight aria-hidden className="size-[15px]" />
          </Button>
          <Button onClick={() => createAgent({ withoutResources: true })} disabled={saving}>
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
          <Button onClick={() => createAgent()} disabled={saving}>
            {saving ? "Creating…" : "Skip permissions & create agent"}
          </Button>
        </FormActions>
      ) : null}

      {step === 3 ? (
        <FormActions>
          <Button onClick={() => setStep(2)}>
            <ArrowLeft aria-hidden className="size-[15px]" />
            Back
          </Button>
          <Button variant="primary" onClick={() => createAgent()} disabled={saving}>
            <Check aria-hidden className="size-[15px]" />
            {saving ? "Creating…" : "Create agent"}
          </Button>
        </FormActions>
      ) : null}

      {error ? <p role="alert" className="mt-3 text-[12.5px] text-deny">{error}</p> : null}
    </FormCard>
  );
}
