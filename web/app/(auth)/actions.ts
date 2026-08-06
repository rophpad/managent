"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendRequest, BackendError, SESSION_COOKIE } from "@/lib/backend";

type AuthResponse = {
  token: string;
  expiresAt: string;
};

async function authenticate(path: "login" | "signup", formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const page = path === "signup" ? "/register" : "/login";
  const fail = (message: string): never =>
    redirect(page + "?error=" + encodeURIComponent(message));

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fail("Enter a valid work email address.");
  }
  if (!password) fail("Enter your password.");
  if (path === "signup") {
    if (name.length < 2) fail("Enter your full name.");
    if (password.length < 8) fail("Use at least 8 characters for your password.");
    if (formData.get("terms") !== "on") fail("Accept the Terms of Service to continue.");
  }
  let result: AuthResponse | undefined;
  try {
    result = await backendRequest<AuthResponse>(
      `/api/v1/auth/${path}`,
      {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      },
      false,
    );
  } catch (error) {
    const message = error instanceof BackendError ? error.message : "Unable to connect to Managent";
    fail(message);
  }
  if (!result) redirect(page + "?error=" + encodeURIComponent("Unable to authenticate."));
  (await cookies()).set(SESSION_COOKIE, result.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(result.expiresAt),
  });
  redirect("/agents");
}

export async function loginAction(formData: FormData) {
  return authenticate("login", formData);
}

export async function registerAction(formData: FormData) {
  return authenticate("signup", formData);
}

export async function logoutAction() {
  try {
    await backendRequest<void>("/api/v1/auth/logout", { method: "POST" });
  } catch {
    // Clear the local cookie even when the session has already expired.
  }
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
