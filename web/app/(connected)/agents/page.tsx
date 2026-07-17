import { AgentsSection } from "@/components/dashboard/agents-section";
import { SectionEyebrow } from "@/components/dashboard/primitives";

import {
  activateAgent,
  createAgent,
  createAgentKey,
  revokeAgentKey,
  rotateAgentKey,
  suspendAgent,
} from "../actions";
import { getOverview, request } from "../lib";

export default async function DashboardAgentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ agentId?: string; issuedKey?: string }>;
}) {
  const overview = await getOverview();
  const params = (await searchParams) || {};
  const selectedAgent =
    overview.agents.find((agent) => agent.id === params.agentId) ||
    overview.agents[0] ||
    null;

  let selectedKeys: Array<{
    id: string;
    agentId: string;
    last4: string;
    status: string;
    createdAt: string;
    revokedAt?: string;
  }> = [];

  if (selectedAgent) {
    const detail = await request<{ keys: typeof selectedKeys }>(
      `/api/v1/agents/${selectedAgent.id}/detail`,
      {
        method: "POST",
        body: JSON.stringify({}),
      },
    );
    selectedKeys = detail.keys || [];
  }

  return (
    <>
      <section className="space-y-3">
        <SectionEyebrow>Agents</SectionEyebrow>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-[#191917]">
              Manage Agents
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6b6b67]">
              Create, manage, and monitor agent identities.
            </p>
          </div>
        </div>
      </section>
      <AgentsSection
        agents={overview.agents}
        selectedAgent={selectedAgent}
        selectedKeys={selectedKeys}
        issuedKey={params.issuedKey ? decodeURIComponent(params.issuedKey) : ""}
        createAgent={createAgent}
        createAgentKey={createAgentKey}
        suspendAgent={suspendAgent}
        activateAgent={activateAgent}
        revokeAgentKey={revokeAgentKey}
        rotateAgentKey={rotateAgentKey}
      />
    </>
  );
}
