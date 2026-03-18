import { NextRequest, NextResponse } from "next/server";
import { getAllAgents, createAgent, getSystemStats } from "@/lib/db";

export async function GET(req: NextRequest) {
  const stats = req.nextUrl.searchParams.get("stats");

  if (stats) {
    return NextResponse.json({ success: true, data: getSystemStats() });
  }

  const agents = getAllAgents();
  return NextResponse.json({ success: true, data: agents });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const agent = createAgent(body);
  return NextResponse.json({ success: true, data: agent });
}
