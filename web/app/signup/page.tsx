import Link from "next/link";

import { signupAction } from "../auth-actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = (await searchParams) || {};
  return (
    <main className="min-h-screen bg-[#f8f7f2] px-4 py-10 text-[#11140f] sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr),420px]">
        <section className="space-y-4 self-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#345436]">Get started</p>
          <h1 className="text-4xl font-semibold leading-tight">Create your Managent account.</h1>
          <p className="max-w-xl text-base leading-7 text-[#565b50]">
            Sign up once, then head into the dashboard to configure agents, tools, and policy.
          </p>
        </section>

        <section className="rounded-lg border border-[#d8d4c5] bg-white p-6 shadow-[0_18px_60px_rgba(17,20,15,0.06)] sm:p-8">
          {params.error ? (
            <div className="mb-4 rounded-lg border border-[#efd8d6] bg-[#fcf4f3] px-4 py-3 text-sm text-[#a14637]">
              {decodeURIComponent(params.error)}
            </div>
          ) : null}
          <form action={signupAction} className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-[#11140f]">Email</span>
              <input
                type="email"
                name="email"
                required
                placeholder="you@company.com"
                className="min-h-12 rounded-lg border border-[#d8d4c5] bg-[#fbfaf6] px-4 text-base outline-none transition focus:border-[#345436] focus:ring-4 focus:ring-[#e7efe3]"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-[#11140f]">Password</span>
              <input
                type="password"
                name="password"
                required
                minLength={8}
                placeholder="At least 8 characters"
                className="min-h-12 rounded-lg border border-[#d8d4c5] bg-[#fbfaf6] px-4 text-base outline-none transition focus:border-[#345436] focus:ring-4 focus:ring-[#e7efe3]"
              />
            </label>
            <button
              type="submit"
              className="min-h-12 rounded-full bg-[#11140f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2d3329]"
            >
              Sign up
            </button>
          </form>

          <p className="mt-5 text-sm text-[#565b50]">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[#11140f]">
              Log in
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
