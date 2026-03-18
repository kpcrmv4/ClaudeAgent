import { NextRequest, NextResponse } from "next/server";
import { getMessages, createMessage } from "@/lib/db";

export async function GET(req: NextRequest) {
  const agentId = req.nextUrl.searchParams.get("agentId") || undefined;
  const messages = getMessages(agentId);
  return NextResponse.json({ success: true, data: messages });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const message = createMessage(body);
  return NextResponse.json({ success: true, data: message });
}
