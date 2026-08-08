"use client";

import { Ban, Info, RefreshCw, Settings, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AGENT_STATUS_TONE, Badge } from "@/components/ui/badge";
import { Button, IconButton } from "@/components/ui/button";
import { Modal, ModalBody } from "@/components/ui/modal";
import { StatRow } from "@/components/ui/rows";
import { TokenReveal } from "@/components/ui/token-reveal";
import { AGENT_STATUS_LABEL } from "@/lib/data/agents";
import type { Agent, Resource } from "@/lib/types";
import { deleteDashboardEntity, saveDashboardEntity } from "@/lib/client-api";
import { AgentSettingsModal, type ScopeRowData } from "./agent-settings-modal";

export function AgentHeader({
  agent,
  scopes,
  resources,
}: {
  agent: Agent;
  scopes: ScopeRowData[];
  resources: Resource[];
}) {
  const router = useRouter();
  const [infoOpen, setInfoOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [tokenPreview, setTokenPreview] = useState(agent.tokenPreview);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function deleteAgent() {
    if (!window.confirm(`Delete ${agent.name}? This permanently removes the agent and cannot be undone.`)) {
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteDashboardEntity("agents", agent.id);
      router.push("/agents");
      router.refresh();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Unable to delete agent");
      setDeleting(false);
    }
  }

  async function regenerateKey() {
    if (!window.confirm("Regenerate this agent key? The current key will stop working immediately.")) {
      return;
    }
    setRegenerating(true);
    setKeyError(null);
    try {
      const response = await fetch(
        `/api/agents/${encodeURIComponent(agent.id)}/regenerate-key`,
        { method: "POST" },
      );
      const result = await response.json() as { rawToken?: string; error?: string };
      if (!response.ok || !result.rawToken) {
        throw new Error(result.error ?? "The gateway did not return a new key");
      }
      const preview = `${result.rawToken.slice(0, 8)}...${result.rawToken.slice(-6)}`;
      await saveDashboardEntity("agents", { ...agent, tokenPreview: preview });
      setTokenPreview(preview);
      setNewToken(result.rawToken);
    } catch (error) {
      setKeyError(error instanceof Error ? error.message : "Unable to regenerate agent key");
    } finally {
      setRegenerating(false);
    }
  }
  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-mono text-[22px] font-semibold">{agent.name}</h1>
            <IconButton label="Agent info" onClick={() => setInfoOpen(true)}>
              <Info className="size-3.5" />
            </IconButton>
          </div>
          <p className="max-w-130 text-[13.5px] text-muted">
            Owned by {agent.owner} · created {agent.createdDaysAgo} days ago
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Badge tone={AGENT_STATUS_TONE[agent.status]}>{AGENT_STATUS_LABEL[agent.status]}</Badge>
          <Button size="sm" onClick={() => setSettingsOpen(true)}>
            <Settings aria-hidden className="size-3.75" />
            Settings
          </Button>
          <Button
            size="sm"
            variant="danger"
            disabled={agent.status === "revoked"}
            onClick={() => saveDashboardEntity("agents", { ...agent, status: "revoked" })}
          >
            <Ban aria-hidden className="size-3.75" />
            Revoke
          </Button>
        </div>
      </div>

      <Modal
        open={infoOpen}
        onClose={() => {
          setInfoOpen(false);
          setNewToken(null);
          setKeyError(null);
          setDeleteError(null);
        }}
        title="Agent info"
        icon={<Info />}
      >
        <ModalBody>
          <StatRow label="Token">
            <span className="font-mono">{tokenPreview}</span>
          </StatRow>
          <StatRow label="Owner">{agent.ownerEmail}</StatRow>
          <StatRow label="First seen">{agent.createdDaysAgo} days ago</StatRow>
          <StatRow label="Last active">{agent.lastActive}</StatRow>
          <StatRow label="Status">
            <Badge tone={AGENT_STATUS_TONE[agent.status]}>{AGENT_STATUS_LABEL[agent.status]}</Badge>
          </StatRow>
          <div className="mt-4 border-t border-line-soft pt-4">
            <Button
              size="sm"
              variant="danger"
              disabled={regenerating}
              onClick={regenerateKey}
            >
              <RefreshCw aria-hidden className="size-3.75" />
              {regenerating ? "Regenerating…" : "Regenerate agent key"}
            </Button>
            <p className="mt-2 text-xs text-muted-2">
              The current key is revoked immediately. The replacement is shown only once.
            </p>
            {keyError ? <p role="alert" className="mt-2 text-xs text-danger">{keyError}</p> : null}
            {newToken ? <TokenReveal token={newToken} /> : null}
          </div>
          <div className="mt-4 border-t border-danger-dim pt-4">
            <Button
              size="sm"
              variant="danger"
              disabled={deleting}
              onClick={deleteAgent}
            >
              <Trash2 aria-hidden className="size-3.75" />
              {deleting ? "Deleting…" : "Delete agent"}
            </Button>
            <p className="mt-2 text-xs text-muted-2">
              Permanently remove this agent and revoke its access. This can&apos;t be undone.
            </p>
            {deleteError ? <p role="alert" className="mt-2 text-xs text-danger">{deleteError}</p> : null}
          </div>
        </ModalBody>
      </Modal>

      <AgentSettingsModal
        agent={agent}
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        scopes={scopes}
        resources={resources}
        initialScopes={agent.scopes}
        initialMode={agent.enforcementMode}
        initialFailOpen={agent.failOpen}
      />
    </>
  );
}
