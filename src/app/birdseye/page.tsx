"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Agent, Mission, Message, ApiResponse } from "@/lib/types";
import { FloorPlan, DESK_POSITIONS } from "@/components/FloorPlan";
import { BirdEyeAgent } from "@/components/BirdEyeAgent";
import { MessageLine } from "@/components/MessageLine";
import { Particles, type ParticleTrigger } from "@/components/Particles";

const SPRITE_COLORS: Record<string, string> = {
  CORE: "#22c55e",
  TECH: "#06b6d4",
  CREATIVE: "#a855f7",
  BIZ: "#ef4444",
  FINANCE: "#f59e0b",
};

// Map agent IDs to their category for desk assignment
const AGENT_CATEGORY_ORDER: Record<string, string[]> = {
  TECH: ["coder", "sysadmin", "automator", "prompt-eng"],
  CREATIVE: ["course-designer", "content-creator", "graphic", "creative"],
  BIZ: ["marketer", "strategist", "journalist"],
  FINANCE: ["accountant", "gold-trader", "stock-analyst"],
  CORE: ["secretary"],
};

function getAgentPosition(agentId: string): { x: number; y: number } | null {
  for (const [category, agentIds] of Object.entries(AGENT_CATEGORY_ORDER)) {
    const idx = agentIds.indexOf(agentId);
    if (idx !== -1) {
      const desks = DESK_POSITIONS[category];
      if (desks && desks[idx]) {
        return desks[idx];
      }
    }
  }
  return null;
}

export default function BirdEyePage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [particleTriggers, setParticleTriggers] = useState<ParticleTrigger[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isLive, setIsLive] = useState(true);
  const previousMissionsRef = useRef<Map<string, string>>(new Map());

  // Dispatch form state
  const [dispatchTitle, setDispatchTitle] = useState("");
  const [dispatchInput, setDispatchInput] = useState("");
  const [dispatchPriority, setDispatchPriority] = useState<"LOW" | "NORMAL" | "HIGH" | "URGENT">("NORMAL");
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleDispatch = async () => {
    if (!selectedAgent || !dispatchTitle.trim() || !dispatchInput.trim()) return;
    setIsDispatching(true);
    setDispatchResult(null);
    try {
      const res = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          title: dispatchTitle.trim(),
          input: dispatchInput.trim(),
          priority: dispatchPriority,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDispatchResult({ success: true, message: `Mission dispatched to ${selectedAgent.name}!` });
        setDispatchTitle("");
        setDispatchInput("");
        setDispatchPriority("NORMAL");
        // Trigger sparkle at agent position
        const pos = getAgentPosition(selectedAgent.id);
        if (pos) {
          setParticleTriggers((prev) => [...prev, {
            x: pos.x,
            y: pos.y,
            type: "sparkle",
            color: SPRITE_COLORS[selectedAgent.category] || "#22c55e",
            id: `dispatch-${Date.now()}`,
          }]);
        }
        // Refresh data immediately
        fetchData();
      } else {
        setDispatchResult({ success: false, message: data.error || "Dispatch failed" });
      }
    } catch {
      setDispatchResult({ success: false, message: "Network error" });
    } finally {
      setIsDispatching(false);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const [agentsRes, missionsRes, messagesRes] = await Promise.all([
        fetch("/api/agents").then((r) => r.json() as Promise<ApiResponse<Agent[]>>),
        fetch("/api/missions").then((r) => r.json() as Promise<ApiResponse<Mission[]>>),
        fetch("/api/messages").then((r) => r.json() as Promise<ApiResponse<Message[]>>),
      ]);

      if (agentsRes.success && agentsRes.data) setAgents(agentsRes.data);
      if (missionsRes.success && missionsRes.data) {
        const newMissions = missionsRes.data;

        // Detect newly completed missions → trigger confetti
        const newTriggers: ParticleTrigger[] = [];
        for (const mission of newMissions) {
          const prevStatus = previousMissionsRef.current.get(mission.id);
          if (prevStatus && prevStatus !== "COMPLETED" && mission.status === "COMPLETED") {
            const pos = getAgentPosition(mission.agent_id);
            if (pos) {
              newTriggers.push({
                x: pos.x,
                y: pos.y,
                type: "confetti",
                color: SPRITE_COLORS[agents.find((a) => a.id === mission.agent_id)?.category || "CORE"] || "#22c55e",
                id: `complete-${mission.id}`,
              });
            }
          }
          if (prevStatus && prevStatus !== "FAILED" && mission.status === "FAILED") {
            const pos = getAgentPosition(mission.agent_id);
            if (pos) {
              newTriggers.push({
                x: pos.x,
                y: pos.y,
                type: "smoke",
                color: "#ef4444",
                id: `fail-${mission.id}`,
              });
            }
          }
        }

        if (newTriggers.length > 0) {
          setParticleTriggers((prev) => [...prev, ...newTriggers]);
        }

        // Update previous missions ref
        const newMap = new Map<string, string>();
        for (const m of newMissions) {
          newMap.set(m.id, m.status);
        }
        previousMissionsRef.current = newMap;

        setMissions(newMissions);
      }
      if (messagesRes.success && messagesRes.data) setMessages(messagesRes.data);
    } catch {
      // Silent fail — dashboard will just show stale data
    }
  }, [agents]);

  // Poll every 3 seconds
  useEffect(() => {
    fetchData();
    if (!isLive) return;
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData, isLive]);

  // Get running missions by agent
  const runningMissions = new Map<string, Mission>();
  for (const m of missions) {
    if (m.status === "RUNNING" || m.status === "PENDING") {
      runningMissions.set(m.agent_id, m);
    }
  }

  // Get recent messages (last 30 seconds)
  const now = Date.now();
  const recentMessages = messages.filter(
    (m) => now - new Date(m.created_at).getTime() < 30000
  );

  // Stats
  const workingCount = agents.filter((a) => a.status === "WORKING").length;
  const standbyCount = agents.filter((a) => a.status === "STANDBY").length;
  const errorCount = agents.filter((a) => a.status === "ERROR").length;
  const runningMissionCount = missions.filter((m) => m.status === "RUNNING").length;
  const pendingMissionCount = missions.filter((m) => m.status === "PENDING").length;

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-accent-green text-xl font-bold tracking-wider flex items-center gap-2">
            📹 BIRD&apos;S EYE VIEW
            <span className={`inline-block w-2 h-2 rounded-full ${isLive ? "bg-accent-green" : "bg-accent-red"}`} />
            <span className="text-xs text-text-dim font-normal">{isLive ? "LIVE" : "PAUSED"}</span>
          </h1>
          <p className="text-text-dim text-xs mt-1">GANK Command Floor — เฝ้าดูทีม AI จากกล้องวงจรปิด</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Quick stats */}
          <div className="flex items-center gap-3 text-xs">
            <span className="text-accent-green">● {workingCount} WORKING</span>
            <span className="text-text-dim">● {standbyCount} STANDBY</span>
            {errorCount > 0 && <span className="text-accent-red">● {errorCount} ERROR</span>}
            <span className="text-accent-cyan">📋 {runningMissionCount + pendingMissionCount} MISSIONS</span>
          </div>
          {/* Pause/Resume */}
          <button
            onClick={() => setIsLive(!isLive)}
            className={`px-3 py-1 rounded text-xs font-bold tracking-wider transition-colors ${
              isLive
                ? "bg-accent-green/20 text-accent-green hover:bg-accent-green/30"
                : "bg-accent-red/20 text-accent-red hover:bg-accent-red/30"
            }`}
          >
            {isLive ? "⏸ PAUSE" : "▶ RESUME"}
          </button>
        </div>
      </div>

      {/* Main SVG Canvas */}
      <div className="relative bg-bg-card rounded-lg border border-border-dim overflow-hidden">
        <svg
          viewBox="0 0 1100 760"
          className="w-full h-auto"
          style={{ minHeight: "500px", maxHeight: "80vh" }}
        >
          {/* Floor plan background */}
          <FloorPlan />

          {/* Message lines between agents */}
          {recentMessages
            .filter((m) => m.to_agent_id)
            .slice(0, 5) // Show max 5 message lines to avoid clutter
            .map((msg) => {
              const fromPos = getAgentPosition(msg.from_agent_id);
              const toPos = msg.to_agent_id ? getAgentPosition(msg.to_agent_id) : null;
              const fromAgent = agents.find((a) => a.id === msg.from_agent_id);
              return (
                <MessageLine
                  key={msg.id}
                  message={msg}
                  fromPos={fromPos}
                  toPos={toPos}
                  color={SPRITE_COLORS[fromAgent?.category || "CORE"] || "#22c55e"}
                />
              );
            })}

          {/* Agents */}
          {agents.map((agent) => {
            const pos = getAgentPosition(agent.id);
            if (!pos) return null;
            return (
              <BirdEyeAgent
                key={agent.id}
                agent={agent}
                x={pos.x}
                y={pos.y}
                currentMission={runningMissions.get(agent.id) || null}
                recentMessages={recentMessages}
                onClick={setSelectedAgent}
              />
            );
          })}

          {/* Particle effects */}
          <Particles triggers={particleTriggers} />

          {/* Timestamp overlay */}
          <text x={1060} y={745} fill="#64748b" fontSize="9" fontFamily="monospace" textAnchor="end">
            {new Date().toLocaleTimeString("th-TH")}
          </text>
          {/* Camera indicator */}
          <g transform="translate(30, 735)">
            <circle cx={0} cy={0} r={4} fill={isLive ? "#22c55e" : "#ef4444"} className={isLive ? "anim-screen-glow" : ""} />
            <text x={10} y={3} fill="#64748b" fontSize="8" fontFamily="monospace">CAM-01</text>
          </g>
        </svg>

        {/* Scanline overlay for CCTV effect */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0, 0, 0, 0.03) 2px,
              rgba(0, 0, 0, 0.03) 4px
            )`,
          }}
        />

        {/* Vignette overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, transparent 60%, rgba(0, 0, 0, 0.3) 100%)`,
          }}
        />
      </div>

      {/* Selected agent detail panel + dispatch */}
      {selectedAgent && (
        <div className="mt-4 bg-bg-card rounded-lg border border-border-dim p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: SPRITE_COLORS[selectedAgent.category],
                  boxShadow: `0 0 8px ${SPRITE_COLORS[selectedAgent.category]}50`,
                }}
              />
              <h3 className="text-text-primary font-bold">{selectedAgent.name}</h3>
              <span className="badge" style={{ backgroundColor: SPRITE_COLORS[selectedAgent.category], color: "#000" }}>
                {selectedAgent.category}
              </span>
              <span className={`text-xs ${
                selectedAgent.status === "WORKING" ? "text-accent-green status-working" :
                selectedAgent.status === "ERROR" ? "text-accent-red" :
                "text-text-dim"
              }`}>
                {selectedAgent.status}
              </span>
            </div>
            <button
              onClick={() => { setSelectedAgent(null); setDispatchResult(null); }}
              className="text-text-dim hover:text-text-primary transition-colors text-sm"
            >
              ✕ ปิด
            </button>
          </div>
          <p className="text-text-secondary text-xs mt-2">{selectedAgent.role}</p>

          {/* Current mission display */}
          {runningMissions.get(selectedAgent.id) && (
            <div className="mt-3 bg-bg-dark rounded p-3 border border-border-dim">
              <p className="text-accent-green text-xs font-bold">🔥 CURRENT MISSION</p>
              <p className="text-text-primary text-sm mt-1">{runningMissions.get(selectedAgent.id)!.title}</p>
              <p className="text-text-dim text-xs mt-1">
                {runningMissions.get(selectedAgent.id)!.input?.slice(0, 100)}
              </p>
            </div>
          )}

          {/* Last completed mission output */}
          {(() => {
            const lastCompleted = missions.find(
              (m) => m.agent_id === selectedAgent.id && m.status === "COMPLETED"
            );
            if (!lastCompleted || runningMissions.get(selectedAgent.id)) return null;
            return (
              <div className="mt-3 bg-bg-dark rounded p-3 border border-border-dim">
                <p className="text-accent-cyan text-xs font-bold">✅ LAST COMPLETED: {lastCompleted.title}</p>
                <p className="text-text-secondary text-xs mt-1 whitespace-pre-wrap leading-relaxed">
                  {lastCompleted.output?.slice(0, 300)}
                  {lastCompleted.output && lastCompleted.output.length > 300 ? "..." : ""}
                </p>
              </div>
            );
          })()}

          {/* Dispatch form */}
          <div className="mt-4 border-t border-border-dim pt-4">
            <p className="text-text-dim text-xs font-bold mb-3 tracking-wider">🚀 DISPATCH MISSION</p>
            <div className="space-y-3">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="ชื่อ mission..."
                  value={dispatchTitle}
                  onChange={(e) => setDispatchTitle(e.target.value)}
                  className="flex-1 bg-bg-dark border border-border-dim rounded px-3 py-2 text-sm text-text-primary placeholder-text-dim focus:outline-none focus:border-text-dim transition-colors"
                />
                <select
                  value={dispatchPriority}
                  onChange={(e) => setDispatchPriority(e.target.value as typeof dispatchPriority)}
                  className="bg-bg-dark border border-border-dim rounded px-2 py-2 text-xs text-text-secondary focus:outline-none focus:border-text-dim"
                >
                  <option value="LOW">LOW</option>
                  <option value="NORMAL">NORMAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="URGENT">URGENT</option>
                </select>
              </div>
              <textarea
                placeholder="รายละเอียดงานที่ต้องการให้ทำ..."
                value={dispatchInput}
                onChange={(e) => setDispatchInput(e.target.value)}
                rows={3}
                className="w-full bg-bg-dark border border-border-dim rounded px-3 py-2 text-sm text-text-primary placeholder-text-dim focus:outline-none focus:border-text-dim transition-colors resize-none"
              />
              <div className="flex items-center justify-between">
                <div>
                  {dispatchResult && (
                    <span className={`text-xs ${dispatchResult.success ? "text-accent-green" : "text-accent-red"}`}>
                      {dispatchResult.success ? "✅" : "❌"} {dispatchResult.message}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleDispatch}
                  disabled={isDispatching || !dispatchTitle.trim() || !dispatchInput.trim()}
                  className={`px-4 py-2 rounded text-xs font-bold tracking-wider transition-all ${
                    isDispatching || !dispatchTitle.trim() || !dispatchInput.trim()
                      ? "bg-border-dim text-text-dim cursor-not-allowed"
                      : "text-black hover:brightness-110"
                  }`}
                  style={
                    !isDispatching && dispatchTitle.trim() && dispatchInput.trim()
                      ? {
                          backgroundColor: SPRITE_COLORS[selectedAgent.category],
                          boxShadow: `0 0 12px ${SPRITE_COLORS[selectedAgent.category]}40`,
                        }
                      : undefined
                  }
                >
                  {isDispatching ? "⏳ DISPATCHING..." : "🚀 DISPATCH"}
                </button>
              </div>
            </div>
          </div>

          {/* Recent messages from/to this agent */}
          {recentMessages.filter(
            (m) => m.from_agent_id === selectedAgent.id || m.to_agent_id === selectedAgent.id
          ).length > 0 && (
            <div className="mt-3 border-t border-border-dim pt-3">
              <p className="text-text-dim text-xs font-bold mb-2">💬 RECENT COMMS</p>
              {recentMessages
                .filter(
                  (m) =>
                    m.from_agent_id === selectedAgent.id ||
                    m.to_agent_id === selectedAgent.id
                )
                .slice(0, 3)
                .map((m) => (
                  <div key={m.id} className="text-xs text-text-secondary mt-1">
                    <span className="text-accent-cyan">{m.from_agent_id}</span>
                    {" → "}
                    <span className="text-accent-amber">{m.to_agent_id || "ALL"}</span>
                    {": "}
                    <span>{m.content.slice(0, 60)}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
