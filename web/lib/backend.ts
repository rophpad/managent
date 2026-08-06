import "server-only";

import { cookies } from "next/headers";

const SESSION_COOKIE = "managent_session";

function apiBaseUrl() {
  return process.env.MANAGENT_API_BASE_URL ?? "http://127.0.0.1:8081";
}

async function bearerToken() {
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  return session || process.env.MANAGENT_ADMIN_TOKEN || "";
}

export class BackendError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}

export function getCurrentUser(): Promise<CurrentUser> {
  return backendRequest<CurrentUser>("/api/v1/auth/me");
}

export async function backendRequest<T>(
  path: string,
  init: RequestInit = {},
  authenticated = true,
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body) headers.set("Content-Type", "application/json");
  if (authenticated) {
    const token = await bearerToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${apiBaseUrl()}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new BackendError(payload?.error ?? `Backend request failed (${response.status})`, response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export { SESSION_COOKIE };
