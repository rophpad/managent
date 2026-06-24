import Image from "next/image";

const anxieties = [
  {
    title: "The Prompt Lie",
    body: 'You write "Never refund more than $100" inside your LangChain system prompt, but you know deep down a basic jailbreak or user-injection can completely bypass it.',
  },
  {
    title: "The Credentials Mess",
    body: "Your developers are copy-pasting live production Stripe, HubSpot, or SQL database tokens directly into random agent scripts and GitHub repositories.",
  },
  {
    title: "The Loop-Death Fear",
    body: "You leave a CrewAI or AutoGen loop running unsupervised, only to wake up to a $500 token bill because the agent got stuck in an infinite try-and-fail loop.",
  },
  {
    title: "The CISO Block",
    body: "Your security team won't let you deploy your agent because they refuse to route sensitive corporate data and internal conversation logs through an external third-party text proxy.",
  },
];

const controls = [
  {
    label: "Deterministic Parameter Guardrails",
    command: "stripe__issue_refund.amount <= 100",
    body: "If an LLM commands an action outside that boundary, Managent drops the packet at the network layer and passes a native error block back to your running framework.",
  },
  {
    label: "Network-Level Stream Freezing",
    command: "slack.approval.required = true",
    body: "When an agent requests a high-stakes mutation, Managent long-polls the connection and dispatches an interactive card to Slack. The code thread resumes only after a human clicks Approve.",
  },
  {
    label: "Virtual Token Vaulting",
    command: "proxy_token -> encrypted_secret",
    body: "Your codebase handles temporary proxy tokens while Managent securely injects the real production API secrets into payload headers mid-flight.",
  },
];

const blockers = [
  "Data Privacy",
  "Financial Risk / Hallucinated spending",
  "Cost / API loops",
  "Credential management",
];

const heroBenefits = [
  "Deterministic policies",
  "Human approvals",
  "Vaulted credentials",
  "Audit trails",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f8f7f2] text-[#11140f]">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-5 px-6 py-6 text-center lg:px-8">
        {/*<a
          href="#top"
          className="text-xl font-semibold"
          aria-label="Managent home"
        >
          Managent
        </a>*/}
        <Image src="/logo.png" alt="Managent logo" width={100} height={100} className=""/>
        <nav className="hidden items-center justify-center gap-8 text-sm font-medium text-[#565b50] md:flex">
          <a className="transition hover:text-[#11140f]" href="#problem">
            Problem
          </a>
          <a className="transition hover:text-[#11140f]" href="#solution">
            Solution
          </a>
          <a className="transition hover:text-[#11140f]" href="#beta">
            Beta
          </a>
        </nav>
        <a
          href="#beta"
          className="rounded-full bg-[#11140f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2d3329]"
        >
          Early access
        </a>
      </header>

      <section
        id="top"
        className="mx-auto flex w-full max-w-6xl flex-col items-center px-6 pb-20 pt-10 text-center lg:px-8 lg:pb-28 lg:pt-16"
      >
        <p className="mb-5 rounded-full border border-[#d9d6c8] bg-white px-4 py-2 text-sm font-semibold text-[#345436]">
          Open-source MCP tool gateway
        </p>
        <h1 className="mt-6 max-w-4xl text-4xl font-medium leading-[1.02] text-[#11140f] sm:text-5xl lg:text-6xl">
          The control plane for your autonomous workforce.
        </h1>
        <p className="mt-5 max-w-4xl text-xl leading-8 text-[#3d4238]">
          Managent sits between AI agents and the tools they use, validating
          every action before it reaches Stripe, databases, Slack, or internal
          APIs. Enforce policy, pause risky calls for approval, and keep
          production keys out of agent code.
        </p>

        <div className="mt-5 flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="#beta"
            className="inline-flex w-max items-center justify-center rounded-full bg-[#11140f] px-6 py-3 text-base font-semibold text-white transition hover:bg-[#2d3329]"
          >
            Join the Beta
          </a>
          <a
            href="#problem"
            className="inline-flex w-max items-center justify-center rounded-full border border-[#cfcabb] bg-white px-6 py-3 text-base font-semibold text-[#11140f] transition hover:border-[#11140f]"
          >
            See how it protects production
          </a>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-2 text-sm font-medium text-[#565b50]">
          {heroBenefits.map((item) => (
            <span
              key={item}
              className="rounded-full border border-[#d9d6c8] bg-white px-3 py-1.5"
            >
              {item}
            </span>
          ))}
        </div>

        <div className="mt-14 w-full max-w-4xl rounded-lg border border-[#d8d4c5] bg-white p-4 text-left shadow-[0_24px_80px_rgba(17,20,15,0.10)] sm:p-6">
          <div className="rounded-lg border border-[#e7e3d5] bg-[#fbfaf6] p-5">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#e2dece] pb-4">
              <div>
                <p className="text-sm font-semibold text-[#345436]">
                  MCP tool call review
                </p>
                <h2 className="mt-1 text-2xl font-semibold">
                  High-risk action paused
                </h2>
              </div>
              <span className="rounded-full bg-[#e7efe3] px-3 py-1 text-sm font-semibold text-[#345436]">
                Needs approval
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-[#e4dfd0] bg-white p-4">
                <p className="text-sm font-semibold text-[#345436]">Request</p>
                <p className="mt-2 text-sm leading-6 text-[#565b50]">
                  Agent requests a Stripe refund for $10,000
                </p>
              </div>
              <div className="rounded-lg border border-[#e4dfd0] bg-white p-4">
                <p className="text-sm font-semibold text-[#345436]">Policy</p>
                <p className="mt-2 text-sm leading-6 text-[#565b50]">
                  Rule: pause refunds over $100 for human approval
                </p>
              </div>
              <div className="rounded-lg border border-[#e4dfd0] bg-white p-4">
                <p className="text-sm font-semibold text-[#345436]">Routing</p>
                <p className="mt-2 text-sm leading-6 text-[#565b50]">
                  Routed to approval through Slack
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-lg bg-[#11140f] p-5 text-white">
              <p className="text-sm font-medium text-[#dfe7d9]">
                Validated automatically
              </p>
              <p className="mt-2 text-3xl font-semibold">&lt;10ms</p>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-[#e8eee3]">
                Socket held. Audit event logged. Real API key stays vaulted.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="problem"
        className="border-y border-[#e3dfd0] bg-white py-20"
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center px-6 text-center lg:px-8">
          <SectionIntro
            eyebrow="Do you relate?"
            title="We love AI agents. But we are terrified to give them production keys."
            description="Does your current agent workflow look like this?"
          />
          <div className="mt-10 grid w-full gap-6 md:grid-cols-2">
            {anxieties.map((item) => (
              <ProblemCard
                key={item.title}
                title={item.title}
                body={item.body}
              />
            ))}
          </div>
        </div>
      </section>

      <section
        id="solution"
        className="mx-auto flex max-w-6xl flex-col items-center px-6 py-20 text-center lg:px-8"
      >
        <SectionIntro
          eyebrow="The infrastructure answer"
          title="Managent firewalls the AI's hands, not its brain."
          description="Stop trying to bury production policy inside natural language. Put every tool call through a gateway that can inspect parameters, freeze risky streams, and inject secrets without exposing them to agent code."
        />
        <div className="mt-10 grid w-full gap-5 lg:grid-cols-3">
          {controls.map((item) => (
            <ControlCard
              key={item.label}
              title={item.label}
              command={item.command}
              body={item.body}
            />
          ))}
        </div>
      </section>

      <section id="beta" className="border-t border-[#e3dfd0] bg-white py-20">
        <div className="mx-auto flex max-w-4xl flex-col items-center px-6 text-center lg:px-8">
          <SectionIntro
            eyebrow="Help us prioritize the roadmap"
            title="Tell us what is blocking your production agent rollout."
            description="We are measuring the exact failure mode: prompt-only permissions, hallucinated tool execution, runaway loops, exposed credentials, and security review dead ends."
          />

          <form className="mt-10 w-full max-w-2xl rounded-lg border border-[#d8d4c5] bg-white p-6 text-left shadow-[0_18px_60px_rgba(17,20,15,0.06)] sm:p-8">
            <div className="grid gap-5">
              <label className="grid gap-2">
                <span className="text-sm font-semibold leading-5 text-[#11140f]">
                  Work email
                </span>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="you@company.com"
                  className="min-h-12 w-full rounded-lg border border-[#d8d4c5] bg-[#fbfaf6] px-4 text-base outline-none transition focus:border-[#345436] focus:ring-4 focus:ring-[#e7efe3]"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold leading-5 text-[#11140f]">
                  Which AI framework are you currently building with?
                </span>
                <select
                  name="framework"
                  defaultValue=""
                  required
                  className="min-h-12 w-full rounded-lg border border-[#d8d4c5] bg-[#fbfaf6] px-4 text-base outline-none transition focus:border-[#345436] focus:ring-4 focus:ring-[#e7efe3]"
                >
                  <option value="" disabled>
                    Select a framework
                  </option>
                  <option>CrewAI</option>
                  <option>LangChain</option>
                  <option>AutoGen</option>
                  <option>Custom Script</option>
                  <option>Cursor / IDE</option>
                </select>
              </label>

              <fieldset className="grid gap-3">
                <legend className="text-sm font-semibold leading-5 text-[#11140f]">
                  What is your biggest blocker to putting agents in production?
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {blockers.map((blocker) => (
                    <label
                      key={blocker}
                      className="flex min-h-12 items-center gap-3 rounded-lg border border-[#d8d4c5] bg-[#fbfaf6] px-4 py-3 text-sm font-medium leading-5 text-[#565b50] transition hover:border-[#11140f]"
                    >
                      <input
                        type="checkbox"
                        name="blocker"
                        value={blocker}
                        className="size-4 shrink-0 accent-[#345436]"
                      />
                      <span>{blocker}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <button
                type="submit"
                className="min-h-12 w-full rounded-full bg-[#11140f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2d3329] focus:outline-none focus:ring-4 focus:ring-[#d8d4c5]"
              >
                Join the Beta
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

function SectionIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-sm font-semibold uppercase text-[#345436]">
        {eyebrow}
      </p>
      <h2 className="mt-4 text-4xl font-semibold leading-tight text-[#11140f]">
        {title}
      </h2>
      <p className="mt-4 text-lg leading-8 text-[#565b50]">{description}</p>
    </div>
  );
}

function ProblemCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-lg border border-[#e4dfd0] bg-[#fbfaf6] p-6 text-center">
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-4 leading-7 text-[#565b50]">{body}</p>
    </article>
  );
}

function ControlCard({
  title,
  command,
  body,
}: {
  title: string;
  command: string;
  body: string;
}) {
  return (
    <article className="rounded-lg border border-[#d8d4c5] bg-white p-6 text-center shadow-[0_18px_60px_rgba(17,20,15,0.06)]">
      <code className="mx-auto block w-fit max-w-full break-all rounded-lg border border-[#d8d4c5] bg-[#11140f] px-3 py-2 font-mono text-xs font-semibold text-[#dfe7d9]">
        {command}
      </code>
      <h3 className="mt-5 text-2xl font-semibold leading-tight">{title}</h3>
      <p className="mt-4 leading-7 text-[#565b50]">{body}</p>
    </article>
  );
}
