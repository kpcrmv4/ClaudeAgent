"use client";

import type { Agent, Mission, Message } from "@/lib/types";
import { useState } from "react";

const SPRITE_COLORS: Record<string, string> = {
  CORE: "#22c55e",
  TECH: "#06b6d4",
  CREATIVE: "#a855f7",
  BIZ: "#ef4444",
  FINANCE: "#f59e0b",
};

// Character accessories/features per agent ID for uniqueness
const AGENT_FEATURES: Record<string, { hat?: string; accessory?: string; emoji: string }> = {
  secretary:       { accessory: "clipboard", emoji: "📋" },
  coder:           { hat: "headphones", emoji: "💻" },
  sysadmin:        { hat: "cap", emoji: "🔧" },
  automator:       { accessory: "gear", emoji: "⚙️" },
  "prompt-eng":    { accessory: "wand", emoji: "🪄" },
  "course-designer": { accessory: "book", emoji: "📚" },
  "content-creator": { accessory: "pen", emoji: "✍️" },
  graphic:         { accessory: "brush", emoji: "🎨" },
  creative:        { hat: "beret", emoji: "🎭" },
  marketer:        { accessory: "megaphone", emoji: "📊" },
  strategist:      { hat: "crown", emoji: "🧠" },
  journalist:      { accessory: "notepad", emoji: "📰" },
  accountant:      { accessory: "calculator", emoji: "🏦" },
  "gold-trader":   { accessory: "chart", emoji: "💰" },
  "stock-analyst": { accessory: "chart", emoji: "📈" },
};

type AgentState = "sleeping" | "coffee" | "typing" | "walking" | "error" | "idle";

function deriveState(
  agent: Agent,
  currentMission: Mission | null,
  recentMessages: Message[]
): AgentState {
  if (agent.status === "ERROR") return "error";
  if (agent.status === "WORKING" && currentMission) return "typing";
  // If there are very recent messages from this agent, show "walking"
  const now = Date.now();
  const hasRecentMsg = recentMessages.some(
    (m) => m.from_agent_id === agent.id && (now - new Date(m.created_at).getTime()) < 30000
  );
  if (hasRecentMsg) return "walking";
  // Standby — determine if sleeping or having coffee
  if (agent.status === "STANDBY") {
    // Use a hash to vary — some agents sleep, some drink coffee
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

export function BirdEyeAgent({
  agent,
  x,
  y,
  currentMission,
  recentMessages,
  onClick,
}: BirdEyeAgentProps) {
  const [hovered, setHovered] = useState(false);
  const color = SPRITE_COLORS[agent.category] || "#888";
  const features = AGENT_FEATURES[agent.id] || { emoji: "🤖" };
  const state = deriveState(agent, currentMission, recentMessages);
  const hash = agent.name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const bodyType = hash % 3;

  return (
    <g
      transform={`translate(${x}, ${y})`}
      className={`cursor-pointer ${state === "walking" ? "anim-walk" : ""}`}
      onClick={() => onClick?.(agent)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Shadow */}
      <ellipse cx={0} cy={32} rx={14} ry={4} fill="#000" opacity={0.2} />

      {/* Character body — top-down pixel art style */}
      <g className={state === "sleeping" ? "anim-head-bob" : ""}>
        {/* Head */}
        <rect x={-8} y={-12} width={16} height={16} rx={3} fill={color} opacity={0.9} />
        {/* Eyes */}
        {state === "sleeping" ? (
          <>
            <line x1={-5} y1={-3} x2={-2} y2={-3} stroke="#fff" strokeWidth={1.5} strokeLinecap="round" />
            <line x1={2} y1={-3} x2={5} y2={-3} stroke="#fff" strokeWidth={1.5} strokeLinecap="round" />
          </>
        ) : state === "error" ? (
          <>
            <text x={-4} y={-1} fill="#fff" fontSize="6" fontFamily="monospace">X</text>
            <text x={3} y={-1} fill="#fff" fontSize="6" fontFamily="monospace">X</text>
          </>
        ) : (
          <>
            <circle cx={-4} cy={-3} r={1.5} fill="#fff" />
            <circle cx={4} cy={-3} r={1.5} fill="#fff" />
            {/* Pupils look at screen when typing */}
            {state === "typing" && (
              <>
                <circle cx={-4.5} cy={-3.5} r={0.6} fill="#000" />
                <circle cx={3.5} cy={-3.5} r={0.6} fill="#000" />
              </>
            )}
          </>
        )}
        {/* Mouth */}
        {state === "coffee" && (
          <path d="M -2 1 Q 0 3 2 1" fill="none" stroke="#fff" strokeWidth={0.8} />
        )}

        {/* Hat/Accessory on head */}
        {features.hat === "headphones" && (
          <g>
            <path d="M -10 -6 Q -10 -14 0 -14 Q 10 -14 10 -6" fill="none" stroke="#64748b" strokeWidth={2} />
            <rect x={-12} y={-8} width={4} height={6} rx={2} fill="#64748b" />
            <rect x={8} y={-8} width={4} height={6} rx={2} fill="#64748b" />
          </g>
        )}
        {features.hat === "cap" && (
          <rect x={-10} y={-15} width={20} height={5} rx={2} fill={color} opacity={0.6} />
        )}
        {features.hat === "beret" && (
          <ellipse cx={0} cy={-14} rx={10} ry={4} fill={color} opacity={0.6} />
        )}
        {features.hat === "crown" && (
          <g>
            <polygon points="-7,-14 -5,-18 -2,-14 0,-19 2,-14 5,-18 7,-14" fill="#f59e0b" />
          </g>
        )}
      </g>

      {/* Body */}
      <g className={state === "typing" ? "anim-typing" : ""}>
        {bodyType === 0 && (
          <>
            <rect x={-10} y={5} width={20} height={14} rx={2} fill={color} opacity={0.6} />
            <rect x={-14} y={6} width={4} height={10} rx={2} fill={color} opacity={0.4} />
            <rect x={10} y={6} width={4} height={10} rx={2} fill={color} opacity={0.4} />
          </>
        )}
        {bodyType === 1 && (
          <>
            <rect x={-8} y={5} width={16} height={14} rx={2} fill={color} opacity={0.6} />
            <rect x={-13} y={7} width={5} height={8} rx={2} fill={color} opacity={0.4} />
            <rect x={8} y={7} width={5} height={8} rx={2} fill={color} opacity={0.4} />
          </>
        )}
        {bodyType === 2 && (
          <>
            <rect x={-10} y={5} width={20} height={12} rx={2} fill={color} opacity={0.6} />
            <rect x={-7} y={17} width={5} height={4} rx={1} fill={color} opacity={0.5} />
            <rect x={2} y={17} width={5} height={4} rx={1} fill={color} opacity={0.5} />
          </>
        )}
        {/* Legs */}
        <rect x={-6} y={20} width={4} height={8} rx={1} fill={color} opacity={0.4} />
        <rect x={2} y={20} width={4} height={8} rx={1} fill={color} opacity={0.4} />
      </g>

      {/* Accessory items */}
      {features.accessory === "clipboard" && state !== "sleeping" && (
        <g transform="translate(16, 5)">
          <rect x={0} y={0} width={8} height={10} rx={1} fill="#94a3b8" opacity={0.6} />
          <rect x={2} y={-2} width={4} height={3} rx={1} fill="#64748b" />
        </g>
      )}
      {features.accessory === "brush" && state !== "sleeping" && (
        <g transform="translate(16, 2)">
          <rect x={0} y={0} width={2} height={12} rx={0.5} fill="#d4a574" />
          <rect x={-1} y={12} width={4} height={4} rx={1} fill={color} opacity={0.5} />
        </g>
      )}
      {features.accessory === "chart" && state === "typing" && (
        <g transform="translate(-25, -5)">
          <rect x={0} y={0} width={12} height={10} rx={1} fill="#1a2235" stroke="#334155" strokeWidth={0.5} />
          <polyline points="2,8 5,4 7,6 10,2" fill="none" stroke="#22c55e" strokeWidth={0.8} />
        </g>
      )}

      {/* === State-specific overlays === */}

      {/* Sleeping: zzz */}
      {state === "sleeping" && (
        <g transform="translate(12, -20)">
          <text className="anim-zzz" fill="#94a3b8" fontSize="8" fontFamily="monospace" fontWeight="bold">z</text>
          <text className="anim-zzz-delay" fill="#94a3b8" fontSize="10" fontFamily="monospace" fontWeight="bold" x={6} y={-8}>z</text>
          <text className="anim-zzz-delay2" fill="#94a3b8" fontSize="12" fontFamily="monospace" fontWeight="bold" x={12} y={-18}>Z</text>
        </g>
      )}

      {/* Coffee: cup + steam */}
      {state === "coffee" && (
        <g transform="translate(16, 8)">
          <rect x={0} y={4} width={7} height={8} rx={1} fill="#8B4513" opacity={0.7} />
          <rect x={7} y={6} width={3} height={4} rx={1.5} fill="none" stroke="#8B4513" strokeWidth={0.8} opacity={0.5} />
          {/* Steam */}
          <path className="anim-steam" d="M 2 3 Q 3 0 2 -2" fill="none" stroke="#94a3b8" strokeWidth={0.8} opacity={0.6} />
          <path className="anim-steam-delay" d="M 5 3 Q 6 0 5 -2" fill="none" stroke="#94a3b8" strokeWidth={0.8} opacity={0.6} />
        </g>
      )}

      {/* Working: screen glow */}
      {state === "typing" && (
        <g transform="translate(0, -30)">
          <rect className="anim-screen-glow" x={-12} y={0} width={24} height={3} rx={1}
            fill={color} opacity={0.3} />
        </g>
      )}

      {/* Error: smoke/fire */}
      {state === "error" && (
        <g transform="translate(0, -18)">
          <circle className="anim-smoke" cx={-5} cy={0} r={4} fill="#ef4444" opacity={0.3}
            style={{ ["--smoke-x" as string]: "-8px" }} />
          <circle className="anim-smoke-delay" cx={3} cy={-2} r={3} fill="#f97316" opacity={0.3}
            style={{ ["--smoke-x" as string]: "6px" }} />
          <circle className="anim-smoke-delay2" cx={0} cy={-4} r={3.5} fill="#ef4444" opacity={0.25}
            style={{ ["--smoke-x" as string]: "0px" }} />
          <text x={-3} y={-10} fill="#ef4444" fontSize="10">🔥</text>
        </g>
      )}

      {/* Name label (always visible) */}
      <text
        x={0}
        y={42}
        fill={color}
        fontSize="8"
        fontFamily="monospace"
        fontWeight="bold"
        textAnchor="middle"
        letterSpacing="0.5"
      >
        {agent.name}
      </text>

      {/* Hover tooltip */}
      {hovered && (
        <g className="anim-bubble">
          <rect x={-60} y={-65} width={120} height={38} rx={6}
            fill="#111827" stroke={color} strokeWidth={1} opacity={0.95} />
          {/* Arrow */}
          <polygon points="-4,-27 4,-27 0,-22" fill="#111827" stroke={color} strokeWidth={0.5} />
          <text x={0} y={-50} fill="#e2e8f0" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
            {features.emoji} {agent.id}
          </text>
          <text x={0} y={-38} fill="#94a3b8" fontSize="7" fontFamily="monospace" textAnchor="middle">
            {currentMission
              ? `🔥 ${currentMission.title.slice(0, 18)}${currentMission.title.length > 18 ? "..." : ""}`
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
