#!/usr/bin/env node

/**
 * Claude GANK MCP Server
 *
 * Architecture:
 * - Dashboard สร้าง missions (status: PENDING) ลง SQLite
 * - Cowork (ใช้ subscription ที่จ่ายอยู่แล้ว) หยิบ missions ไปทำ
 * - Cowork อ่าน agent system_prompt + memories → คิดเอง → เขียนผลกลับ
 * - ไม่ต้องใช้ API key — ทุกอย่างผ่าน Cowork subscription
 */

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

const server = new McpServer({
  name: "claude-gank",
  version: "2.0.0",
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CORE WORKFLOW TOOLS (Cowork ใช้ tools เหล่านี้ทำงาน)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 1. ดูงานที่รอทำ
server.tool(
  "get_pending_missions",
  "ดู missions ที่รอประมวลผล (status: PENDING) — Cowork จะหยิบงานเหล่านี้ไปทำ",
  {},
  async () => {
    const db = getDb();
    const missions = db.prepare(`
      SELECT m.id, m.title, m.input, m.priority, m.agent_id, m.created_at,
             a.name as agent_name, a.role as agent_role, a.category, a.model,
             a.system_prompt, a.personality
      FROM missions m
      JOIN agents a ON m.agent_id = a.id
      WHERE m.status = 'PENDING'
      ORDER BY
        CASE m.priority WHEN 'URGENT' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'NORMAL' THEN 3 ELSE 4 END,
        m.created_at ASC
    `).all() as Array<{
      id: string; title: string; input: string; priority: string; agent_id: string;
      created_at: string; agent_name: string; agent_role: string; category: string;
      model: string; system_prompt: string; personality: string;
    }>;
    db.close();

    if (missions.length === 0) {
      return { content: [{ type: "text" as const, text: "ไม่มี mission ที่รอทำ" }] };
    }

    const formatted = missions.map((m) =>
      `━━━ Mission: ${m.id} ━━━
Title: ${m.title}
Priority: ${m.priority}
Agent: ${m.agent_name} (${m.agent_id}) — ${m.agent_role}
Category: ${m.category} | Model: ${m.model}
Created: ${m.created_at}

Input:
${m.input}
`).join("\n");

    return {
      content: [{
        type: "text" as const,
        text: `Pending Missions (${missions.length}):\n\n${formatted}\n\nใช้ process_next_mission เพื่อหยิบงานแรกไปทำ หรือใช้ complete_mission เพื่อเขียนผลลัพธ์`,
      }],
    };
  }
);

// 2. หยิบงานถัดไปมาทำ — อ่าน context ทั้งหมดที่ Cowork ต้องใช้
server.tool(
  "process_next_mission",
  "หยิบ mission ถัดไปที่รอทำ — คืน system_prompt, memories, และ input ให้ Cowork ใช้คิดคำตอบ แล้วเขียนผลกลับด้วย complete_mission",
  {
    mission_id: z.string().optional().describe("ระบุ mission ID ที่ต้องการทำ (ไม่ใส่ = หยิบงานแรกตาม priority)"),
  },
  async ({ mission_id }) => {
    const db = getDb();

    // Pick mission
    let mission;
    if (mission_id) {
      mission = db.prepare("SELECT * FROM missions WHERE id = ? AND status = 'PENDING'").get(mission_id);
    } else {
      mission = db.prepare(`
        SELECT * FROM missions WHERE status = 'PENDING'
        ORDER BY
          CASE priority WHEN 'URGENT' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'NORMAL' THEN 3 ELSE 4 END,
          created_at ASC
        LIMIT 1
      `).get();
    }

    if (!mission) {
      db.close();
      return { content: [{ type: "text" as const, text: "ไม่มี mission ที่รอทำ" }] };
    }

    const m = mission as { id: string; title: string; input: string; agent_id: string; priority: string };

    // Get agent details
    const agent = db.prepare("SELECT * FROM agents WHERE id = ?").get(m.agent_id) as {
      id: string; name: string; role: string; category: string; model: string;
      personality: string; system_prompt: string;
    } | undefined;

    // Get agent memories
    const memories = db.prepare(
      "SELECT key, value FROM memory WHERE agent_id = ? ORDER BY created_at DESC LIMIT 20"
    ).all(m.agent_id) as Array<{ key: string; value: string }>;

    // Mark as RUNNING
    db.prepare("UPDATE missions SET status = 'RUNNING', started_at = datetime('now') WHERE id = ?").run(m.id);
    if (agent) {
      db.prepare("UPDATE agents SET status = 'WORKING', updated_at = datetime('now') WHERE id = ?").run(agent.id);
    }

    db.close();

    // Build context for Cowork
    let context = `━━━ MISSION: ${m.id} ━━━
Title: ${m.title}
Priority: ${m.priority}
`;

    if (agent) {
      context += `
━━━ AGENT CONTEXT ━━━
Name: ${agent.name}
Role: ${agent.role}
Category: ${agent.category}
Personality: ${agent.personality}

System Prompt:
${agent.system_prompt}
`;
    }

    if (memories.length > 0) {
      context += `\n━━━ MEMORIES (จากงานก่อนหน้า) ━━━\n`;
      for (const mem of memories) {
        context += `- [${mem.key}]: ${mem.value}\n`;
      }
    }

    context += `
━━━ TASK ━━━
${m.input}

━━━ INSTRUCTIONS ━━━
1. ทำตัวเป็น ${agent?.name || "agent"} ตาม system prompt ด้านบน
2. ตอบตามภาษาที่ user ใช้ (ไทย/อังกฤษ)
3. เมื่อทำเสร็จ ใช้ complete_mission เพื่อบันทึกผลลัพธ์
   - mission_id: "${m.id}"
   - output: ผลลัพธ์ของคุณ
   - memory_key + memory_value: (optional) สิ่งสำคัญที่ควรจำ`;

    return {
      content: [{
        type: "text" as const,
        text: context,
      }],
    };
  }
);

// 3. เขียนผลลัพธ์กลับ
server.tool(
  "complete_mission",
  "บันทึกผลลัพธ์ของ mission ที่ทำเสร็จ — อัปเดต status เป็น COMPLETED และเก็บ output + memory",
  {
    mission_id: z.string().describe("ID ของ mission"),
    output: z.string().describe("ผลลัพธ์ที่ Cowork สร้างขึ้น"),
    memory_key: z.string().optional().describe("(optional) ชื่อ key สำหรับจดจำ"),
    memory_value: z.string().optional().describe("(optional) สิ่งที่ต้องการจดจำ"),
  },
  async ({ mission_id, output, memory_key, memory_value }) => {
    const db = getDb();

    const mission = db.prepare("SELECT * FROM missions WHERE id = ?").get(mission_id) as {
      id: string; agent_id: string; title: string;
    } | undefined;

    if (!mission) {
      db.close();
      return { content: [{ type: "text" as const, text: `Mission "${mission_id}" not found` }] };
    }

    // Update mission
    db.prepare(`
      UPDATE missions SET status = 'COMPLETED', output = ?, completed_at = datetime('now')
      WHERE id = ?
    `).run(output, mission_id);

    // Set agent back to STANDBY
    db.prepare("UPDATE agents SET status = 'STANDBY', updated_at = datetime('now') WHERE id = ?").run(mission.agent_id);

    // Save memory if provided
    if (memory_key && memory_value) {
      db.prepare(
        "INSERT INTO memory (id, agent_id, key, value, mission_id) VALUES (?, ?, ?, ?, ?)"
      ).run(crypto.randomUUID(), mission.agent_id, memory_key, memory_value, mission_id);
    }

    // Auto-save output summary as memory
    if (output.length > 50) {
      db.prepare(
        "INSERT INTO memory (id, agent_id, key, value, mission_id) VALUES (?, ?, ?, ?, ?)"
      ).run(
        crypto.randomUUID(),
        mission.agent_id,
        `mission_${mission_id}`,
        output.slice(0, 500),
        mission_id
      );
    }

    // Log completion message
    db.prepare(
      "INSERT INTO messages (id, from_agent_id, type, content, mission_id) VALUES (?, ?, 'RESULT', ?, ?)"
    ).run(crypto.randomUUID(), mission.agent_id, `Mission "${mission.title}" completed.`, mission_id);

    db.close();

    return {
      content: [{
        type: "text" as const,
        text: `Mission "${mission.title}" completed and saved.\nAgent ${mission.agent_id} → STANDBY`,
      }],
    };
  }
);

// 4. Fail mission
server.tool(
  "fail_mission",
  "บันทึกว่า mission ล้มเหลว — อัปเดต status เป็น FAILED",
  {
    mission_id: z.string().describe("ID ของ mission"),
    reason: z.string().describe("สาเหตุที่ล้มเหลว"),
  },
  async ({ mission_id, reason }) => {
    const db = getDb();

    const mission = db.prepare("SELECT agent_id, title FROM missions WHERE id = ?").get(mission_id) as {
      agent_id: string; title: string;
    } | undefined;

    if (!mission) {
      db.close();
      return { content: [{ type: "text" as const, text: `Mission "${mission_id}" not found` }] };
    }

    db.prepare("UPDATE missions SET status = 'FAILED', output = ? WHERE id = ?").run(`FAILED: ${reason}`, mission_id);
    db.prepare("UPDATE agents SET status = 'STANDBY', updated_at = datetime('now') WHERE id = ?").run(mission.agent_id);

    db.close();

    return { content: [{ type: "text" as const, text: `Mission "${mission.title}" marked as FAILED: ${reason}` }] };
  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MANAGEMENT TOOLS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 5. List agents
server.tool("list_agents", "แสดงรายชื่อ agent ทั้งหมดในทีม พร้อมสถานะและ model", {}, async () => {
  const db = getDb();
  const agents = db.prepare("SELECT id, name, role, category, model, status FROM agents ORDER BY category, name").all() as Array<{
    id: string; name: string; role: string; category: string; model: string; status: string;
  }>;
  db.close();

  const formatted = agents
    .map((a) => `[${a.category}] ${a.name} (${a.id}) — ${a.role} | ${a.status} · ${a.model}`)
    .join("\n");

  return { content: [{ type: "text" as const, text: `Agent Team (${agents.length} members):\n\n${formatted}` }] };
});

// 6. Get agent details
server.tool(
  "get_agent",
  "ดูรายละเอียดของ agent ตัวที่ระบุ พร้อม missions ล่าสุดและ memories",
  { agent_id: z.string().describe("ID ของ agent") },
  async ({ agent_id }) => {
    const db = getDb();
    const agent = db.prepare("SELECT * FROM agents WHERE id = ?").get(agent_id);
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

// 7. Dispatch mission (สร้าง PENDING mission ใหม่)
server.tool(
  "dispatch_mission",
  "สร้าง mission ใหม่ให้ agent — status จะเป็น PENDING แล้วใช้ process_next_mission หยิบไปทำ",
  {
    agent_id: z.string().describe("ID ของ agent ที่จะรับงาน"),
    title: z.string().describe("ชื่องาน"),
    input: z.string().describe("รายละเอียดงาน"),
    priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  },
  async ({ agent_id, title, input, priority }) => {
    const db = getDb();

    // Verify agent exists
    const agent = db.prepare("SELECT name FROM agents WHERE id = ?").get(agent_id) as { name: string } | undefined;
    if (!agent) {
      db.close();
      return { content: [{ type: "text" as const, text: `Agent "${agent_id}" not found` }] };
    }

    const id = crypto.randomUUID();
    db.prepare(
      "INSERT INTO missions (id, title, description, agent_id, status, priority, input, output) VALUES (?, ?, '', ?, 'PENDING', ?, ?, '')"
    ).run(id, title, agent_id, priority, input);

    db.prepare(
      "INSERT INTO messages (id, from_agent_id, type, content, mission_id) VALUES (?, 'system', 'TASK', ?, ?)"
    ).run(crypto.randomUUID(), `Mission dispatched: ${title}`, id);

    db.close();

    return {
      content: [{
        type: "text" as const,
        text: `Mission created (ID: ${id})\nAgent: ${agent.name} (${agent_id})\nPriority: ${priority}\n\nใช้ process_next_mission เพื่อหยิบงานนี้ไปทำ`,
      }],
    };
  }
);

// 8. Team status
server.tool("team_status", "ดูสถานะรวมของทีม — ใครทำอะไรอยู่ งานค้างกี่ชิ้น", {}, async () => {
  const db = getDb();

  const agents = db.prepare("SELECT name, category, status, model FROM agents").all() as Array<{
    name: string; category: string; status: string; model: string;
  }>;
  const missionStats = {
    total: (db.prepare("SELECT COUNT(*) as c FROM missions").get() as { c: number }).c,
    pending: (db.prepare("SELECT COUNT(*) as c FROM missions WHERE status = 'PENDING'").get() as { c: number }).c,
    running: (db.prepare("SELECT COUNT(*) as c FROM missions WHERE status = 'RUNNING'").get() as { c: number }).c,
    completed: (db.prepare("SELECT COUNT(*) as c FROM missions WHERE status = 'COMPLETED'").get() as { c: number }).c,
    failed: (db.prepare("SELECT COUNT(*) as c FROM missions WHERE status = 'FAILED'").get() as { c: number }).c,
  };

  db.close();

  const workingAgents = agents
    .filter((a) => a.status === "WORKING")
    .map((a) => `  - ${a.name} (${a.category})`)
    .join("\n") || "  None";

  const pendingNote = missionStats.pending > 0
    ? `\n\n⚡ มี ${missionStats.pending} missions รอทำ — ใช้ process_next_mission เพื่อหยิบงาน`
    : "";

  return {
    content: [{
      type: "text" as const,
      text: `Team Status:
━━━━━━━━━━━━━━━━━━━━
Agents: ${agents.length} total (${agents.filter((a) => a.status === "WORKING").length} working, ${agents.filter((a) => a.status === "STANDBY").length} standby)
Missions: ${missionStats.total} total (${missionStats.pending} pending, ${missionStats.running} running, ${missionStats.completed} completed, ${missionStats.failed} failed)

Currently Working:
${workingAgents}${pendingNote}`,
    }],
  };
});

// 9. Send message
server.tool(
  "send_message",
  "ส่งข้อความระหว่าง agents ผ่าน message bus",
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
        text: `Message sent: ${from_agent_id} → ${to_agent_id || "ALL"}: ${content.slice(0, 100)}${content.length > 100 ? "..." : ""}`,
      }],
    };
  }
);

// 10. Get mission result
server.tool(
  "get_mission_result",
  "ดูผลลัพธ์ของ mission ที่ระบุ",
  { mission_id: z.string().describe("ID ของ mission") },
  async ({ mission_id }) => {
    const db = getDb();
    const mission = db.prepare(`
      SELECT m.*, a.name as agent_name
      FROM missions m
      LEFT JOIN agents a ON m.agent_id = a.id
      WHERE m.id = ?
    `).get(mission_id) as Record<string, unknown> | undefined;
    db.close();

    if (!mission) {
      return { content: [{ type: "text" as const, text: `Mission "${mission_id}" not found` }] };
    }

    return { content: [{ type: "text" as const, text: JSON.stringify(mission, null, 2) }] };
  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RESOURCES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

server.resource("agents", "claude-gank://agents", async () => {
  const db = getDb();
  const agents = db.prepare("SELECT * FROM agents ORDER BY category, name").all();
  db.close();
  return { contents: [{ uri: "claude-gank://agents", mimeType: "application/json", text: JSON.stringify(agents, null, 2) }] };
});

server.resource("pending-missions", "claude-gank://pending-missions", async () => {
  const db = getDb();
  const missions = db.prepare(`
    SELECT m.*, a.name as agent_name, a.system_prompt
    FROM missions m
    JOIN agents a ON m.agent_id = a.id
    WHERE m.status = 'PENDING'
    ORDER BY CASE m.priority WHEN 'URGENT' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'NORMAL' THEN 3 ELSE 4 END
  `).all();
  db.close();
  return { contents: [{ uri: "claude-gank://pending-missions", mimeType: "application/json", text: JSON.stringify(missions, null, 2) }] };
});

server.resource("missions", "claude-gank://missions", async () => {
  const db = getDb();
  const missions = db.prepare("SELECT * FROM missions ORDER BY created_at DESC LIMIT 50").all();
  db.close();
  return { contents: [{ uri: "claude-gank://missions", mimeType: "application/json", text: JSON.stringify(missions, null, 2) }] };
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// START
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Claude GANK MCP Server v2.0 running (Cowork-powered, no API key needed)");
}

main().catch(console.error);
