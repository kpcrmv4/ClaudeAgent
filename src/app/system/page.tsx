"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/context";
import { useSpriteStyle, renderSprite, SPRITE_LABELS, type SpriteStyle } from "@/lib/sprites";

interface Stats {
  totalAgents: number;
  activeAgents: number;
  totalMissions: number;
  runningMissions: number;
  completedMissions: number;
  totalMessages: number;
}

const STAT_LABELS_TH: Record<string, string> = {
  totalAgents: "สมาชิกทั้งหมด",
  activeAgents: "กำลังทำงาน",
  totalMissions: "งานทั้งหมด",
  runningMissions: "งานกำลังทำ",
  completedMissions: "งานเสร็จแล้ว",
  totalMessages: "ข้อความทั้งหมด",
};

const STAT_LABELS_EN: Record<string, string> = {
  totalAgents: "Total Agents",
  activeAgents: "Active",
  totalMissions: "Total Tasks",
  runningMissions: "Running",
  completedMissions: "Completed",
  totalMessages: "Messages",
};

const SPRITE_STYLES: SpriteStyle[] = ["robot", "chibi", "geometric", "animal", "minimal"];
const PREVIEW_COLORS = ["#22d3ee", "#a78bfa", "#f43f5e", "#f59e0b", "#10b981"];

export default function SystemPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const { t, locale } = useLang();
  const { spriteStyle, setSpriteStyle } = useSpriteStyle();

  useEffect(() => {
    fetch("/api/agents?stats=true")
      .then((r) => r.json())
      .then((d) => { if (d.data) setStats(d.data); });
  }, []);

  const statLabels = locale === "th" ? STAT_LABELS_TH : STAT_LABELS_EN;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">{t.system.title}</h1>
      <p className="text-text-dim text-sm mb-6">{t.system.subtitle}</p>

      <div className="space-y-5">

        {/* Sprite Style Picker */}
        <div className="bg-bg-card border border-border-dim rounded-xl p-5">
          <h2 className="text-text-primary text-sm font-bold mb-1">
            {locale === "th" ? "รูปแบบตัวละคร" : "Character Style"}
          </h2>
          <p className="text-text-dim text-xs mb-4">
            {locale === "th" ? "เลือกรูปแบบตัวละครที่ใช้แสดงสมาชิกในทีม" : "Choose how your team members look"}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {SPRITE_STYLES.map((style, i) => {
              const isActive = spriteStyle === style;
              const label = SPRITE_LABELS[style];
              return (
                <button
                  key={style}
                  onClick={() => setSpriteStyle(style)}
                  className={`relative rounded-xl p-4 border-2 transition-all text-center ${
                    isActive
                      ? "border-accent-green bg-accent-green/8"
                      : "border-border-dim hover:border-border-hover bg-bg-input"
                  }`}
                >
                  {/* Preview — show 3 characters */}
                  <div className="flex justify-center gap-1 mb-3">
                    {[0, 1, 2].map((v) => (
                      <svg key={v} width="28" height="28" viewBox="-16 -16 32 32">
                        {renderSprite(style, PREVIEW_COLORS[(i + v) % PREVIEW_COLORS.length], v)}
                      </svg>
                    ))}
                  </div>
                  <div className="text-xs font-medium text-text-primary">
                    {locale === "th" ? label.th : label.en}
                  </div>
                  {isActive && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-accent-green flex items-center justify-center">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* System Info */}
        <div className="bg-bg-card border border-border-dim rounded-xl p-5">
          <h2 className="text-text-primary text-sm font-bold mb-4">{t.system.info}</h2>
          <div className="space-y-3 text-sm">
            {[
              { label: t.system.version, value: "1.0.0" },
              { label: t.system.engine, value: "Claude Cowork (via MCP)" },
              { label: t.system.database, value: "SQLite" },
              { label: t.system.framework, value: "Next.js 16 App Router" },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center">
                <span className="text-text-dim">{row.label}</span>
                <span className="text-text-primary font-medium">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* DB Stats */}
        {stats && (
          <div className="bg-bg-card border border-border-dim rounded-xl p-5">
            <h2 className="text-text-primary text-sm font-bold mb-4">{t.system.dbStats}</h2>
            <div className="space-y-3 text-sm">
              {Object.entries(stats).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-text-dim">{statLabels[key] || key}</span>
                  <span className="text-text-primary font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MCP Server */}
        <div className="bg-bg-card border border-border-dim rounded-xl p-5">
          <h2 className="text-text-primary text-sm font-bold mb-2">{t.system.mcpServer}</h2>
          <p className="text-text-dim text-sm mb-4">{t.system.mcpNote}</p>
          <div className="bg-bg-input rounded-xl p-4 overflow-x-auto">
            <pre className="text-accent-green text-xs font-mono leading-relaxed">{JSON.stringify({
              mcpServers: {
                "claude-gank": {
                  command: "node",
                  args: ["mcp-server/dist/index.js"],
                  cwd: "/path/to/claude-gank"
                }
              }
            }, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
