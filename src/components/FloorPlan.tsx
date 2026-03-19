"use client";

import { useTheme } from "@/lib/context";

export interface ZoneConfig {
  id: string;
  label: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const ZONES: ZoneConfig[] = [
  { id: "TECH",     label: "TECH ZONE",     color: "#06b6d4", x: 40,  y: 40,  width: 520, height: 280 },
  { id: "CREATIVE", label: "CREATIVE ZONE", color: "#a855f7", x: 600, y: 40,  width: 520, height: 280 },
  { id: "BIZ",      label: "BIZ ZONE",      color: "#ef4444", x: 40,  y: 380, width: 520, height: 220 },
  { id: "FINANCE",  label: "FINANCE ZONE",  color: "#f59e0b", x: 600, y: 380, width: 520, height: 220 },
  { id: "CORE",     label: "CORE",          color: "#22c55e", x: 250, y: 650, width: 660, height: 120 },
];

export const DESK_POSITIONS: Record<string, { x: number; y: number }[]> = {
  TECH: [
    { x: 110, y: 100 },
    { x: 260, y: 100 },
    { x: 410, y: 100 },
    { x: 110, y: 210 },
    { x: 260, y: 210 },
  ],
  CREATIVE: [
    { x: 670, y: 100 },
    { x: 820, y: 100 },
    { x: 970, y: 100 },
    { x: 670, y: 210 },
    { x: 820, y: 210 },
  ],
  BIZ: [
    { x: 110, y: 450 },
    { x: 260, y: 450 },
    { x: 410, y: 450 },
    { x: 110, y: 530 },
  ],
  FINANCE: [
    { x: 670, y: 450 },
    { x: 820, y: 450 },
    { x: 970, y: 450 },
  ],
  CORE: [
    { x: 430, y: 700 },
    { x: 580, y: 700 },
    { x: 730, y: 700 },
  ],
};

function Desk({ x, y, light }: { x: number; y: number; light: boolean }) {
  const deskFill = light ? "#e2e8f0" : "#1a2235";
  const deskStroke = light ? "#cbd5e1" : "#2a3a55";
  const monitorFill = light ? "#f1f5f9" : "#0f172a";
  const monitorStroke = light ? "#94a3b8" : "#334155";
  const standFill = light ? "#94a3b8" : "#334155";
  const chairFill = light ? "#d1d5db" : "#1e293b";

  return (
    <g>
      <rect x={x - 30} y={y + 20} width={60} height={35} rx={3} fill={deskFill} stroke={deskStroke} strokeWidth={1} />
      <rect x={x - 10} y={y + 12} width={20} height={14} rx={1} fill={monitorFill} stroke={monitorStroke} strokeWidth={0.5} />
      <rect x={x - 3} y={y + 26} width={6} height={4} fill={standFill} />
      <circle cx={x} cy={y + 65} r={10} fill={chairFill} stroke={deskStroke} strokeWidth={0.5} />
    </g>
  );
}

export function FloorPlan() {
  const { theme } = useTheme();
  const light = theme === "light";

  const gridStroke = light ? "#cbd5e1" : "#1e293b";
  const bgFill = light ? "#f8fafc" : "none";
  const decoFill = light ? "#d1d5db" : "#2a3a55";
  const labelColor = light ? "#64748b" : "#64748b";
  const plantColor = light ? "#34d399" : "#22c55e";
  const waterFill = light ? "#e0f2fe" : "#06b6d4";

  return (
    <g>
      {/* Background fill for light mode */}
      {light && <rect width="1200" height="820" fill={bgFill} />}

      <defs>
        <pattern id="floor-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="none" />
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke={gridStroke} strokeWidth="0.5" opacity={light ? 0.4 : 0.3} />
        </pattern>
      </defs>
      <rect width="1200" height="820" fill="url(#floor-grid)" />

      {/* Zone areas */}
      {ZONES.map((zone) => (
        <g key={zone.id}>
          <rect
            x={zone.x} y={zone.y}
            width={zone.width} height={zone.height}
            rx={12}
            fill={zone.color}
            opacity={light ? 0.06 : 0.04}
            stroke={zone.color}
            strokeWidth={1.5}
            strokeOpacity={light ? 0.25 : 0.2}
            strokeDasharray="8 4"
          />
          <text
            x={zone.x + 14} y={zone.y + 22}
            fill={zone.color}
            fontSize="11"
            fontFamily="monospace"
            fontWeight="bold"
            letterSpacing="2"
            opacity={light ? 0.7 : 0.5}
            className="anim-zone-label"
          >
            {zone.label}
          </text>
        </g>
      ))}

      {/* Desks */}
      {Object.entries(DESK_POSITIONS).map(([, positions]) =>
        positions.map((pos, i) => (
          <Desk key={`desk-${pos.x}-${pos.y}-${i}`} x={pos.x} y={pos.y} light={light} />
        ))
      )}

      {/* Decorations */}
      <g transform="translate(570, 180)">
        <rect x={-4} y={4} width={8} height={10} rx={2} fill={decoFill} />
        <circle cx={0} cy={0} r={6} fill={plantColor} opacity={0.35} />
        <circle cx={-3} cy={2} r={4} fill={plantColor} opacity={0.3} />
        <circle cx={3} cy={1} r={4} fill={plantColor} opacity={0.3} />
      </g>
      <g transform="translate(570, 480)">
        <rect x={-4} y={4} width={8} height={10} rx={2} fill={decoFill} />
        <circle cx={0} cy={0} r={6} fill={plantColor} opacity={0.35} />
        <circle cx={-3} cy={2} r={4} fill={plantColor} opacity={0.3} />
      </g>
      {/* Water cooler */}
      <g transform="translate(570, 340)">
        <rect x={-8} y={-15} width={16} height={30} rx={3} fill={light ? "#e2e8f0" : "#1a2235"} stroke={light ? "#94a3b8" : "#334155"} strokeWidth={0.5} />
        <rect x={-6} y={-12} width={12} height={10} rx={2} fill={waterFill} opacity={light ? 0.3 : 0.15} />
        <text x={0} y={22} fill={labelColor} fontSize="7" textAnchor="middle" fontFamily="monospace">WATER</text>
      </g>
      {/* Coffee machine */}
      <g transform="translate(180, 710)">
        <rect x={-8} y={-10} width={16} height={20} rx={2} fill={light ? "#e2e8f0" : "#1a2235"} stroke={light ? "#94a3b8" : "#334155"} strokeWidth={0.5} />
        <rect x={-5} y={-7} width={10} height={8} rx={1} fill="#8B4513" opacity={light ? 0.3 : 0.2} />
        <text x={0} y={17} fill={labelColor} fontSize="6" textAnchor="middle" fontFamily="monospace">COFFEE</text>
      </g>
    </g>
  );
}
