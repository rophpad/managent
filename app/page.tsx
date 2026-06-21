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
    <main className="min-h-screen bg-[#f7f5ef] text-[#151515]">
      <section className="border-b border-[#d8d2c4] bg-[#fbfaf6]">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-12 lg:py-12">
          <div className="flex min-h-[calc(100vh-6rem)] flex-col justify-between gap-10 lg:min-h-[640px]">
            <nav className="flex items-center justify-between text-sm font-semibold">
              <a href="#top" className="flex items-center gap-3" aria-label="Managent home">
                <span className="grid size-9 place-items-center border border-[#151515] bg-[#d84f2a] font-mono text-sm text-white shadow-[3px_3px_0_#151515]">
                  M
                </span>
                <span className="font-mono uppercase tracking-[0.18em]">managent</span>
              </a>
              <a
                href="#beta"
                className="hidden border border-[#151515] bg-white px-4 py-2 shadow-[3px_3px_0_#151515] transition hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#151515] sm:inline-flex"
              >
                Early access
              </a>
            </nav>

            <div id="top" className="max-w-4xl">
              <p className="mb-5 inline-flex border border-[#151515] bg-[#e1f0d0] px-3 py-1 font-mono text-xs font-bold uppercase tracking-[0.18em]">
                MCP Tool Gateway for production agents
              </p>
              <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-normal text-[#151515] sm:text-6xl lg:text-7xl">
                Stop Prompt-Engineering Your Agent&apos;s Permissions.
              </h1>
              <p className="mt-7 max-w-3xl text-lg leading-8 text-[#383631] sm:text-xl">
                Managent is an open-source MCP Tool Gateway that acts as a secure network firewall for your AI workforce. Stop worrying about your agents hallucinating a database wipe or an unauthorized $10,000 refund. Secure their capabilities at the infrastructure layer, not inside a fragile system prompt.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#beta"
                  className="inline-flex min-h-12 items-center justify-center border border-[#151515] bg-[#151515] px-6 py-3 text-center text-sm font-black uppercase tracking-[0.08em] text-white shadow-[4px_4px_0_#d84f2a] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#d84f2a]"
                >
                  Join the Beta / Get Early Access to the Proxy
                </a>
                <a
                  href="#problem"
                  className="inline-flex min-h-12 items-center justify-center border border-[#151515] bg-white px-6 py-3 text-center text-sm font-black uppercase tracking-[0.08em] shadow-[4px_4px_0_#151515] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#151515]"
                >
                  See the production risks
                </a>
              </div>
            </div>

            <div className="grid gap-3 border-l-4 border-[#d84f2a] bg-white p-5 text-sm shadow-[6px_6px_0_#151515] sm:grid-cols-3">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#6c6559]">Block</p>
                <p className="mt-1 font-bold">Unsafe tool calls before execution</p>
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#6c6559]">Freeze</p>
                <p className="mt-1 font-bold">High-risk streams for human approval</p>
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#6c6559]">Vault</p>
                <p className="mt-1 font-bold">Production secrets outside agent code</p>
              </div>
            </div>
          </div>

          <div className="flex items-center lg:min-h-[640px]">
            <div className="w-full border border-[#151515] bg-[#151515] p-3 shadow-[10px_10px_0_#d84f2a]">
              <div className="border border-[#494949] bg-[#202020] p-4 font-mono text-xs text-[#f4efe2]">
                <div className="mb-4 flex items-center justify-between border-b border-[#494949] pb-3">
                  <span>managent/proxy</span>
                  <span className="bg-[#e1f0d0] px-2 py-1 text-[#151515]">LIVE POLICY</span>
                </div>
                <div className="space-y-3">
                  <div className="border border-[#5f5f5f] bg-[#111] p-3">
                    <p className="text-[#9ad18b]">ALLOW</p>
                    <p className="mt-2 break-words text-base">github__create_issue</p>
                    <p className="mt-2 text-[#b7b0a4]">repo in [customer-support, docs]</p>
                  </div>
                  <div className="border border-[#d84f2a] bg-[#2a1712] p-3">
                    <p className="text-[#ffb199]">DROP</p>
                    <p className="mt-2 break-words text-base">stripe__issue_refund</p>
                    <p className="mt-2 text-[#f4efe2]">amount: 10000 &gt; policy.max: 100</p>
                  </div>
                  <div className="border border-[#e6c84f] bg-[#2d2712] p-3">
                    <p className="text-[#ffe07a]">FREEZE</p>
                    <p className="mt-2 break-words text-base">sql__execute_mutation</p>
                    <p className="mt-2 text-[#f4efe2]">Slack approval required</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-[1fr_auto] gap-3 border-t border-[#494949] pt-4">
                  <p className="text-[#b7b0a4]">Framework receives native MCP error block.</p>
                  <span className="bg-[#d84f2a] px-2 py-1 font-bold text-white">NO PROMPT TRUST</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="problem" className="border-b border-[#d8d2c4] px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="font-mono text-sm font-bold uppercase tracking-[0.18em] text-[#d84f2a]">Do you relate?</p>
            <h2 className="mt-4 text-3xl font-black tracking-normal sm:text-5xl">
              We love AI agents. But we are terrified to give them production keys.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#4c4840]">Does your current agent workflow look like this?</p>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            {anxieties.map((item) => (
              <article key={item.title} className="border border-[#151515] bg-white p-5 shadow-[5px_5px_0_#151515]">
                <div className="flex gap-4">
                  <span className="mt-1 grid size-7 shrink-0 place-items-center border border-[#151515] bg-[#d84f2a] text-sm font-black text-white">
                    !
                  </span>
                  <div>
                    <h3 className="text-xl font-black">{item.title}</h3>
                    <p className="mt-2 leading-7 text-[#4c4840]">{item.body}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[#d8d2c4] bg-[#fbfaf6] px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="font-mono text-sm font-bold uppercase tracking-[0.18em] text-[#d84f2a]">The infrastructure answer</p>
            <h2 className="mt-4 text-3xl font-black tracking-normal sm:text-5xl">
              Managent firewalls the AI&apos;s hands, not its brain.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#4c4840]">
              Stop trying to bury production policy inside natural language. Put every tool call through a gateway that can inspect parameters, freeze risky streams, and inject secrets without exposing them to agent code.
            </p>
          </div>

          <div className="space-y-4">
            {controls.map((item) => (
              <article key={item.label} className="border border-[#151515] bg-white p-5 shadow-[5px_5px_0_#151515]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <h3 className="text-xl font-black">{item.label}</h3>
                  <code className="w-fit max-w-full border border-[#151515] bg-[#e1f0d0] px-2 py-1 font-mono text-xs font-bold text-[#151515]">
                    {item.command}
                  </code>
                </div>
                <p className="mt-3 leading-7 text-[#4c4840]">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="beta" className="px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="font-mono text-sm font-bold uppercase tracking-[0.18em] text-[#d84f2a]">Help us prioritize the roadmap</p>
            <h2 className="mt-4 text-3xl font-black tracking-normal sm:text-5xl">
              Tell us what is blocking your production agent rollout.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#4c4840]">
              We are measuring the exact failure mode: prompt-only permissions, hallucinated tool execution, runaway loops, exposed credentials, and security review dead ends.
            </p>
          </div>

          <form className="border border-[#151515] bg-white p-5 shadow-[8px_8px_0_#151515] sm:p-7">
            <div className="grid gap-5">
              <label className="grid gap-2">
                <span className="text-sm font-black uppercase tracking-[0.08em]">Work email</span>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="you@company.com"
                  className="min-h-12 border border-[#151515] bg-[#fbfaf6] px-3 text-base outline-none focus:ring-4 focus:ring-[#e1f0d0]"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black uppercase tracking-[0.08em]">Which AI framework are you currently building with?</span>
                <select
                  name="framework"
                  defaultValue=""
                  required
                  className="min-h-12 border border-[#151515] bg-[#fbfaf6] px-3 text-base outline-none focus:ring-4 focus:ring-[#e1f0d0]"
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
                <legend className="text-sm font-black uppercase tracking-[0.08em]">
                  What is your biggest blocker to putting agents in production?
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {blockers.map((blocker) => (
                    <label key={blocker} className="flex min-h-12 items-center gap-3 border border-[#151515] bg-[#fbfaf6] px-3 font-semibold">
                      <input type="checkbox" name="blocker" value={blocker} className="size-4 accent-[#d84f2a]" />
                      <span>{blocker}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <button
                type="submit"
                className="min-h-12 border border-[#151515] bg-[#d84f2a] px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white shadow-[4px_4px_0_#151515] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#151515]"
              >
                Join the Beta / Get Early Access to the Proxy
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
