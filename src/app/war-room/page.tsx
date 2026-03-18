"use client";

import { useEffect, useState } from "react";

interface Stats {
  totalAgents: number;
  activeAgents: number;
  totalMissions: number;
  runningMissions: number;
  completedMissions: number;
  totalMessages: number;
}

interface AgentOverview {
  id: string;
  name: string;
  category: string;
  status: string;
  model: string;
}

export default function WarRoomPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [agents, setAgents] = useState<AgentOverview[]>([]);
  const [autoInput, setAutoInput] = useState("");
  const [autoResult, setAutoResult] = useState("");
  const [isDispatching, setIsDispatching] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    const [statsRes, agentsRes] = await Promise.all([
      fetch("/api/agents?stats=true"),
      fetch("/api/agents"),
    ]);
    const statsData = await statsRes.json();
    const agentsData = await agentsRes.json();
    if (statsData.data) setStats(statsData.data);
    if (agentsData.data) setAgents(agentsData.data);
  }

  async function handleAutoDispatch(e: React.FormEvent) {
    e.preventDefault();
    if (!autoInput.trim() || isDispatching) return;
    setIsDispatching(true);
    setAutoResult("");

    try {
      const res = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: autoInput.slice(0, 50), input: autoInput, auto: true }),
      });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          setAutoResult((prev) => prev + decoder.decode(value));
        }
      }
    } finally {
      setIsDispatching(false);
      setAutoInput("");
    }
  }

  const statusColor: Record<string, string> = {
    STANDBY: "text-text-dim",
    WORKING: "text-accent-green status-working",
    ERROR: "text-accent-red",
    OFFLINE: "text-text-dim opacity-50",
  };

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-wider mb-2">WAR ROOM</h1>
      <p className="text-text-dim text-sm mb-6">// TEAM OVERVIEW & AUTO-DISPATCH</p>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          {[
            { label: "AGENTS", value: stats.totalAgents, color: "text-accent-cyan" },
            { label: "ACTIVE", value: stats.activeAgents, color: "text-accent-green" },
            { label: "MISSIONS", value: stats.totalMissions, color: "text-accent-amber" },
            { label: "RUNNING", value: stats.runningMissions, color: "text-accent-green" },
            { label: "COMPLETED", value: stats.completedMissions, color: "text-accent-cyan" },
            { label: "MESSAGES", value: stats.totalMessages, color: "text-accent-purple" },
          ].map((s) => (
            <div key={s.label} className="bg-bg-card border border-border-dim rounded p-3 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-text-dim text-[10px] tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Auto Dispatch */}
      <div className="bg-bg-card border border-border-dim rounded-lg p-4 mb-6">
        <h2 className="text-accent-green text-sm font-bold mb-3">AUTO-DISPATCH</h2>
        <p className="text-text-dim text-xs mb-3">เลขาจะวิเคราะห์งานแล้วส่งต่อให้ agent ที่เหมาะสม</p>
        <form onSubmit={handleAutoDispatch} className="flex gap-2">
          <input
            value={autoInput}
            onChange={(e) => setAutoInput(e.target.value)}
            placeholder="สั่งงานทีม..."
            className="flex-1 bg-bg-dark border border-border-dim rounded px-3 py-2 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent-green"
          />
          <button
            type="submit"
            disabled={isDispatching}
            className="bg-accent-green text-black px-4 py-2 rounded text-sm font-bold"
          >
            {isDispatching ? "DISPATCHING..." : "DISPATCH"}
          </button>
        </form>
        {autoResult && (
          <div className="mt-3 bg-bg-dark rounded p-3 text-sm text-text-primary whitespace-pre-wrap max-h-[300px] overflow-y-auto">
            {autoResult}
          </div>
        )}
      </div>

      {/* Agent Status Grid */}
      <div className="bg-bg-card border border-border-dim rounded-lg p-4">
        <h2 className="text-accent-cyan text-sm font-bold mb-3">AGENT STATUS</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {agents.map((a) => (
            <div key={a.id} className="flex items-center justify-between bg-bg-dark rounded px-3 py-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${a.status === "WORKING" ? "bg-accent-green" : a.status === "ERROR" ? "bg-accent-red" : "bg-text-dim"}`} />
                <span className="text-text-primary text-sm">{a.name}</span>
              </div>
              <span className={`text-[10px] ${statusColor[a.status] || "text-text-dim"}`}>
                {a.status} · {a.model}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
