import { v4 as uuid } from "uuid";
import { getAllAgents, getAgent, createMission, updateMission, createMessage } from "./db";
import { executeAgentTask, delegateTask } from "./ai-engine";
import type { Agent, MissionPriority } from "./types";

// Active mission streams for WebSocket
const activeStreams = new Map<string, { chunks: string[]; done: boolean; error?: string }>();

export function getStream(missionId: string) {
  return activeStreams.get(missionId);
}

export function getAllStreams() {
  return activeStreams;
}

/**
 * Dispatch a mission to a specific agent
 */
export async function dispatchMission(params: {
  agentId: string;
  title: string;
  input: string;
  priority?: MissionPriority;
  parentMissionId?: string;
}): Promise<{ missionId: string; result: string }> {
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

  // Track streaming
  const stream: { chunks: string[]; done: boolean; error?: string } = { chunks: [], done: false };
  activeStreams.set(mission.id, stream);

  try {
    const result = await executeAgentTask({
      agent,
      input: params.input,
      missionId: mission.id,
      onChunk: (chunk) => {
        stream.chunks.push(chunk);
      },
      onComplete: () => {
        stream.done = true;
      },
      onError: (err) => {
        stream.done = true;
        stream.error = err;
      },
    });

    return { missionId: mission.id, result };
  } finally {
    // Clean up after 5 minutes
    setTimeout(() => activeStreams.delete(mission.id), 5 * 60 * 1000);
  }
}

/**
 * Auto-dispatch: Let the secretary (เลขา) analyze and route the task
 */
export async function autoDispatch(params: {
  title: string;
  input: string;
  priority?: MissionPriority;
}): Promise<{ missionId: string; agentId: string; result: string }> {
  const agents = getAllAgents();
  const secretary = agents.find((a) => a.category === "CORE");

  if (!secretary) throw new Error("No CORE agent found for routing");

  // Build agent catalog for secretary
  const agentCatalog = agents
    .filter((a) => a.id !== secretary.id)
    .map((a) => `- ${a.id}: ${a.name} (${a.category}) — ${a.role}`)
    .join("\n");

  const routingPrompt = `You are the team coordinator. Analyze this task and decide which agent should handle it.

Available agents:
${agentCatalog}

Task: ${params.input}

Respond with ONLY the agent ID that should handle this task. Nothing else.`;

  // Ask secretary to route
  const routingMission = createMission({
    id: uuid(),
    title: `[Routing] ${params.title}`,
    agent_id: secretary.id,
    input: routingPrompt,
    priority: "HIGH",
  });

  const routingResult = await executeAgentTask({
    agent: secretary,
    input: routingPrompt,
    missionId: routingMission.id,
  });

  // Find the target agent
  const targetId = routingResult.trim();
  const targetAgent = getAgent(targetId);

  if (!targetAgent) {
    // Fallback: secretary handles it
    return dispatchMission({
      agentId: secretary.id,
      title: params.title,
      input: params.input,
      priority: params.priority,
      parentMissionId: routingMission.id,
    }).then((r) => ({ ...r, agentId: secretary.id }));
  }

  // Delegate to target agent
  createMessage({
    from_agent_id: secretary.id,
    to_agent_id: targetAgent.id,
    type: "TASK",
    content: `Routed task: ${params.title}`,
    mission_id: routingMission.id,
  });

  const result = await dispatchMission({
    agentId: targetAgent.id,
    title: params.title,
    input: params.input,
    priority: params.priority,
    parentMissionId: routingMission.id,
  });

  return { ...result, agentId: targetAgent.id };
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
