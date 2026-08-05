import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in — Managent" };

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      description="Log in to manage your agents, resources, and policies."
      footer={
        <>
          New to Managent?{" "}
          <Link href="/register" className="font-medium text-brand hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
