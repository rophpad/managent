import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Field, Hint, Input } from "@/components/ui/field";
import { registerAction } from "../actions";

export const metadata: Metadata = { title: "Create account — Managent" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <AuthShell
      title="Create your account"
      description="Start defining safe access boundaries for every agent in your organization."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form action={registerAction}>
        {error ? <p className="mb-4 text-[12.5px] text-deny">{error}</p> : null}
        <Field label="Full name" htmlFor="name">
          <Input
            id="name"
            name="name"
            autoComplete="name"
            placeholder="Ada Lovelace"
            required
          />
        </Field>
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
        <Field label="Password" htmlFor="password" className="mb-2">
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Create a password"
            minLength={8}
            required
          />
          <Hint>Use at least 8 characters.</Hint>
        </Field>
        <label className="mb-5 flex items-start gap-2.5 text-[12.5px] leading-5 text-muted">
          <input
            name="terms"
            type="checkbox"
            required
            className="mt-0.5 size-4 shrink-0 rounded border-line bg-panel-2 accent-brand"
          />
          <span>
            I agree to the{" "}
            <Link href="#" className="text-brand hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="#" className="text-brand hover:underline">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        <Button type="submit" variant="primary" className="w-full justify-center py-2.75">
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
