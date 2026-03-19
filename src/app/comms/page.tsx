"use client";

import { useEffect, useState } from "react";
import type { Message } from "@/lib/types";
import { useLang } from "@/lib/context";

export default function CommsPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const { t } = useLang();

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  async function fetchMessages() {
    const res = await fetch("/api/messages");
    const data = await res.json();
    if (data.data) setMessages(data.data);
  }

  const typeBadge: Record<string, string> = {
    CHAT: "bg-accent-cyan/10 text-accent-cyan",
    TASK: "bg-accent-amber/10 text-accent-amber",
    RESULT: "bg-accent-green/10 text-accent-green",
    SYSTEM: "bg-accent-purple/10 text-accent-purple",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">{t.comms.title}</h1>
      <p className="text-text-dim text-sm mb-6">{t.comms.subtitle}</p>

      <div className="space-y-2">
        {messages.length === 0 ? (
          <div className="text-text-dim text-sm text-center py-16">{t.comms.empty}</div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="bg-bg-card border border-border-dim rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${typeBadge[msg.type] || "bg-bg-input text-text-dim"}`}>
                  {msg.type}
                </span>
                <span className="text-text-secondary text-xs">
                  {msg.from_agent_id}
                  <span className="text-text-dim mx-1">&rarr;</span>
                  {msg.to_agent_id || "ALL"}
                </span>
                <span className="text-text-dim text-[11px] ml-auto">
                  {new Date(msg.created_at).toLocaleString("th-TH")}
                </span>
              </div>
              <p className="text-text-primary text-sm leading-relaxed">{msg.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
