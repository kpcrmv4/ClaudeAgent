#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "../../claude-gank.db");

function getDb() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  return db;
}

// Create the MCP server
const server = new McpServer({
  name: "claude-gank",
  version: "1.0.0",
});

// === TOOLS ===

// 1. List all agents
server.tool("list_agents", "แสดงรายชื่อ agent ทั้งหมดในทีม พร้อมสถานะและ model", {}, async () => {
  const db = getDb();
  const agents = db.prepare("SELECT id, name, role, category, model, status FROM agents ORDER BY category, name").all();
  db.close();

  const formatted = (agents as Array<{ id: string; name: string; role: string; category: string; model: string; status: string }>)
    .map((a) => `[${a.category}] ${a.name} (${a.id}) — ${a.role} | ${a.status} · ${a.model}`)
    .join("\n");

  return { content: [{ type: "text" as const, text: `Agent Team (${agents.length} members):\n\n${formatted}` }] };
});

// 2. Get agent details
server.tool(
  "get_agent",
  "ดูรายละเอียดของ agent ตัวที่ระบุ",
  { agent_id: z.string().describe("ID ของ agent") },
  async ({ agent_id }) => {
    const db = getDb();
    const agent = db.prepare("SELECT * FROM agents WHERE id = ?").get(agent_id) as Record<string, unknown> | undefined;
    const missions = db.prepare("SELECT id, title, status, created_at FROM missions WHERE agent_id = ? ORDER BY created_at DESC LIMIT 5").all(agent_id);
    const memories = db.prepare("SELECT key, value FROM memory WHERE agent_id = ? ORDER BY created_at DESC LIMIT 10").all(agent_id);
    db.close();

    if (!agent) {
      return { content: [{ type: "text" as const, text: `Agent "${agent_id}" not found` }] };
    }

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({ agent, recent_missions: missions, memories }, null, 2),
      }],
    };
  }
);

// 3. Dispatch mission to a specific agent
server.tool(
  "dispatch_mission",
  "สั่งงาน (mission) ให้ agent ตัวที่ระบุ — งานจะถูกส่งไปยัง Dashboard และ AI Engine จะประมวลผล",
  {
    agent_id: z.string().describe("ID ของ agent ที่จะรับงาน"),
    title: z.string().describe("ชื่องาน"),
    input: z.string().describe("รายละเอียดงานที่ต้องการให้ทำ"),
    priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL").describe("ระดับความสำคัญ"),
  },
  async ({ agent_id, title, input, priority }) => {
    // Call the dashboard API to dispatch
    try {
      const res = await fetch("http://localhost:3000/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: agent_id, title, input, priority }),
      });
      const text = await res.text();
      return { content: [{ type: "text" as const, text: `Mission dispatched to ${agent_id}:\n\n${text}` }] };
    } catch {
      // Fallback: write directly to DB
      const db = getDb();
      const id = crypto.randomUUID();
      db.prepare(
        "INSERT INTO missions (id, title, description, agent_id, status, priority, input) VALUES (?, ?, ?, ?, 'PENDING', ?, ?)"
      ).run(id, title, "", agent_id, priority, input);
      db.close();
      return {
        content: [{
          type: "text" as const,
          text: `Mission queued (ID: ${id}). Dashboard is not running — mission saved to DB for later processing.`,
        }],
      };
    }
  }
);

// 4. Auto-dispatch (let secretary route)
server.tool(
  "auto_dispatch",
  "สั่งงานโดยไม่ระบุ agent — เลขาจะวิเคราะห์แล้วส่งต่อให้คนที่เหมาะสม",
  {
    title: z.string().describe("ชื่องาน"),
    input: z.string().describe("รายละเอียดงาน"),
    priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  },
  async ({ title, input, priority }) => {
    try {
      const res = await fetch("http://localhost:3000/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, input, priority, auto: true }),
      });
      const text = await res.text();
      return { content: [{ type: "text" as const, text: `Auto-dispatched:\n\n${text}` }] };
    } catch {
      return {
        content: [{
          type: "text" as const,
          text: "Dashboard is not running. Please start the dashboard first: npm run dev",
        }],
      };
    }
  }
);

// 5. Get team status
server.tool("team_status", "ดูสถานะรวมของทีม — ใครทำอะไรอยู่ งานค้างกี่ชิ้น", {}, async () => {
  const db = getDb();

  const agents = db.prepare("SELECT name, category, status, model FROM agents").all() as Array<{
    name: string; category: string; status: string; model: string;
  }>;
  const stats = {
    total_agents: agents.length,
    working: agents.filter((a) => a.status === "WORKING").length,
    standby: agents.filter((a) => a.status === "STANDBY").length,
    error: agents.filter((a) => a.status === "ERROR").length,
    total_missions: (db.prepare("SELECT COUNT(*) as c FROM missions").get() as { c: number }).c,
    running_missions: (db.prepare("SELECT COUNT(*) as c FROM missions WHERE status = 'RUNNING'").get() as { c: number }).c,
    pending_missions: (db.prepare("SELECT COUNT(*) as c FROM missions WHERE status = 'PENDING'").get() as { c: number }).c,
    completed_missions: (db.prepare("SELECT COUNT(*) as c FROM missions WHERE status = 'COMPLETED'").get() as { c: number }).c,
  };

  db.close();

  const workingAgents = agents
    .filter((a) => a.status === "WORKING")
    .map((a) => `  - ${a.name} (${a.category})`)
    .join("\n") || "  None";

  return {
    content: [{
      type: "text" as const,
      text: `Team Status:
━━━━━━━━━━━━━━━━━━━━
Agents: ${stats.total_agents} total (${stats.working} working, ${stats.standby} standby, ${stats.error} error)
Missions: ${stats.total_missions} total (${stats.running_missions} running, ${stats.pending_missions} pending, ${stats.completed_missions} completed)

Currently Working:
${workingAgents}`,
    }],
  };
});

// 6. Get mission result
server.tool(
  "get_mission_result",
  "ดูผลลัพธ์ของ mission ที่ระบุ",
  { mission_id: z.string().describe("ID ของ mission") },
  async ({ mission_id }) => {
    const db = getDb();
    const mission = db.prepare("SELECT * FROM missions WHERE id = ?").get(mission_id) as Record<string, unknown> | undefined;
    db.close();

    if (!mission) {
      return { content: [{ type: "text" as const, text: `Mission "${mission_id}" not found` }] };
    }

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify(mission, null, 2),
      }],
    };
  }
);

// 7. Send message between agents
server.tool(
  "send_message",
  "ส่งข้อความระหว่าง agents",
  {
    from_agent_id: z.string().describe("ID ของผู้ส่ง"),
    to_agent_id: z.string().optional().describe("ID ของผู้รับ (ไม่ใส่ = broadcast)"),
    content: z.string().describe("เนื้อหาข้อความ"),
    type: z.enum(["CHAT", "TASK", "RESULT", "SYSTEM"]).default("CHAT"),
  },
  async ({ from_agent_id, to_agent_id, content, type }) => {
    const db = getDb();
    const id = crypto.randomUUID();
    db.prepare(
      "INSERT INTO messages (id, from_agent_id, to_agent_id, type, content) VALUES (?, ?, ?, ?, ?)"
    ).run(id, from_agent_id, to_agent_id || null, type, content);
    db.close();

    return {
      content: [{
        type: "text" as const,
        text: `Message sent (ID: ${id}): ${from_agent_id} → ${to_agent_id || "ALL"}: ${content.slice(0, 100)}...`,
      }],
    };
  }
);

// === RESOURCES ===

server.resource("agents", "claude-gank://agents", async () => {
  const db = getDb();
  const agents = db.prepare("SELECT * FROM agents ORDER BY category, name").all();
  db.close();
  return { contents: [{ uri: "claude-gank://agents", mimeType: "application/json", text: JSON.stringify(agents, null, 2) }] };
});

server.resource("missions", "claude-gank://missions", async () => {
  const db = getDb();
  const missions = db.prepare("SELECT * FROM missions ORDER BY created_at DESC LIMIT 50").all();
  db.close();
  return { contents: [{ uri: "claude-gank://missions", mimeType: "application/json", text: JSON.stringify(missions, null, 2) }] };
});

// === START SERVER ===

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Claude GANK MCP Server running on stdio");
}

main().catch(console.error);
