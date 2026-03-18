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
  const [streaming, setStreaming] = useState(false);
  const [streamOutput, setStreamOutput] = useState("");
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMissions();
  }, [agent.id]);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [streamOutput]);

  async function fetchMissions() {
    const res = await fetch(`/api/agents/${agent.id}`);
    const data = await res.json();
    if (data.missions) setMissions(data.missions);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || streaming) return;

    setStreaming(true);
    setStreamOutput("");

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

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value);
          setStreamOutput((prev) => prev + text);
        }
      }
    } catch (err) {
      setStreamOutput((prev) => prev + "\n\n[Error: " + (err instanceof Error ? err.message : "Unknown") + "]");
    } finally {
      setStreaming(false);
      setInput("");
      fetchMissions();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-card border border-border-dim rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-dim">
          <div>
            <h2 className="text-accent-green font-bold">{agent.name}</h2>
            <p className="text-text-dim text-xs">{agent.role}</p>
          </div>
          <button onClick={onClose} className="text-text-dim hover:text-text-primary text-xl">
            ✕
          </button>
        </div>

        {/* Output area */}
        <div ref={outputRef} className="flex-1 overflow-y-auto p-4 min-h-[300px]">
          {streamOutput ? (
            <div className="text-text-primary text-sm whitespace-pre-wrap leading-relaxed">
              {streamOutput}
              {streaming && <span className="animate-pulse">▊</span>}
            </div>
          ) : missions.length > 0 ? (
            <div className="space-y-3">
              {missions.slice(0, 10).map((m) => (
                <div key={m.id} className="border border-border-dim rounded p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-text-primary text-sm font-bold">{m.title}</span>
                    <span
                      className={`text-[10px] ${
                        m.status === "COMPLETED"
                          ? "text-accent-green"
                          : m.status === "RUNNING"
                            ? "text-accent-amber status-working"
                            : m.status === "FAILED"
                              ? "text-accent-red"
                              : "text-text-dim"
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>
                  {m.output && (
                    <p className="text-text-secondary text-xs mt-2 line-clamp-3">{m.output}</p>
                  )}
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
              disabled={streaming}
              className="flex-1 bg-bg-dark border border-border-dim rounded px-3 py-2 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent-green"
            />
            <button
              type="submit"
              disabled={streaming || !input.trim()}
              className="bg-accent-green text-black px-4 py-2 rounded text-sm font-bold hover:bg-accent-green/80 disabled:opacity-50"
            >
              {streaming ? "RUNNING..." : "DEPLOY"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
