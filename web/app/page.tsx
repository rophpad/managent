"use client";

import Link from "next/link";
import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type SVGProps,
} from "react";
import {
  Menu,
  X,
  Shield,
  Check,
  AlertCircle,
  Star,
  Zap,
  Lock,
  Cloud,
} from "lucide-react";
import { Modal, ModalBody } from "@/components/ui/modal";

function Github({
  className,
  size = 24,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number | string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.41 1.17-.75 1.7v4" />
    </svg>
  );
}

// Geometry for illustration-managent.svg is untouched: every `d` and `mask`
// attribute below is identical to the original file. Two deliberate changes:
//
//  - `stroke`/`fill` are `currentColor` so the diagram takes its colour from
//    the container, rather than being hardcoded black.
//  - `stroke-width` / `stroke-linecap` are spelled in kebab-case. This markup is
//    injected with dangerouslySetInnerHTML, i.e. parsed as HTML, where the
//    camelCased JSX spelling is not a real attribute and was silently dropped —
//    every stroke rendered at the default width of 1 instead of the intended 2.
//
// The animation CSS lives *inside* the SVG string itself (rather than in an
// external stylesheet reaching in via nth-of-type) so it's guaranteed to apply
// no matter how the surrounding page injects this markup.
const AGENT_ILLUSTRATION_SVG = `<svg width="1196" height="651" viewBox="0 0 1196 651" fill="none" xmlns="http://www.w3.org/2000/svg">
<style>
  .agent-node { transform-box: fill-box; transform-origin: center; animation: agentNodePulse 3.6s ease-in-out infinite; }
  .agent-node.n2 { animation-delay: .5s; }
  .agent-node.n3 { animation-delay: 1s; }
  .agent-node.n5 { animation-delay: .7s; }
  .agent-node.n6 { animation-delay: 1.4s; }
  .agent-line { stroke-dasharray: 12 16; animation: agentSignalFlow 2.2s linear infinite; }
  .agent-line.l2 { animation-delay: .3s; }
  .agent-line.l3 { animation-delay: .6s; }
  .agent-line.l4 { animation-delay: .9s; }
  .agent-line.l5 { animation-delay: .15s; }
  .agent-line.l6 { animation-delay: .45s; }
  @keyframes agentNodePulse {
    0%, 100% { opacity: .55; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.18); }
  }
  @keyframes agentSignalFlow {
    to { stroke-dashoffset: -56; }
  }
</style>
<path class="agent-node n1" d="M67 1H8C4.13401 1 1 4.13401 1 8V67L1.00879 67.3604C1.19633 71.0589 4.25486 74 8 74H67C70.866 74 74 70.866 74 67V8L73.9912 7.63965C73.8097 4.06046 70.9395 1.19028 67.3604 1.00879L67 1ZM37.5 29C42.1944 29 46 32.8056 46 37.5C46 42.1944 42.1944 46 37.5 46C32.8056 46 29 42.1944 29 37.5C29 32.8056 32.8056 29 37.5 29Z" stroke="currentColor" stroke-width="2"/>
<path class="agent-node n2" d="M67 289H8C4.13401 289 1 292.134 1 296V355L1.00879 355.36C1.19633 359.059 4.25486 362 8 362H67C70.866 362 74 358.866 74 355V296L73.9912 295.64C73.8097 292.06 70.9395 289.19 67.3604 289.009L67 289ZM37.5 317C42.1944 317 46 320.806 46 325.5C46 330.194 42.1944 334 37.5 334C32.8056 334 29 330.194 29 325.5C29 320.806 32.8056 317 37.5 317Z" stroke="currentColor" stroke-width="2"/>
<path class="agent-node n3" d="M67 577H8C4.13401 577 1 580.134 1 584V643L1.00879 643.36C1.19633 647.059 4.25486 650 8 650H67C70.866 650 74 646.866 74 643V584L73.9912 583.64C73.8097 580.06 70.9395 577.19 67.3604 577.009L67 577ZM37.5 605C42.1944 605 46 608.806 46 613.5C46 618.194 42.1944 622 37.5 622C32.8056 622 29 618.194 29 613.5C29 608.806 32.8056 605 37.5 605Z" stroke="currentColor" stroke-width="2"/>
<mask id="path-4-inside-1_50_41" fill="white">
<path d="M644.5 254C653.337 254 660.5 261.163 660.5 270V359C660.5 367.837 653.337 375 644.5 375H555.5C546.663 375 539.5 367.837 539.5 359V270C539.5 261.163 546.663 254 555.5 254H644.5ZM626.022 298.25C623.064 295.72 618.863 295.282 615.451 297.147L603.987 303.416C601.189 304.946 597.811 304.946 595.013 303.416L583.549 297.147C580.137 295.282 575.936 295.72 572.978 298.25L551.863 316.304C544.146 322.903 550.837 335.426 560.564 332.589L596.884 321.996C598.593 321.498 600.407 321.498 602.116 321.996L638.436 332.589C648.163 335.426 654.854 322.903 647.137 316.304L626.022 298.25Z"/>
</mask>
<path class="agent-chip" d="M644.5 254V252V252V254ZM660.5 359H662.5V359H660.5ZM555.5 375V377V377V375ZM539.5 270H537.5V270H539.5ZM626.022 298.25L627.322 296.73L627.322 296.73L626.022 298.25ZM615.451 297.147L614.492 295.393L614.492 295.393L615.451 297.147ZM603.987 303.416L603.028 301.661V301.661L603.987 303.416ZM595.013 303.416L595.972 301.661V301.661L595.013 303.416ZM583.549 297.147L584.508 295.393L584.508 295.393L583.549 297.147ZM572.978 298.25L571.678 296.73L571.678 296.73L572.978 298.25ZM551.863 316.304L550.564 314.784L550.564 314.784L551.863 316.304ZM560.564 332.589L561.124 334.509L561.124 334.509L560.564 332.589ZM596.884 321.996L596.324 320.076L596.324 320.076L596.884 321.996ZM602.116 321.996L602.676 320.076L602.676 320.076L602.116 321.996ZM638.436 332.589L637.876 334.509L637.876 334.509L638.436 332.589ZM647.137 316.304L648.436 314.784L648.436 314.784L647.137 316.304ZM644.5 254V256C652.232 256 658.5 262.268 658.5 270H660.5H662.5C662.5 260.059 654.441 252 644.5 252V254ZM660.5 270H658.5V359H660.5H662.5V270H660.5ZM660.5 359H658.5C658.5 366.732 652.232 373 644.5 373V375V377C654.441 377 662.5 368.941 662.5 359H660.5ZM644.5 375V373H555.5V375V377H644.5V375ZM555.5 375V373C547.768 373 541.5 366.732 541.5 359H539.5H537.5C537.5 368.941 545.559 377 555.5 377V375ZM539.5 359H541.5V270H539.5H537.5V359H539.5ZM539.5 270H541.5C541.5 262.268 547.768 256 555.5 256V254V252C545.559 252 537.5 260.059 537.5 270H539.5ZM555.5 254V256H644.5V254V252H555.5V254ZM626.022 298.25L627.322 296.73C623.733 293.661 618.633 293.128 614.492 295.393L615.451 297.147L616.411 298.902C619.092 297.436 622.394 297.779 624.723 299.77L626.022 298.25ZM615.451 297.147L614.492 295.393L603.028 301.661L603.987 303.416L604.947 305.171L616.411 298.902L615.451 297.147ZM603.987 303.416L603.028 301.661C600.828 302.864 598.172 302.864 595.972 301.661L595.013 303.416L594.053 305.171C597.449 307.028 601.551 307.028 604.947 305.171L603.987 303.416ZM595.013 303.416L595.972 301.661L584.508 295.393L583.549 297.147L582.589 298.902L594.053 305.171L595.013 303.416ZM583.549 297.147L584.508 295.393C580.367 293.128 575.267 293.661 571.678 296.73L572.978 298.25L574.277 299.77C576.606 297.779 579.908 297.436 582.589 298.902L583.549 297.147ZM572.978 298.25L571.678 296.73L550.564 314.784L551.863 316.304L553.163 317.824L574.277 299.77L572.978 298.25ZM551.863 316.304L550.564 314.784C541.256 322.742 549.269 337.966 561.124 334.509L560.564 332.589L560.005 330.669C552.404 332.885 547.036 323.063 553.163 317.824L551.863 316.304ZM560.564 332.589L561.124 334.509L597.444 323.916L596.884 321.996L596.324 320.076L560.004 330.669L560.564 332.589ZM596.884 321.996L597.444 323.916C598.787 323.524 600.213 323.524 601.556 323.916L602.116 321.996L602.676 320.076C600.602 319.471 598.398 319.471 596.324 320.076L596.884 321.996ZM602.116 321.996L601.556 323.916L637.876 334.509L638.436 332.589L638.996 330.669L602.676 320.076L602.116 321.996ZM638.436 332.589L637.876 334.509C649.731 337.966 657.744 322.742 648.436 314.784L647.137 316.304L645.837 317.824C651.964 323.063 646.596 332.885 638.995 330.669L638.436 332.589ZM647.137 316.304L648.436 314.784L627.322 296.73L626.022 298.25L624.723 299.77L645.837 317.824L647.137 316.304Z" fill="currentColor" mask="url(#path-4-inside-1_50_41)"/>
<path class="agent-line l1" d="M89 38C159 38.0002 282.75 47.5002 313 157.5C342.917 266.29 424.5 282.5 528 282.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
<path class="agent-line l2" d="M1107 599.5C1037 599.5 913.25 590 883 480C853.083 371.21 771.5 355 668 355" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
<path class="agent-line l3" d="M528 363C458 363 334.25 372.5 304 482.5C274.083 591.29 192.5 607.5 89 607.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
<path class="agent-line l4" d="M668 274.5C738 274.5 861.75 265 892 155C921.917 46.21 1003.5 30 1107 30" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
<path class="agent-line l5" d="M94 323H526.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
<path class="agent-line l6" d="M1102 315.5H674.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
<path class="agent-node n4" d="M1158.5 1C1178.66 1 1195 17.3416 1195 37.5C1195 57.6584 1178.66 74 1158.5 74C1138.34 74 1122 57.6584 1122 37.5C1122 17.3416 1138.34 1 1158.5 1ZM1158 32C1154.69 32 1152 34.6863 1152 38C1152 41.3137 1154.69 44 1158 44C1161.31 44 1164 41.3137 1164 38C1164 34.6863 1161.31 32 1158 32Z" stroke="currentColor" stroke-width="2"/>
<path class="agent-node n5" d="M1158.5 278C1178.66 278 1195 294.342 1195 314.5C1195 334.658 1178.66 351 1158.5 351C1138.34 351 1122 334.658 1122 314.5C1122 294.342 1138.34 278 1158.5 278ZM1158 309C1154.69 309 1152 311.686 1152 315C1152 318.314 1154.69 321 1158 321C1161.31 321 1164 318.314 1164 315C1164 311.686 1161.31 309 1158 309Z" stroke="currentColor" stroke-width="2"/>
<path class="agent-node n6" d="M1158.5 555C1178.66 555 1195 571.342 1195 591.5C1195 611.658 1178.66 628 1158.5 628C1138.34 628 1122 611.658 1122 591.5C1122 571.342 1138.34 555 1158.5 555ZM1158 586C1154.69 586 1152 588.686 1152 592C1152 595.314 1154.69 598 1158 598C1161.31 598 1164 595.314 1164 592C1164 588.686 1161.31 586 1158 586Z" stroke="currentColor" stroke-width="2"/>
</svg>`;

const navigationItems = [
  { label: "Product", href: "#products" },
  { label: "Security & Policy", href: "#vision" },
  { label: "Platform", href: "#ecosystem" },
  { label: "Pricing", href: "#pricing" },
  { label: "Blog", href: "/blog" },
];

const auditRows = [
  ["-03s", "support-agent", "mcp:stripe/charge", "allow"],
  ["-06s", "billing-agent", "mcp:linear/create_issue", "allow"],
  ["-09s", "deploy-pipeline", "mcp:github/delete_repo", "deny"],
  ["-13s", "research-bot", "mcp:stripe/refund $840", "review"],
  ["-16s", "sales-agent", "mcp:slack/post_message", "allow"],
  ["-20s", "ops-bot", "mcp:postgres/drop_table", "deny"],
] as const;

const decisionStates = [
  {
    type: "allow",
    label: "ALLOW",
    body: "The tool call matches your approved scopes and resolves instantly. Credentials are safely injected at the gateway edge.",
    rule: "agent:support-bot → mcp-linear:read_issue",
  },
  {
    type: "review",
    label: "REQUIRE APPROVAL",
    body: "Held and routed to Slack, Discord, or your custom webhook. Tool execution pauses until resolved by a human operator.",
    rule: "agent:billing-bot → mcp-stripe:refund > $500",
  },
  {
    type: "deny",
    label: "DENY",
    body: "Blocked immediately at the proxy. Your model client receives standard error context with zero silent context failures.",
    rule: "agent:*-bot → mcp-github:delete_repo",
  },
] as const;

const platformFeatures = [
  [
    "◈",
    "Unified Registry",
    "Instantly discover every connected MCP server, tool definition, and client connection in one live map.",
  ],
  [
    "▤",
    "Declarative Policies",
    "Evaluate granular tool-level rules—allow, deny, or human-in-the-loop triggers—top to bottom.",
  ],
  [
    "◷",
    "Structured Auditing",
    "Record every request payload, parameter arguments, timestamp, and server response automatically.",
  ],
  [
    "⊘",
    "Instant Revocation",
    "Unlink or pause any downstream tool or external service immediately without modifying your client configs.",
  ],
] as const;

const footerColumns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#ecosystem" },
      { label: "Pricing", href: "#pricing" },
      { label: "Documentation", href: "/docs" },
      { label: "Self-Hosting Guide", href: "/docs/self-hosting" },
    ],
  },
  {
    title: "Managed Cloud",
    links: [
      { label: "Sign Up Free", href: "/register" },
      { label: "Cloud Status", href: "https://status.managent.dev" },
      { label: "Security", href: "/security" },
      { label: "SLA", href: "/sla" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "GitHub", href: "https://github.com/managent/managent" },
      { label: "Discord Community", href: "#discord" },
      { label: "Support Packages", href: "/support" },
      { label: "Enterprise", href: "/enterprise" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Changelog", href: "/changelog" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "#contact" },
    ],
  },
];

/** Decision colours, read from the shared palette so they match the dashboard. */
const DECISION_COLOR = {
  allow: "var(--color-allow)",
  deny: "var(--color-danger)",
  review: "var(--color-deny)",
} as const;

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [pricingView, setPricingView] = useState<"cloud" | "self-hosted">(
    "cloud",
  );
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly",
  );

  return (
    <main className="min-h-screen bg-ink text-fg relative">
      {/* Global keyframes + reveal utility classes. Respects prefers-reduced-motion. */}
      <style jsx global>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes floaty {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        @keyframes auditScroll {
          to {
            transform: translateY(-50%);
          }
        }
        @keyframes livePulse {
          50% {
            opacity: 0.55;
            box-shadow: 0 0 0 5px rgba(61, 220, 151, 0);
          }
        }
        .audit-track {
          animation: auditScroll 12s linear infinite;
        }
        .live-pulse {
          animation: livePulse 1.6s ease-in-out infinite;
        }

        .hero-anim {
          opacity: 0;
          animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .float-anim {
          animation: floaty 6s ease-in-out infinite;
        }

        .agent-illustration svg {
          display: block;
          width: 100%;
          height: auto;
          overflow: visible;
        }

        .reveal {
          opacity: 0;
          transform: translateY(24px);
          transition:
            opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
            transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .reveal.is-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .mobile-menu {
          display: grid;
          grid-template-rows: 0fr;
          opacity: 0;
          transition:
            grid-template-rows 0.35s ease,
            opacity 0.25s ease;
        }
        .mobile-menu.is-open {
          grid-template-rows: 1fr;
          opacity: 1;
        }
        .mobile-menu > div {
          overflow: hidden;
        }
      `}</style>

      {/* ================= HEADER ================= */}
      <header className="absolute w-full top-0 z-50 bg-none backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:h-auto sm:px-6 sm:py-3 lg:px-8 lg:py-4">
          <Link href="#top" aria-label="Managent home">
            <Image
              src="/logo1.svg"
              alt="Managent"
              width={100}
              height={100}
              className="h-auto w-24 brightness-0 invert"
              priority
            />
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-muted lg:flex">
            {navigationItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="transition-colors hover:text-fg"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="https://github.com/managent/managent"
              aria-label="GitHub"
              title="View on GitHub"
              className="hidden text-muted transition-colors hover:text-fg lg:inline-flex"
            >
              <Github className="size-5" />
            </a>
            <div className="hidden lg:block">
              <Button href="/register" size="sm" className="w-max">
                Try Free
              </Button>
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-line text-fg transition-colors hover:border-line-soft lg:hidden"
            >
              {menuOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile nav panel */}
        <div
          className={`bg-ink mobile-menu border-t border-line-soft lg:hidden ${menuOpen ? "is-open" : ""}`}
        >
          <div>
            <nav className="flex max-h-[calc(100vh-4rem)] flex-col gap-1 overflow-y-auto px-4 py-3 text-sm font-medium text-muted sm:px-6 sm:py-4">
              {navigationItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-2.5 transition-colors hover:bg-panel hover:text-fg"
                >
                  {item.label}
                </a>
              ))}
              <a
                href="https://github.com/managent/managent"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 transition-colors hover:bg-panel hover:text-fg"
              >
                GitHub
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section id="top" className="mt-4 relative overflow-hidden">
        {/* soft radial glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-104 opacity-[0.55] sm:h-128"
          style={{
            background:
              "radial-gradient(600px 260px at 50% 0%, rgba(108,123,255,0.18), transparent 70%)",
          }}
        />

        <div
          className="mt-16 hero-anim relative mx-auto flex w-full max-w-6xl justify-center px-4 pb-10 pt-8 sm:px-6 sm:pb-8 sm:pt-10 lg:max-w-272 lg:pb-10 lg:pt-14"
          style={{ animationDelay: "360ms" }}
        >
          <div className="relative flow-root w-full max-w-4xl lg:max-w-5xl">
            <div className="relative z-10 mb-5 flex flex-col items-center text-center sm:absolute sm:inset-x-0 sm:top-0 sm:mb-0 sm:px-6 sm:pt-4 lg:pt-6">
              <span
                className="hero-anim inline-flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-brand sm:px-3.5 sm:text-xs"
                style={{ animationDelay: "0ms" }}
              >
                <span className="size-1.5 rounded-full bg-brand" />
                Open Source MCP Gateway
              </span>

              <h1
                className="hero-anim mt-4 max-w-88 text-[1.85rem] font-medium leading-[1.08] tracking-tight text-fg min-[390px]:text-[2.05rem] sm:mt-5 sm:max-w-lg sm:text-5xl lg:max-w-2xl lg:text-6xl"
                style={{ animationDelay: "90ms" }}
              >
                Every agent call, <span className="text-allow">allowed</span>,{" "}
                <span className="text-danger">denied</span>, or{" "}
                <span className="text-deny">reviewed</span> <br /> on purpose.
              </h1>

              <p
                className="hero-anim mt-4 max-w-sm text-[13.5px] leading-6 text-muted sm:max-w-sm sm:text-lg sm:leading-7 lg:max-w-md"
                style={{ animationDelay: "180ms" }}
              >
                A lightweight MCP gateway you can deploy anywhere. Run it
                yourself for free, or let us manage it for you.
              </p>

              <div
                className="hero-anim mt-5 flex w-full max-w-xs flex-col items-stretch justify-center gap-3 sm:mt-6 sm:w-auto sm:max-w-none sm:flex-row"
                style={{ animationDelay: "270ms" }}
              >
                <Button
                  href="https://github.com/managent/managent"
                  size="md"
                  variant="outline"
                  className="mx-auto w-max sm:w-auto"
                >
                  <Star className="size-4" />
                  Star on GitHub
                </Button>
                <Button
                  href="/register"
                  size="md"
                  className="mx-auto w-max sm:w-auto"
                >
                  Try Managed Free
                </Button>
              </div>
            </div>

            <div className="relative mt-7 sm:mt-10 lg:mt-64">
              <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 -top-10 z-5 hidden h-[40%] w-screen max-w-none -translate-x-1/2 bg-linear-to-b from-ink via-ink/75 to-transparent sm:block"
              />

              <div
                role="img"
                aria-label="Illustration of connected AI agent nodes via MCP"
                className="hidden lg:block agent-illustration float-anim relative left-1/2 w-[138%] -translate-x-1/2 text-muted-2 sm:left-auto sm:w-full sm:translate-x-0"
                dangerouslySetInnerHTML={{ __html: AGENT_ILLUSTRATION_SVG }}
              />
              <div className="absolute bottom-[7%] left-1/2 z-5 hidden w-[82%] max-w-96 -translate-x-1/2 sm:block">
                <AuditStream />
              </div>
            </div>
            <div className="relative z-10 mx-auto mt-3 w-full max-w-sm sm:hidden">
              <AuditStream />
            </div>
          </div>
        </div>
      </section>

      {/* ================= TRUST BAR ================= */}
      <section className="border-y border-line-soft bg-panel-2 py-6">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-4 px-4 text-center sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Star className="size-4 fill-brand text-brand" />
            <span className="font-semibold text-fg">1+</span> GitHub Stars
          </div>
          <div className="flex items-center gap-2 text-sm text-muted">
            <Zap className="size-4 text-allow" />
            <span className="font-semibold text-fg">1+</span> Self-Hosted
            Deployments
          </div>
          <div className="flex items-center gap-2 text-sm text-muted">
            <Lock className="size-4 text-brand" />
            <span className="font-semibold text-fg">MIT</span> Licensed
          </div>
          <div className="flex items-center gap-2 text-sm text-muted">
            <Cloud className="size-4 text-allow" />
            <span className="font-semibold text-fg">99.9%</span> Managed Uptime
          </div>
        </div>
      </section>

      <ProductSection
        id="products"
        eyebrow="Architecture"
        title="Zero SDK integration. One lightweight proxy."
        description="Connect any standard MCP-compatible client—from Claude Desktop to Cursor—to our managed proxy. Zero changes to your application codebase required."
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <ModeCard
            badge="Client Config"
            tone="gateway"
            title="Point your client to the bridge."
            body="Instead of direct local configurations, configure your agent or IDE client once to route its transport commands securely through our edge."
          >
            <span className="text-muted-2">
              `// claude_desktop_config.json`
            </span>
            <br />
            <span className="text-muted">&quot;mcpServers&quot;</span>: &#123;
            <br />
            &nbsp;&nbsp;
            <span className="text-muted">&quot;managent-gateway&quot;</span>:
            &#123;
            <br />
            &nbsp;&nbsp;&nbsp;&nbsp;
            <span className="text-muted">&quot;command&quot;</span>:{" "}
            <span className="text-allow">&quot;npx&quot;</span>,
            <br />
            &nbsp;&nbsp;&nbsp;&nbsp;
            <span className="text-muted">&quot;args&quot;</span>: [
            <span className="text-allow">
              &quot;-y&quot;, &quot;@managent/mcp-bridge&quot;
            </span>
            ],
            <br />
            &nbsp;&nbsp;&nbsp;&nbsp;
            <span className="text-muted">&quot;env&quot;</span>: &#123;{" "}
            <span className="text-muted">&quot;GATEWAY_URL&quot;</span>:{" "}
            <span className="text-brand">&quot;env.MANAGENT_URL&quot;</span>{" "}
            &#125;
            <br />
            &nbsp;&nbsp;&#125;
            <br />
            &#125;
          </ModeCard>
          <PolicyUICard
            badge="Policy Dashboard"
            tone="sdk"
            title="Manage security through the UI."
            body="Define global authorization scopes and enforce safety constraints through a visual interface. No configuration files needed."
          />
        </div>
      </ProductSection>

      <ProductSection
        id="vision"
        eyebrow="Gateway Policy Engine"
        title="Granular tool control. Zero untrusted executions."
        description="Write safety rules globally. Managent intercepts tool executions instantly based on user parameters, schema arguments, and developer configurations."
        tone="tint"
      >
        <div className="grid gap-5 lg:grid-cols-3">
          {decisionStates.map((state) => (
            <DecisionCard key={state.label} {...state} />
          ))}
        </div>
      </ProductSection>

      <ProductSection
        id="ecosystem"
        eyebrow="Platform Map"
        title="One control plane. Absolute visibility."
        description="Every active MCP server, local client connector, and live tool session reports into a single screen—enforcing enterprise governance over LLM capabilities."
      >
        <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {platformFeatures.map(([icon, title, body]) => (
            <article key={title} className="bg-panel p-5 text-left sm:p-7">
              <div className="grid size-9 place-items-center rounded-lg border border-line bg-panel-2 font-mono text-sm text-brand">
                {icon}
              </div>
              <h3 className="mt-4 text-[16.5px] font-semibold text-fg sm:mt-5">
                {title}
              </h3>
              <p className="mt-2 text-[13.5px] leading-6 text-muted">{body}</p>
            </article>
          ))}
        </div>
      </ProductSection>

      {/* ================= PRICING SECTION ================= */}
      <section
        id="pricing"
        className="scroll-mt-16 py-12 sm:py-20 lg:py-24 bg-ink"
      >
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mb-8 text-center sm:mb-12">
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-brand sm:text-xs">
              Flexible Deployment
            </p>
            <h2 className="mt-3 text-[1.65rem] font-semibold leading-tight tracking-tight text-fg sm:mt-4 sm:text-4xl">
              Self-host for free, or let us run it
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[15px] leading-6 text-muted sm:mt-4 sm:text-base sm:leading-7">
              Managent is 100% open source. Deploy it yourself or use our
              managed cloud.
            </p>
          </Reveal>

          {/* Pricing View Toggle */}
          <Reveal delay={100}>
            <div className="mb-8 flex justify-center">
              <div className="inline-flex rounded-lg border border-line bg-panel p-1">
                <button
                  type="button"
                  onClick={() => setPricingView("cloud")}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                    pricingView === "cloud"
                      ? "bg-brand text-ink"
                      : "text-muted hover:text-fg"
                  }`}
                >
                  Managed Cloud
                </button>
                <button
                  type="button"
                  onClick={() => setPricingView("self-hosted")}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                    pricingView === "self-hosted"
                      ? "bg-brand text-ink"
                      : "text-muted hover:text-fg"
                  }`}
                >
                  Self-Hosted
                </button>
              </div>
            </div>
          </Reveal>

          {pricingView === "self-hosted" ? (
            /* Self-Hosted View */
            <Reveal delay={200}>
              <div className="mx-auto max-w-2xl">
                <div className="overflow-hidden rounded-xl border border-line bg-panel">
                  <div className="border-b border-line bg-panel-2 px-6 py-5 sm:px-8 sm:py-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-fg sm:text-2xl">
                          Deploy Anywhere
                        </h3>
                        <p className="mt-2 text-sm text-muted">
                          Run Managent on your own infrastructure
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-fg sm:text-4xl">
                          $0
                        </div>
                        <div className="text-sm text-muted">forever</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 sm:p-8">
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <Check className="mt-0.5 size-5 shrink-0 text-allow" />
                        <span className="text-sm text-fg">
                          Full source code access (MIT License)
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check className="mt-0.5 size-5 shrink-0 text-allow" />
                        <span className="text-sm text-fg">
                          Unlimited agents & gateway calls
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check className="mt-0.5 size-5 shrink-0 text-allow" />
                        <span className="text-sm text-fg">
                          All features included
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check className="mt-0.5 size-5 shrink-0 text-allow" />
                        <span className="text-sm text-fg">
                          Deploy on Docker, Kubernetes, or bare metal
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check className="mt-0.5 size-5 shrink-0 text-allow" />
                        <span className="text-sm text-fg">
                          Community support (GitHub & Discord)
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check className="mt-0.5 size-5 shrink-0 text-allow" />
                        <span className="text-sm text-fg">
                          No vendor lock-in
                        </span>
                      </li>
                    </ul>

                    <div className="mt-6 space-y-3">
                      <Button
                        href="https://github.com/managent/managent"
                        className="w-full justify-center"
                        size="lg"
                      >
                        <Github className="size-4" />
                        View on GitHub
                      </Button>
                      <Button
                        href="/docs/self-hosting"
                        variant="outline"
                        className="w-full justify-center"
                        size="lg"
                      >
                        Read Deployment Guide
                      </Button>
                    </div>

                    <div className="mt-6 rounded-lg border border-line-soft bg-surface p-4">
                      <p className="text-xs text-muted">
                        <strong className="text-fg">Need help?</strong>{" "}
                        Professional support packages available from{" "}
                        <Link
                          href="/support"
                          className="text-brand hover:underline"
                        >
                          $499/month
                        </Link>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          ) : (
            /* Managed Cloud View */
            <>
              {/* Billing Cycle Toggle */}
              <Reveal delay={100}>
                <div className="mb-8 flex justify-center">
                  <div className="inline-flex items-center gap-3 rounded-lg border border-line bg-panel px-4 py-2">
                    <button
                      type="button"
                      onClick={() => setBillingCycle("monthly")}
                      className={`text-sm font-medium transition-colors ${
                        billingCycle === "monthly"
                          ? "text-fg"
                          : "text-muted hover:text-fg"
                      }`}
                    >
                      Monthly
                    </button>
                    <div className="h-4 w-px bg-line" />
                    <button
                      type="button"
                      onClick={() => setBillingCycle("annual")}
                      className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                        billingCycle === "annual"
                          ? "text-fg"
                          : "text-muted hover:text-fg"
                      }`}
                    >
                      Annual
                      <span className="rounded bg-allow/10 px-1.5 py-0.5 text-[10px] font-semibold text-allow">
                        Save 20%
                      </span>
                    </button>
                  </div>
                </div>
              </Reveal>

              {/* Pricing Cards */}
              <div className="grid gap-6 lg:grid-cols-3">
                <Reveal delay={200}>
                  <PricingCard
                    name="Free"
                    price="$0"
                    period="forever"
                    description="Perfect for trying out Managent"
                    features={[
                      "Up to 3 agents",
                      "10,000 gateway calls/month",
                      "30-day audit retention",
                      "Community support",
                      "Basic policies (allow/deny)",
                    ]}
                    cta="Start Free"
                    ctaHref="/register"
                  />
                </Reveal>

                <Reveal delay={300}>
                  <PricingCard
                    name="Starter"
                    price={billingCycle === "annual" ? "$23" : "$29"}
                    period="per month"
                    originalPrice={
                      billingCycle === "annual" ? "$29" : undefined
                    }
                    description="For small teams getting started"
                    features={[
                      "Up to 10 agents",
                      "100,000 gateway calls/month",
                      "90-day audit retention",
                      "Email support",
                      "All policy types",
                      "Slack/Discord integrations",
                      "SSO (Google, GitHub)",
                    ]}
                    cta="Start Trial"
                    ctaHref="/register?plan=starter"
                    popular
                  />
                </Reveal>

                <Reveal delay={400}>
                  <PricingCard
                    name="Professional"
                    price={billingCycle === "annual" ? "$119" : "$149"}
                    period="per month"
                    originalPrice={
                      billingCycle === "annual" ? "$149" : undefined
                    }
                    description="For growing teams at scale"
                    features={[
                      "Up to 50 agents",
                      "1M gateway calls/month",
                      "1-year audit retention",
                      "Priority support + Slack",
                      "Advanced conditions",
                      "Custom workflows",
                      "RBAC",
                      "SOC 2 infrastructure",
                    ]}
                    cta="Start Trial"
                    ctaHref="/register?plan=pro"
                  />
                </Reveal>
              </div>

              {/* Enterprise Card */}
              <Reveal delay={500}>
                <div className="mt-6 overflow-hidden rounded-xl border border-line bg-panel">
                  <div className="flex flex-col items-center gap-6 p-6 text-center sm:flex-row sm:text-left sm:p-8">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-fg">
                        Enterprise
                      </h3>
                      <p className="mt-2 text-sm text-muted">
                        Custom deployment, dedicated support, and SLA guarantees
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted sm:justify-start justify-center">
                        <span className="flex items-center gap-1">
                          <Check className="size-3 text-allow" />
                          Unlimited agents
                        </span>
                        <span className="flex items-center gap-1">
                          <Check className="size-3 text-allow" />
                          On-premise option
                        </span>
                        <span className="flex items-center gap-1">
                          <Check className="size-3 text-allow" />
                          Custom SLA
                        </span>
                        <span className="flex items-center gap-1">
                          <Check className="size-3 text-allow" />
                          Dedicated support
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <Button
                        onClick={() => setContactOpen(true)}
                        variant="outline"
                        size="lg"
                      >
                        Contact Sales
                      </Button>
                    </div>
                  </div>
                </div>
              </Reveal>

              {/* FAQ */}
              <Reveal delay={600}>
                <div className="mt-12 space-y-6">
                  <h3 className="text-center text-xl font-semibold text-fg">
                    Frequently Asked Questions
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border border-line bg-panel p-5">
                      <h4 className="font-semibold text-fg">
                        What counts as a gateway call?
                      </h4>
                      <p className="mt-2 text-sm text-muted">
                        Each tool invocation that passes through Managent,
                        regardless of outcome (allow/deny/review).
                      </p>
                    </div>
                    <div className="rounded-lg border border-line bg-panel p-5">
                      <h4 className="font-semibold text-fg">
                        Can I upgrade or downgrade anytime?
                      </h4>
                      <p className="mt-2 text-sm text-muted">
                        Yes, changes take effect immediately with prorated
                        billing. No lock-in contracts.
                      </p>
                    </div>
                    <div className="rounded-lg border border-line bg-panel p-5">
                      <h4 className="font-semibold text-fg">
                        How is self-hosted different from managed?
                      </h4>
                      <p className="mt-2 text-sm text-muted">
                        Same features, same code. Managed cloud handles
                        infrastructure, updates, and scaling for you.
                      </p>
                    </div>
                    <div className="rounded-lg border border-line bg-panel p-5">
                      <h4 className="font-semibold text-fg">
                        Is my data secure?
                      </h4>
                      <p className="mt-2 text-sm text-muted">
                        All data encrypted in transit and at rest. SOC 2 Type II
                        certified. Self-host for complete control.
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            </>
          )}
        </div>
      </section>

      {/* ================= CTA SECTION ================= */}
      <Section id="labs">
        <Reveal className="w-full">
          <div className="relative w-full overflow-hidden rounded-xl border border-line bg-panel px-5 py-10 text-center sm:rounded-2xl sm:px-10 sm:py-16">
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 -top-60 size-150 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(108,123,255,.16),transparent_68%)]"
            />
            <h2 className="relative text-[1.65rem] font-semibold leading-tight tracking-tight text-fg sm:text-4xl">
              Bring compliance and safety to MCP.
            </h2>
            <p className="relative mx-auto mt-3 max-w-lg text-sm leading-6 text-muted sm:mt-4 sm:text-base sm:leading-7">
              Start securing tool execution in minutes. Deploy yourself or use
              our managed cloud.
            </p>
            <div className="w-full mx-auto relative mt-6 flex flex-col items-center justify-center gap-3 sm:mt-8 sm:flex-row">
              <Button
                href="https://github.com/managent/managent"
                size="md"
                variant="outline"
                className="w-max sm:w-auto"
              >
                <Github className="size-4" />
                View on GitHub
              </Button>
              <Button href="/register" size="md" className="w-max sm:w-auto">
                Start Free Trial
              </Button>
            </div>
          </div>
        </Reveal>

        <Modal
          open={contactOpen}
          onClose={() => setContactOpen(false)}
          title="Talk with us"
          wide
        >
          <ModalBody className="p-5 text-left sm:p-6 no-scrollbar">
            <p className="mb-5 text-[13.5px] leading-6 text-muted">
              Tell us about your agent platform, what MCP servers you&apos;re
              connecting, and how you want to manage developer security.
            </p>
            <form id="contact-form">
              <div className="grid gap-5">
                <Field label="Work email">
                  <input
                    aria-label="Work email"
                    type="email"
                    name="email"
                    placeholder="you@company.com"
                    className={inputClass}
                    autoComplete="email"
                    required
                  />
                </Field>

                <Field label="Primary MCP Clients">
                  <select
                    aria-label="MCP Client"
                    name="client"
                    defaultValue=""
                    className={inputClass}
                    required
                  >
                    <option value="" disabled>
                      Select client environment
                    </option>
                    <option>Claude Desktop</option>
                    <option>Cursor / Windsurf</option>
                    <option>LangChain / LangGraph</option>
                    <option>LlamaIndex / Custom Agent Platform</option>
                    <option>Other / Multi-IDE</option>
                  </select>
                </Field>

                <Field label="What tools are your agents executing?">
                  <textarea
                    aria-label="What are you building?"
                    minLength={10}
                    name="building"
                    rows={3}
                    placeholder="Github modifications, Stripe payments, Slack automation, internal DB writing..."
                    className={inputClass}
                    required
                  />
                </Field>

                <Field label="What is your biggest governance requirement?">
                  <textarea
                    aria-label="What is your biggest challenge?"
                    minLength={10}
                    name="challenge"
                    rows={3}
                    placeholder="Human-in-the-loop approvals, credential storage, live audit logging..."
                    className={inputClass}
                    required
                  />
                </Field>

                <Button
                  type="submit"
                  size="md"
                  className="w-full justify-center"
                >
                  Request access
                </Button>
              </div>
            </form>
          </ModalBody>
        </Modal>
      </Section>

      {/* ================= FOOTER ================= */}
      <footer id="footer" className="overflow-hidden bg-ink">
        <div className="mx-auto w-full max-w-7xl px-4 pt-10 sm:px-6 sm:pt-14 lg:px-8">
          <div className="mb-10 max-w-md">
            <p className="text-base font-semibold text-fg">Managent</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Every MCP tool call, allowed, denied, or reviewed — at the
              gateway.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-5 gap-y-9 sm:gap-10 lg:grid-cols-4">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-brand">
                  {column.title}
                </h3>
                <div className="mt-4 grid gap-2.5 text-sm text-muted">
                  {column.links.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      className="transition-colors hover:text-fg"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 border-t border-line-soft py-6 text-xs text-muted-2">
            © {new Date().getFullYear()} Managent. All rights reserved.
          </div>

          <p
            aria-hidden="true"
            className="select-none whitespace-nowrap text-center text-[clamp(3.7rem,17vw,13.5rem)] font-semibold leading-[0.72] tracking-[-0.075em] text-surface"
          >
            Managent
          </p>
        </div>
      </footer>
    </main>
  );
}

/* ============================================================
   Shared primitives
   ============================================================ */

const inputClass =
  "min-h-12 w-full rounded-lg border border-line bg-panel-2 px-4 text-base text-fg outline-none transition placeholder:text-muted-2 focus:border-brand focus:ring-4 focus:ring-brand/20";

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(node);
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

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
        "py-12 sm:py-20 lg:py-24 " + (tone === "tint" ? "bg-panel-2" : "bg-ink")
      }
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 text-center sm:px-6 lg:px-8">
        {children}
      </div>
    </section>
  );
}

function Button({
  href,
  children,
  variant = "primary",
  size = "md",
  type,
  onClick,
  className = "",
}: {
  href?: string;
  children: ReactNode;
  variant?: "primary" | "outline";
  size?: "sm" | "md" | "lg";
  type?: "button" | "submit";
  onClick?: () => void;
  className?: string;
}) {
  const sizeClass =
    size === "lg"
      ? "px-5 py-3 text-sm sm:px-6 sm:text-base"
      : size === "sm"
        ? "px-4 py-2 text-sm"
        : "px-5 py-2.5 text-sm";
  const variantClass =
    variant === "primary"
      ? "bg-brand text-ink hover:brightness-110"
      : "border border-line bg-panel text-fg hover:border-line-soft hover:bg-surface";

  const classes = `inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${sizeClass} ${variantClass} ${className}`;

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }
  return (
    <button type={type ?? "button"} className={classes} onClick={onClick}>
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-fg">{label}</span>
      {children}
    </label>
  );
}

function ProductSection({
  id,
  eyebrow,
  title,
  description,
  tone = "plain",
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  tone?: "plain" | "tint";
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-16 py-12 sm:py-20 lg:py-24 ${tone === "tint" ? "bg-panel-2" : "bg-ink"}`}
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mb-8 max-w-2xl text-left sm:mb-12">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-brand sm:text-xs">
            {eyebrow}
          </p>
          <h2 className="mt-3 text-[1.65rem] font-semibold leading-tight tracking-tight text-fg sm:mt-4 sm:text-4xl">
            {title}
          </h2>
          <p className="mt-3 max-w-xl text-[15px] leading-6 text-muted sm:mt-4 sm:text-base sm:leading-7">
            {description}
          </p>
        </Reveal>
        {children}
      </div>
    </section>
  );
}

function ModeCard({
  badge,
  tone,
  title,
  body,
  children,
}: {
  badge: string;
  tone: "gateway" | "sdk";
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-line bg-panel px-4 pt-5 text-left sm:px-7 sm:pt-7">
      <span
        className={`inline-block rounded px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide ${tone === "gateway" ? "bg-brand/9 text-brand" : "bg-deny/8 text-deny"}`}
      >
        {badge}
      </span>
      <h3 className="mt-4 text-lg font-semibold text-fg sm:text-xl">{title}</h3>
      <p className="mb-5 mt-2 text-sm leading-6 text-muted sm:mb-6 sm:text-[14.5px]">
        {body}
      </p>
      <div className="-mx-px overflow-x-auto whitespace-nowrap rounded-t-lg border border-b-0 border-line bg-panel-2 p-3 font-mono text-[10px] leading-5 text-fg sm:p-5 sm:text-xs sm:leading-6">
        {children}
      </div>
    </article>
  );
}

function PolicyUICard({
  badge,
  tone,
  title,
  body,
}: {
  badge: string;
  tone: "gateway" | "sdk";
  title: string;
  body: string;
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-line bg-panel px-4 pt-5 text-left sm:px-7 sm:pt-7">
      <span
        className={`inline-block rounded px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide ${tone === "gateway" ? "bg-brand/9 text-brand" : "bg-deny/8 text-deny"}`}
      >
        {badge}
      </span>
      <h3 className="mt-4 text-lg font-semibold text-fg sm:text-xl">{title}</h3>
      <p className="mb-5 mt-2 text-sm leading-6 text-muted sm:mb-6 sm:text-[14.5px]">
        {body}
      </p>
      <div className="-mx-px rounded-t-lg border border-b-0 border-line bg-panel-2 p-4 sm:p-5">
        {/* Policy Rules List */}
        <div className="space-y-3">
          {/* Rule 1 - Allow */}
          <div className="flex items-start gap-3 rounded-lg border border-line-soft bg-panel p-3">
            <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-allow/10">
              <Check className="size-3 text-allow" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-fg">
                  mcp-github:read_*
                </span>
                <span className="rounded bg-allow/10 px-1.5 py-0.5 text-[9px] font-semibold text-allow">
                  ALLOW
                </span>
              </div>
              <p className="mt-1 text-[10px] text-muted">All agents</p>
            </div>
          </div>

          {/* Rule 2 - Review */}
          <div className="flex items-start gap-3 rounded-lg border border-line-soft bg-panel p-3">
            <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-deny/10">
              <AlertCircle className="size-3 text-deny" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-fg">
                  mcp-stripe:charge
                </span>
                <span className="rounded bg-deny/10 px-1.5 py-0.5 text-[9px] font-semibold text-deny">
                  REVIEW
                </span>
              </div>
              <p className="mt-1 text-[10px] text-muted">If amount &gt; $100</p>
            </div>
          </div>

          {/* Rule 3 - Deny */}
          <div className="flex items-start gap-3 rounded-lg border border-line-soft bg-panel p-3">
            <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-danger/10">
              <Shield className="size-3 text-danger" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-fg">
                  mcp-*:delete_*
                </span>
                <span className="rounded bg-danger/10 px-1.5 py-0.5 text-[9px] font-semibold text-danger">
                  DENY
                </span>
              </div>
              <p className="mt-1 text-[10px] text-muted">Production agents</p>
            </div>
          </div>
        </div>

        {/* Add Rule Button */}
        <button
          type="button"
          className="mt-3 w-full rounded-lg border border-dashed border-line-soft bg-surface px-3 py-2 text-[10px] font-medium text-muted transition-colors hover:border-line hover:bg-panel hover:text-fg"
        >
          + Add new rule
        </button>
      </div>
    </article>
  );
}

function PricingCard({
  name,
  price,
  period,
  originalPrice,
  description,
  features,
  cta,
  ctaHref,
  popular = false,
}: {
  name: string;
  price: string;
  period: string;
  originalPrice?: string;
  description: string;
  features: string[];
  cta: string;
  ctaHref: string;
  popular?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border ${
        popular ? "border-brand shadow-lg shadow-brand/20" : "border-line"
      } bg-panel`}
    >
      {popular && (
        <div className="absolute right-4 top-4">
          <span className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-ink">
            Popular
          </span>
        </div>
      )}

      <div className="p-6 sm:p-8">
        <h3 className="text-xl font-semibold text-fg">{name}</h3>
        <p className="mt-2 text-sm text-muted">{description}</p>

        <div className="mt-6">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-fg">{price}</span>
            <span className="text-sm text-muted">{period}</span>
          </div>
          {originalPrice && (
            <div className="mt-1">
              <span className="text-sm text-muted line-through">
                {originalPrice}/month
              </span>
            </div>
          )}
        </div>

        <Button
          href={ctaHref}
          className="mt-6 w-full justify-center"
          variant={popular ? "primary" : "outline"}
        >
          {cta}
        </Button>

        <ul className="mt-8 space-y-3">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-sm">
              <Check className="mt-0.5 size-4 shrink-0 text-allow" />
              <span className="text-fg">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function DecisionCard({
  type,
  label,
  body,
  rule,
}: {
  type: "allow" | "review" | "deny";
  label: string;
  body: string;
  rule: string;
}) {
  const color = DECISION_COLOR[type];
  return (
    <article
      className="rounded-xl border border-line border-t-2 bg-panel p-5 text-left sm:p-6"
      style={{ borderTopColor: color }}
    >
      <div
        className="flex items-center gap-2 font-mono text-xs font-semibold"
        style={{ color }}
      >
        <span
          className="size-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        {label}
      </div>
      <p className="mt-4 text-sm leading-6 text-muted">{body}</p>
      <p className="mt-4 border-t border-line-soft pt-4 font-mono text-xs text-muted-2">
        {rule}
      </p>
    </article>
  );
}

function AuditStream() {
  return (
    <div
      className="hero-anim overflow-hidden rounded-xl border border-line bg-panel text-left shadow-[0_18px_45px_-20px_rgba(0,0,0,.75)]"
      style={{ animationDelay: "460ms" }}
    >
      <div className="flex items-center justify-between border-b border-line bg-panel-2 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="flex gap-1">
            <i className="size-1.5 rounded-full bg-line" />
            <i className="size-1.5 rounded-full bg-line" />
            <i className="size-1.5 rounded-full bg-line" />
          </span>
          <span className="font-mono text-[8px] text-muted sm:text-[9px]">
            gateway-log — all mcp connections
          </span>
        </div>
        <span className="flex items-center gap-1 font-mono text-[8px] text-allow sm:text-[9px]">
          <i className="live-pulse size-1.5 rounded-full bg-allow" />
          live
        </span>
      </div>
      <div className="relative h-28 overflow-hidden after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-7 after:bg-linear-to-b after:from-transparent after:to-panel sm:h-33">
        <div className="audit-track">
          {[...auditRows, ...auditRows].map(
            ([time, agent, call, state], index) => (
              <div
                key={`${time}-${index}`}
                className="flex items-center gap-2 border-b border-line-soft px-3 py-1.5 font-mono text-[7px] sm:text-[8.5px]"
              >
                <span className="w-7 shrink-0 text-muted-2">{time}</span>
                <span className="hidden w-20 shrink-0 truncate text-muted sm:block">
                  {agent}
                </span>
                <span className="min-w-0 flex-1 truncate text-fg">{call}</span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[6.5px] font-semibold sm:text-[7px] ${state === "allow" ? "bg-allow/8 text-allow" : state === "deny" ? "bg-danger/8 text-danger" : "bg-deny/8 text-deny"}`}
                >
                  {state === "review" ? "REVIEW" : state.toUpperCase()}
                </span>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
