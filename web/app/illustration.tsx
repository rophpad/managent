function HeroIllustration({ className }: { className?: string }) {
  const agents = [
    { x: 120, y: 90 },
    { x: 90, y: 200 },
    { x: 130, y: 320 },
  ];
  const resources = [
    { x: 1080, y: 80 },
    { x: 1110, y: 190 },
    { x: 1070, y: 300 },
    { x: 1100, y: 400 },
  ];
  const gate = { x: 600, y: 220 };

  return (
    <svg
      viewBox="0 0 1200 480"
      preserveAspectRatio="xMidYMin slice"
      className={className}
      aria-hidden="true"
      style={{
        maskImage: "linear-gradient(to bottom, black 0%, black 55%, transparent 92%)",
        WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 55%, transparent 92%)",
        opacity: 0.9,
      }}
    >
      {/* connecting lines: agents -> gate -> resources */}
      {agents.map((a, i) => (
        <path
          key={`a-${i}`}
          d={`M ${a.x} ${a.y} C ${a.x + 160} ${a.y}, ${gate.x - 160} ${gate.y}, ${gate.x} ${gate.y}`}
          stroke="#a9a38f"
          strokeWidth="2"
          fill="none"
        />
      ))}
      {resources.map((r, i) => (
        <path
          key={`r-${i}`}
          d={`M ${gate.x} ${gate.y} C ${gate.x + 160} ${gate.y}, ${r.x - 160} ${r.y}, ${r.x} ${r.y}`}
          stroke="#a9a38f"
          strokeWidth="2"
          fill="none"
        />
      ))}

      {/* agent nodes */}
      {agents.map((a, i) => (
        <g key={`agent-node-${i}`}>
          <circle cx={a.x} cy={a.y} r="16" fill="#fbfaf6" stroke="#a9a38f" strokeWidth="2" />
          <circle cx={a.x} cy={a.y} r="4" fill="#6b7064" />
        </g>
      ))}

      {/* resource nodes */}
      {resources.map((r, i) => (
        <g key={`resource-node-${i}`}>
          <rect x={r.x - 14} y={r.y - 14} width="28" height="28" rx="7" fill="#fbfaf6" stroke="#a9a38f" strokeWidth="2" />
          <rect x={r.x - 4} y={r.y - 4} width="8" height="8" rx="2" fill="#6b7064" />
        </g>
      ))}

      {/* central permission gate */}
      <circle cx={gate.x} cy={gate.y} r="34" fill="#fbfaf6" stroke="#345436" strokeWidth="2" />
      <path
        d={`M ${gate.x - 9} ${gate.y - 2} v-6 a9 9 0 0 1 18 0 v6`}
        stroke="#345436"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <rect x={gate.x - 13} y={gate.y - 2} width="26" height="20" rx="4" fill="none" stroke="#345436" strokeWidth="2.5" />
    </svg>
  );
}