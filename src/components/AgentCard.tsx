"use client";

import type { Agent } from "@/lib/types";
import { useLang } from "@/lib/context";
import { useSpriteStyle, renderSprite } from "@/lib/sprites";

const CAT_COLORS: Record<string, { bg: string; text: string }> = {
  CORE: { bg: "bg-cat-core/12", text: "text-cat-core" },
  TECH: { bg: "bg-cat-tech/12", text: "text-cat-tech" },
  CREATIVE: { bg: "bg-cat-creative/12", text: "text-cat-creative" },
  BIZ: { bg: "bg-cat-biz/12", text: "text-cat-biz" },
  FINANCE: { bg: "bg-cat-finance/12", text: "text-cat-finance" },
};

const CATEGORY_GLOW: Record<string, string> = {
  CORE: "glow-green",
  TECH: "glow-cyan",
  CREATIVE: "glow-purple",
  BIZ: "glow-red",
  FINANCE: "glow-amber",
};

const SPRITE_COLORS: Record<string, string> = {
  CORE: "#10b981",
  TECH: "#22d3ee",
  CREATIVE: "#a78bfa",
  BIZ: "#f43f5e",
  FINANCE: "#f59e0b",
};

function AgentAvatar({ name, category }: { name: string; category: string }) {
  const color = SPRITE_COLORS[category] || "#888";
  const { spriteStyle } = useSpriteStyle();
  const hash = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const variant = hash % 4;

  return (
    <div
      className="w-12 h-12 rounded-xl flex items-center justify-center"
      style={{ backgroundColor: `${color}15` }}
    >
      <svg width="36" height="36" viewBox="-16 -16 32 32" className="pixel-art">
        {renderSprite(spriteStyle, color, variant)}
      </svg>
    </div>
  );
}

const STATUS_MAP: Record<string, { labelKey: string; className: string }> = {
  STANDBY: { labelKey: "standby", className: "text-text-dim" },
  WORKING: { labelKey: "working", className: "text-accent-green status-working" },
  ERROR: { labelKey: "error", className: "text-accent-red" },
  OFFLINE: { labelKey: "offline", className: "text-text-dim opacity-50" },
};

interface AgentCardProps {
  agent: Agent;
  onClick?: (agent: Agent) => void;
}

export function AgentCard({ agent, onClick }: AgentCardProps) {
  const { t } = useLang();
  const cat = CAT_COLORS[agent.category] || CAT_COLORS.CORE;
  const status = STATUS_MAP[agent.status] || STATUS_MAP.STANDBY;
  const statusLabel = t.agents[status.labelKey as keyof typeof t.agents] || agent.status;

  return (
    <div
      className={`agent-card bg-bg-card rounded-xl p-4 cursor-pointer ${
        agent.status === "WORKING" ? CATEGORY_GLOW[agent.category] : ""
      }`}
      onClick={() => onClick?.(agent)}
    >
      <div className="flex items-start gap-3">
        <AgentAvatar name={agent.name} category={agent.category} />
        <div className="flex-1 min-w-0">
          <h3 className="text-text-primary text-sm font-semibold truncate mb-0.5">{agent.name}</h3>
          <p className="text-text-dim text-xs truncate mb-2">{agent.role}</p>
          <div className="flex items-center gap-2">
            <span className={`badge ${cat.bg} ${cat.text}`}>
              {t.categories[agent.category as keyof typeof t.categories] || agent.category}
            </span>
            <span className="text-text-dim text-[10px]">{agent.model}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-border-dim flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${
          agent.status === "WORKING" ? "bg-accent-green" :
          agent.status === "ERROR" ? "bg-accent-red" : "bg-text-dim"
        }`} />
        <span className={`text-[11px] ${status.className}`}>{statusLabel}</span>
      </div>
    </div>
  );
}
