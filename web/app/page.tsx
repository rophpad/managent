import Image from "next/image";

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
  {
    name: "Managent Learn",
    description: "Knowledge and education.",
    status: "In Development",
  },
  {
    name: "Managent Credential",
    description: "Secure credential management.",
    status: "Coming Soon",
  },
  {
    name: "Managent Gateway",
    description: "Secure access to tools and services.",
    status: "Coming Soon",
  },
  {
    name: "Managent Registry",
    description: "Discover and manage agents and services.",
    status: "Coming Soon",
  },
  {
    name: "Managent Test  ",
    description: "Test and evaluate agents.",
    status: "Coming Soon",
  },
  {
    name: "Managent Cloud",
    description: "Managed infrastructure.",
    status: "Coming Soon",
  },
];

const whyItems = [
  "New frameworks appear every month.",
  "Protocols are still emerging.",
  "Best practices are constantly changing.",
  "Production tooling is fragmented.",
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
      { label: "Open Source", href: "#open-source" },
      { label: "Research", href: "#research" },
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
      { label: "Research", href: "#research" },
      { label: "Built in Public", href: "#built-in-public" },
      { label: "Legal", href: "#footer" },
    ],
  },
];

const heroBenefits = [
  "Education",
  "Open source",
  "Research",
  "Infrastructure",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-[#11140f]">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-5 px-6 py-6 text-center lg:px-8">
        <a href="#top" aria-label="Managent home" className="shrink-0">
          <Image
            src="/logo.png"
            alt="Managent logo"
            width={100}
            height={100}
            style={{ height: "auto" }}
            priority
          />
        </a>

        <nav className="hidden items-center justify-center gap-8 text-sm font-medium text-[#565b50] md:flex">
          {navigationItems.map((item) => (
            <a key={item.label} href={item.href} className="transition hover:text-[#11140f]">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="#open-source"
            className="hidden text-sm font-semibold text-[#565b50] transition hover:text-[#11140f] sm:inline-flex"
          >
            GitHub
          </a>
          <a
            href="#newsletter"
            className="rounded-full bg-[#11140f] px-5 py-3 text-sm font-semibold transition hover:bg-[#2d3329]"
          >
            <p className="text-white">
              Newsletter
            </p>
          </a>
        </div>
      </header>

      <section
        id="top"
        className="mx-auto flex w-full max-w-6xl flex-col items-center px-6 pb-20 pt-16 text-center lg:px-8 lg:pb-28 lg:pt-24"
      >
        <h1 className="mt-6 max-w-6xl text-4xl font-medium leading-none text-[#11140f] sm:text-5xl lg:text-7xl">
          The Home of AI Agent Engineering.
        </h1>
        <p className="mt-6 max-w-xl text-xl leading-8 text-[#3d4238]">
          Helping developers and companies build, secure, and operate the next
          generation of AI agents.
        </p>

        <div className="mt-6 flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="#ecosystem"
            className="inline-flex w-max items-center justify-center rounded-full bg-[#11140f] px-6 py-3 text-base font-semibold text-white transition hover:bg-[#2d3329]"
          >
            <p className="text-white">
              Explore the ecosystem
            </p>
          </a>
          <a
            href="#newsletter"
            className="inline-flex w-max items-center justify-center rounded-full border border-[#cfcabb] bg-white px-6 py-3 text-base font-semibold text-[#11140f] transition hover:border-[#11140f]"
          >
            Join the newsletter
          </a>
        </div>
      </section>

      <section
        id="ecosystem"
        className="border-y border-[#e3dfd0] bg-white py-20"
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center px-6 text-center lg:px-8">
          <SectionIntro
            eyebrow="Our Ecosystem"
            title="Everything you need to build AI agents."
            description=""
          />
          <div className="mt-10 grid w-full gap-6 md:grid-cols-2 xl:grid-cols-3">
            {ecosystemItems.map((item) => {
              const Icon = item.icon;

              return (
                <FeatureCard
                  key={item.title}
                  id={item.id}
                  icon={<Icon className="size-6" />}
                  title={item.title}
                  body={item.description}
                  cta={item.cta}
                />
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="vision"
        className="mx-auto flex max-w-6xl flex-col items-center px-6 py-20 text-center lg:px-8"
      >

        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase text-[#345436]">
            Our Vision
          </p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight text-[#11140f]">
            AI agents are becoming a new software platform.
          </h2>
          <div className="mt-10 w-full rounded-lg border border-[#d8d4c5] bg-white p-8 shadow-[0_18px_60px_rgba(17,20,15,0.06)]">
            <p className="mx-auto max-w-4xl text-lg leading-8 text-[#565b50]">
              Our mission is to help developers navigate this shift by creating
              the knowledge, tools, and infrastructure needed to build reliable AI
              agents.
            </p>
          </div>
        </div>

      </section>

      <section
        id="products"
        className="mx-auto flex max-w-6xl flex-col items-center px-6 py-20 text-center lg:px-8"
      >
        <SectionIntro
          eyebrow="What We&apos;re Building"
          title="A control plane for autonomous systems"
          description=""
        />
        <div className="mt-10 flex flex-wrap  items-center justify-center w-full gap-5">
          {roadmapItems.map((item, index) => (
            <div key={item.name}>
              <RoadmapCard
                title={item.name}
                body={item.description}
                status={item.status}
              />
              {/* {index + 1 < roadmapItems.length ? (
                <div className="py-4 text-[#8e9486]">
                  <ArrowDownIcon className="mx-auto size-5" />
                </div>
              ) : null} */}
            </div>
          ))}
        </div>
      </section>


      {/* <section id="newsletter" className="border-t border-[#e3dfd0] bg-white py-20">
        <div className="mx-auto flex max-w-4xl flex-col items-center px-6 text-center lg:px-8">
          <SectionIntro
            eyebrow="Stay Connected"
            title="Follow the evolution of AI Agent Engineering."
            description="Receive product updates, research, technical articles, and new open-source releases."
          />

          <form className="mt-10 grid w-full max-w-2xl gap-4 rounded-lg border border-[#d8d4c5] bg-white p-6 text-left shadow-[0_18px_60px_rgba(17,20,15,0.06)] sm:grid-cols-[1fr_auto] sm:items-end sm:p-8">
            <label className="grid gap-2">
              <span className="text-sm font-semibold leading-5 text-[#11140f]">
                Email
              </span>
              <input
                type="email"
                name="newsletter-email"
                placeholder="you@company.com"
                className="min-h-12 w-full rounded-lg border border-[#d8d4c5] bg-[#fbfaf6] px-4 text-base outline-none transition focus:border-[#345436] focus:ring-4 focus:ring-[#e7efe3]"
              />
            </label>

            <button
              type="submit"
              className="min-h-12 rounded-full bg-[#11140f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2d3329] focus:outline-none focus:ring-4 focus:ring-[#d8d4c5]"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section> */}

      <section id="labs" className="border-t border-[#e3dfd0] bg-white py-20">
        <div className="mx-auto flex max-w-4xl flex-col items-center px-6 text-center lg:px-8">
          <SectionIntro
            eyebrow="Help Shape the Future"
            title="We&apos;re talking with developers building AI agents every day."
            description="Your feedback helps us decide what to teach and what products to build."
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
                  placeholder="you@company.com"
                  className="min-h-12 w-full rounded-lg border border-[#d8d4c5] bg-[#fbfaf6] px-4 text-base outline-none transition focus:border-[#345436] focus:ring-4 focus:ring-[#e7efe3]"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold leading-5 text-[#11140f]">
                  Framework
                </span>
                <select
                  name="framework"
                  defaultValue=""
                  className="min-h-12 w-full rounded-lg border border-[#d8d4c5] bg-[#fbfaf6] px-4 text-base outline-none transition focus:border-[#345436] focus:ring-4 focus:ring-[#e7efe3]"
                >
                  <option value="" disabled>
                    Select a framework
                  </option>
                  <option>OpenAI Agents SDK</option>
                  <option>LangChain</option>
                  <option>CrewAI</option>
                  <option>AutoGen</option>
                  <option>Custom stack</option>
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold leading-5 text-[#11140f]">
                  What are you building?
                </span>
                <textarea
                  name="building"
                  rows={4}
                  placeholder="Agent workflows, internal copilots, customer support, automation pipelines..."
                  className="w-full rounded-lg border border-[#d8d4c5] bg-[#fbfaf6] px-4 py-3 text-base outline-none transition focus:border-[#345436] focus:ring-4 focus:ring-[#e7efe3]"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold leading-5 text-[#11140f]">
                  What&apos;s your biggest challenge?
                </span>
                <textarea
                  name="challenge"
                  rows={4}
                  placeholder="Reliability, evaluation, orchestration, security, cost control..."
                  className="w-full rounded-lg border border-[#d8d4c5] bg-[#fbfaf6] px-4 py-3 text-base outline-none transition focus:border-[#345436] focus:ring-4 focus:ring-[#e7efe3]"
                />
              </label>

              <button
                type="submit"
                className="min-h-12 w-full rounded-full bg-[#11140f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2d3329] focus:outline-none focus:ring-4 focus:ring-[#d8d4c5]"
              >
                Share Feedback
              </button>
            </div>
          </form>
        </div>
      </section>

      <footer id="footer" className="mx-auto w-full max-w-7xl px-6 py-12 lg:px-8">
        <div className="border-t border-[#ddd8c8] pt-8">
          <div className="mb-8">
            <p className="text-lg font-semibold">Managent</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#565b50]">
              Building the infrastructure and knowledge layer for AI Agent
              Engineering.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <h3 className="text-sm font-semibold uppercase text-[#345436]">
                  {column.title}
                </h3>
                <div className="mt-4 grid gap-3 text-sm text-[#565b50]">
                  {column.links.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      className="transition hover:text-[#11140f]"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </footer>
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

function FeatureCard({
  id,
  icon,
  title,
  body,
  cta,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  cta: string;
}) {
  return (
    <article
      id={id}
      className="rounded-lg border border-[#e4dfd0] bg-[#fbfaf6] p-6 text-left"
    >
      <div className="flex size-12 items-center justify-center rounded-lg border border-[#d8d4c5] bg-white text-[#345436]">
        {icon}
      </div>
      <h3 className="mt-5 text-2xl font-semibold">{title}</h3>
      <p className="mt-4 leading-7 text-[#565b50]">{body}</p>
      <a
        href={`#${id}`}
        className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#345436] transition hover:text-[#11140f]"
      >
        {cta}
        <ArrowRightIcon className="size-4" />
      </a>
    </article>
  );
}

function ProblemCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-lg border border-[#e4dfd0] bg-[#fbfaf6] p-6 text-center">
      <h3 className="text-xl font-semibold">{title}</h3>
      {body ? <p className="mt-4 leading-7 text-[#565b50]">{body}</p> : null}
    </article>
  );
}

function RoadmapCard({
  title,
  body,
  status,
}: {
  title: string;
  body: string;
  status: string;
}) {
  return (
    <article className="rounded-lg border border-[#d8d4c5] bg-white p-6 text-center shadow-[0_18px_60px_rgba(17,20,15,0.06)]">
      <span className="inline-flex rounded-full border border-[#d9d6c8] bg-[#f8f7f2] px-3 py-1 text-xs font-semibold uppercase text-[#345436]">
        {status}
      </span>
      <h3 className="mt-5 text-2xl font-semibold leading-tight">{title}</h3>
      <p className="mt-4 leading-7 text-[#565b50]">{body}</p>
    </article>
  );
}

type IconProps = {
  className?: string;
};

function IconBase({
  className,
  children,
}: IconProps & { children: React.ReactNode }) {
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

function CodeXmlIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="m8 16-4-4 4-4" />
      <path d="m16 8 4 4-4 4" />
      <path d="m14 4-4 16" />
    </IconBase>
  );
}

function ChartColumnIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M3 3v18h18" />
      <path d="M8 15v3" />
      <path d="M12 11v7" />
      <path d="M16 7v11" />
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

function ArrowDownIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M12 5v14" />
      <path d="m5 12 7 7 7-7" />
    </IconBase>
  );
}
