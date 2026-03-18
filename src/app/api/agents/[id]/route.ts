import { NextRequest, NextResponse } from "next/server";
import { getAgent, updateAgent, getMissionsByAgent, getMemories } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = getAgent(id);
  if (!agent) return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 });

  const missions = getMissionsByAgent(id);
  const memories = getMemories(id);

  return NextResponse.json({ success: true, data: agent, missions, memories });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const agent = updateAgent(id, body);
  if (!agent) return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: agent });
}
