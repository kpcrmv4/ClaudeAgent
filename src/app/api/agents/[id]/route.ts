import { NextRequest, NextResponse } from "next/server";
import { getAgent, updateAgent, getMissionsByAgent, getMemories } from "@/lib/db";
import { z } from "zod/v4";

const UpdateAgentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z.string().min(1).max(500).optional(),
  status: z.enum(["STANDBY", "WORKING", "ERROR", "OFFLINE"]).optional(),
  personality: z.string().max(1000).optional(),
  system_prompt: z.string().max(10000).optional(),
  effort_level: z.enum(["low", "medium", "high"]).optional(),
  model: z.enum(["opus", "sonnet", "haiku"]).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = getAgent(id);
  if (!agent) return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 });

  const missions = getMissionsByAgent(id);
  const memories = getMemories(id);

  return NextResponse.json({ success: true, data: agent, missions, memories });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = UpdateAgentSchema.parse(body);
    const agent = updateAgent(id, parsed);
    if (!agent) return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: agent });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: err.issues.map((i) => i.message) },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
