"use client";

import { useEffect, useState } from "react";
import type { Message } from "@/lib/types";

export default function CommsPage() {
  const [messages, setMessages] = useState<Message[]>([]);

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

  const typeColor: Record<string, string> = {
    CHAT: "text-accent-cyan",
    TASK: "text-accent-amber",
    RESULT: "text-accent-green",
    SYSTEM: "text-accent-purple",
  };

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-wider mb-2">COMMS</h1>
      <p className="text-text-dim text-sm mb-6">// INTER-AGENT MESSAGE BUS</p>

      <div className="space-y-2">
        {messages.length === 0 ? (
          <div className="text-text-dim text-sm text-center py-10">
            // NO MESSAGES YET
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="bg-bg-card border border-border-dim rounded p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold ${typeColor[msg.type] || "text-text-dim"}`}>
                  [{msg.type}]
                </span>
                <span className="text-text-secondary text-xs">
                  {msg.from_agent_id}
                  {msg.to_agent_id ? ` → ${msg.to_agent_id}` : " → ALL"}
                </span>
                <span className="text-text-dim text-[10px] ml-auto">
                  {new Date(msg.created_at).toLocaleString("th-TH")}
                </span>
              </div>
              <p className="text-text-primary text-sm">{msg.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
