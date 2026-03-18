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

// Office zones layout — 5 zones on an 1100x700 canvas
export const ZONES: ZoneConfig[] = [
  { id: "TECH",     label: "TECH ZONE",     color: "#06b6d4", x: 40,  y: 40,  width: 460, height: 280 },
  { id: "CREATIVE", label: "CREATIVE ZONE", color: "#a855f7", x: 560, y: 40,  width: 460, height: 280 },
  { id: "BIZ",      label: "BIZ ZONE",      color: "#ef4444", x: 40,  y: 380, width: 460, height: 200 },
  { id: "FINANCE",  label: "FINANCE ZONE",  color: "#f59e0b", x: 560, y: 380, width: 460, height: 200 },
  { id: "CORE",     label: "CORE",          color: "#22c55e", x: 300, y: 620, width: 460, height: 100 },
];

// Desk positions within each zone for agents
export const DESK_POSITIONS: Record<string, { x: number; y: number }[]> = {
  TECH: [
    { x: 100, y: 100 },
    { x: 250, y: 100 },
    { x: 100, y: 210 },
    { x: 250, y: 210 },
  ],
  CREATIVE: [
    { x: 620, y: 100 },
    { x: 770, y: 100 },
    { x: 620, y: 210 },
    { x: 770, y: 210 },
  ],
  BIZ: [
    { x: 100, y: 440 },
    { x: 250, y: 440 },
    { x: 400, y: 440 },
  ],
  FINANCE: [
    { x: 620, y: 440 },
    { x: 770, y: 440 },
    { x: 920, y: 440 },
  ],
  CORE: [
    { x: 530, y: 650 },
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
      <rect width="1100" height="760" fill="url(#floor-grid)" />

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
      {/* Plant 1 */}
      <g transform="translate(510, 180)">
        <rect x={-4} y={4} width={8} height={10} rx={2} fill="#2a3a55" />
        <circle cx={0} cy={0} r={6} fill="#22c55e" opacity={0.3} />
        <circle cx={-3} cy={2} r={4} fill="#22c55e" opacity={0.25} />
        <circle cx={3} cy={1} r={4} fill="#22c55e" opacity={0.25} />
      </g>
      {/* Plant 2 */}
      <g transform="translate(510, 470)">
        <rect x={-4} y={4} width={8} height={10} rx={2} fill="#2a3a55" />
        <circle cx={0} cy={0} r={6} fill="#22c55e" opacity={0.3} />
        <circle cx={-3} cy={2} r={4} fill="#22c55e" opacity={0.25} />
      </g>
      {/* Water cooler */}
      <g transform="translate(510, 330)">
        <rect x={-8} y={-15} width={16} height={30} rx={3} fill="#1a2235" stroke="#334155" strokeWidth={0.5} />
        <rect x={-6} y={-12} width={12} height={10} rx={2} fill="#06b6d4" opacity={0.15} />
        <text x={0} y={22} fill="#64748b" fontSize="7" textAnchor="middle" fontFamily="monospace">WATER</text>
      </g>
    </g>
  );
}
