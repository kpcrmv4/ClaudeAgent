"use client";

import type { Agent } from "@/lib/types";

const CATEGORY_COLORS: Record<string, string> = {
  CORE: "bg-cat-core text-black",
  TECH: "bg-cat-tech text-black",
  CREATIVE: "bg-cat-creative text-white",
  BIZ: "bg-cat-biz text-white",
  FINANCE: "bg-cat-finance text-black",
};

const CATEGORY_GLOW: Record<string, string> = {
  CORE: "glow-green",
  TECH: "glow-cyan",
  CREATIVE: "glow-purple",
  BIZ: "glow-red",
  FINANCE: "glow-amber",
};

const SPRITE_COLORS: Record<string, string> = {
  CORE: "#22c55e",
  TECH: "#06b6d4",
  CREATIVE: "#a855f7",
  BIZ: "#ef4444",
  FINANCE: "#f59e0b",
};

// Generate a simple pixel art avatar using SVG
function PixelAvatar({ name, category }: { name: string; category: string }) {
  const color = SPRITE_COLORS[category] || "#888";
  // Simple hash from name for variety
  const hash = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const bodyType = hash % 3;

  return (
    <svg width="48" height="48" viewBox="0 0 16 16" className="pixel-art">
      {/* Head */}
      <rect x="5" y="1" width="6" height="6" fill={color} opacity="0.9" />
      {/* Eyes */}
      <rect x="6" y="3" width="1" height="1" fill="#fff" />
      <rect x="9" y="3" width="1" height="1" fill="#fff" />
      {/* Body variants */}
      {bodyType === 0 && (
        <>
          <rect x="4" y="7" width="8" height="5" fill={color} opacity="0.7" />
          <rect x="3" y="7" width="1" height="4" fill={color} opacity="0.5" />
          <rect x="12" y="7" width="1" height="4" fill={color} opacity="0.5" />
        </>
      )}
      {bodyType === 1 && (
        <>
          <rect x="5" y="7" width="6" height="5" fill={color} opacity="0.7" />
          <rect x="3" y="8" width="2" height="3" fill={color} opacity="0.5" />
          <rect x="11" y="8" width="2" height="3" fill={color} opacity="0.5" />
        </>
      )}
      {bodyType === 2 && (
        <>
          <rect x="4" y="7" width="8" height="4" fill={color} opacity="0.7" />
          <rect x="5" y="11" width="2" height="1" fill={color} opacity="0.6" />
          <rect x="9" y="11" width="2" height="1" fill={color} opacity="0.6" />
        </>
      )}
      {/* Legs */}
      <rect x="5" y="12" width="2" height="3" fill={color} opacity="0.5" />
      <rect x="9" y="12" width="2" height="3" fill={color} opacity="0.5" />
    </svg>
  );
}

interface AgentCardProps {
  agent: Agent;
  onClick?: (agent: Agent) => void;
}

export function AgentCard({ agent, onClick }: AgentCardProps) {
  return (
    <div
      className={`agent-card bg-bg-card rounded-lg p-4 cursor-pointer relative ${
        agent.status === "WORKING" ? CATEGORY_GLOW[agent.category] : ""
      }`}
      onClick={() => onClick?.(agent)}
    >
      {/* Category badge */}
      <span className={`badge absolute top-3 left-3 ${CATEGORY_COLORS[agent.category]}`}>
        {agent.category}
      </span>

      {/* Sprite */}
      <div className="flex justify-center my-4">
        <PixelAvatar name={agent.name} category={agent.category} />
      </div>

      {/* Info */}
      <div className="text-center">
        <h3 className="text-text-primary text-sm font-bold">{agent.name}</h3>
        <p className="text-text-dim text-[11px] mt-1">
          <span className={agent.status === "WORKING" ? "status-working" : ""}>
            {agent.status}
          </span>
          {" · "}
          <span className="text-text-dim">{agent.model}</span>
        </p>
      </div>
    </div>
  );
}
