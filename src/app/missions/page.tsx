"use client";

import { useEffect, useState } from "react";
import type { Mission } from "@/lib/types";
import { useLang } from "@/lib/context";

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { t } = useLang();

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

  const statusLabel: Record<string, string> = {
    PENDING: t.mission.pending,
    RUNNING: t.mission.running,
    COMPLETED: t.mission.completed,
    FAILED: t.mission.failed,
    CANCELLED: t.mission.cancelled,
  };

  const statusColors: Record<string, string> = {
    PENDING: "text-text-dim",
    RUNNING: "text-accent-amber status-working",
    COMPLETED: "text-accent-green",
    FAILED: "text-accent-red",
    CANCELLED: "text-text-dim",
  };

  const statusDot: Record<string, string> = {
    PENDING: "bg-text-dim",
    RUNNING: "bg-accent-amber",
    COMPLETED: "bg-accent-green",
    FAILED: "bg-accent-red",
    CANCELLED: "bg-text-dim",
  };

  const priorityColors: Record<string, string> = {
    LOW: "bg-text-dim/10 text-text-dim",
    NORMAL: "bg-accent-cyan/10 text-accent-cyan",
    HIGH: "bg-accent-amber/10 text-accent-amber",
    URGENT: "bg-accent-red/10 text-accent-red",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">{t.missions.title}</h1>
      <p className="text-text-dim text-sm mb-6">{t.missions.subtitle}</p>

      <div className="space-y-2">
        {missions.length === 0 ? (
          <div className="text-text-dim text-sm text-center py-16">{t.missions.empty}</div>
        ) : (
          missions.map((m) => (
            <div
              key={m.id}
              className="bg-bg-card border border-border-dim rounded-xl p-4 cursor-pointer hover:border-border-hover transition-colors"
              onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot[m.status]}`} />
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${priorityColors[m.priority]}`}>
                    {m.priority}
                  </span>
                  <span className="text-text-primary text-sm font-medium truncate">{m.title}</span>
                </div>
                <span className={`text-[11px] font-medium flex-shrink-0 ${statusColors[m.status]}`}>
                  {statusLabel[m.status] || m.status}
                </span>
              </div>
              {expandedId === m.id && (
                <div className="mt-3 pt-3 border-t border-border-dim">
                  <div className="text-text-dim text-[11px] font-medium mb-1.5">{t.missions.input}</div>
                  <p className="text-text-secondary text-sm mb-3 leading-relaxed">{m.input}</p>
                  {m.output && (
                    <>
                      <div className="text-text-dim text-[11px] font-medium mb-1.5">{t.missions.output}</div>
                      <div className="bg-bg-input rounded-lg p-3">
                        <p className="text-text-primary text-sm whitespace-pre-wrap leading-relaxed">{m.output}</p>
                      </div>
                    </>
                  )}
                  <div className="text-text-dim text-[11px] mt-3">
                    {t.missions.created}: {new Date(m.created_at).toLocaleString("th-TH")}
                    {m.completed_at && ` · ${t.mission.completed}: ${new Date(m.completed_at).toLocaleString("th-TH")}`}
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
