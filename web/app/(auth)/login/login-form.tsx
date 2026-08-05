"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export function LoginForm() {
  const router = useRouter();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push("/agents");
  }

  return (
    <form onSubmit={submit}>
      <Field label="Work email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@company.com" required />
      </Field>
      <Field
        label={
          <span className="flex items-center justify-between gap-4">
            Password
            <Link href="#" className="text-xs font-normal text-brand hover:underline">Forgot password?</Link>
          </span>
        }
        htmlFor="password"
      >
        <Input id="password" name="password" type="password" autoComplete="current-password" placeholder="Enter your password" required />
      </Field>
      <label className="mb-5 flex w-fit items-center gap-2.5 text-[13px] text-muted">
        <input name="remember" type="checkbox" className="size-4 rounded border-line bg-panel-2 accent-brand" />
        Keep me logged in
      </label>
      <Button type="submit" variant="primary" className="w-full justify-center py-2.75">Log in</Button>
    </form>
  );
}
