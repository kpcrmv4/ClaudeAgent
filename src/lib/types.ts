// === Agent Types ===
export type AgentCategory = "CORE" | "TECH" | "CREATIVE" | "BIZ" | "FINANCE";
export type AgentModel = "opus" | "sonnet" | "haiku";
export type AgentStatus = "STANDBY" | "WORKING" | "ERROR" | "OFFLINE";
export type EffortLevel = "low" | "medium" | "high";

export interface Agent {
  id: string;
  name: string;
  role: string;
  category: AgentCategory;
  model: AgentModel;
  status: AgentStatus;
  personality: string;
  system_prompt: string;
  effort_level: EffortLevel;
  sprite: string;
  skills: string[]; // JSON array of skill IDs
  created_at: string;
  updated_at: string;
}

// === Mission Types ===
export type MissionStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
export type MissionPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export interface Mission {
  id: string;
  title: string;
  description: string;
  agent_id: string;
  status: MissionStatus;
  priority: MissionPriority;
  input: string;
  output: string;
  parent_mission_id: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

// === Message Types ===
export type MessageType = "CHAT" | "TASK" | "RESULT" | "SYSTEM";

export interface Message {
  id: string;
  from_agent_id: string;
  to_agent_id: string | null; // null = broadcast
  type: MessageType;
  content: string;
  mission_id: string | null;
  created_at: string;
}

// === Memory Types ===
export interface Memory {
  id: string;
  agent_id: string;
  key: string;
  value: string;
  mission_id: string | null;
  created_at: string;
}

// === Skill Types ===
export interface Skill {
  id: string;
  name: string;
  description: string;
  instructions: string; // injected into agent prompt
  created_at: string;
}

// === API Response ===
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// === WebSocket Events ===
export interface WsEvent {
  type: "mission_update" | "agent_status" | "message" | "stream_chunk";
  payload: Record<string, unknown>;
}
