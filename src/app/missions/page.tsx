"use client";

import { useEffect, useState } from "react";
import type { Mission } from "@/lib/types";

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchMissions();
    const interval = setInterval(fetchMissions, 3000);
    return () => clearInterval(interval);
  }, []);

  async function fetchMissions() {
    const res = await fetch("/api/missions");
    const data = await res.json();
    if (data.data) setMissions(data.data);
  }

  const statusColors: Record<string, string> = {
    PENDING: "text-text-dim",
    RUNNING: "text-accent-amber status-working",
    COMPLETED: "text-accent-green",
    FAILED: "text-accent-red",
    CANCELLED: "text-text-dim",
  };

  const priorityColors: Record<string, string> = {
    LOW: "text-text-dim",
    NORMAL: "text-accent-cyan",
    HIGH: "text-accent-amber",
    URGENT: "text-accent-red",
  };

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-wider mb-2">MISSIONS</h1>
      <p className="text-text-dim text-sm mb-6">// ALL MISSION LOGS</p>

      <div className="space-y-2">
        {missions.length === 0 ? (
          <div className="text-text-dim text-sm text-center py-10">// NO MISSIONS YET</div>
        ) : (
          missions.map((m) => (
            <div
              key={m.id}
              className="bg-bg-card border border-border-dim rounded p-3 cursor-pointer hover:border-text-dim"
              onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold ${priorityColors[m.priority]}`}>
                    [{m.priority}]
                  </span>
                  <span className="text-text-primary text-sm font-bold">{m.title}</span>
                  <span className="text-text-dim text-xs">→ {m.agent_id}</span>
                </div>
                <span className={`text-[10px] ${statusColors[m.status]}`}>{m.status}</span>
              </div>
              {expandedId === m.id && (
                <div className="mt-3 pt-3 border-t border-border-dim">
                  <div className="text-text-dim text-xs mb-2">INPUT:</div>
                  <p className="text-text-secondary text-sm mb-3">{m.input}</p>
                  {m.output && (
                    <>
                      <div className="text-text-dim text-xs mb-2">OUTPUT:</div>
                      <p className="text-text-primary text-sm whitespace-pre-wrap">{m.output}</p>
                    </>
                  )}
                  <div className="text-text-dim text-[10px] mt-3">
                    Created: {m.created_at}
                    {m.completed_at && ` · Completed: ${m.completed_at}`}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
