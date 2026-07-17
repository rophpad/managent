"use client";

import { useState } from "react";

import {
  DashboardCard,
  DashboardField,
  DashboardModal,
  DataTable,
  EmptyState,
  SectionEyebrow,
  StatusBadge,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "./primitives";
import type { Overview } from "./types";

export function AgentsSection({
  agents,
  selectedAgent,
  selectedKeys,
  issuedKey,
  createAgent,
  createAgentKey,
  suspendAgent,
  activateAgent,
  revokeAgentKey,
  rotateAgentKey,
}: {
  agents: Overview["agents"];
  selectedAgent: Overview["agents"][number] | null;
  selectedKeys: Array<{
    id: string;
    agentId: string;
    last4: string;
    status: string;
    createdAt: string;
    revokedAt?: string;
  }>;
  issuedKey?: string;
  createAgent: (formData: FormData) => Promise<void>;
  createAgentKey: (formData: FormData) => Promise<void>;
  suspendAgent: (formData: FormData) => Promise<void>;
  activateAgent: (formData: FormData) => Promise<void>;
  revokeAgentKey: (formData: FormData) => Promise<void>;
  rotateAgentKey: (formData: FormData) => Promise<void>;
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div className="space-y-6">
      {issuedKey ? (
        <DashboardCard
          title="New agent key"
          description="This plaintext token is shown once. It will never be returned again."
        >
          <div className="space-y-3 rounded-lg border border-[#e7e7e5] bg-[#fbfbfa] p-4">
            <p className="break-all font-mono text-sm text-[#191917]">{issuedKey}</p>
            <p className="text-sm text-[#a14637]">
              Copy it now. Stored records only keep a hash and the last 4 characters.
            </p>
          </div>
        </DashboardCard>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr),320px]">
        <DashboardCard
          title="Agents"
          description="Select an agent to inspect keys. Create flows stay tucked away until you ask for them."
          action={
            <button
              type="button"
              className={primaryButtonClass}
              onClick={() => setShowCreateForm(true)}
            >
              New agent
            </button>
          }
        >
          <div className="space-y-4">
            <div>
              <SectionEyebrow>Identities</SectionEyebrow>
              <p className="mt-2 text-sm leading-6 text-[#6b6b67]">
                Agent-specific behavior now starts with the agent itself. Owner entry is gone.
              </p>
            </div>

            {agents.length === 0 ? (
              <EmptyState
                label="No agents created yet."
                detail="Create an agent to issue its first bearer key."
              />
            ) : (
              <DataTable>
                <div className="hidden items-center gap-4 border-b border-[#efefee] px-4 py-3 text-xs font-medium uppercase tracking-wide text-[#8a8a86] lg:flex">
                  <span className="min-w-0 flex-1">Agent</span>
                  <span className="w-40 shrink-0">Tags</span>
                  <span className="w-28 shrink-0">Status</span>
                  <span className="w-40 shrink-0">Last seen</span>
                </div>
                <div className="divide-y divide-[#efefee] bg-white">
                  {agents.map((agent) => (
                    <a
                      key={agent.id}
                      href={`/agents?agentId=${agent.id}`}
                      className={`flex flex-col gap-4 px-4 py-4 transition hover:bg-[#fbfbfa] lg:flex-row lg:items-start ${
                        selectedAgent?.id === agent.id ? "bg-[#f7f7f5]" : ""
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-[#191917]">{agent.name}</p>
                        <p className="mt-1 text-xs text-[#6b6b67]">{agent.id}</p>
                      </div>
                      <div className="text-sm text-[#6b6b67] lg:w-40 lg:shrink-0">
                        {agent.tags.join(", ") || "No tags"}
                      </div>
                      <div className="lg:w-28 lg:shrink-0">
                        <StatusBadge status={agent.status} />
                      </div>
                      <div className="text-sm text-[#6b6b67] lg:w-40 lg:shrink-0">
                        {agent.lastSeenAt ? formatDate(agent.lastSeenAt) : "Never"}
                      </div>
                    </a>
                  ))}
                </div>
              </DataTable>
            )}
          </div>
        </DashboardCard>

        <DashboardCard title="Quick actions" description="Create only when you need to.">
          <div className="space-y-3 text-sm text-[#6b6b67]">
            <p>Agent onboarding stays lightweight: name, optional tags, one-time key display.</p>
            <p>Open an agent row to manage its live keys and lifecycle.</p>
          </div>
        </DashboardCard>
      </div>

      <DashboardCard
        title={selectedAgent ? selectedAgent.name : "Agent detail"}
        description={
          selectedAgent
            ? "Key rotation preserves identity-level history while allowing overlap during rollout."
            : "Pick an agent to inspect its keys."
        }
        action={
          selectedAgent ? (
            <div className="flex gap-2">
              <form action={createAgentKey}>
                <input type="hidden" name="agentId" value={selectedAgent.id} />
                <button className={secondaryButtonClass}>Add key</button>
              </form>
              <form action={selectedAgent.status === "active" ? suspendAgent : activateAgent}>
                <input type="hidden" name="agentId" value={selectedAgent.id} />
                <button className={secondaryButtonClass}>
                  {selectedAgent.status === "active" ? "Suspend" : "Activate"}
                </button>
              </form>
            </div>
          ) : null
        }
      >
        {!selectedAgent ? (
          <EmptyState label="Select an agent" detail="Its masked keys and actions will appear here." />
        ) : selectedKeys.length === 0 ? (
          <EmptyState label="No keys issued." detail="Add a key to rotate credentials without downtime." />
        ) : (
          <DataTable>
            <div className="hidden items-center gap-4 border-b border-[#efefee] px-4 py-3 text-xs font-medium uppercase tracking-wide text-[#8a8a86] lg:flex">
              <span className="min-w-0 flex-1">Key</span>
              <span className="w-28 shrink-0">Status</span>
              <span className="w-40 shrink-0">Created</span>
              <span className="w-40 shrink-0">Actions</span>
            </div>
            <div className="divide-y divide-[#efefee] bg-white">
              {selectedKeys.map((key) => (
                <div key={key.id} className="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-start">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[#191917]">••••{key.last4}</p>
                    <p className="mt-1 text-xs text-[#6b6b67]">
                      {key.revokedAt ? `Revoked ${formatDate(key.revokedAt)}` : "Plaintext hidden after issue"}
                    </p>
                  </div>
                  <div className="lg:w-28 lg:shrink-0">
                    <StatusBadge status={key.status} />
                  </div>
                  <div className="text-sm text-[#6b6b67] lg:w-40 lg:shrink-0">
                    {formatDate(key.createdAt)}
                  </div>
                  <div className="flex gap-2 lg:w-40 lg:shrink-0">
                    <form action={rotateAgentKey}>
                      <input type="hidden" name="agentId" value={selectedAgent.id} />
                      <input type="hidden" name="keyId" value={key.id} />
                      <button className={secondaryButtonClass} disabled={key.status !== "active"}>
                        Rotate
                      </button>
                    </form>
                    <form action={revokeAgentKey}>
                      <input type="hidden" name="agentId" value={selectedAgent.id} />
                      <input type="hidden" name="keyId" value={key.id} />
                      <button className={secondaryButtonClass} disabled={key.status !== "active"}>
                        Revoke
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </DataTable>
        )}
      </DashboardCard>

      <DashboardModal
        open={showCreateForm}
        title="Add agent"
        description="Name it, add optional tags, and issue the first key."
        onClose={() => setShowCreateForm(false)}
      >
        <form
          action={createAgent}
          className="grid gap-3"
          onSubmit={() => setShowCreateForm(false)}
        >
          <DashboardField label="Agent name">
            <input name="name" required className={inputClass} placeholder="Payments agent" />
          </DashboardField>
          <DashboardField label="Tags" hint="Comma-separated">
            <input name="tags" className={inputClass} placeholder="finance, approvals" />
          </DashboardField>
          <div className="flex justify-end gap-2">
            <button type="button" className={secondaryButtonClass} onClick={() => setShowCreateForm(false)}>
              Cancel
            </button>
            <button className={primaryButtonClass}>Create agent</button>
          </div>
        </form>
      </DashboardModal>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
