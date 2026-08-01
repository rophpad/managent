"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";

// Exact source geometry for illustration-managent.svg is untouched: every `d`,
// `stroke`, `fill`, and `mask` attribute below is byte-for-byte identical to the
// original file. The only additions are `class` attributes (for CSS targeting)
// and a <style> block — pure metadata, it changes nothing about the static shape.
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
  .agent-chip { transform-box: fill-box; transform-origin: center; animation: agentChipBorder 3.6s ease-in-out infinite; }
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
  // @keyframes agentChipBorder {
  //   0%, 100% { fill: #35D28A; }
  //   33% { fill: #FF5C5C; }
  //   66% { fill: #F5B942; }
  // }
  @keyframes agentSignalFlow {
    to { stroke-dashoffset: -56; }
  }
</style>
<path class="agent-node n1" d="M67 1H8C4.13401 1 1 4.13401 1 8V67L1.00879 67.3604C1.19633 71.0589 4.25486 74 8 74H67C70.866 74 74 70.866 74 67V8L73.9912 7.63965C73.8097 4.06046 70.9395 1.19028 67.3604 1.00879L67 1ZM37.5 29C42.1944 29 46 32.8056 46 37.5C46 42.1944 42.1944 46 37.5 46C32.8056 46 29 42.1944 29 37.5C29 32.8056 32.8056 29 37.5 29Z" stroke="black" strokeWidth="2"/>
<path class="agent-node n2" d="M67 289H8C4.13401 289 1 292.134 1 296V355L1.00879 355.36C1.19633 359.059 4.25486 362 8 362H67C70.866 362 74 358.866 74 355V296L73.9912 295.64C73.8097 292.06 70.9395 289.19 67.3604 289.009L67 289ZM37.5 317C42.1944 317 46 320.806 46 325.5C46 330.194 42.1944 334 37.5 334C32.8056 334 29 330.194 29 325.5C29 320.806 32.8056 317 37.5 317Z" stroke="black" strokeWidth="2"/>
<path class="agent-node n3" d="M67 577H8C4.13401 577 1 580.134 1 584V643L1.00879 643.36C1.19633 647.059 4.25486 650 8 650H67C70.866 650 74 646.866 74 643V584L73.9912 583.64C73.8097 580.06 70.9395 577.19 67.3604 577.009L67 577ZM37.5 605C42.1944 605 46 608.806 46 613.5C46 618.194 42.1944 622 37.5 622C32.8056 622 29 618.194 29 613.5C29 608.806 32.8056 605 37.5 605Z" stroke="black" strokeWidth="2"/>
<mask id="path-4-inside-1_50_41" fill="white">
<path d="M644.5 254C653.337 254 660.5 261.163 660.5 270V359C660.5 367.837 653.337 375 644.5 375H555.5C546.663 375 539.5 367.837 539.5 359V270C539.5 261.163 546.663 254 555.5 254H644.5ZM626.022 298.25C623.064 295.72 618.863 295.282 615.451 297.147L603.987 303.416C601.189 304.946 597.811 304.946 595.013 303.416L583.549 297.147C580.137 295.282 575.936 295.72 572.978 298.25L551.863 316.304C544.146 322.903 550.837 335.426 560.564 332.589L596.884 321.996C598.593 321.498 600.407 321.498 602.116 321.996L638.436 332.589C648.163 335.426 654.854 322.903 647.137 316.304L626.022 298.25Z"/>
</mask>
<path class="agent-chip" d="M644.5 254V252V252V254ZM660.5 359H662.5V359H660.5ZM555.5 375V377V377V375ZM539.5 270H537.5V270H539.5ZM626.022 298.25L627.322 296.73L627.322 296.73L626.022 298.25ZM615.451 297.147L614.492 295.393L614.492 295.393L615.451 297.147ZM603.987 303.416L603.028 301.661V301.661L603.987 303.416ZM595.013 303.416L595.972 301.661V301.661L595.013 303.416ZM583.549 297.147L584.508 295.393L584.508 295.393L583.549 297.147ZM572.978 298.25L571.678 296.73L571.678 296.73L572.978 298.25ZM551.863 316.304L550.564 314.784L550.564 314.784L551.863 316.304ZM560.564 332.589L561.124 334.509L561.124 334.509L560.564 332.589ZM596.884 321.996L596.324 320.076L596.324 320.076L596.884 321.996ZM602.116 321.996L602.676 320.076L602.676 320.076L602.116 321.996ZM638.436 332.589L637.876 334.509L637.876 334.509L638.436 332.589ZM647.137 316.304L648.436 314.784L648.436 314.784L647.137 316.304ZM644.5 254V256C652.232 256 658.5 262.268 658.5 270H660.5H662.5C662.5 260.059 654.441 252 644.5 252V254ZM660.5 270H658.5V359H660.5H662.5V270H660.5ZM660.5 359H658.5C658.5 366.732 652.232 373 644.5 373V375V377C654.441 377 662.5 368.941 662.5 359H660.5ZM644.5 375V373H555.5V375V377H644.5V375ZM555.5 375V373C547.768 373 541.5 366.732 541.5 359H539.5H537.5C537.5 368.941 545.559 377 555.5 377V375ZM539.5 359H541.5V270H539.5H537.5V359H539.5ZM539.5 270H541.5C541.5 262.268 547.768 256 555.5 256V254V252C545.559 252 537.5 260.059 537.5 270H539.5ZM555.5 254V256H644.5V254V252H555.5V254ZM626.022 298.25L627.322 296.73C623.733 293.661 618.633 293.128 614.492 295.393L615.451 297.147L616.411 298.902C619.092 297.436 622.394 297.779 624.723 299.77L626.022 298.25ZM615.451 297.147L614.492 295.393L603.028 301.661L603.987 303.416L604.947 305.171L616.411 298.902L615.451 297.147ZM603.987 303.416L603.028 301.661C600.828 302.864 598.172 302.864 595.972 301.661L595.013 303.416L594.053 305.171C597.449 307.028 601.551 307.028 604.947 305.171L603.987 303.416ZM595.013 303.416L595.972 301.661L584.508 295.393L583.549 297.147L582.589 298.902L594.053 305.171L595.013 303.416ZM583.549 297.147L584.508 295.393C580.367 293.128 575.267 293.661 571.678 296.73L572.978 298.25L574.277 299.77C576.606 297.779 579.908 297.436 582.589 298.902L583.549 297.147ZM572.978 298.25L571.678 296.73L550.564 314.784L551.863 316.304L553.163 317.824L574.277 299.77L572.978 298.25ZM551.863 316.304L550.564 314.784C541.256 322.742 549.269 337.966 561.124 334.509L560.564 332.589L560.005 330.669C552.404 332.885 547.036 323.063 553.163 317.824L551.863 316.304ZM560.564 332.589L561.124 334.509L597.444 323.916L596.884 321.996L596.324 320.076L560.004 330.669L560.564 332.589ZM596.884 321.996L597.444 323.916C598.787 323.524 600.213 323.524 601.556 323.916L602.116 321.996L602.676 320.076C600.602 319.471 598.398 319.471 596.324 320.076L596.884 321.996ZM602.116 321.996L601.556 323.916L637.876 334.509L638.436 332.589L638.996 330.669L602.676 320.076L602.116 321.996ZM638.436 332.589L637.876 334.509C649.731 337.966 657.744 322.742 648.436 314.784L647.137 316.304L645.837 317.824C651.964 323.063 646.596 332.885 638.995 330.669L638.436 332.589ZM647.137 316.304L648.436 314.784L627.322 296.73L626.022 298.25L624.723 299.77L645.837 317.824L647.137 316.304Z" fill="black" mask="url(#path-4-inside-1_50_41)"/>
<path class="agent-line l1" d="M89 38C159 38.0002 282.75 47.5002 313 157.5C342.917 266.29 424.5 282.5 528 282.5" stroke="black" strokeWidth="2" strokeLinecap="round"/>
<path class="agent-line l2" d="M1107 599.5C1037 599.5 913.25 590 883 480C853.083 371.21 771.5 355 668 355" stroke="black" strokeWidth="2" strokeLinecap="round"/>
<path class="agent-line l3" d="M528 363C458 363 334.25 372.5 304 482.5C274.083 591.29 192.5 607.5 89 607.5" stroke="black" strokeWidth="2" strokeLinecap="round"/>
<path class="agent-line l4" d="M668 274.5C738 274.5 861.75 265 892 155C921.917 46.21 1003.5 30 1107 30" stroke="black" strokeWidth="2" strokeLinecap="round"/>
<path class="agent-line l5" d="M94 323H526.5" stroke="black" strokeWidth="2" strokeLinecap="round"/>
<path class="agent-line l6" d="M1102 315.5H674.5" stroke="black" strokeWidth="2" strokeLinecap="round"/>
<path class="agent-node n4" d="M1158.5 1C1178.66 1 1195 17.3416 1195 37.5C1195 57.6584 1178.66 74 1158.5 74C1138.34 74 1122 57.6584 1122 37.5C1122 17.3416 1138.34 1 1158.5 1ZM1158 32C1154.69 32 1152 34.6863 1152 38C1152 41.3137 1154.69 44 1158 44C1161.31 44 1164 41.3137 1164 38C1164 34.6863 1161.31 32 1158 32Z" stroke="black" strokeWidth="2"/>
<path class="agent-node n5" d="M1158.5 278C1178.66 278 1195 294.342 1195 314.5C1195 334.658 1178.66 351 1158.5 351C1138.34 351 1122 334.658 1122 314.5C1122 294.342 1138.34 278 1158.5 278ZM1158 309C1154.69 309 1152 311.686 1152 315C1152 318.314 1154.69 321 1158 321C1161.31 321 1164 318.314 1164 315C1164 311.686 1161.31 309 1158 309Z" stroke="black" strokeWidth="2"/>
<path class="agent-node n6" d="M1158.5 555C1178.66 555 1195 571.342 1195 591.5C1195 611.658 1178.66 628 1158.5 628C1138.34 628 1122 611.658 1122 591.5C1122 571.342 1138.34 555 1158.5 555ZM1158 586C1154.69 586 1152 588.686 1152 592C1152 595.314 1154.69 598 1158 598C1161.31 598 1164 595.314 1164 592C1164 588.686 1161.31 586 1158 586Z" stroke="black" strokeWidth="2"/>
</svg>`;

const navigationItems = [
  { label: "Product", href: "#products" },
  { label: "How it works", href: "#vision" },
  { label: "Platform", href: "#ecosystem" },
  { label: "Blog", href: "#blog" },
];

const auditRows = [
  ["-03s", "support-bot", "stripe:charge", "allow"],
  ["-06s", "billing-bot", "linear:create_issue", "allow"],
  ["-09s", "deploy-agent", "github:delete_repo", "deny"],
  ["-13s", "research-bot", "stripe:refund $840", "review"],
  ["-16s", "sales-agent", "slack:post_message", "allow"],
  ["-20s", "ops-bot", "postgres:drop_table", "deny"],
] as const;

const decisionStates = [
  { type: "allow", label: "ALLOW", body: "The call matches an approved scope and runs immediately, with the real credential injected at the last moment.", rule: "agent:support-bot → linear:read_issue" },
  { type: "review", label: "REQUIRE APPROVAL", body: "The call is held and routed to Slack or Discord. It only runs once a human resolves it — and every resolution is logged.", rule: "agent:billing-bot → stripe:refund > $500" },
  { type: "deny", label: "DENY", body: "The call is blocked before it reaches the real tool. The agent sees a normal error — no silent failures.", rule: "agent:*-bot → github:delete_repo" },
] as const;

const platformFeatures = [
  ["◈", "Agent registry", "Every agent, its owner, and its live coverage — populated automatically as calls come in."],
  ["▤", "Ordered policy", "Allow, deny, or require approval, with rate limits and conditions, evaluated top to bottom."],
  ["◷", "Audit log", "Every decision — agent, tool, outcome, timestamp — searchable and exportable."],
  ["⊘", "One-click revoke", "Cut off an agent's access instantly, across every tool it touches, without a redeploy."],
] as const;

const footerColumns = [
  {
    title: "Company",
    links: [
      { label: "Docs", href: "#products" },
      { label: "Pricing", href: "#labs" },
      { label: "Changelog", href: "#products" },
    ],
  },
  {
    title: "Explore",
    links: [
      { label: "Gateway", href: "#products" },
      { label: "SDK", href: "#products" },
      { label: "Platform", href: "#ecosystem" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Security", href: "#vision" },
      { label: "GitHub", href: "#open-source" },
      { label: "Discord", href: "#labs" },
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
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="min-h-screen bg-white text-(--ink)" style={{ ["--ink" as string]: INK }}>
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
        @keyframes popIn {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
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
            box-shadow: 0 0 0 5px rgba(35, 132, 90, 0);
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

        /* Illustration sizing only — the actual node/chip/line animations are
           defined inline inside the SVG markup itself (see AGENT_ILLUSTRATION_SVG),
           so they render correctly regardless of how this page injects the string. */
        .agent-illustration svg {
          display: block;
          width: 100%;
          height: auto;
          overflow: visible;
        }

        .reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
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
          transition: grid-template-rows 0.35s ease, opacity 0.25s ease;
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
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:h-auto sm:px-6 sm:py-3 lg:px-8 lg:py-4">
          <a
            href="#top"
            aria-label="Managent home"
            className="flex shrink-0 items-center gap-1 font-semibold leading-none text-[#11140f] "
          >
            {/* <Image
              src="/logo.svg"
              alt=""
              width={108}
              height={44}
              className="h-auto w-8 sm:w-11 "
              priority
            />
            <span className="text-sm sm:text-lg font-light">anagent</span> */}
            <Image
              src="/logo1.svg"
              alt=""
              width={100}
              height={100}
              className="h-auto w-[86px] sm:w-[100px]"
              priority
            />
          </a>

          <nav className="hidden items-center gap-7 text-sm font-medium text-[#565b50] lg:flex">
            {navigationItems.map((item) => (
              <a key={item.label} href={item.href} className="transition-colors hover:text-[#11140f]">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="#open-source"
              aria-label="GitHub"
              title="GitHub"
              className="hidden text-[#565b50] transition-colors hover:border-black hover:text-[#11140f] lg:inline-flex"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2" />
              </svg>
            </a>
            <div className="hidden lg:block">
              <Button href="#built-in-public" size="sm">
                <span className="text-white">Get started</span>
              </Button>
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-[#e4dfd0] text-[#11140f] transition-colors hover:border-[#c9c3ae] lg:hidden"
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav panel */}
        <div className={`mobile-menu border-t border-[#ece7d8] lg:hidden ${menuOpen ? "is-open" : ""}`}>
          <div>
            <nav className="flex max-h-[calc(100vh-4rem)] flex-col gap-1 overflow-y-auto px-4 py-3 text-sm font-medium text-[#565b50] sm:px-6 sm:py-4">
              {navigationItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-2.5 transition-colors hover:bg-[#fbfaf6] hover:text-[#11140f]"
                >
                  {item.label}
                </a>
              ))}
              <a
                href="#open-source"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 transition-colors hover:bg-[#fbfaf6] hover:text-[#11140f]"
              >
                GitHub
              </a>
              <Button href="#built-in-public" size="sm" className="mt-2 w-full justify-center">
                <span className="text-white">Get started</span>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section id="top" className="relative overflow-hidden">
        {/* soft radial glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-104 opacity-[0.35] sm:h-128"
          style={{
            background:
              "radial-gradient(600px 260px at 50% 0%, rgba(52,84,54,0.14), transparent 70%)",
          }}
        />

        <div
          className="hero-anim relative mx-auto flex w-full max-w-6xl justify-center px-4 pb-10 pt-8 sm:px-6 sm:pb-8 sm:pt-10 lg:max-w-272 lg:pb-10 lg:pt-14"
          style={{ animationDelay: "360ms" }}
        >
          {/* Shared positioning context for the text + image + pills, sized to the
              SVG's own aspect ratio so everything lines up against its real coordinates. */}
          <div className="relative flow-root w-full max-w-4xl lg:max-w-5xl">
            {/* Hero copy: stacked normally on mobile (not enough image height to
                overlay legibly there), becomes an absolute overlay on top of the
                illustration from `sm` up. z-10 always wins the stacking once it's
                positioned, regardless of DOM order. */}
            <div className="relative z-10 mb-5 flex flex-col items-center text-center sm:absolute sm:inset-x-0 sm:top-0 sm:mb-0 sm:px-6 sm:pt-4 lg:pt-6">
              <span
                className="hero-anim inline-flex items-center gap-2 rounded-full border border-[#e4dfd0] bg-[#fbfaf6] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#345436] sm:px-3.5 sm:text-xs"
                style={{ animationDelay: "0ms" }}
              >
                <span className="size-1.5 rounded-full bg-[#345436]" />
                Control plane for AI agents
              </span>

              <h1
                className="hero-anim mt-4 max-w-[22rem] text-[1.85rem] font-medium leading-[1.08] tracking-tight text-[#11140f] min-[390px]:text-[2.05rem] sm:mt-5 sm:max-w-lg sm:text-5xl lg:max-w-2xl lg:text-6xl"
                style={{ animationDelay: "90ms" }}
              >
                Every agent call, <span className="text-[#23845a]">allowed</span>,{" "}
                <span className="text-[#d94b4b]">denied</span>, or{" "}
                <span className="text-[#b47a12]">reviewed</span> <br /> on purpose.
              </h1>

              <p
                className="hero-anim mt-4 max-w-sm text-[13.5px] leading-6 text-[#565b50] sm:max-w-sm sm:text-lg sm:leading-7 lg:max-w-md"
                style={{ animationDelay: "180ms" }}
              >
                Managent scopes what your agents can touch, checks every call against policy, and logs what happened.
                {/* Connect through a gateway or wrap it into your agent&apos;s own code — same control plane either way. */}
              </p>

              <div
                className="hero-anim mt-5 flex w-full max-w-xs flex-col items-stretch justify-center gap-3 sm:mt-6 sm:w-auto sm:max-w-none sm:flex-row"
                style={{ animationDelay: "270ms" }}
              >
                <Button href="#ecosystem" size="md" className="w-full sm:w-auto">
                  <span className="text-white">Get started free</span>
                </Button>
              </div>
            </div>

            {/* Illustration group, nudged down a bit and kept independent of the
                text overlay above: this margin lives on its own block, and the
                outer wrapper's `flow-root` stops it from collapsing upward into
                the text overlay's anchor point. Adjust sm:mt-*/}
            <div className="relative mt-7 sm:mt-10 lg:mt-64">
              {/* Soft scrim so the overlaid copy stays legible against the diagram
                  beneath it. The top of the illustration is empty space by design
                  (the corner nodes sit far to the sides), so this mostly just adds
                  a gentle fade rather than hiding any part of the artwork. */}
              <div
                aria-hidden
                className=" pointer-events-none absolute left-1/2 -top-10 z-5 hidden h-[40%] w-screen max-w-none -translate-x-1/2 bg-linear-to-b from-white via-white/75 to-transparent sm:block"
              />

              <div
                role="img"
                aria-label="Illustration of connected AI agent nodes"
                className="hidden lg:block agent-illustration float-anim relative left-1/2 w-[138%] -translate-x-1/2 opacity-90 sm:left-auto sm:w-full sm:translate-x-0"
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

      <ProductSection id="products" eyebrow="Two ways in" title="Same control plane, however your agents run." description="Pick per agent. Both report into the same registry, policy engine, and audit log — so coverage never fragments.">
        <div className="grid gap-5 lg:grid-cols-2">
          <ModeCard badge="Gateway" tone="gateway" title="Point your agent at one endpoint." body="Managent fans out to every tool and MCP server behind it. No code changes in the agent itself — just repoint the connection.">
            <span className="text-[#8e9486]"># configure once</span><br />
            <span className="text-[#565b50]">agent</span>.endpoint = <span className="text-[#23845a]">&quot;mcp.managent.dev/gw/acme&quot;</span><br />
            <span className="text-[#565b50]">agent</span>.token = <span className="text-[#3474a8]">env.MANAGENT_KEY</span><br />
            <span className="text-[#8e9486]"># every downstream tool is now scoped</span>
          </ModeCard>
          <ModeCard badge="SDK" tone="sdk" title="Wrap the calls your agent already makes." body="One line per tool or MCP session. Denied calls raise a normal exception — handle it the same way you handle any other error.">
            <span className="text-[#8e9486]">from</span> managent <span className="text-[#8e9486]">import</span> Managent<br />
            mg = <span className="text-[#7656a5]">Managent</span>(token=<span className="text-[#3474a8]">env.MANAGENT_KEY</span>)<br />
            stripe.charge = mg.<span className="text-[#565b50]">wrap</span>(stripe.charge, scope=<span className="text-[#23845a]">&quot;stripe:charge&quot;</span>)
          </ModeCard>
        </div>
      </ProductSection>

      <ProductSection id="vision" eyebrow="How a call gets decided" title="Three outcomes. Nothing runs by default." description="Policy is ordered and explicit — write the rule once, it applies wherever the call comes from." tone="tint">
        <div className="grid gap-5 lg:grid-cols-3">
          {decisionStates.map((state) => <DecisionCard key={state.label} {...state} />)}
        </div>
      </ProductSection>

      <ProductSection id="ecosystem" eyebrow="Underneath both modes" title="One registry. One policy. One log." description="Whichever mode an agent uses, it shows up here the same way — including a coverage indicator so you know exactly what's governed.">
        <div className="grid gap-px overflow-hidden rounded-xl border border-[#e4dfd0] bg-[#e4dfd0] sm:grid-cols-2 lg:grid-cols-4">
          {platformFeatures.map(([icon, title, body]) => (
            <article key={title} className="bg-white p-5 text-left sm:p-7">
              <div className="grid size-9 place-items-center rounded-lg border border-[#e4dfd0] bg-[#fbfaf6] font-mono text-sm text-[#345436]">{icon}</div>
              <h3 className="mt-4 text-[16.5px] font-semibold text-[#11140f] sm:mt-5">{title}</h3>
              <p className="mt-2 text-[13.5px] leading-6 text-[#565b50]">{body}</p>
            </article>
          ))}
        </div>
      </ProductSection>

      {/* ================= LABS / FEEDBACK ================= */}
      <Section id="labs">
        <Reveal className="w-full">
          <div className="relative w-full overflow-hidden rounded-xl border border-[#e4dfd0] bg-[#fbfaf6] px-5 py-10 text-center sm:rounded-2xl sm:px-10 sm:py-16">
            <div aria-hidden className="pointer-events-none absolute left-1/2 -top-60 size-150 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(52,84,54,.13),transparent_68%)]" />
            <h2 className="relative text-[1.65rem] font-semibold leading-tight tracking-tight text-[#11140f] sm:text-4xl">Put a control plane in front of your agents.</h2>
            <p className="relative mx-auto mt-3 max-w-lg text-sm leading-6 text-[#565b50] sm:mt-4 sm:text-base sm:leading-7">Start free with up to 3 agents. No infrastructure required to try it.</p>
            <div className="relative mt-6 flex flex-col justify-center gap-3 sm:mt-8 sm:flex-row">
              <Button href="#feedback-form" size="lg" className="w-full sm:w-auto">
                <span className="text-white">
                  Get started free

                </span>
              </Button>
              <Button href="#footer" variant="outline" size="lg" className="w-full sm:w-auto">Talk to us</Button>
            </div>
          </div>
        </Reveal>

        <Reveal delay={120} className="mt-8 w-full max-w-xl sm:mt-12">
          <form id="feedback-form" className="w-full scroll-mt-20 rounded-xl border border-[#e4dfd0] bg-white p-4 text-left sm:rounded-2xl sm:p-8">
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
        </Reveal>
      </Section>

      {/* ================= FOOTER ================= */}
      <footer id="footer" className="overflow-hidden bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 pt-10 sm:px-6 sm:pt-14 lg:px-8">
          <div className="mb-10 max-w-md">
            <p className="text-base font-semibold text-[#11140f]">Managent</p>
            <p className="mt-2 text-sm leading-6 text-[#565b50]">
              Every agent call, allowed, denied, or reviewed — on purpose.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-5 gap-y-9 sm:gap-10 lg:grid-cols-4">
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

          <div className="mt-12 border-t border-[#ece7d8] py-6 text-xs text-[#8e9486]">
            © {new Date().getFullYear()} Managent. All rights reserved.
          </div>

          <p aria-hidden="true" className="select-none whitespace-nowrap text-center text-[clamp(3.7rem,17vw,13.5rem)] font-semibold leading-[0.72] tracking-[-0.075em] text-[#11140f]">
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
  "min-h-12 w-full rounded-lg border border-[#e4dfd0] bg-[#fbfaf6] px-4 text-base text-[#11140f] outline-none transition placeholder:text-[#9a9686] focus:border-[#345436] focus:ring-4 focus:ring-[#e7efe3]";

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
      { threshold: 0.15 }
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
      className={"py-12 sm:py-20 lg:py-24 " + (tone === "tint" ? "bg-[#fbfaf6]" : "bg-white")}
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
    size === "lg" ? "px-5 py-3 text-sm sm:px-6 sm:text-base" : size === "sm" ? "px-4 py-2 text-sm" : "px-5 py-2.5 text-sm";
  const variantClass =
    variant === "primary"
      ? "bg-[#11140f] text-white hover:bg-[#2d3329]"
      : "border border-[#d8d4c5] bg-white text-[#11140f] hover:border-[#11140f]";

  const classes = `inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${sizeClass} ${variantClass} ${className}`;

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

function ProductSection({ id, eyebrow, title, description, tone = "plain", children }: { id: string; eyebrow: string; title: string; description: string; tone?: "plain" | "tint"; children: ReactNode }) {
  return (
    <section id={id} className={`scroll-mt-16 py-12 sm:py-20 lg:py-24 ${tone === "tint" ? "bg-[#fbfaf6]" : "bg-white"}`}>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mb-8 max-w-2xl text-left sm:mb-12">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#345436] sm:text-xs">{eyebrow}</p>
          <h2 className="mt-3 text-[1.65rem] font-semibold leading-tight tracking-tight text-[#11140f] sm:mt-4 sm:text-4xl">{title}</h2>
          <p className="mt-3 max-w-xl text-[15px] leading-6 text-[#565b50] sm:mt-4 sm:text-base sm:leading-7">{description}</p>
        </Reveal>
        {children}
      </div>
    </section>
  );
}

function ModeCard({ badge, tone, title, body, children }: { badge: string; tone: "gateway" | "sdk"; title: string; body: string; children: ReactNode }) {
  return (
    <article className="overflow-hidden rounded-xl border border-[#e4dfd0] bg-[#fbfaf6] px-4 pt-5 text-left sm:px-7 sm:pt-7">
      <span className={`inline-block rounded px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide ${tone === "gateway" ? "bg-[#e7efe3] text-[#345436]" : "bg-[#fff3d8] text-[#9b680d]"}`}>{badge}</span>
      <h3 className="mt-4 text-lg font-semibold text-[#11140f] sm:text-xl">{title}</h3>
      <p className="mb-5 mt-2 text-sm leading-6 text-[#565b50] sm:mb-6 sm:text-[14.5px]">{body}</p>
      <div className="-mx-px overflow-x-auto whitespace-nowrap rounded-t-lg border border-b-0 border-[#e4dfd0] bg-white p-3 font-mono text-[10px] leading-5 text-[#20231e] sm:p-5 sm:text-xs sm:leading-6">{children}</div>
    </article>
  );
}

function DecisionCard({ type, label, body, rule }: { type: "allow" | "review" | "deny"; label: string; body: string; rule: string }) {
  const color = type === "allow" ? "#23845a" : type === "deny" ? "#d94b4b" : "#a56f0e";
  return (
    <article className="rounded-xl border border-[#e4dfd0] border-t-2 bg-white p-5 text-left sm:p-6" style={{ borderTopColor: color }}>
      <div className="flex items-center gap-2 font-mono text-xs font-semibold" style={{ color }}><span className="size-2 rounded-full" style={{ backgroundColor: color }} />{label}</div>
      <p className="mt-4 text-sm leading-6 text-[#565b50]">{body}</p>
      <p className="mt-4 border-t border-[#ece7d8] pt-4 font-mono text-xs text-[#8e9486]">{rule}</p>
    </article>
  );
}

function AuditStream() {
  return (
    <div className="hero-anim overflow-hidden rounded-xl border border-[#d8d4c5] bg-white text-left shadow-[0_18px_45px_-20px_rgba(17,20,15,.35)]" style={{ animationDelay: "460ms" }}>
      <div className="flex items-center justify-between border-b border-[#e4dfd0] bg-[#f5f3ec] px-3 py-2">
        <div className="flex items-center gap-2"><span className="flex gap-1"><i className="size-1.5 rounded-full bg-[#c9c5b3]" /><i className="size-1.5 rounded-full bg-[#c9c5b3]" /><i className="size-1.5 rounded-full bg-[#c9c5b3]" /></span><span className="font-mono text-[8px] text-[#565b50] sm:text-[9px]">audit-log — all agents</span></div>
        <span className="flex items-center gap-1 font-mono text-[8px] text-[#23845a] sm:text-[9px]"><i className="live-pulse size-1.5 rounded-full bg-[#23845a]" />live</span>
      </div>
      <div className="relative h-[112px] overflow-hidden after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-7 after:bg-linear-to-b after:from-transparent after:to-white sm:h-[132px]">
        <div className="audit-track">
          {[...auditRows, ...auditRows].map(([time, agent, call, state], index) => (
            <div key={`${time}-${index}`} className="flex items-center gap-2 border-b border-[#eeeae0] px-3 py-1.5 font-mono text-[7px] sm:text-[8.5px]">
              <span className="w-7 shrink-0 text-[#8e9486]">{time}</span><span className="hidden w-20 shrink-0 truncate text-[#565b50] sm:block">{agent}</span><span className="min-w-0 flex-1 truncate text-[#11140f]">{call}</span>
              <span className={`rounded px-1.5 py-0.5 text-[6.5px] font-semibold sm:text-[7px] ${state === "allow" ? "bg-[#e5f5ed] text-[#23845a]" : state === "deny" ? "bg-[#fdeaea] text-[#d94b4b]" : "bg-[#fff3d8] text-[#9b680d]"}`}>{state === "review" ? "REVIEW" : state.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
