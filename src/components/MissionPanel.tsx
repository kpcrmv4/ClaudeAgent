"use client";

import { useState, useRef, useEffect } from "react";
import type { Agent, Mission } from "@/lib/types";

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

  useEffect(() => {
    fetchMissions();
    // Poll for mission updates (Cowork writes results back via MCP)
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
        body: JSON.stringify({
          agentId: agent.id,
          title: input.slice(0, 50),
          input: input,
        }),
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

  const statusColors: Record<string, string> = {
    PENDING: "text-accent-amber",
    RUNNING: "text-accent-cyan status-working",
    COMPLETED: "text-accent-green",
    FAILED: "text-accent-red",
    CANCELLED: "text-text-dim",
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-card border border-border-dim rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-dim">
          <div>
            <h2 className="text-accent-green font-bold">{agent.name}</h2>
            <p className="text-text-dim text-xs">{agent.role} · {agent.model}</p>
          </div>
          <button onClick={onClose} className="text-text-dim hover:text-text-primary text-xl">
            ✕
          </button>
        </div>

        {/* Mission list */}
        <div ref={outputRef} className="flex-1 overflow-y-auto p-4 min-h-[300px]">
          {lastMessage && (
            <div className="bg-accent-green/10 border border-accent-green/30 rounded p-3 mb-3 text-sm text-accent-green">
              {lastMessage}
            </div>
          )}

          {missions.length > 0 ? (
            <div className="space-y-3">
              {missions.slice(0, 10).map((m) => (
                <div key={m.id} className="border border-border-dim rounded p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-text-primary text-sm font-bold">{m.title}</span>
                    <span className={`text-[10px] ${statusColors[m.status] || "text-text-dim"}`}>
                      {m.status}
                    </span>
                  </div>
                  <p className="text-text-dim text-xs mb-2">{m.input.slice(0, 100)}{m.input.length > 100 ? "..." : ""}</p>
                  {m.output ? (
                    <div className="bg-bg-dark rounded p-2 mt-2">
                      <p className="text-text-primary text-xs whitespace-pre-wrap">{m.output}</p>
                    </div>
                  ) : m.status === "PENDING" ? (
                    <p className="text-accent-amber text-[10px] mt-1">
                      // WAITING — Cowork จะหยิบงานนี้ไปทำ
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-text-dim text-sm">
              // READY FOR MISSION
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-border-dim">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="สั่งงาน..."
              disabled={submitting}
              className="flex-1 bg-bg-dark border border-border-dim rounded px-3 py-2 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent-green"
            />
            <button
              type="submit"
              disabled={submitting || !input.trim()}
              className="bg-accent-green text-black px-4 py-2 rounded text-sm font-bold hover:bg-accent-green/80 disabled:opacity-50"
            >
              {submitting ? "SENDING..." : "DEPLOY"}
            </button>
          </div>
          <p className="text-text-dim text-[10px] mt-2">
            Mission จะถูกสร้างเป็น PENDING → Cowork/Dispatch หยิบไปทำ → เขียนผลกลับ
          </p>
        </form>
      </div>
    </div>
  );
}
