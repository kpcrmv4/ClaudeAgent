"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/context";

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
  const [autoMessage, setAutoMessage] = useState("");
  const [isDispatching, setIsDispatching] = useState(false);
  const { t } = useLang();

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
    setAutoMessage("");

    try {
      const res = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: autoInput.slice(0, 50), input: autoInput, auto: true }),
      });
      const data = await res.json();
      if (data.success) {
        setAutoMessage(`Mission queued (ID: ${data.data.id})`);
      } else {
        setAutoMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      setAutoMessage("Error: " + (err instanceof Error ? err.message : "Unknown"));
    } finally {
      setIsDispatching(false);
      setAutoInput("");
      fetchData();
    }
  }

  const statusDot: Record<string, string> = {
    STANDBY: "bg-text-dim",
    WORKING: "bg-accent-green",
    ERROR: "bg-accent-red",
    OFFLINE: "bg-text-dim opacity-40",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">{t.warRoom.title}</h1>
      <p className="text-text-dim text-sm mb-6">{t.warRoom.subtitle}</p>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {[
            { label: t.warRoom.totalAgents, value: stats.totalAgents, accent: "stat-card-cyan" },
            { label: t.warRoom.active, value: stats.activeAgents, accent: "stat-card-green" },
            { label: t.warRoom.totalMissions, value: stats.totalMissions, accent: "stat-card-amber" },
            { label: t.warRoom.running, value: stats.runningMissions, accent: "stat-card-green" },
            { label: t.warRoom.completed, value: stats.completedMissions, accent: "stat-card-blue" },
            { label: t.warRoom.messages, value: stats.totalMessages, accent: "stat-card-purple" },
          ].map((s) => (
            <div key={s.label} className={`bg-bg-card border border-border-dim rounded-xl p-4 ${s.accent}`}>
              <div className="text-2xl font-bold text-text-primary">{s.value}</div>
              <div className="text-text-dim text-[11px] mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Auto Dispatch */}
      <div className="bg-bg-card border border-border-dim rounded-xl p-5 mb-6">
        <h2 className="text-text-primary text-sm font-bold mb-2">{t.warRoom.autoDispatch}</h2>
        <p className="text-text-dim text-xs mb-4">{t.warRoom.autoNote}</p>
        <form onSubmit={handleAutoDispatch} className="flex gap-2">
          <input
            value={autoInput}
            onChange={(e) => setAutoInput(e.target.value)}
            placeholder={t.warRoom.commandPlaceholder}
            className="flex-1 bg-bg-input border border-border-dim rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent-green/50 transition-colors"
          />
          <button
            type="submit"
            disabled={isDispatching}
            className="bg-accent-green text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            {isDispatching ? t.warRoom.queuing : t.warRoom.dispatch}
          </button>
        </form>
        {autoMessage && (
          <div className="mt-3 bg-accent-green/10 border border-accent-green/20 rounded-xl p-3 text-sm text-accent-green">
            {autoMessage}
          </div>
        )}
      </div>

      {/* Agent Status Grid */}
      <div className="bg-bg-card border border-border-dim rounded-xl p-5">
        <h2 className="text-text-primary text-sm font-bold mb-4">{t.warRoom.agentStatus}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
          {agents.map((a) => (
            <div key={a.id} className="flex items-center justify-between bg-bg-input rounded-lg px-3.5 py-2.5">
              <div className="flex items-center gap-2.5">
                <div className={`w-2 h-2 rounded-full ${statusDot[a.status] || "bg-text-dim"}`} />
                <span className="text-text-primary text-sm">{a.name}</span>
              </div>
              <span className="text-text-dim text-[11px]">{a.model}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
