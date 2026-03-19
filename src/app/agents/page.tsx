"use client";

import { useEffect, useState } from "react";
import type { Agent, AgentCategory } from "@/lib/types";
import { AgentCard } from "@/components/AgentCard";
import { MissionPanel } from "@/components/MissionPanel";
import { DeployAgentModal } from "@/components/DeployAgentModal";
import { useLang } from "@/lib/context";

const CATEGORIES: (AgentCategory | "ALL")[] = ["ALL", "CORE", "TECH", "CREATIVE", "BIZ", "FINANCE"];

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showDeploy, setShowDeploy] = useState(false);
  const [filter, setFilter] = useState<AgentCategory | "ALL">("ALL");
  const { t } = useLang();

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, 3000);
    return () => clearInterval(interval);
  }, []);

  async function fetchAgents() {
    const res = await fetch("/api/agents");
    const data = await res.json();
    if (data.data) setAgents(data.data);
  }

  async function handleDeploy(agentData: Parameters<typeof DeployAgentModal extends React.FC<infer P> ? P extends { onDeploy: (a: infer A) => void } ? (a: A) => void : never : never>[0]) {
    await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(agentData),
    });
    setShowDeploy(false);
    fetchAgents();
  }

  const filtered = filter === "ALL" ? agents : agents.filter((a) => a.category === filter);
  const workingCount = agents.filter((a) => a.status === "WORKING").length;
  const standbyCount = agents.filter((a) => a.status === "STANDBY").length;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t.agents.title}</h1>
          <p className="text-text-dim text-sm mt-1">{t.agents.subtitle}</p>
        </div>
        <button
          onClick={() => setShowDeploy(true)}
          className="bg-accent-green text-white px-4 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity flex items-center gap-2 self-start sm:self-auto"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          {t.agents.addNew}
        </button>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 mb-5 text-sm">
        <div className="flex items-center gap-1.5 text-text-secondary">
          <div className="w-2 h-2 rounded-full bg-accent-green" />
          <span>{workingCount} {t.agents.working}</span>
        </div>
        <div className="flex items-center gap-1.5 text-text-secondary">
          <div className="w-2 h-2 rounded-full bg-text-dim" />
          <span>{standbyCount} {t.agents.standby}</span>
        </div>
        <div className="text-text-dim">|</div>
        <div className="text-text-dim">{agents.length} {t.agents.filterAll}</div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === cat
                ? "bg-accent-green/15 text-accent-green"
                : "bg-bg-card text-text-secondary hover:text-text-primary border border-border-dim"
            }`}
          >
            {cat === "ALL" ? t.agents.filterAll : (t.categories[cat as keyof typeof t.categories] || cat)}
          </button>
        ))}
      </div>

      {/* Agent grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((agent) => (
          <AgentCard key={agent.id} agent={agent} onClick={setSelectedAgent} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-text-dim text-sm text-center py-16">{t.agents.noAgents}</div>
      )}

      {selectedAgent && (
        <MissionPanel agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
      )}

      {showDeploy && (
        <DeployAgentModal onClose={() => setShowDeploy(false)} onDeploy={handleDeploy} />
      )}
    </div>
  );
}
