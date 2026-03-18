"use client";

import { useState } from "react";
import type { AgentCategory, AgentModel, EffortLevel } from "@/lib/types";

interface DeployAgentModalProps {
  onClose: () => void;
  onDeploy: (agent: {
    name: string;
    role: string;
    category: AgentCategory;
    model: AgentModel;
    personality: string;
    system_prompt: string;
    effort_level: EffortLevel;
  }) => void;
}

export function DeployAgentModal({ onClose, onDeploy }: DeployAgentModalProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [category, setCategory] = useState<AgentCategory>("TECH");
  const [model, setModel] = useState<AgentModel>("sonnet");
  const [personality, setPersonality] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [effort, setEffort] = useState<EffortLevel>("medium");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onDeploy({ name, role, category, model, personality, system_prompt: systemPrompt, effort_level: effort });
  }

  const inputClass = "w-full bg-bg-dark border border-border-dim rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-green";
  const labelClass = "text-text-secondary text-xs mb-1 block";

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-card border border-border-dim rounded-lg w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b border-border-dim">
          <h2 className="text-accent-green font-bold">+ DEPLOY NEW AGENT</h2>
          <button onClick={onClose} className="text-text-dim hover:text-text-primary text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className={labelClass}>NAME</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>ROLE</label>
            <input value={role} onChange={(e) => setRole(e.target.value)} className={inputClass} required />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>CATEGORY</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as AgentCategory)} className={inputClass}>
                <option value="CORE">CORE</option>
                <option value="TECH">TECH</option>
                <option value="CREATIVE">CREATIVE</option>
                <option value="BIZ">BIZ</option>
                <option value="FINANCE">FINANCE</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>MODEL</label>
              <select value={model} onChange={(e) => setModel(e.target.value as AgentModel)} className={inputClass}>
                <option value="opus">opus</option>
                <option value="sonnet">sonnet</option>
                <option value="haiku">haiku</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>EFFORT</label>
              <select value={effort} onChange={(e) => setEffort(e.target.value as EffortLevel)} className={inputClass}>
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>PERSONALITY</label>
            <input value={personality} onChange={(e) => setPersonality(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>SYSTEM PROMPT</label>
            <textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} className={`${inputClass} h-24 resize-none`} />
          </div>
          <button type="submit" className="w-full bg-accent-green text-black py-2 rounded font-bold hover:bg-accent-green/80">
            DEPLOY
          </button>
        </form>
      </div>
    </div>
  );
}
