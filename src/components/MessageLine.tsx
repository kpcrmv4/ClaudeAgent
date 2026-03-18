"use client";

import type { Message } from "@/lib/types";

interface MessageLineProps {
  message: Message;
  fromPos: { x: number; y: number } | null;
  toPos: { x: number; y: number } | null;
  color: string;
}

export function MessageLine({ message, fromPos, toPos, color }: MessageLineProps) {
  if (!fromPos || !toPos) return null;

  // Calculate midpoint for speech bubble
  const midX = (fromPos.x + toPos.x) / 2;
  const midY = (fromPos.y + toPos.y) / 2;

  // Truncate message content for display
  const shortContent = message.content.length > 25
    ? message.content.slice(0, 25) + "..."
    : message.content;

  return (
    <g>
      {/* Dashed line connecting agents */}
      <line
        x1={fromPos.x}
        y1={fromPos.y}
        x2={toPos.x}
        y2={toPos.y}
        stroke={color}
        strokeWidth={1.5}
        strokeDasharray="6 4"
        opacity={0.4}
        className="anim-dash"
      />

      {/* Moving dot along the path */}
      <circle r={3} fill={color} opacity={0.8}>
        <animateMotion
          dur="2s"
          repeatCount="indefinite"
          path={`M ${fromPos.x} ${fromPos.y} L ${toPos.x} ${toPos.y}`}
        />
      </circle>

      {/* Small speech bubble at midpoint */}
      <g transform={`translate(${midX}, ${midY - 15})`} className="anim-bubble">
        <rect
          x={-50}
          y={-12}
          width={100}
          height={18}
          rx={4}
          fill="#111827"
          stroke={color}
          strokeWidth={0.5}
          opacity={0.9}
        />
        <text
          x={0}
          y={0}
          fill="#94a3b8"
          fontSize="6.5"
          fontFamily="monospace"
          textAnchor="middle"
        >
          💬 {shortContent}
        </text>
      </g>
    </g>
  );
}
