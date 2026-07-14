"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { request } from "./lib";

function revalidateDashboard() {
  revalidatePath("/dashboard", "layout");
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

function buildConnectorPayload(formData: FormData) {
  const args = String(formData.get("args") || "")
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean);

  return {
    name: String(formData.get("name") || ""),
    namespace: String(formData.get("namespace") || ""),
    transport: String(formData.get("transport") || "stdio"),
    command: String(formData.get("command") || ""),
    args,
    url: String(formData.get("url") || ""),
    headers: parseKeyValueLines(String(formData.get("headers") || "")),
    env: parseKeyValueLines(String(formData.get("env") || "")),
    secretEnv: parseKeyValueLines(String(formData.get("secretEnv") || "")),
    secretHeaders: parseKeyValueLines(String(formData.get("secretHeaders") || "")),
    enabled: String(formData.get("enabled") || "true") === "true",
  };
}

export async function createApiKey() {
  const result = await request<{ rawToken?: string }>("/api/v1/api-keys", {
    method: "POST",
    body: JSON.stringify({}),
  });

  revalidateDashboard();
  redirect(
    `/dashboard/settings?issuedKey=${encodeURIComponent(
      String(result.rawToken || ""),
    )}`,
  );
}

export async function createConnector(formData: FormData) {
  await request("/api/v1/connectors", {
    method: "POST",
    body: JSON.stringify(buildConnectorPayload(formData)),
  });

  revalidateDashboard();
}

export async function updateConnector(formData: FormData) {
  const id = String(formData.get("id") || "");

  await request(`/api/v1/connectors/${id}/update`, {
    method: "POST",
    body: JSON.stringify(buildConnectorPayload(formData)),
  });

  revalidateDashboard();
}

export async function reconnectConnector(formData: FormData) {
  const id = String(formData.get("id") || "");

  await request(`/api/v1/connectors/${id}/reconnect`, {
    method: "POST",
    body: JSON.stringify({}),
  });

  revalidateDashboard();
}

export async function connectConnector(formData: FormData) {
  const id = String(formData.get("id") || "");

  await request(`/api/v1/connectors/${id}/connect`, {
    method: "POST",
    body: JSON.stringify({}),
  });

  revalidateDashboard();
}

export async function disconnectConnector(formData: FormData) {
  const id = String(formData.get("id") || "");

  await request(`/api/v1/connectors/${id}/disconnect`, {
    method: "POST",
    body: JSON.stringify({}),
  });

  revalidateDashboard();
}

export async function installMarketplaceListing(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const transportOption = String(formData.get("transportOption") || "");
  const name = String(formData.get("name") || "");
  const namespace = String(formData.get("namespace") || "");
  const values: Record<string, string> = {};

  for (const [key, value] of formData.entries()) {
    if (key === "slug" || key === "transportOption" || key === "name" || key === "namespace") {
      continue;
    }
    values[key] = String(value || "");
  }

  await request("/api/v1/marketplace", {
    method: "POST",
    body: JSON.stringify({ slug, transportOption, name, namespace, values }),
  });

  revalidateDashboard();
}

export async function createPolicy(formData: FormData) {
  const field = String(formData.get("field") || "").trim();
  const operator = String(formData.get("operator") || "eq").trim();
  const value = String(formData.get("value") || "").trim();
  const conditions: Record<string, Record<string, string | number>> = {};

  if (field) {
    const normalizedValue = /^-?\d+(\.\d+)?$/.test(value) ? Number(value) : value;
    conditions[field] = { [operator]: normalizedValue };
  }

  await request("/api/v1/policies", {
    method: "POST",
    body: JSON.stringify({
      name: String(formData.get("name") || ""),
      tool: String(formData.get("tool") || ""),
      action: String(formData.get("action") || "deny"),
      conditions,
    }),
  });

  revalidateDashboard();
}
