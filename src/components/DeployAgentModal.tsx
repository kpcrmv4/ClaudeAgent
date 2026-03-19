"use client";

import { useState } from "react";
import type { AgentCategory, AgentModel, EffortLevel } from "@/lib/types";
import { useLang } from "@/lib/context";

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
  const { t } = useLang();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onDeploy({ name, role, category, model, personality, system_prompt: systemPrompt, effort_level: effort });
  }

  const inputClass = "w-full bg-bg-input border border-border-dim rounded-xl px-3.5 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-green/50 transition-colors";
  const labelClass = "text-text-secondary text-xs font-medium mb-1.5 block";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-bg-card border border-border-dim rounded-2xl w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border-dim">
          <h2 className="text-text-primary font-bold">{t.deploy.title}</h2>
          <button onClick={onClose} className="text-text-dim hover:text-text-primary p-1 rounded-lg hover:bg-bg-card-hover transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={labelClass}>{t.deploy.name}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>{t.deploy.role}</label>
            <input value={role} onChange={(e) => setRole(e.target.value)} className={inputClass} required />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>{t.deploy.category}</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as AgentCategory)} className={inputClass}>
                <option value="CORE">Core</option>
                <option value="TECH">Tech</option>
                <option value="CREATIVE">Creative</option>
                <option value="BIZ">Business</option>
                <option value="FINANCE">Finance</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>{t.deploy.model}</label>
              <select value={model} onChange={(e) => setModel(e.target.value as AgentModel)} className={inputClass}>
                <option value="opus">Opus</option>
                <option value="sonnet">Sonnet</option>
                <option value="haiku">Haiku</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>{t.deploy.effort}</label>
              <select value={effort} onChange={(e) => setEffort(e.target.value as EffortLevel)} className={inputClass}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>{t.deploy.personality}</label>
            <input value={personality} onChange={(e) => setPersonality(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{t.deploy.systemPrompt}</label>
            <textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} className={`${inputClass} h-24 resize-none`} />
          </div>
          <button type="submit" className="w-full bg-accent-green text-white py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity">
            {t.deploy.submit}
          </button>
        </form>
      </div>
    </div>
  );
}
