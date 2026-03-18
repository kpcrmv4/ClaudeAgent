"use client";

import { useEffect, useState } from "react";
import type { Agent } from "@/lib/types";
import { AgentCard } from "@/components/AgentCard";
import { MissionPanel } from "@/components/MissionPanel";
import { DeployAgentModal } from "@/components/DeployAgentModal";

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showDeploy, setShowDeploy] = useState(false);

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-wider">AGENTS</h1>
          <p className="text-text-dim text-sm mt-1">// SELECT AN AGENT TO VIEW DETAILS OR DEPLOY A MISSION</p>
        </div>
        <button
          onClick={() => setShowDeploy(true)}
          className="bg-accent-green text-black px-4 py-2 rounded font-bold text-sm hover:bg-accent-green/80"
        >
          + DEPLOY NEW AGENT
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} onClick={setSelectedAgent} />
        ))}
      </div>

      {selectedAgent && (
        <MissionPanel agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
      )}

      {showDeploy && (
        <DeployAgentModal onClose={() => setShowDeploy(false)} onDeploy={handleDeploy} />
      )}
    </div>
  );
}
