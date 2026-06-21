const anxieties = [
  {
    title: "The Prompt Lie",
    body:
      "You write \"Never refund more than $100\" inside your LangChain system prompt, but you know deep down a basic jailbreak or user-injection can completely bypass it.",
  },
  {
    title: "The Credentials Mess",
    body:
      "Your developers are copy-pasting live production Stripe, HubSpot, or SQL database tokens directly into random agent scripts and GitHub repositories.",
  },
  {
    title: "The Loop-Death Fear",
    body:
      "You leave a CrewAI or AutoGen loop running unsupervised, only to wake up to a $500 token bill because the agent got stuck in an infinite try-and-fail loop.",
  },
  {
    title: "The CISO Block",
    body:
      "Your security team won't let you deploy your agent because they refuse to route sensitive corporate data and internal conversation logs through an external third-party text proxy.",
  },
];

const controls = [
  {
    label: "Deterministic Parameter Guardrails",
    command: "stripe__issue_refund.amount <= 100",
    body:
      "If an LLM commands an action outside that boundary, Managent drops the packet at the network layer and passes a native error block back to your running framework.",
  },
  {
    label: "Network-Level Stream Freezing",
    command: "slack.approval.required = true",
    body:
      "When an agent requests a high-stakes mutation, Managent long-polls the connection and dispatches an interactive card to Slack. The code thread resumes only after a human clicks Approve.",
  },
  {
    label: "Virtual Token Vaulting",
    command: "proxy_token -> encrypted_secret",
    body:
      "Your codebase handles temporary proxy tokens while Managent securely injects the real production API secrets into payload headers mid-flight.",
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
      <section className="overflow-hidden border-b border-[#e7e1d6] bg-[radial-gradient(circle_at_top,#ffffff_0%,#f8f7f3_48%,#f1eee7_100%)]">
        <div className="mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col px-4 py-6 sm:min-h-screen sm:px-8 sm:py-7 lg:px-10">
          <nav className="flex items-center justify-center sm:justify-between">
            <a href="#top" className="flex items-center gap-3" aria-label="Managent home">
              <span className="grid size-9 place-items-center rounded-md bg-[#1f6f5b] font-mono text-sm font-semibold text-white">
                M
              </span>
              <span className="font-mono text-sm font-semibold uppercase tracking-[0.18em] text-[#34383a]">managent</span>
            </a>
            <a
              href="#beta"
              className="hidden rounded-md border border-[#d8d2c7] bg-white/75 px-4 py-2 text-sm font-semibold text-[#34383a] shadow-sm transition hover:border-[#1f6f5b] hover:text-[#1f6f5b] sm:inline-flex"
            >
              Early access
            </a>
          </nav>

          <div id="top" className="flex flex-1 flex-col items-center justify-center gap-8 py-10 text-center sm:gap-10 sm:py-16">
            <div className="mx-auto w-full">
              <p className="mx-auto mb-5 inline-flex max-w-full rounded-full border border-[#d8d2c7] bg-white/80 px-3 py-2 text-center font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[#1f6f5b] shadow-sm sm:mb-6 sm:px-4 sm:text-xs sm:tracking-[0.16em]">
                MCP Tool Gateway for production agents
              </p>
              <h1 className="mx-auto max-w-6xl text-[2.45rem] font-semibold leading-[1.06] tracking-normal text-[#111314] sm:text-6xl sm:leading-[1.02] lg:text-7xl">
                Stop Prompt-Engineering Your Agent&apos;s Permissions.
              </h1>
              <p className="mx-auto mt-5 max-w-4xl text-base leading-7 text-[#555b5f] sm:mt-7 sm:text-xl sm:leading-8">
                Managent is an open-source MCP Tool Gateway that acts as a secure network firewall for your AI workforce. Stop worrying about your agents hallucinating a database wipe or an unauthorized $10,000 refund. Secure their capabilities at the infrastructure layer, not inside a fragile system prompt.
              </p>
              <div className="mx-auto mt-8 flex w-full max-w-sm flex-col items-stretch justify-center gap-3 sm:mt-9 sm:max-w-none sm:flex-row sm:items-center">
                <a
                  href="#beta"
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-[#1f6f5b] px-5 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-[#185846] focus:outline-none focus:ring-4 focus:ring-[#cfe5dd] sm:w-auto sm:px-6"
                >
                  Join the Beta
                </a>
                <a
                  href="#problem"
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-md border border-[#d8d2c7] bg-white/80 px-5 py-3 text-center text-sm font-semibold text-[#34383a] shadow-sm transition hover:border-[#1f6f5b] hover:text-[#1f6f5b] focus:outline-none focus:ring-4 focus:ring-[#cfe5dd] sm:w-auto sm:px-6"
                >
                  See the production risks
                </a>
              </div>
            </div>

            <div className="mx-auto w-full max-w-4xl rounded-lg border border-[#ded8cc] bg-white/90 p-2 text-left shadow-[0_18px_48px_rgba(31,46,39,0.10)] backdrop-blur sm:p-4 sm:shadow-[0_24px_70px_rgba(31,46,39,0.10)]">
              <div className="rounded-md border border-[#ebe5da] bg-[#101314] p-3 font-mono text-[11px] text-[#edf3ef] sm:p-4 sm:text-xs">
                <div className="mb-4 flex flex-col gap-2 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <span>managent/proxy</span>
                  <span className="w-fit rounded-full bg-[#d9f2e8] px-3 py-1 text-[#174c3f]">LIVE POLICY</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-md border border-white/10 bg-white/4 p-3">
                    <p className="text-[#8fd6bd]">ALLOW</p>
                    <p className="mt-2 break-all text-[13px] text-white sm:text-sm">github__create_issue</p>
                    <p className="mt-2 text-[#aeb8b4]">repo in [support, docs]</p>
                  </div>
                  <div className="rounded-md border border-[#eaa28e]/50 bg-[#2b1714] p-3">
                    <p className="text-[#ffb199]">DROP</p>
                    <p className="mt-2 break-all text-[13px] text-white sm:text-sm">stripe__issue_refund</p>
                    <p className="mt-2 text-[#ead7d0]">amount: 10000 &gt; max: 100</p>
                  </div>
                  <div className="rounded-md border border-[#e5d37d]/50 bg-[#292512] p-3">
                    <p className="text-[#f0d96e]">FREEZE</p>
                    <p className="mt-2 break-all text-[13px] text-white sm:text-sm">sql__execute_mutation</p>
                    <p className="mt-2 text-[#e8dfb9]">Slack approval required</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[#aeb8b4]">Framework receives a native MCP error block.</p>
                  <span className="w-fit rounded-full bg-white px-3 py-1 font-semibold text-[#101314]">No prompt trust</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="problem" className="border-b border-[#e7e1d6] px-4 py-14 sm:px-8 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-6xl text-center">
          <p className="font-mono text-sm font-semibold uppercase tracking-[0.18em] text-[#1f6f5b]">Do you relate?</p>
          <h2 className="mx-auto mt-4 max-w-3xl text-[2rem] font-semibold leading-tight tracking-normal sm:text-5xl">
            We love AI agents. But we are terrified to give them production keys.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#555b5f] sm:mt-5 sm:text-lg sm:leading-8">Does your current agent workflow look like this?</p>

          <div className="mx-auto mt-8 grid max-w-5xl gap-4 text-left sm:mt-10 md:grid-cols-2">
            {anxieties.map((item) => (
              <article key={item.title} className="rounded-lg border border-[#e1dbd0] bg-white p-5 shadow-sm sm:p-6">
                <div className="flex gap-3 sm:gap-4">
                  <span className="mt-1 grid size-7 shrink-0 place-items-center rounded-full bg-[#f3d8cf] text-sm font-semibold text-[#9b3e27]">
                    !
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-[#151617] sm:text-xl">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#555b5f] sm:text-base sm:leading-7">{item.body}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[#e7e1d6] bg-white px-4 py-14 sm:px-8 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-6xl text-center">
          <p className="font-mono text-sm font-semibold uppercase tracking-[0.18em] text-[#1f6f5b]">The infrastructure answer</p>
          <h2 className="mx-auto mt-4 max-w-3xl text-[2rem] font-semibold leading-tight tracking-normal sm:text-5xl">
            Managent firewalls the AI&apos;s hands, not its brain.
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-[#555b5f] sm:mt-5 sm:text-lg sm:leading-8">
            Stop trying to bury production policy inside natural language. Put every tool call through a gateway that can inspect parameters, freeze risky streams, and inject secrets without exposing them to agent code.
          </p>

          <div className="mx-auto mt-8 grid max-w-5xl gap-4 text-left sm:mt-10 lg:grid-cols-3">
            {controls.map((item) => (
              <article key={item.label} className="rounded-lg border border-[#e1dbd0] bg-[#fbfaf7] p-5 shadow-sm sm:p-6">
                <h3 className="text-lg font-semibold text-[#151617] sm:text-xl">{item.label}</h3>
                <code className="mt-4 block w-fit max-w-full break-all rounded-md border border-[#d7ece4] bg-[#edf8f4] px-3 py-2 font-mono text-[11px] font-semibold text-[#174c3f] sm:text-xs">
                  {item.command}
                </code>
                <p className="mt-4 leading-7 text-[#555b5f]">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="beta" className="px-4 py-14 sm:px-8 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-4xl text-center">
          <p className="font-mono text-sm font-semibold uppercase tracking-[0.18em] text-[#1f6f5b]">Help us prioritize the roadmap</p>
          <h2 className="mx-auto mt-4 max-w-3xl text-[2rem] font-semibold leading-tight tracking-normal sm:text-5xl">
            Tell us what is blocking your production agent rollout.
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-[#555b5f] sm:mt-5 sm:text-lg sm:leading-8">
            We are measuring the exact failure mode: prompt-only permissions, hallucinated tool execution, runaway loops, exposed credentials, and security review dead ends.
          </p>

          <form className="mx-auto mt-8 max-w-2xl rounded-lg border border-[#e1dbd0] bg-white p-4 text-left shadow-[0_14px_44px_rgba(31,46,39,0.08)] sm:mt-10 sm:p-8 sm:shadow-[0_18px_60px_rgba(31,46,39,0.08)]">
            <div className="grid gap-4 sm:gap-5">
              <label className="grid gap-2">
                <span className="text-sm font-semibold leading-5 text-[#34383a]">Work email</span>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="you@company.com"
                  className="min-h-12 w-full rounded-md border border-[#d8d2c7] bg-[#fbfaf7] px-3 text-base outline-none transition focus:border-[#1f6f5b] focus:ring-4 focus:ring-[#cfe5dd]"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold leading-5 text-[#34383a]">Which AI framework are you currently building with?</span>
                <select
                  name="framework"
                  defaultValue=""
                  required
                  className="min-h-12 w-full rounded-md border border-[#d8d2c7] bg-[#fbfaf7] px-3 text-base outline-none transition focus:border-[#1f6f5b] focus:ring-4 focus:ring-[#cfe5dd]"
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
                    <label key={blocker} className="flex min-h-12 items-center gap-3 rounded-md border border-[#d8d2c7] bg-[#fbfaf7] px-3 py-2 text-sm font-medium leading-5 text-[#34383a]">
                      <input type="checkbox" name="blocker" value={blocker} className="size-4 shrink-0 accent-[#1f6f5b]" />
                      <span>{blocker}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <button
                type="submit"
                className="min-h-12 w-full rounded-md bg-[#1f6f5b] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#185846] focus:outline-none focus:ring-4 focus:ring-[#cfe5dd]"
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
