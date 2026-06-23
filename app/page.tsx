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

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f8f7f3] text-[#151617]">
      <section className="relative overflow-hidden border-b border-[#e7e1d6] bg-[#f8f7f3]">
        <div className="relative mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col px-4 py-6 sm:min-h-screen sm:px-8 sm:py-7 lg:px-10">
          <nav className="flex items-center justify-center sm:justify-between">
            <a
              href="#top"
              className="flex items-center gap-3"
              aria-label="Managent home"
            >
              <span className="grid size-9 place-items-center rounded-full bg-[#1f6f5b] text-sm font-semibold text-white shadow-sm shadow-[#1f6f5b]/20">
                M
              </span>
              <span className="text-sm font-semibold uppercase tracking-[0.18em] text-[#34383a]">
                managent
              </span>
            </a>
            <a
              href="#beta"
              className="hidden rounded-full border border-[#d8d2c7] bg-white/75 px-4 py-2 text-sm font-semibold text-[#34383a] shadow-sm transition hover:border-[#1f6f5b] hover:text-[#1f6f5b] sm:inline-flex"
            >
              Early access
            </a>
          </nav>

          <div
            id="top"
            className="flex flex-1 flex-col items-center justify-center gap-10 py-10 text-center lg:gap-12 lg:py-16"
          >
            <div className="mx-auto max-w-4xl text-center">
              <p className="mb-5 inline-flex max-w-full rounded-full border border-[#d8d2c7] bg-white/80 px-4 py-2 text-center text-xs font-semibold text-[#1f6f5b] shadow-sm sm:mb-6">
                Open-source MCP tool gateway
              </p>
              <h1 className="mx-auto max-w-4xl text-[2.65rem] font-semibold leading-[0.98] tracking-[-0.055em] text-[#111314] sm:text-6xl lg:text-7xl">
                The control plane for your autonomous workforce.
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-[#555b5f] sm:text-lg sm:leading-8">
                Managent sits between AI agents and the tools they use,
                validating every action before it reaches Stripe, databases,
                Slack, or internal APIs. Enforce policy, pause risky calls for
                approval, and keep production keys out of agent code.
              </p>
              <div className="mx-auto mt-8 flex w-full max-w-sm flex-col items-stretch justify-center gap-3 sm:max-w-none sm:flex-row sm:items-center lg:mt-9">
                <a
                  href="#beta"
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#1f6f5b] px-6 py-3 text-center text-sm font-semibold text-white shadow-sm shadow-[#1f6f5b]/20 transition hover:bg-[#185846] focus:outline-none focus:ring-4 focus:ring-[#cfe5dd] sm:w-auto"
                >
                  Join the Beta
                </a>
                <a
                  href="#problem"
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-[#d8d2c7] bg-white/80 px-6 py-3 text-center text-sm font-semibold text-[#34383a] shadow-sm transition hover:border-[#1f6f5b] hover:text-[#1f6f5b] focus:outline-none focus:ring-4 focus:ring-[#cfe5dd] sm:w-auto"
                >
                  See how it protects production
                </a>
              </div>
              <div className="mt-8 flex flex-wrap justify-center gap-2 text-sm font-medium text-[#555b5f]">
                {[
                  "Deterministic policies",
                  "Human approvals",
                  "Vaulted credentials",
                  "Audit trails",
                ].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-[#e1dbd0] bg-white/70 px-3 py-1.5 shadow-sm"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="mx-auto w-full max-w-4xl">
              <div className="rounded-[2rem] border border-[#ded8cc] bg-white/85 p-3 shadow-[0_24px_80px_rgba(31,46,39,0.14)] backdrop-blur sm:p-4">
                <div className="rounded-[1.5rem] bg-[#fbfaf7] p-5 sm:p-6 lg:p-7">
                  <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1f6f5b]">
                        MCP tool call review
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#151617]">
                        High-risk action paused
                      </h2>
                    </div>
                    <span className="rounded-full bg-[#fff0d5] px-3 py-1 text-xs font-semibold text-[#9a5a10]">
                      Needs approval
                    </span>
                  </div>

                  <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-[#e7e1d6] bg-white p-4 shadow-sm">
                    <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
                      <span className="grid size-10 place-items-center rounded-full bg-[#edf8f4] text-lg">
                        ↳
                      </span>
                      <div>
                        <p className="font-semibold text-[#151617]">
                          Agent requests a Stripe refund for $10,000
                        </p>
                        <p className="mt-1 text-sm text-[#6a7073]">
                          Rule: pause refunds over $100 for human approval
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mx-auto mt-4 grid max-w-2xl gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-[#e7e1d6] bg-white p-4">
                      <p className="text-sm font-semibold text-[#34383a]">
                        Validated automatically
                      </p>
                      <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#1f6f5b]">
                        &lt;10ms
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[#6a7073]">
                        Target latency overhead per tool call.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[#e7e1d6] bg-white p-4">
                      <p className="text-sm font-semibold text-[#34383a]">
                        Routed to approval
                      </p>
                      <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#c06b28]">
                        Slack
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[#6a7073]">
                        Interactive approve or deny workflow.
                      </p>
                    </div>
                  </div>

                  <div className="mx-auto mt-5 flex max-w-2xl flex-col items-center gap-3 rounded-2xl bg-[#173f35] p-4 text-center text-white sm:flex-row sm:justify-between sm:text-left">
                    <p className="text-sm leading-6 text-[#dcefe5]">
                      Socket held. Audit event logged. Real API key stays
                      vaulted.
                    </p>
                    <button
                      type="button"
                      className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#173f35]"
                    >
                      Review
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="problem"
        className="relative overflow-hidden border-b border-[#e7e1d6] bg-[#f8f7f3] px-4 py-16 sm:px-8 sm:py-24 lg:px-10"
      >
        <div className="relative mx-auto max-w-6xl text-center">
          <p className="inline-flex rounded-full border border-[#d8d2c7] bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#1f6f5b] shadow-sm">
            Do you relate?
          </p>
          <h2 className="mx-auto mt-5 max-w-3xl text-[2.4rem] font-semibold leading-[1.03] tracking-[-0.045em] text-[#111314] sm:text-5xl">
            We love AI agents. But we are terrified to give them production
            keys.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#555b5f] sm:text-lg sm:leading-8">
            Does your current agent workflow look like this?
          </p>

          <div className="mx-auto mt-10 grid max-w-5xl gap-4 text-left md:grid-cols-2">
            {anxieties.map((item) => (
              <article
                key={item.title}
                className="group rounded-[1.75rem] border border-[#e1dbd0] bg-white/80 p-3 shadow-[0_16px_50px_rgba(31,46,39,0.07)] backdrop-blur transition hover:-translate-y-1 hover:shadow-[0_22px_70px_rgba(31,46,39,0.11)]"
              >
                <div className="h-full rounded-[1.35rem] bg-[#fbfaf7] p-5 sm:p-6">
                  <div className="flex gap-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#fff0d5] text-sm font-semibold text-[#9a5a10] shadow-sm">
                      !
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold tracking-[-0.02em] text-[#151617] sm:text-xl">
                        {item.title}
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-[#555b5f] sm:text-base sm:leading-7">
                        {item.body}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-b border-[#e7e1d6] bg-[#fbfaf7] px-4 py-16 sm:px-8 sm:py-24 lg:px-10">
        <div className="relative mx-auto max-w-6xl text-center">
          <p className="inline-flex rounded-full border border-[#d8d2c7] bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#1f6f5b] shadow-sm">
            The infrastructure answer
          </p>
          <h2 className="mx-auto mt-5 max-w-3xl text-[2.4rem] font-semibold leading-[1.03] tracking-[-0.045em] text-[#111314] sm:text-5xl">
            Managent firewalls the AI&apos;s hands, not its brain.
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-[#555b5f] sm:text-lg sm:leading-8">
            Stop trying to bury production policy inside natural language. Put
            every tool call through a gateway that can inspect parameters,
            freeze risky streams, and inject secrets without exposing them to
            agent code.
          </p>

          <div className="mx-auto mt-10 rounded-[2rem] border border-[#ded8cc] bg-white/80 p-3 text-left shadow-[0_24px_80px_rgba(31,46,39,0.10)] backdrop-blur sm:p-4">
            <div className="grid gap-3 rounded-[1.5rem] bg-[#fbfaf7] p-3 sm:p-4 lg:grid-cols-3">
              {controls.map((item) => (
                <article
                  key={item.label}
                  className="rounded-[1.35rem] border border-[#e7e1d6] bg-white p-5 shadow-sm sm:p-6"
                >
                  <h3 className="text-lg font-semibold tracking-[-0.02em] text-[#151617] sm:text-xl">
                    {item.label}
                  </h3>
                  <code className="mt-4 block w-fit max-w-full break-all rounded-full border border-[#d7ece4] bg-[#edf8f4] px-3 py-2 font-mono text-[11px] font-semibold text-[#174c3f] sm:text-xs">
                    {item.command}
                  </code>
                  <p className="mt-4 leading-7 text-[#555b5f]">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="beta"
        className="relative overflow-hidden bg-[#fffdf7] px-4 py-16 sm:px-8 sm:py-24 lg:px-10"
      >
        <div className="relative mx-auto max-w-8xl text-center">
          <p className="inline-flex rounded-full border border-[#d8d2c7] bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#1f6f5b] shadow-sm">
            Help us prioritize the roadmap
          </p>
          <h2 className="mx-auto mt-5 max-w-3xl text-[2.4rem] font-semibold leading-[1.03] tracking-[-0.045em] text-[#111314] sm:text-5xl">
            Tell us what is blocking your production agent rollout.
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-[#555b5f] sm:text-lg sm:leading-8">
            We are measuring the exact failure mode: prompt-only permissions,
            hallucinated tool execution, runaway loops, exposed credentials, and
            security review dead ends.
          </p>

          <form className="mx-auto mt-10 max-w-2xl rounded-[2rem] border border-[#ded8cc] bg-white/85 p-3 text-left shadow-[0_24px_80px_rgba(31,46,39,0.12)] backdrop-blur sm:p-4">
            <div className="grid gap-5 rounded-[1.5rem] bg-[#fbfaf7] p-5 sm:p-7">
              <label className="grid gap-2">
                <span className="text-sm font-semibold leading-5 text-[#34383a]">
                  Work email
                </span>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="you@company.com"
                  className="min-h-12 w-full rounded-2xl border border-[#d8d2c7] bg-white px-4 text-base outline-none transition focus:border-[#1f6f5b] focus:ring-4 focus:ring-[#cfe5dd]"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold leading-5 text-[#34383a]">
                  Which AI framework are you currently building with?
                </span>
                <select
                  name="framework"
                  defaultValue=""
                  required
                  className="min-h-12 w-full rounded-2xl border border-[#d8d2c7] bg-white px-4 text-base outline-none transition focus:border-[#1f6f5b] focus:ring-4 focus:ring-[#cfe5dd]"
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
                <legend className="text-sm font-semibold leading-5 text-[#34383a]">
                  What is your biggest blocker to putting agents in production?
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {blockers.map((blocker) => (
                    <label
                      key={blocker}
                      className="flex min-h-12 items-center gap-3 rounded-2xl border border-[#d8d2c7] bg-white px-4 py-3 text-sm font-medium leading-5 text-[#34383a] shadow-sm transition hover:border-[#1f6f5b]/60"
                    >
                      <input
                        type="checkbox"
                        name="blocker"
                        value={blocker}
                        className="size-4 shrink-0 accent-[#1f6f5b]"
                      />
                      <span>{blocker}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <button
                type="submit"
                className="min-h-12 w-full rounded-full bg-[#1f6f5b] px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-[#1f6f5b]/20 transition hover:bg-[#185846] focus:outline-none focus:ring-4 focus:ring-[#cfe5dd]"
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
