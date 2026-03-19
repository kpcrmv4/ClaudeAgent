"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Agent, Mission, Message, ApiResponse } from "@/lib/types";
import { FloorPlan, DESK_POSITIONS } from "@/components/FloorPlan";
import { BirdEyeAgent } from "@/components/BirdEyeAgent";
import { MessageLine } from "@/components/MessageLine";
import { Particles, type ParticleTrigger } from "@/components/Particles";
import { useLang, useTheme } from "@/lib/context";

const SPRITE_COLORS: Record<string, string> = {
  CORE: "#10b981",
  TECH: "#22d3ee",
  CREATIVE: "#a78bfa",
  BIZ: "#f43f5e",
  FINANCE: "#f59e0b",
};

const AGENT_CATEGORY_ORDER: Record<string, string[]> = {
  TECH: ["coder", "sysadmin", "automator", "prompt-eng", "data-scientist"],
  CREATIVE: ["course-designer", "content-creator", "graphic", "creative", "video-producer"],
  BIZ: ["marketer", "strategist", "journalist", "legal-advisor"],
  FINANCE: ["accountant", "gold-trader", "stock-analyst"],
  CORE: ["secretary", "translator", "project-mgr"],
};

function getAgentPosition(agentId: string): { x: number; y: number } | null {
  for (const [category, agentIds] of Object.entries(AGENT_CATEGORY_ORDER)) {
    const idx = agentIds.indexOf(agentId);
    if (idx !== -1) {
      const desks = DESK_POSITIONS[category];
      if (desks && desks[idx]) return desks[idx];
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
  const { t } = useLang();
  const { theme } = useTheme();
  const isDark = theme === "dark";

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
        const pos = getAgentPosition(selectedAgent.id);
        if (pos) {
          setParticleTriggers((prev) => [...prev, {
            x: pos.x, y: pos.y, type: "sparkle",
            color: SPRITE_COLORS[selectedAgent.category] || "#10b981",
            id: `dispatch-${Date.now()}`,
          }]);
        }
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
        const newTriggers: ParticleTrigger[] = [];
        for (const mission of newMissions) {
          const prevStatus = previousMissionsRef.current.get(mission.id);
          if (prevStatus && prevStatus !== "COMPLETED" && mission.status === "COMPLETED") {
            const pos = getAgentPosition(mission.agent_id);
            if (pos) {
              newTriggers.push({
                x: pos.x, y: pos.y, type: "confetti",
                color: SPRITE_COLORS[agents.find((a) => a.id === mission.agent_id)?.category || "CORE"] || "#10b981",
                id: `complete-${mission.id}`,
              });
            }
          }
          if (prevStatus && prevStatus !== "FAILED" && mission.status === "FAILED") {
            const pos = getAgentPosition(mission.agent_id);
            if (pos) {
              newTriggers.push({ x: pos.x, y: pos.y, type: "smoke", color: "#f43f5e", id: `fail-${mission.id}` });
            }
          }
        }
        if (newTriggers.length > 0) setParticleTriggers((prev) => [...prev, ...newTriggers]);
        const newMap = new Map<string, string>();
        for (const m of newMissions) newMap.set(m.id, m.status);
        previousMissionsRef.current = newMap;
        setMissions(newMissions);
      }
      if (messagesRes.success && messagesRes.data) setMessages(messagesRes.data);
    } catch { /* silent */ }
  }, [agents]);

  useEffect(() => {
    fetchData();
    if (!isLive) return;
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData, isLive]);

  const runningMissions = new Map<string, Mission>();
  for (const m of missions) {
    if (m.status === "RUNNING" || m.status === "PENDING") runningMissions.set(m.agent_id, m);
  }

  const now = Date.now();
  const recentMessages = messages.filter((m) => now - new Date(m.created_at).getTime() < 30000);

  const workingCount = agents.filter((a) => a.status === "WORKING").length;
  const standbyCount = agents.filter((a) => a.status === "STANDBY").length;
  const errorCount = agents.filter((a) => a.status === "ERROR").length;
  const missionCount = missions.filter((m) => m.status === "RUNNING" || m.status === "PENDING").length;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {t.birdEye.title}
            <span className={`inline-block w-2 h-2 rounded-full ${isLive ? "bg-accent-green" : "bg-accent-red"}`} />
            <span className="text-xs text-text-dim font-normal">{isLive ? t.birdEye.live : t.birdEye.paused}</span>
          </h1>
          <p className="text-text-dim text-sm mt-0.5">{t.birdEye.subtitle}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-xs text-text-secondary">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-accent-green" /> {workingCount}</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-text-dim" /> {standbyCount}</span>
            {errorCount > 0 && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-accent-red" /> {errorCount}</span>}
            <span className="text-text-dim">|</span>
            <span>{missionCount} tasks</span>
          </div>
          <button
            onClick={() => setIsLive(!isLive)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isLive
                ? "bg-accent-green/12 text-accent-green hover:bg-accent-green/20"
                : "bg-accent-red/12 text-accent-red hover:bg-accent-red/20"
            }`}
          >
            {isLive ? t.birdEye.pause : t.birdEye.resume}
          </button>
        </div>
      </div>

      {/* Main SVG Canvas */}
      <div className="relative bg-bg-card rounded-xl border border-border-dim overflow-hidden">
        <svg viewBox="0 0 1200 820" className="w-full h-auto" style={{ minHeight: "400px", maxHeight: "75vh" }}>
          <FloorPlan />
          {recentMessages.filter((m) => m.to_agent_id).slice(0, 5).map((msg) => {
            const fromPos = getAgentPosition(msg.from_agent_id);
            const toPos = msg.to_agent_id ? getAgentPosition(msg.to_agent_id) : null;
            const fromAgent = agents.find((a) => a.id === msg.from_agent_id);
            return <MessageLine key={msg.id} message={msg} fromPos={fromPos} toPos={toPos} color={SPRITE_COLORS[fromAgent?.category || "CORE"] || "#10b981"} />;
          })}
          {agents.map((agent) => {
            const pos = getAgentPosition(agent.id);
            if (!pos) return null;
            return <BirdEyeAgent key={agent.id} agent={agent} x={pos.x} y={pos.y} currentMission={runningMissions.get(agent.id) || null} recentMessages={recentMessages} onClick={setSelectedAgent} />;
          })}
          <Particles triggers={particleTriggers} />
          <text x={1160} y={805} fill="#64748b" fontSize="9" fontFamily="monospace" textAnchor="end">{new Date().toLocaleTimeString("th-TH")}</text>
          <g transform="translate(30, 800)">
            <circle cx={0} cy={0} r={4} fill={isLive ? "#10b981" : "#f43f5e"} className={isLive ? "anim-screen-glow" : ""} />
            <text x={10} y={3} fill="#64748b" fontSize="8" fontFamily="monospace">CAM-01</text>
          </g>
        </svg>
        {isDark && (
          <>
            <div className="absolute inset-0 pointer-events-none" style={{ background: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)` }} />
            <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.3) 100%)` }} />
          </>
        )}
      </div>

      {/* Selected agent panel */}
      {selectedAgent && (
        <div className="mt-4 bg-bg-card rounded-xl border border-border-dim p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SPRITE_COLORS[selectedAgent.category], boxShadow: `0 0 8px ${SPRITE_COLORS[selectedAgent.category]}50` }} />
              <h3 className="text-text-primary font-bold">{selectedAgent.name}</h3>
              <span className="badge" style={{ backgroundColor: `${SPRITE_COLORS[selectedAgent.category]}20`, color: SPRITE_COLORS[selectedAgent.category] }}>{selectedAgent.category}</span>
            </div>
            <button onClick={() => { setSelectedAgent(null); setDispatchResult(null); }} className="text-text-dim hover:text-text-primary text-sm transition-colors">
              {t.birdEye.close}
            </button>
          </div>
          <p className="text-text-secondary text-xs mt-2">{selectedAgent.role}</p>

          {runningMissions.get(selectedAgent.id) && (
            <div className="mt-3 bg-bg-input rounded-xl p-3 border border-border-dim">
              <p className="text-accent-green text-xs font-medium">{t.birdEye.currentMission}</p>
              <p className="text-text-primary text-sm mt-1">{runningMissions.get(selectedAgent.id)!.title}</p>
            </div>
          )}

          {(() => {
            const lastCompleted = missions.find((m) => m.agent_id === selectedAgent.id && m.status === "COMPLETED");
            if (!lastCompleted || runningMissions.get(selectedAgent.id)) return null;
            return (
              <div className="mt-3 bg-bg-input rounded-xl p-3 border border-border-dim">
                <p className="text-accent-cyan text-xs font-medium">{t.birdEye.lastCompleted}: {lastCompleted.title}</p>
                <p className="text-text-secondary text-xs mt-1 whitespace-pre-wrap leading-relaxed">
                  {lastCompleted.output?.slice(0, 300)}{lastCompleted.output && lastCompleted.output.length > 300 ? "..." : ""}
                </p>
              </div>
            );
          })()}

          <div className="mt-4 pt-4 border-t border-border-dim">
            <p className="text-text-dim text-xs font-medium mb-3">{t.birdEye.dispatchMission}</p>
            <div className="space-y-3">
              <div className="flex gap-3">
                <input type="text" placeholder={t.birdEye.missionName} value={dispatchTitle} onChange={(e) => setDispatchTitle(e.target.value)} className="flex-1 bg-bg-input border border-border-dim rounded-xl px-3 py-2 text-sm text-text-primary placeholder-text-dim focus:outline-none focus:border-accent-green/50 transition-colors" />
                <select value={dispatchPriority} onChange={(e) => setDispatchPriority(e.target.value as typeof dispatchPriority)} className="bg-bg-input border border-border-dim rounded-xl px-2 py-2 text-xs text-text-secondary focus:outline-none">
                  <option value="LOW">LOW</option><option value="NORMAL">NORMAL</option><option value="HIGH">HIGH</option><option value="URGENT">URGENT</option>
                </select>
              </div>
              <textarea placeholder={t.birdEye.missionDetail} value={dispatchInput} onChange={(e) => setDispatchInput(e.target.value)} rows={3} className="w-full bg-bg-input border border-border-dim rounded-xl px-3 py-2 text-sm text-text-primary placeholder-text-dim focus:outline-none focus:border-accent-green/50 transition-colors resize-none" />
              <div className="flex items-center justify-between">
                <div>
                  {dispatchResult && (
                    <span className={`text-xs ${dispatchResult.success ? "text-accent-green" : "text-accent-red"}`}>{dispatchResult.message}</span>
                  )}
                </div>
                <button
                  onClick={handleDispatch}
                  disabled={isDispatching || !dispatchTitle.trim() || !dispatchInput.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed text-white"
                  style={!isDispatching && dispatchTitle.trim() && dispatchInput.trim() ? { backgroundColor: SPRITE_COLORS[selectedAgent.category] } : { backgroundColor: "var(--color-border-dim)" }}
                >
                  {isDispatching ? t.birdEye.dispatching : t.birdEye.dispatchMission}
                </button>
              </div>
            </div>
          </div>

          {recentMessages.filter((m) => m.from_agent_id === selectedAgent.id || m.to_agent_id === selectedAgent.id).length > 0 && (
            <div className="mt-3 pt-3 border-t border-border-dim">
              <p className="text-text-dim text-xs font-medium mb-2">{t.birdEye.recentComms}</p>
              {recentMessages
                .filter((m) => m.from_agent_id === selectedAgent.id || m.to_agent_id === selectedAgent.id)
                .slice(0, 3)
                .map((m) => (
                  <div key={m.id} className="text-xs text-text-secondary mt-1">
                    <span className="text-accent-cyan">{m.from_agent_id}</span>
                    <span className="text-text-dim mx-1">&rarr;</span>
                    <span className="text-accent-amber">{m.to_agent_id || "ALL"}</span>
                    {": "}{m.content.slice(0, 60)}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
