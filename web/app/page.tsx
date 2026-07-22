import Image from "next/image";
import type { ReactNode } from "react";

const navigationItems = [
  { label: "Learn", href: "#learn" },
  { label: "Products", href: "#products" },
  { label: "Labs", href: "#labs" },
];

const ecosystemItems = [
  {
    id: "learn",
    title: "Learn",
    description:
      "Practical guides, tutorials, and roadmaps for AI Agent Engineering.",
    cta: "Explore Learn",
    icon: BookOpenIcon,
  },
  {
    id: "products",
    title: "Products",
    description:
      "Developer tools for securing and operating AI agents in production.",
    cta: "Explore Products",
    icon: BoxesIcon,
  },
  {
    id: "labs",
    title: "Labs",
    description:
      "Experimental projects, prototypes, and ideas exploring the future of AI agents.",
    cta: "Explore Labs",
    icon: FlaskConicalIcon,
  },
];

const roadmapItems = [
  { name: "Managent Learn", description: "Knowledge and education.", status: "In development" },
  { name: "Managent Credential", description: "Secure credential management.", status: "Coming soon" },
  { name: "Managent Gateway", description: "Secure access to tools and services.", status: "Coming soon" },
  { name: "Managent Registry", description: "Discover and manage agents and services.", status: "Coming soon" },
  { name: "Managent Test", description: "Test and evaluate agents.", status: "Coming soon" },
  { name: "Managent Cloud", description: "Managed infrastructure.", status: "Coming soon" },
];

const footerColumns = [
  {
    title: "Company",
    links: [
      { label: "About", href: "#vision" },
      { label: "Mission", href: "#manifesto" },
      { label: "Blog", href: "#learn" },
    ],
  },
  {
    title: "Explore",
    links: [
      { label: "Learn", href: "#learn" },
      { label: "Products", href: "#products" },
      { label: "Labs", href: "#labs" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "GitHub", href: "#open-source" },
      { label: "Newsletter", href: "#newsletter" },
      { label: "Discord", href: "#built-in-public" },
    ],
  },
  {
    title: "Social",
    links: [
      { label: "LinkedIn", href: "#linkedIn" },
      { label: "X", href: "#x" },
      { label: "YouTube", href: "#youtube" },
    ],
  },
];

const INK = "#11140f";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-(--ink)" style={{ ["--ink" as string]: INK }}>
      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-50  bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-6 py-4 lg:px-8">
          <a href="#top" aria-label="Managent home" className="shrink-0">
            <Image src="/logo.png" alt="Managent" width={100} height={100} style={{ height: "auto" }} priority />
          </a>

          <nav className="hidden items-center gap-8 text-sm font-medium text-[#565b50] md:flex">
            {navigationItems.map((item) => (
              <a key={item.label} href={item.href} className="transition-colors hover:text-[#11140f]">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="#open-source"
              className="hidden rounded-full px-3 py-2 text-sm font-medium text-[#565b50] transition-colors hover:text-[#11140f] sm:inline-flex"
            >
              GitHub
            </a>
            <Button href="#newsletter" size="sm">
              <span className="text-white">Newsletter</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section id="top" className="relative inset-x-0 top-0 z-10 h-160 overflow-hidden">
        {/* soft radial glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-105 opacity-[0.35]"
          style={{
            background:
              "radial-gradient(600px 260px at 50% 0%, rgba(52,84,54,0.14), transparent 70%)",
          }}
        />



        <div className="relative mx-4 grid grid-cols-[auto_1fr_auto] items-center sm:mx-8 lg:mx-16 2xl:mx-72">
          <Image
            className="col-start-1 row-start-1 opacity-90"
            src="/left.svg"
            alt="illustration-1"
            width={300}
            height={300}
            style={{ height: "auto" }}
            priority
          />
          <div className="relative z-10 col-span-3 col-start-1 row-start-1 mx-auto flex w-full flex-col items-center px-6 pb-24 pt-24 text-center lg:px-8 lg:pt-32">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#e4dfd0] bg-[#fbfaf6] px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#345436]">
              <span className="size-1.5 rounded-full bg-[#345436]" />
              AI Agent Engineering
            </span>

            <h1 className="mt-7 max-w-3xl text-[2.6rem] font-medium leading-[1.05] tracking-tight text-[#11140f] sm:text-6xl lg:text-[4.25rem]">
              The home of AI agent engineering.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-[#565b50] sm:text-xl">
              Helping developers and companies build, secure, and operate the
              next generation of AI agents.
            </p>

            <div className="mt-9 flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
              <Button href="#ecosystem" size="lg">
                <span className="text-white">Explore the ecosystem</span>
              </Button>
              {/* <Button href="#newsletter" variant="outline" size="lg">
                Join the newsletter
              </Button> */}
            </div>
          </div>
          <Image
            className="col-start-3 row-start-1 opacity-90"
            src="/right.svg"
            alt="illustration-2"
            width={300}
            height={300}
            style={{ height: "auto" }}
            priority
          />
        </div>
      </section>

      {/* ================= ECOSYSTEM ================= */}
      <Section id="ecosystem" tone="tint">
        <SectionIntro
          eyebrow="Our ecosystem"
          title="Everything you need to build AI agents."
        />
        <div className="mt-12 grid w-full gap-5 md:grid-cols-3">
          {ecosystemItems.map((item) => {
            const Icon = item.icon;
            return (
              <FeatureCard
                key={item.title}
                id={item.id}
                icon={<Icon className="size-5" />}
                title={item.title}
                body={item.description}
                cta={item.cta}
              />
            );
          })}
        </div>
      </Section>

      {/* ================= VISION ================= */}
      <Section id="vision">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Our vision</Eyebrow>
          <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-[#11140f] sm:text-4xl">
            AI agents are becoming a new software platform.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-[#565b50]">
            Our mission is to help developers navigate this shift by creating
            the knowledge, tools, and infrastructure needed to build reliable
            AI agents.
          </p>
        </div>
      </Section>

      {/* ================= PRODUCTS / ROADMAP ================= */}
      <Section id="products" tone="tint">
        <SectionIntro eyebrow="What we're building" title="A control plane for autonomous systems." />
        <div className="mt-12 grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roadmapItems.map((item) => (
            <RoadmapCard key={item.name} title={item.name} body={item.description} status={item.status} />
          ))}
        </div>
      </Section>

      {/* ================= LABS / FEEDBACK ================= */}
      <Section id="labs">
        <SectionIntro
          eyebrow="Help shape the future"
          title="We're talking with developers building AI agents every day."
          description="Your feedback helps us decide what to teach and what products to build."
        />

        <form className="mt-12 w-full max-w-xl rounded-2xl border border-[#e4dfd0] bg-white p-6 text-left sm:p-8">
          <div className="grid gap-5">
            <Field label="Work email">
              <input type="email" name="email" placeholder="you@company.com" className={inputClass} />
            </Field>

            <Field label="Framework">
              <select name="framework" defaultValue="" className={inputClass}>
                <option value="" disabled>Select a framework</option>
                <option>OpenAI Agents SDK</option>
                <option>LangChain</option>
                <option>CrewAI</option>
                <option>AutoGen</option>
                <option>Custom stack</option>
              </select>
            </Field>

            <Field label="What are you building?">
              <textarea
                name="building"
                rows={3}
                placeholder="Agent workflows, internal copilots, customer support, automation pipelines..."
                className={inputClass}
              />
            </Field>

            <Field label="What's your biggest challenge?">
              <textarea
                name="challenge"
                rows={3}
                placeholder="Reliability, evaluation, orchestration, security, cost control..."
                className={inputClass}
              />
            </Field>

            <Button type="submit" size="lg" className="w-full justify-center">
              Share feedback
            </Button>
          </div>
        </form>
      </Section>

      {/* ================= FOOTER ================= */}
      <footer id="footer" className=" bg-white">
        <div className="mx-auto w-full max-w-7xl px-6 py-14 lg:px-8">
          <div className="mb-10 max-w-md">
            <p className="text-base font-semibold text-[#11140f]">Managent</p>
            <p className="mt-2 text-sm leading-6 text-[#565b50]">
              Building the infrastructure and knowledge layer for AI Agent
              Engineering.
            </p>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[#345436]">
                  {column.title}
                </h3>
                <div className="mt-4 grid gap-2.5 text-sm text-[#565b50]">
                  {column.links.map((link) => (
                    <a key={link.label} href={link.href} className="transition-colors hover:text-[#11140f]">
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 border-t border-[#ece7d8] pt-6 text-xs text-[#8e9486]">
            © {new Date().getFullYear()} Managent. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}

/* ============================================================
   Shared primitives
   ============================================================ */

const inputClass =
  "min-h-12 w-full rounded-lg border border-[#e4dfd0] bg-[#fbfaf6] px-4 text-base text-[#11140f] outline-none transition placeholder:text-[#9a9686] focus:border-[#345436] focus:ring-4 focus:ring-[#e7efe3]";

function Section({
  id,
  tone = "plain",
  children,
}: {
  id: string;
  tone?: "plain" | "tint";
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={
        " py-20 lg:py-24 " +
        (tone === "tint" ? "bg-[#fbfaf6]" : "bg-white")
      }
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-6 text-center lg:px-8">
        {children}
      </div>
    </section>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-[#345436]">
      {children}
    </p>
  );
}

function SectionIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-[#11140f] sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-lg leading-8 text-[#565b50]">{description}</p>
      ) : null}
    </div>
  );
}

function Button({
  href,
  children,
  variant = "primary",
  size = "md",
  type,
  className = "",
}: {
  href?: string;
  children: ReactNode;
  variant?: "primary" | "outline";
  size?: "sm" | "md" | "lg";
  type?: "button" | "submit";
  className?: string;
}) {
  const sizeClass =
    size === "lg" ? "px-6 py-3 text-base" : size === "sm" ? "px-4 py-2 text-sm" : "px-5 py-2.5 text-sm";
  const variantClass =
    variant === "primary"
      ? "bg-[#11140f] text-white hover:bg-[#2d3329]"
      : "border border-[#d8d4c5] bg-white text-[#11140f] hover:border-[#11140f]";

  const classes = `inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors ${sizeClass} ${variantClass} ${className}`;

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }
  return (
    <button type={type ?? "button"} className={classes}>
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-[#11140f]">{label}</span>
      {children}
    </label>
  );
}

function FeatureCard({
  id,
  icon,
  title,
  body,
  cta,
}: {
  id: string;
  icon: ReactNode;
  title: string;
  body: string;
  cta: string;
}) {
  return (
    <article
      id={id}
      className="group rounded-2xl border border-[#e4dfd0] bg-black/2 p-6 text-left transition-colors hover:border-[#c9c3ae]"
    >
      <div className="flex size-10 items-center justify-center rounded-lg border border-[#e4dfd0] bg-[#fbfaf6] text-[#345436]">
        {icon}
      </div>
      <h3 className="mt-5 text-xl font-semibold text-[#11140f]">{title}</h3>
      <p className="mt-2.5 text-[15px] leading-6 text-[#565b50]">{body}</p>
      <a
        href={`#${id}`}
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#345436] transition-colors group-hover:text-[#11140f]"
      >
        {cta}
        <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </a>
    </article>
  );
}

function RoadmapCard({ title, body, status }: { title: string; body: string; status: string }) {
  const isActive = status.toLowerCase().includes("development");
  return (
    <article className="flex flex-col items-start rounded-2xl border border-[#e4dfd0] bg-white p-6 text-left">
      <span
        className={
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide " +
          (isActive ? "bg-[#e7efe3] text-[#345436]" : "bg-[#f3f1e8] text-[#8e9486]")
        }
      >
        <span className={"size-1.5 rounded-full " + (isActive ? "bg-[#345436]" : "bg-[#c9c5b3]")} />
        {status}
      </span>
      <h3 className="mt-4 text-lg font-semibold leading-snug text-[#11140f]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#565b50]">{body}</p>
    </article>
  );
}

/* ============================================================
   Hero illustration
   Agents (left) route through a central permission gate before
   reaching resources (right) — a literal picture of what
   Managent does, kept faint enough to read as background texture.
   ============================================================ */



/* ============================================================
   Icons
   ============================================================ */

type IconProps = { className?: string };

function IconBase({ className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function BookOpenIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M12 7v14" />
      <path d="M3 18.5A2.5 2.5 0 0 1 5.5 16H12V5.5A2.5 2.5 0 0 0 9.5 3H5.75A2.75 2.75 0 0 0 3 5.75Z" />
      <path d="M21 18.5A2.5 2.5 0 0 0 18.5 16H12V5.5A2.5 2.5 0 0 1 14.5 3h3.75A2.75 2.75 0 0 1 21 5.75Z" />
    </IconBase>
  );
}

function BoxesIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M2.97 7.27 12 12l9.03-4.73" />
      <path d="M12 22V12" />
      <path d="m7.5 4.27 9 4.73" />
      <path d="m7.5 19.73-4.53-2.37V7.27L12 12l9.03-4.73v10.09L16.5 19.73" />
      <path d="m7.5 4.27-4.53 2.37L12 11.37l9.03-4.73-4.53-2.37Z" />
    </IconBase>
  );
}

function FlaskConicalIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M10 2v7.31" />
      <path d="M14 2v7.31" />
      <path d="M8.5 2h7" />
      <path d="M6 15.5 11.5 9h1L18 15.5A4 4 0 0 1 14.94 22H9.06A4 4 0 0 1 6 15.5Z" />
      <path d="M9 16h6" />
    </IconBase>
  );
}

function ArrowRightIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </IconBase>
  );
}
