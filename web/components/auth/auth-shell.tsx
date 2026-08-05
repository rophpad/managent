import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Check, ShieldCheck } from "lucide-react";

const assurances = [
  "Policy checks before every tool call",
  "Human approval for sensitive actions",
  "A searchable audit trail by default",
];

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main className="w-full grid min-h-dvh bg-ink text-fg ">
      <section className="w-full flex min-h-dvh flex-col px-5 py-6 sm:px-8 lg:px-12">
        {/* <Link
          href="/"
          aria-label="Managent home"
          className="w-fit rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
        >
          <Image
            src="/logo1.svg"
            alt="Managent"
            width={100}
            height={100}
            className="h-auto w-25 brightness-0 invert"
            priority
          />
        </Link> */}

        <Link href="/" className="flex items-center gap-2 px-2.5 pb-5.5 pt-1">
          <span
            aria-hidden
            className="size-4.5 shrink-0 rounded-[5px] bg-linear-to-br from-brand to-allow"
          />
          <span className="font-display text-base font-semibold">Managent</span>
        </Link>

        <div className="w-full flex items-center justify-center">
          <div className="mx-auto flex w-full max-w-105 flex-1 flex-col justify-center py-12">
            <div className="mb-7">
              {/* <p className="mb-3 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-brand">
              Secure agent access
            </p> */}
              <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-[34px]">
                {title}
              </h1>
              <p className="mt-2.5 text-[14px] leading-6 text-muted">{description}</p>
            </div>

            <div className="rounded-xl border border-line bg-panel p-5 shadow-[0_24px_70px_-40px_rgba(0,0,0,0.9)] sm:p-7">
              {children}
            </div>

            <p className="mt-6 text-center text-[13px] text-muted">{footer}</p>
          </div>
        </div>


        <p className="text-center text-[11px] text-muted-2 lg:text-left">
          Protected by Managent policy enforcement
        </p>
      </section>

      {/* <aside className="relative hidden overflow-hidden border-l border-line-soft bg-panel-2 lg:flex lg:items-center lg:justify-center lg:p-12">
        <div
          aria-hidden
          className="absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(600px 420px at 80% 20%, rgba(108,123,255,.16), transparent 68%), radial-gradient(400px 320px at 15% 85%, rgba(61,220,151,.08), transparent 70%)",
          }}
        />
        <div className="relative w-full max-w-105 rounded-2xl border border-line bg-ink/70 p-7 backdrop-blur-sm">
          <span className="mb-7 flex size-11 items-center justify-center rounded-xl border border-brand/30 bg-brand/9 text-brand">
            <ShieldCheck aria-hidden className="size-5.5" />
          </span>
          <h2 className="max-w-sm font-display text-2xl font-semibold leading-tight tracking-tight">
            Keep every agent inside the boundaries you define.
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            One control plane for identities, permissions, approvals, and evidence.
          </p>
          <ul className="mt-7 space-y-3 border-t border-line-soft pt-6">
            {assurances.map((assurance) => (
              <li key={assurance} className="flex items-center gap-3 text-[13px] text-muted">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-allow/8 text-allow">
                  <Check aria-hidden className="size-3" />
                </span>
                {assurance}
              </li>
            ))}
          </ul>
        </div>
      </aside> */}
    </main>
  );
}
