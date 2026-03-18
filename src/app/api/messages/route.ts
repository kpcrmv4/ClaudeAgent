import { NextRequest, NextResponse } from "next/server";
import { getMessages, createMessage } from "@/lib/db";
import { z } from "zod/v4";

const CreateMessageSchema = z.object({
  from_agent_id: z.string().min(1).max(50),
  to_agent_id: z.string().max(50).nullable().optional().default(null),
  type: z.enum(["CHAT", "TASK", "RESULT", "SYSTEM"]).optional().default("CHAT"),
  content: z.string().min(1).max(50000),
  mission_id: z.string().max(100).nullable().optional().default(null),
});

export async function GET(req: NextRequest) {
  const agentId = req.nextUrl.searchParams.get("agentId") || undefined;
  const messages = getMessages(agentId);
  return NextResponse.json({ success: true, data: messages });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateMessageSchema.parse(body);
    const message = createMessage(parsed);
    return NextResponse.json({ success: true, data: message });
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
