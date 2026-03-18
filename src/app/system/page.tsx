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

export default function SystemPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/agents?stats=true")
      .then((r) => r.json())
      .then((d) => { if (d.data) setStats(d.data); });
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-wider mb-2">SYSTEM</h1>
      <p className="text-text-dim text-sm mb-6">// SYSTEM CONFIGURATION & INFO</p>

      <div className="space-y-4">
        <div className="bg-bg-card border border-border-dim rounded-lg p-4">
          <h2 className="text-accent-green text-sm font-bold mb-3">SYSTEM INFO</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-dim">Version</span>
              <span className="text-text-primary">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-dim">Engine</span>
              <span className="text-text-primary">Claude Cowork (via MCP)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-dim">Database</span>
              <span className="text-text-primary">SQLite (better-sqlite3)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-dim">Framework</span>
              <span className="text-text-primary">Next.js App Router</span>
            </div>
          </div>
        </div>

        {stats && (
          <div className="bg-bg-card border border-border-dim rounded-lg p-4">
            <h2 className="text-accent-cyan text-sm font-bold mb-3">DATABASE STATS</h2>
            <div className="space-y-2 text-sm">
              {Object.entries(stats).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-text-dim">{key}</span>
                  <span className="text-text-primary">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-bg-card border border-border-dim rounded-lg p-4">
          <h2 className="text-accent-purple text-sm font-bold mb-3">MCP SERVER</h2>
          <p className="text-text-secondary text-sm mb-3">
            เชื่อมต่อ Claude Cowork กับ Dashboard ผ่าน MCP Server
          </p>
          <div className="bg-bg-dark rounded p-3 text-xs text-text-dim">
            <p>// เพิ่มใน claude_desktop_config.json:</p>
            <pre className="text-accent-green mt-2">{JSON.stringify({
              mcpServers: {
                "claude-gank": {
                  command: "node",
                  args: ["mcp-server/dist/index.js"],
                  cwd: "/path/to/ClaudeAgent"
                }
              }
            }, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
