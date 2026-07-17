"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { request } from "./lib";

function revalidateDashboard() {
  revalidatePath("/overview", "layout");
}

function parseKeyValueLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, line) => {
      const [key, ...rest] = line.split("=");
      if (key && rest.length > 0) {
        acc[key.trim()] = rest.join("=").trim();
      }
      return acc;
    }, {});
}

function parseTags(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseJSONField(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  return JSON.parse(trimmed) as Record<string, unknown>;
}

function buildMCPPayload(formData: FormData) {
  const args = String(formData.get("args") || "")
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean);

  return {
    agentId: String(formData.get("agentId") || ""),
    name: String(formData.get("name") || ""),
    namespace: String(formData.get("namespace") || ""),
    transport: String(formData.get("transport") || "stdio"),
    endpoint: String(formData.get("endpoint") || ""),
    command: String(formData.get("command") || ""),
    args,
    url: String(formData.get("url") || ""),
    method: String(formData.get("method") || "POST"),
    urlTemplate: String(formData.get("urlTemplate") || ""),
    credentialName: String(formData.get("credentialName") || "Authorization"),
    credentialValue: String(formData.get("credentialValue") || ""),
    inputSchema: parseJSONField(String(formData.get("inputSchema") || "")),
    outputSchema: parseJSONField(String(formData.get("outputSchema") || "")),
    headers: parseKeyValueLines(String(formData.get("headers") || "")),
    env: parseKeyValueLines(String(formData.get("env") || "")),
    secretEnv: parseKeyValueLines(String(formData.get("secretEnv") || "")),
    secretHeaders: parseKeyValueLines(String(formData.get("secretHeaders") || "")),
    enabled: String(formData.get("enabled") || "true") === "true",
  };
}

export async function createAgent(formData: FormData) {
  const result = await request<{ rawToken?: string; agent?: { id: string } }>("/api/v1/agents", {
    method: "POST",
    body: JSON.stringify({
      name: String(formData.get("name") || ""),
      tags: parseTags(String(formData.get("tags") || "")),
    }),
  });

  revalidateDashboard();
  redirect(
    `/agents?issuedKey=${encodeURIComponent(String(result.rawToken || ""))}&agentId=${encodeURIComponent(String(result.agent?.id || ""))}`,
  );
}

export async function createAgentKey(formData: FormData) {
  const agentId = String(formData.get("agentId") || "");
  const result = await request<{ rawToken?: string }>(`/api/v1/agents/${agentId}/keys`, {
    method: "POST",
    body: JSON.stringify({}),
  });

  revalidateDashboard();
  redirect(
    `/agents?issuedKey=${encodeURIComponent(String(result.rawToken || ""))}&agentId=${encodeURIComponent(agentId)}`,
  );
}

export async function suspendAgent(formData: FormData) {
  const agentId = String(formData.get("agentId") || "");
  await request(`/api/v1/agents/${agentId}/suspend`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  revalidateDashboard();
}

export async function activateAgent(formData: FormData) {
  const agentId = String(formData.get("agentId") || "");
  await request(`/api/v1/agents/${agentId}/activate`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  revalidateDashboard();
}

export async function revokeAgentKey(formData: FormData) {
  const agentId = String(formData.get("agentId") || "");
  const keyId = String(formData.get("keyId") || "");
  await request(`/api/v1/agents/${agentId}/keys/${keyId}/revoke`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  revalidateDashboard();
}

export async function rotateAgentKey(formData: FormData) {
  const agentId = String(formData.get("agentId") || "");
  const keyId = String(formData.get("keyId") || "");
  const result = await request<{ rawToken?: string }>(`/api/v1/agents/${agentId}/keys/${keyId}/rotate`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  revalidateDashboard();
  redirect(
    `/agents?issuedKey=${encodeURIComponent(String(result.rawToken || ""))}&agentId=${encodeURIComponent(agentId)}`,
  );
}

export async function createMCP(formData: FormData) {
  await request("/api/v1/mcps", {
    method: "POST",
    body: JSON.stringify(buildMCPPayload(formData)),
  });
  revalidateDashboard();
}

export async function updateMCP(formData: FormData) {
  const id = String(formData.get("id") || "");
  await request(`/api/v1/mcps/${id}/update`, {
    method: "POST",
    body: JSON.stringify(buildMCPPayload(formData)),
  });
  revalidateDashboard();
}

export async function testMCP(formData: FormData) {
  await request("/api/v1/mcps/preview/test", {
    method: "POST",
    body: JSON.stringify(buildMCPPayload(formData)),
  });
  revalidateDashboard();
}

export async function reconnectMCP(formData: FormData) {
  const id = String(formData.get("id") || "");
  await request(`/api/v1/mcps/${id}/reconnect`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  revalidateDashboard();
}

export async function connectMCP(formData: FormData) {
  const id = String(formData.get("id") || "");
  await request(`/api/v1/mcps/${id}/connect`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  revalidateDashboard();
}

export async function disconnectMCP(formData: FormData) {
  const id = String(formData.get("id") || "");
  await request(`/api/v1/mcps/${id}/disconnect`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  revalidateDashboard();
}

export async function createPolicy(formData: FormData) {
  await request("/api/v1/policies", {
    method: "POST",
    body: JSON.stringify({
      name: String(formData.get("name") || ""),
      tool: String(formData.get("tool") || ""),
      actionName: String(formData.get("actionName") || "call"),
      effect: String(formData.get("effect") || "deny"),
      condition: {
        field: String(formData.get("field") || ""),
        operator: String(formData.get("operator") || "eq"),
        value: String(formData.get("value") || ""),
      },
      rateLimit: String(formData.get("rateLimit") || ""),
      channelOverride: String(formData.get("channelOverride") || ""),
      subjectType: "tag",
      subjectValue: "*",
    }),
  });
  revalidateDashboard();
}

export async function reorderPolicies(formData: FormData) {
  const ids = String(formData.get("ids") || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  await request("/api/v1/policies/reorder", {
    method: "POST",
    body: JSON.stringify({ ids }),
  });
  revalidateDashboard();
}

export async function saveApprovalIntegration(formData: FormData) {
  await request("/api/v1/approval-integrations", {
    method: "POST",
    body: JSON.stringify({
      provider: String(formData.get("provider") || ""),
      defaultChannel: String(formData.get("defaultChannel") || ""),
      webhookUrl: String(formData.get("webhookUrl") || ""),
      accessToken: String(formData.get("accessToken") || ""),
      signingSecret: String(formData.get("signingSecret") || ""),
      teamName: String(formData.get("teamName") || ""),
    }),
  });
  revalidateDashboard();
}
