"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchFromApi, getApiUnavailableMessage } from "./server-api";

const SESSION_COOKIE = "managent_session";

async function authenticate(path: string, formData: FormData) {
  let response: Response;
  try {
    response = await fetchFromApi(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: String(formData.get("email") || ""),
        password: String(formData.get("password") || ""),
      }),
    });
  } catch (error) {
    console.error("Authentication request failed.", error);
    return { error: getApiUnavailableMessage() };
  }

  const rawBody = await response.text();
  let payload = {} as {
    error?: string;
    token?: string;
    expiresAt?: string;
  };
  try {
    payload = JSON.parse(rawBody) as typeof payload;
  } catch {
    payload = {
      error: rawBody
        ? rawBody.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
        : "Authentication failed",
    };
  }

  if (
    response.status === 404 &&
    (!payload.error || payload.error.toLowerCase().includes("page not found"))
  ) {
    payload.error =
      "Authentication backend is not available yet. Restart or rebuild the gateway service so the new auth routes are loaded.";
  }

  if (!response.ok || !payload.token) {
    return { error: payload.error || "Authentication failed" };
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, payload.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    expires: payload.expiresAt ? new Date(payload.expiresAt) : undefined,
  });
  return { error: "" };
}

export async function loginAction(formData: FormData) {
  const result = await authenticate("/api/v1/auth/login", formData);
  if (result.error) {
    redirect(`/login?error=${encodeURIComponent(result.error)}`);
  }
  redirect("/overview");
}

export async function signupAction(formData: FormData) {
  const result = await authenticate("/api/v1/auth/signup", formData);
  if (result.error) {
    redirect(`/signup?error=${encodeURIComponent(result.error)}`);
  }
  redirect("/overview");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/");
}
