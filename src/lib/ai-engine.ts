import Anthropic from "@anthropic-ai/sdk";
import type { Agent, Memory } from "./types";
import { getMemories, addMemory, updateAgent, updateMission, createMessage } from "./db";

const anthropic = new Anthropic();

const MODEL_MAP = {
  opus: "claude-opus-4-6",
  sonnet: "claude-sonnet-4-6",
  haiku: "claude-haiku-4-5-20251001",
} as const;

interface ExecuteOptions {
  agent: Agent;
  input: string;
  missionId: string;
  onChunk?: (chunk: string) => void;
  onComplete?: (result: string) => void;
  onError?: (error: string) => void;
}

function buildSystemPrompt(agent: Agent, memories: Memory[]): string {
  let prompt = agent.system_prompt;

  if (memories.length > 0) {
    prompt += "\n\n## Your Memory (from previous missions)\n";
    for (const mem of memories) {
      prompt += `- [${mem.key}]: ${mem.value}\n`;
    }
  }

  prompt += `\n\n## Your Identity
- Name: ${agent.name}
- Role: ${agent.role}
- Category: ${agent.category}
- Personality: ${agent.personality}

## Instructions
- Respond in the same language as the user's input
- Be thorough but concise
- If you learn important facts, state them clearly so they can be remembered
- You are part of a team of AI agents. Collaborate when needed.`;

  return prompt;
}

export async function executeAgentTask(options: ExecuteOptions): Promise<string> {
  const { agent, input, missionId, onChunk, onComplete, onError } = options;

  // Set agent to working
  updateAgent(agent.id, { status: "WORKING" });
  updateMission(missionId, { status: "RUNNING", started_at: new Date().toISOString() });

  try {
    const memories = getMemories(agent.id, 20);
    const systemPrompt = buildSystemPrompt(agent, memories);

    const stream = anthropic.messages.stream({
      model: MODEL_MAP[agent.model],
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: "user", content: input }],
    });

    let fullResponse = "";

    stream.on("text", (text) => {
      fullResponse += text;
      onChunk?.(text);
    });

    const finalMessage = await stream.finalMessage();

    // Extract text from response
    const result = finalMessage.content
      .filter((block) => block.type === "text")
      .map((block) => {
        if (block.type === "text") return block.text;
        return "";
      })
      .join("");

    // Save memory - extract key takeaway
    if (result.length > 50) {
      addMemory({
        agent_id: agent.id,
        key: `mission_${missionId}`,
        value: result.slice(0, 500),
        mission_id: missionId,
      });
    }

    // Update statuses
    updateMission(missionId, {
      status: "COMPLETED",
      output: result,
      completed_at: new Date().toISOString(),
    });
    updateAgent(agent.id, { status: "STANDBY" });

    // Log result message
    createMessage({
      from_agent_id: agent.id,
      type: "RESULT",
      content: `Mission "${missionId}" completed.`,
      mission_id: missionId,
    });

    onComplete?.(result);
    return result;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    updateMission(missionId, { status: "FAILED", output: `Error: ${errorMsg}` });
    updateAgent(agent.id, { status: "ERROR" });
    onError?.(errorMsg);
    throw err;
  }
}

export async function delegateTask(
  fromAgent: Agent,
  toAgent: Agent,
  task: string,
  missionId: string,
  onChunk?: (chunk: string) => void
): Promise<string> {
  // Create delegation message
  createMessage({
    from_agent_id: fromAgent.id,
    to_agent_id: toAgent.id,
    type: "TASK",
    content: task,
    mission_id: missionId,
  });

  // Execute on target agent
  return executeAgentTask({
    agent: toAgent,
    input: `[Delegated from ${fromAgent.name}]: ${task}`,
    missionId,
    onChunk,
  });
}
