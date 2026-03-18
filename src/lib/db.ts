import Database from "better-sqlite3";
import path from "path";
import { v4 as uuid } from "uuid";
import type { Agent, Mission, Message, Memory, Skill } from "./types";

const DB_PATH = path.join(process.cwd(), "claude-gank.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('CORE','TECH','CREATIVE','BIZ','FINANCE')),
      model TEXT NOT NULL DEFAULT 'sonnet' CHECK(model IN ('opus','sonnet','haiku')),
      status TEXT NOT NULL DEFAULT 'STANDBY' CHECK(status IN ('STANDBY','WORKING','ERROR','OFFLINE')),
      personality TEXT NOT NULL DEFAULT '',
      system_prompt TEXT NOT NULL DEFAULT '',
      effort_level TEXT NOT NULL DEFAULT 'medium' CHECK(effort_level IN ('low','medium','high')),
      sprite TEXT NOT NULL DEFAULT '',
      skills TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS missions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      agent_id TEXT NOT NULL REFERENCES agents(id),
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','RUNNING','COMPLETED','FAILED','CANCELLED')),
      priority TEXT NOT NULL DEFAULT 'NORMAL' CHECK(priority IN ('LOW','NORMAL','HIGH','URGENT')),
      input TEXT NOT NULL DEFAULT '',
      output TEXT NOT NULL DEFAULT '',
      parent_mission_id TEXT REFERENCES missions(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      started_at TEXT,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      from_agent_id TEXT NOT NULL,
      to_agent_id TEXT,
      type TEXT NOT NULL DEFAULT 'CHAT' CHECK(type IN ('CHAT','TASK','RESULT','SYSTEM')),
      content TEXT NOT NULL,
      mission_id TEXT REFERENCES missions(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS memory (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL REFERENCES agents(id),
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      mission_id TEXT REFERENCES missions(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS skills (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      instructions TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_missions_agent ON missions(agent_id);
    CREATE INDEX IF NOT EXISTS idx_missions_status ON missions(status);
    CREATE INDEX IF NOT EXISTS idx_messages_from ON messages(from_agent_id);
    CREATE INDEX IF NOT EXISTS idx_messages_to ON messages(to_agent_id);
    CREATE INDEX IF NOT EXISTS idx_memory_agent ON memory(agent_id);
  `);
}

// === Agent CRUD ===
export function getAllAgents(): Agent[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM agents ORDER BY category, name").all() as Agent[];
  return rows.map((r) => ({ ...r, skills: JSON.parse(r.skills as unknown as string) }));
}

export function getAgent(id: string): Agent | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM agents WHERE id = ?").get(id) as Agent | undefined;
  if (!row) return null;
  return { ...row, skills: JSON.parse(row.skills as unknown as string) };
}

export function createAgent(data: Partial<Agent>): Agent {
  const db = getDb();
  const id = data.id || uuid();
  db.prepare(`
    INSERT INTO agents (id, name, role, category, model, status, personality, system_prompt, effort_level, sprite, skills)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.name || "New Agent",
    data.role || "",
    data.category || "CORE",
    data.model || "sonnet",
    data.status || "STANDBY",
    data.personality || "",
    data.system_prompt || "",
    data.effort_level || "medium",
    data.sprite || "",
    JSON.stringify(data.skills || [])
  );
  return getAgent(id)!;
}

export function updateAgent(id: string, data: Partial<Agent>): Agent | null {
  const db = getDb();
  const existing = getAgent(id);
  if (!existing) return null;

  const fields: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (key === "id" || key === "created_at") continue;
    fields.push(`${key} = ?`);
    values.push(key === "skills" ? JSON.stringify(value) : value);
  }

  fields.push("updated_at = datetime('now')");
  values.push(id);

  db.prepare(`UPDATE agents SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  return getAgent(id);
}

// === Mission CRUD ===
export function getAllMissions(limit = 50): Mission[] {
  const db = getDb();
  return db.prepare("SELECT * FROM missions ORDER BY created_at DESC LIMIT ?").all(limit) as Mission[];
}

export function getMission(id: string): Mission | null {
  const db = getDb();
  return db.prepare("SELECT * FROM missions WHERE id = ?").get(id) as Mission | undefined || null;
}

export function getMissionsByAgent(agentId: string): Mission[] {
  const db = getDb();
  return db.prepare("SELECT * FROM missions WHERE agent_id = ? ORDER BY created_at DESC").all(agentId) as Mission[];
}

export function createMission(data: Partial<Mission>): Mission {
  const db = getDb();
  const id = data.id || uuid();
  db.prepare(`
    INSERT INTO missions (id, title, description, agent_id, status, priority, input, output, parent_mission_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.title || "Untitled Mission",
    data.description || "",
    data.agent_id,
    data.status || "PENDING",
    data.priority || "NORMAL",
    data.input || "",
    data.output || "",
    data.parent_mission_id || null
  );
  return getMission(id)!;
}

export function updateMission(id: string, data: Partial<Mission>): Mission | null {
  const db = getDb();
  const fields: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (key === "id" || key === "created_at") continue;
    fields.push(`${key} = ?`);
    values.push(value);
  }

  values.push(id);
  db.prepare(`UPDATE missions SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  return getMission(id);
}

// === Message CRUD ===
export function getMessages(agentId?: string, limit = 100): Message[] {
  const db = getDb();
  if (agentId) {
    return db
      .prepare("SELECT * FROM messages WHERE from_agent_id = ? OR to_agent_id = ? ORDER BY created_at DESC LIMIT ?")
      .all(agentId, agentId, limit) as Message[];
  }
  return db.prepare("SELECT * FROM messages ORDER BY created_at DESC LIMIT ?").all(limit) as Message[];
}

export function createMessage(data: Partial<Message>): Message {
  const db = getDb();
  const id = data.id || uuid();
  db.prepare(`
    INSERT INTO messages (id, from_agent_id, to_agent_id, type, content, mission_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, data.from_agent_id, data.to_agent_id || null, data.type || "CHAT", data.content || "", data.mission_id || null);
  return db.prepare("SELECT * FROM messages WHERE id = ?").get(id) as Message;
}

// === Memory CRUD ===
export function getMemories(agentId: string, limit = 20): Memory[] {
  const db = getDb();
  return db.prepare("SELECT * FROM memory WHERE agent_id = ? ORDER BY created_at DESC LIMIT ?").all(agentId, limit) as Memory[];
}

export function addMemory(data: Partial<Memory>): Memory {
  const db = getDb();
  const id = data.id || uuid();
  db.prepare(`
    INSERT INTO memory (id, agent_id, key, value, mission_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, data.agent_id, data.key || "", data.value || "", data.mission_id || null);
  return db.prepare("SELECT * FROM memory WHERE id = ?").get(id) as Memory;
}

// === Skill CRUD ===
export function getAllSkills(): Skill[] {
  const db = getDb();
  return db.prepare("SELECT * FROM skills ORDER BY name").all() as Skill[];
}

export function getSkill(id: string): Skill | null {
  const db = getDb();
  return db.prepare("SELECT * FROM skills WHERE id = ?").get(id) as Skill | undefined || null;
}

// === Stats ===
export function getSystemStats() {
  const db = getDb();
  return {
    totalAgents: (db.prepare("SELECT COUNT(*) as c FROM agents").get() as { c: number }).c,
    activeAgents: (db.prepare("SELECT COUNT(*) as c FROM agents WHERE status = 'WORKING'").get() as { c: number }).c,
    totalMissions: (db.prepare("SELECT COUNT(*) as c FROM missions").get() as { c: number }).c,
    runningMissions: (db.prepare("SELECT COUNT(*) as c FROM missions WHERE status = 'RUNNING'").get() as { c: number }).c,
    completedMissions: (db.prepare("SELECT COUNT(*) as c FROM missions WHERE status = 'COMPLETED'").get() as { c: number }).c,
    totalMessages: (db.prepare("SELECT COUNT(*) as c FROM messages").get() as { c: number }).c,
  };
}
