import { v4 as uuid } from "uuid";
import { getAllAgents, getAgent, createMission, createMessage } from "./db";
import type { Agent, Mission, MissionPriority } from "./types";

/**
 * Create a PENDING mission for a specific agent.
 * Cowork จะหยิบ mission นี้ไปประมวลผลผ่าน MCP tools.
 */
export function dispatchMission(params: {
  agentId: string;
  title: string;
  input: string;
  priority?: MissionPriority;
  parentMissionId?: string;
}): Mission {
  const agent = getAgent(params.agentId);
  if (!agent) throw new Error(`Agent ${params.agentId} not found`);

  const mission = createMission({
    id: uuid(),
    title: params.title,
    agent_id: params.agentId,
    input: params.input,
    priority: params.priority || "NORMAL",
    parent_mission_id: params.parentMissionId || null,
  });

  // Log dispatch message
  createMessage({
    from_agent_id: "system",
    to_agent_id: params.agentId,
    type: "TASK",
    content: `Mission dispatched: ${params.title}`,
    mission_id: mission.id,
  });

  return mission;
}

/**
 * Auto-dispatch: สร้าง mission ให้เลขา route
 * Cowork จะอ่าน mission นี้ → ดู agent catalog → เลือก agent → delegate
 */
export function autoDispatchMission(params: {
  title: string;
  input: string;
  priority?: MissionPriority;
}): Mission {
  const agents = getAllAgents();
  const secretary = agents.find((a) => a.category === "CORE");

  if (!secretary) throw new Error("No CORE agent found for routing");

  // Build agent catalog for Cowork to read
  const agentCatalog = agents
    .filter((a) => a.id !== secretary.id)
    .map((a) => `- ${a.id}: ${a.name} (${a.category}) — ${a.role}`)
    .join("\n");

  const routingInput = `[AUTO-DISPATCH] วิเคราะห์งานนี้แล้วเลือก agent ที่เหมาะสม:

งาน: ${params.input}

Agent ที่มี:
${agentCatalog}

คำแนะนำ: ใช้ process_next_mission เพื่ออ่านงานนี้ แล้วใช้ dispatch_mission ส่งต่อให้ agent ที่เหมาะสม`;

  const mission = createMission({
    id: uuid(),
    title: `[Routing] ${params.title}`,
    agent_id: secretary.id,
    input: routingInput,
    priority: params.priority || "NORMAL",
  });

  createMessage({
    from_agent_id: "system",
    to_agent_id: secretary.id,
    type: "TASK",
    content: `Auto-dispatch requested: ${params.title}`,
    mission_id: mission.id,
  });

  return mission;
}

/**
 * Get team overview
 */
export function getTeamOverview() {
  const agents = getAllAgents();
  const byCategory = new Map<string, Agent[]>();

  for (const agent of agents) {
    const list = byCategory.get(agent.category) || [];
    list.push(agent);
    byCategory.set(agent.category, list);
  }

  return {
    total: agents.length,
    working: agents.filter((a) => a.status === "WORKING").length,
    standby: agents.filter((a) => a.status === "STANDBY").length,
    error: agents.filter((a) => a.status === "ERROR").length,
    categories: Object.fromEntries(byCategory),
  };
}
