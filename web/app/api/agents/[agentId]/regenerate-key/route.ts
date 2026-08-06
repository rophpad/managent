import { BackendError, backendRequest } from "@/lib/backend";

interface GatewayAgent {
  id: string;
  name: string;
}

interface AgentKey {
  id: string;
  status: string;
}

function slug(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ agentId: string }> },
) {
  try {
    const { agentId } = await params;
    const agents = await backendRequest<{ items: GatewayAgent[] }>("/api/v1/agents");
    const agent = agents.items.find(
      (item) => item.id === agentId || slug(item.name) === agentId,
    );
    if (!agent) {
      return Response.json({ error: "Agent not found" }, { status: 404 });
    }

    const detail = await backendRequest<{ keys: AgentKey[] }>(
      `/api/v1/agents/${encodeURIComponent(agent.id)}/detail`,
      { method: "POST" },
    );
    const activeKey = detail.keys.find((key) => key.status === "active");
    const path = activeKey
      ? `/api/v1/agents/${encodeURIComponent(agent.id)}/keys/${encodeURIComponent(activeKey.id)}/rotate`
      : `/api/v1/agents/${encodeURIComponent(agent.id)}/keys`;
    const result = await backendRequest<{ rawToken: string }>(path, { method: "POST" });
    return Response.json(result);
  } catch (error) {
    const status = error instanceof BackendError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Unable to regenerate agent key";
    return Response.json({ error: message }, { status });
  }
}
