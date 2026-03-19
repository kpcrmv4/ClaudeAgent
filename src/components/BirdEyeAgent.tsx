"use client";

import type { Agent, Mission, Message } from "@/lib/types";
import { useState } from "react";
import { useSpriteStyle, renderSprite } from "@/lib/sprites";
import { useTheme } from "@/lib/context";

const SPRITE_COLORS: Record<string, string> = {
  CORE: "#10b981",
  TECH: "#22d3ee",
  CREATIVE: "#a78bfa",
  BIZ: "#f43f5e",
  FINANCE: "#f59e0b",
};

const AGENT_FEATURES: Record<string, { emoji: string }> = {
  secretary:         { emoji: "📋" },
  coder:             { emoji: "💻" },
  sysadmin:          { emoji: "🔧" },
  automator:         { emoji: "⚙️" },
  "prompt-eng":      { emoji: "🪄" },
  "data-scientist":  { emoji: "🤖" },
  "course-designer": { emoji: "📚" },
  "content-creator": { emoji: "✍️" },
  graphic:           { emoji: "🎨" },
  creative:          { emoji: "🎭" },
  "video-producer":  { emoji: "🎬" },
  marketer:          { emoji: "📊" },
  strategist:        { emoji: "🧠" },
  journalist:        { emoji: "📰" },
  "legal-advisor":   { emoji: "👨‍⚖️" },
  accountant:        { emoji: "🏦" },
  "gold-trader":     { emoji: "💰" },
  "stock-analyst":   { emoji: "📈" },
  translator:        { emoji: "🌐" },
  "project-mgr":     { emoji: "🧑‍💼" },
};

type AgentState = "sleeping" | "coffee" | "typing" | "walking" | "error" | "idle";

function deriveState(agent: Agent, currentMission: Mission | null, recentMessages: Message[]): AgentState {
  if (agent.status === "ERROR") return "error";
  if (agent.status === "WORKING" && currentMission) return "typing";
  const now = Date.now();
  const hasRecentMsg = recentMessages.some(
    (m) => m.from_agent_id === agent.id && (now - new Date(m.created_at).getTime()) < 30000
  );
  if (hasRecentMsg) return "walking";
  if (agent.status === "STANDBY") {
    const hash = agent.name.charCodeAt(0) + agent.name.charCodeAt(agent.name.length - 1);
    return hash % 3 === 0 ? "coffee" : hash % 3 === 1 ? "sleeping" : "idle";
  }
  return "idle";
}

interface BirdEyeAgentProps {
  agent: Agent;
  x: number;
  y: number;
  currentMission: Mission | null;
  recentMessages: Message[];
  onClick?: (agent: Agent) => void;
}

export function BirdEyeAgent({ agent, x, y, currentMission, recentMessages, onClick }: BirdEyeAgentProps) {
  const [hovered, setHovered] = useState(false);
  const color = SPRITE_COLORS[agent.category] || "#888";
  const features = AGENT_FEATURES[agent.id] || { emoji: "🤖" };
  const state = deriveState(agent, currentMission, recentMessages);
  const hash = agent.name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const variant = hash % 4;
  const { spriteStyle } = useSpriteStyle();
  const { theme } = useTheme();
  const light = theme === "light";

  const tooltipBg = light ? "#ffffff" : "#111827";
  const tooltipTextMain = light ? "#0f172a" : "#e2e8f0";
  const tooltipTextSub = light ? "#475569" : "#94a3b8";

  // Name label background
  const labelBg = light ? "#ffffff" : "#111827";
  const labelBorder = light ? "#e2e8f0" : "#1e293b";

  return (
    <g
      transform={`translate(${x}, ${y})`}
      className={`cursor-pointer ${state === "walking" ? "anim-walk" : ""}`}
      onClick={() => onClick?.(agent)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Shadow */}
      <ellipse cx={0} cy={38} rx={18} ry={5} fill="#000" opacity={light ? 0.06 : 0.15} />

      {/* Character sprite — scaled up 1.6x */}
      <g
        transform="scale(1.6)"
        className={state === "sleeping" ? "anim-head-bob" : state === "typing" ? "anim-typing" : ""}
      >
        {renderSprite(spriteStyle, color, variant)}
      </g>

      {/* === State-specific overlays === */}
      {state === "sleeping" && (
        <g transform="translate(18, -28)">
          <text className="anim-zzz" fill="#94a3b8" fontSize="10" fontFamily="monospace" fontWeight="bold">z</text>
          <text className="anim-zzz-delay" fill="#94a3b8" fontSize="13" fontFamily="monospace" fontWeight="bold" x={8} y={-10}>z</text>
          <text className="anim-zzz-delay2" fill="#94a3b8" fontSize="16" fontFamily="monospace" fontWeight="bold" x={16} y={-22}>Z</text>
        </g>
      )}

      {state === "coffee" && (
        <g transform="translate(22, 6)">
          <rect x={0} y={4} width={9} height={10} rx={1.5} fill="#8B4513" opacity={0.8} />
          <rect x={9} y={6} width={4} height={5} rx={2} fill="none" stroke="#8B4513" strokeWidth={1} opacity={0.6} />
          <path className="anim-steam" d="M 2 3 Q 4 -1 2 -4" fill="none" stroke="#94a3b8" strokeWidth={1} opacity={0.7} />
          <path className="anim-steam-delay" d="M 6 3 Q 8 -1 6 -4" fill="none" stroke="#94a3b8" strokeWidth={1} opacity={0.7} />
        </g>
      )}

      {state === "typing" && (
        <g transform="translate(0, -36)">
          <rect className="anim-screen-glow" x={-16} y={0} width={32} height={4} rx={2} fill={color} opacity={0.35} />
        </g>
      )}

      {state === "error" && (
        <g transform="translate(0, -24)">
          <circle className="anim-smoke" cx={-6} cy={0} r={5} fill="#f43f5e" opacity={0.35} style={{ ["--smoke-x" as string]: "-10px" }} />
          <circle className="anim-smoke-delay" cx={4} cy={-3} r={4} fill="#f97316" opacity={0.35} style={{ ["--smoke-x" as string]: "8px" }} />
          <circle className="anim-smoke-delay2" cx={0} cy={-5} r={4.5} fill="#f43f5e" opacity={0.3} style={{ ["--smoke-x" as string]: "0px" }} />
        </g>
      )}

      {/* Name label — pill badge style for readability */}
      <g transform={`translate(0, 48)`}>
        <rect
          x={-38} y={-8}
          width={76} height={18}
          rx={9}
          fill={labelBg}
          stroke={labelBorder}
          strokeWidth={0.8}
          opacity={0.92}
        />
        <text
          x={0} y={4}
          fill={color}
          fontSize="9"
          fontFamily="sans-serif"
          fontWeight="700"
          textAnchor="middle"
          letterSpacing="0.2"
        >
          {agent.name.length > 10 ? agent.name.slice(0, 9) + "…" : agent.name}
        </text>
      </g>

      {/* Status dot */}
      <circle
        cx={0} cy={62}
        r={3}
        fill={agent.status === "WORKING" ? "#10b981" : agent.status === "ERROR" ? "#f43f5e" : (light ? "#94a3b8" : "#475569")}
        className={agent.status === "WORKING" ? "status-working" : ""}
      />

      {/* Hover tooltip */}
      {hovered && (
        <g className="anim-bubble">
          <rect x={-70} y={-80} width={140} height={44} rx={10}
            fill={tooltipBg} stroke={color} strokeWidth={1.5} opacity={0.96}
            style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.15))" }}
          />
          <polygon points="-5,-36 5,-36 0,-30" fill={tooltipBg} />
          <text x={0} y={-60} fill={tooltipTextMain} fontSize="10" fontFamily="sans-serif" textAnchor="middle" fontWeight="bold">
            {features.emoji} {agent.name}
          </text>
          <text x={0} y={-46} fill={tooltipTextSub} fontSize="8" fontFamily="sans-serif" textAnchor="middle">
            {currentMission
              ? `🔥 ${currentMission.title.slice(0, 20)}${currentMission.title.length > 20 ? "…" : ""}`
              : state === "sleeping" ? "💤 กำลังพัก..."
              : state === "coffee" ? "☕ ดื่มกาแฟ"
              : state === "error" ? "❌ เกิดข้อผิดพลาด!"
              : "⏳ รอรับงาน"}
          </text>
        </g>
      )}
    </g>
  );
}
