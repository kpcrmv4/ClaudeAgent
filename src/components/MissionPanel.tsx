"use client";

import { useState, useRef, useEffect } from "react";
import type { Agent, Mission } from "@/lib/types";
import { useLang } from "@/lib/context";

interface MissionPanelProps {
  agent: Agent;
  onClose: () => void;
}

export function MissionPanel({ agent, onClose }: MissionPanelProps) {
  const [input, setInput] = useState("");
  const [missions, setMissions] = useState<Mission[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [lastMessage, setLastMessage] = useState("");
  const outputRef = useRef<HTMLDivElement>(null);
  const { t } = useLang();

  useEffect(() => {
    fetchMissions();
    const interval = setInterval(fetchMissions, 3000);
    return () => clearInterval(interval);
  }, [agent.id]);

  async function fetchMissions() {
    const res = await fetch(`/api/agents/${agent.id}`);
    const data = await res.json();
    if (data.missions) setMissions(data.missions);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || submitting) return;
    setSubmitting(true);
    setLastMessage("");

    try {
      const res = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: agent.id, title: input.slice(0, 50), input }),
      });
      const data = await res.json();
      if (data.success) {
        setLastMessage(data.message || "Mission queued!");
      } else {
        setLastMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      setLastMessage("Error: " + (err instanceof Error ? err.message : "Unknown"));
    } finally {
      setSubmitting(false);
      setInput("");
      fetchMissions();
    }
  }

  const statusLabel: Record<string, string> = {
    PENDING: t.mission.pending,
    RUNNING: t.mission.running,
    COMPLETED: t.mission.completed,
    FAILED: t.mission.failed,
    CANCELLED: t.mission.cancelled,
  };

  const statusColors: Record<string, string> = {
    PENDING: "text-accent-amber",
    RUNNING: "text-accent-cyan status-working",
    COMPLETED: "text-accent-green",
    FAILED: "text-accent-red",
    CANCELLED: "text-text-dim",
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-bg-card border border-border-dim rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border-dim">
          <div>
            <h2 className="text-text-primary font-bold text-lg">{agent.name}</h2>
            <p className="text-text-dim text-xs mt-0.5">{agent.role} / {agent.model}</p>
          </div>
          <button onClick={onClose} className="text-text-dim hover:text-text-primary transition-colors p-1 rounded-lg hover:bg-bg-card-hover">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        {/* Mission list */}
        <div ref={outputRef} className="flex-1 overflow-y-auto p-5 min-h-[280px]">
          {lastMessage && (
            <div className="bg-accent-green/10 border border-accent-green/20 rounded-xl p-3 mb-4 text-sm text-accent-green">
              {lastMessage}
            </div>
          )}

          {missions.length > 0 ? (
            <div className="space-y-3">
              {missions.slice(0, 10).map((m) => (
                <div key={m.id} className="border border-border-dim rounded-xl p-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-text-primary text-sm font-medium">{m.title}</span>
                    <span className={`text-[11px] font-medium ${statusColors[m.status] || "text-text-dim"}`}>
                      {statusLabel[m.status] || m.status}
                    </span>
                  </div>
                  <p className="text-text-dim text-xs leading-relaxed">{m.input.slice(0, 120)}{m.input.length > 120 ? "..." : ""}</p>
                  {m.output ? (
                    <div className="bg-bg-input rounded-lg p-3 mt-2.5">
                      <p className="text-text-primary text-xs whitespace-pre-wrap leading-relaxed">{m.output}</p>
                    </div>
                  ) : m.status === "PENDING" ? (
                    <p className="text-accent-amber text-[11px] mt-2 opacity-70">{t.mission.waitingNote}</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-text-dim text-sm">
              {t.mission.ready}
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-5 border-t border-border-dim">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.mission.inputPlaceholder}
              disabled={submitting}
              className="flex-1 bg-bg-input border border-border-dim rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent-green/50 transition-colors"
            />
            <button
              type="submit"
              disabled={submitting || !input.trim()}
              className="bg-accent-green text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              {submitting ? t.mission.sending : t.mission.send}
            </button>
          </div>
          <p className="text-text-dim text-[11px] mt-2">{t.mission.flowNote}</p>
        </form>
      </div>
    </div>
  );
}
