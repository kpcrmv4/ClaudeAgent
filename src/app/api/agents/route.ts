import { NextRequest, NextResponse } from "next/server";
import { getAllAgents, createAgent, getSystemStats } from "@/lib/db";
import { z } from "zod/v4";

const CreateAgentSchema = z.object({
  id: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, "ID must be lowercase kebab-case"),
  name: z.string().min(1).max(100),
  role: z.string().min(1).max(500),
  category: z.enum(["CORE", "TECH", "CREATIVE", "BIZ", "FINANCE"]),
  model: z.enum(["opus", "sonnet", "haiku"]),
  personality: z.string().max(1000).optional().default(""),
  system_prompt: z.string().max(10000).optional().default(""),
  effort_level: z.enum(["low", "medium", "high"]).optional().default("medium"),
  sprite: z.string().max(100).optional().default(""),
});

export async function GET(req: NextRequest) {
  const stats = req.nextUrl.searchParams.get("stats");

  if (stats) {
    return NextResponse.json({ success: true, data: getSystemStats() });
  }

  const agents = getAllAgents();
  return NextResponse.json({ success: true, data: agents });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateAgentSchema.parse(body);
    const agent = createAgent(parsed);
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
