"use client";

/**
 * FloorPlan — isometric office layout background for Bird's Eye View
 * Renders zone areas (TECH, CREATIVE, BIZ, FINANCE, CORE) with desks
 */

export interface ZoneConfig {
  id: string;
  label: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Office zones layout — 5 zones on an 1200x820 canvas (20 agents)
export const ZONES: ZoneConfig[] = [
  { id: "TECH",     label: "TECH ZONE",     color: "#06b6d4", x: 40,  y: 40,  width: 520, height: 280 },
  { id: "CREATIVE", label: "CREATIVE ZONE", color: "#a855f7", x: 600, y: 40,  width: 520, height: 280 },
  { id: "BIZ",      label: "BIZ ZONE",      color: "#ef4444", x: 40,  y: 380, width: 520, height: 220 },
  { id: "FINANCE",  label: "FINANCE ZONE",  color: "#f59e0b", x: 600, y: 380, width: 520, height: 220 },
  { id: "CORE",     label: "CORE",          color: "#22c55e", x: 250, y: 650, width: 660, height: 120 },
];

// Desk positions within each zone for agents
export const DESK_POSITIONS: Record<string, { x: number; y: number }[]> = {
  TECH: [
    { x: 110, y: 100 },  // coder
    { x: 260, y: 100 },  // sysadmin
    { x: 410, y: 100 },  // automator
    { x: 110, y: 210 },  // prompt-eng
    { x: 260, y: 210 },  // data-scientist
  ],
  CREATIVE: [
    { x: 670, y: 100 },  // course-designer
    { x: 820, y: 100 },  // content-creator
    { x: 970, y: 100 },  // graphic
    { x: 670, y: 210 },  // creative
    { x: 820, y: 210 },  // video-producer
  ],
  BIZ: [
    { x: 110, y: 450 },  // marketer
    { x: 260, y: 450 },  // strategist
    { x: 410, y: 450 },  // journalist
    { x: 110, y: 530 },  // legal-advisor
  ],
  FINANCE: [
    { x: 670, y: 450 },  // accountant
    { x: 820, y: 450 },  // gold-trader
    { x: 970, y: 450 },  // stock-analyst
  ],
  CORE: [
    { x: 430, y: 700 },  // secretary
    { x: 580, y: 700 },  // translator
    { x: 730, y: 700 },  // project-mgr
  ],
};

function Desk({ x, y }: { x: number; y: number }) {
  return (
    <g>
      {/* Desk surface */}
      <rect x={x - 30} y={y + 20} width={60} height={35} rx={3}
        fill="#1a2235" stroke="#2a3a55" strokeWidth={1} />
      {/* Monitor */}
      <rect x={x - 10} y={y + 12} width={20} height={14} rx={1}
        fill="#0f172a" stroke="#334155" strokeWidth={0.5} />
      {/* Monitor stand */}
      <rect x={x - 3} y={y + 26} width={6} height={4}
        fill="#334155" />
      {/* Chair (circle below desk) */}
      <circle cx={x} cy={y + 65} r={10}
        fill="#1e293b" stroke="#2a3a55" strokeWidth={0.5} />
    </g>
  );
}

export function FloorPlan() {
  return (
    <g>
      {/* Floor tiles pattern */}
      <defs>
        <pattern id="floor-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="none" />
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" opacity="0.3" />
        </pattern>
      </defs>
      <rect width="1200" height="820" fill="url(#floor-grid)" />

      {/* Zone areas */}
      {ZONES.map((zone) => (
        <g key={zone.id}>
          {/* Zone background */}
          <rect
            x={zone.x} y={zone.y}
            width={zone.width} height={zone.height}
            rx={8}
            fill={zone.color}
            opacity={0.04}
            stroke={zone.color}
            strokeWidth={1}
            strokeOpacity={0.2}
            strokeDasharray="8 4"
          />
          {/* Zone label */}
          <text
            x={zone.x + 12}
            y={zone.y + 20}
            fill={zone.color}
            fontSize="11"
            fontFamily="monospace"
            fontWeight="bold"
            letterSpacing="2"
            className="anim-zone-label"
          >
            {zone.label}
          </text>
        </g>
      ))}

      {/* Desks in each zone */}
      {Object.entries(DESK_POSITIONS).map(([, positions]) =>
        positions.map((pos, i) => (
          <Desk key={`desk-${pos.x}-${pos.y}-${i}`} x={pos.x} y={pos.y} />
        ))
      )}

      {/* Decorations — plants, water cooler, etc */}
      {/* Plant 1 — between TECH and CREATIVE */}
      <g transform="translate(570, 180)">
        <rect x={-4} y={4} width={8} height={10} rx={2} fill="#2a3a55" />
        <circle cx={0} cy={0} r={6} fill="#22c55e" opacity={0.3} />
        <circle cx={-3} cy={2} r={4} fill="#22c55e" opacity={0.25} />
        <circle cx={3} cy={1} r={4} fill="#22c55e" opacity={0.25} />
      </g>
      {/* Plant 2 — between BIZ and FINANCE */}
      <g transform="translate(570, 480)">
        <rect x={-4} y={4} width={8} height={10} rx={2} fill="#2a3a55" />
        <circle cx={0} cy={0} r={6} fill="#22c55e" opacity={0.3} />
        <circle cx={-3} cy={2} r={4} fill="#22c55e" opacity={0.25} />
      </g>
      {/* Water cooler — center */}
      <g transform="translate(570, 340)">
        <rect x={-8} y={-15} width={16} height={30} rx={3} fill="#1a2235" stroke="#334155" strokeWidth={0.5} />
        <rect x={-6} y={-12} width={12} height={10} rx={2} fill="#06b6d4" opacity={0.15} />
        <text x={0} y={22} fill="#64748b" fontSize="7" textAnchor="middle" fontFamily="monospace">WATER</text>
      </g>
      {/* Coffee machine — near CORE */}
      <g transform="translate(180, 710)">
        <rect x={-8} y={-10} width={16} height={20} rx={2} fill="#1a2235" stroke="#334155" strokeWidth={0.5} />
        <rect x={-5} y={-7} width={10} height={8} rx={1} fill="#8B4513" opacity={0.2} />
        <text x={0} y={17} fill="#64748b" fontSize="6" textAnchor="middle" fontFamily="monospace">COFFEE</text>
      </g>
    </g>
  );
}
