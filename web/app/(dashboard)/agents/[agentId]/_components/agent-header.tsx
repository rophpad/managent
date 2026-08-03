"use client";

import { Ban, Info, Settings } from "lucide-react";
import { useState } from "react";
import { AGENT_STATUS_TONE, Badge } from "@/components/ui/badge";
import { Button, IconButton } from "@/components/ui/button";
import { Modal, ModalBody } from "@/components/ui/modal";
import { StatRow } from "@/components/ui/rows";
import { AGENT_STATUS_LABEL } from "@/lib/data/agents";
import type { Agent, Resource } from "@/lib/types";
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
  const [infoOpen, setInfoOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
          <p className="max-w-[520px] text-[13.5px] text-muted">
            Owned by {agent.owner} · created {agent.createdDaysAgo} days ago
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Badge tone={AGENT_STATUS_TONE[agent.status]}>{AGENT_STATUS_LABEL[agent.status]}</Badge>
          <Button size="sm" onClick={() => setSettingsOpen(true)}>
            <Settings aria-hidden className="size-[15px]" />
            Settings
          </Button>
          <Button size="sm" variant="danger" disabled={agent.status === "revoked"}>
            <Ban aria-hidden className="size-[15px]" />
            Revoke
          </Button>
        </div>
      </div>

      <Modal
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        title="Agent info"
        icon={<Info />}
      >
        <ModalBody>
          <StatRow label="Token">
            <span className="font-mono">{agent.tokenPreview}</span>
          </StatRow>
          <StatRow label="Owner">{agent.ownerEmail}</StatRow>
          <StatRow label="First seen">{agent.createdDaysAgo} days ago</StatRow>
          <StatRow label="Last active">{agent.lastActive}</StatRow>
          <StatRow label="Status">
            <Badge tone={AGENT_STATUS_TONE[agent.status]}>{AGENT_STATUS_LABEL[agent.status]}</Badge>
          </StatRow>
        </ModalBody>
      </Modal>

      <AgentSettingsModal
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
