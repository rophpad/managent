import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

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
      <form>
        <Field label="Work email" htmlFor="email">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            required
          />
        </Field>
        <Field
          label={
            <span className="flex items-center justify-between gap-4">
              Password
              <Link href="#" className="text-xs font-normal text-brand hover:underline">
                Forgot password?
              </Link>
            </span>
          }
          htmlFor="password"
        >
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            required
          />
        </Field>
        <label className="mb-5 flex w-fit items-center gap-2.5 text-[13px] text-muted">
          <input
            name="remember"
            type="checkbox"
            className="size-4 rounded border-line bg-panel-2 accent-brand"
          />
          Keep me logged in
        </label>
        <Button type="submit" variant="primary" className="w-full justify-center py-2.75">
          Log in
        </Button>
      </form>
    </AuthShell>
  );
}
