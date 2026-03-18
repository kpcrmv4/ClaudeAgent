import { NextRequest, NextResponse } from "next/server";
import { getMission, updateMission } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mission = getMission(id);
  if (!mission) return NextResponse.json({ success: false, error: "Mission not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: mission });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const mission = updateMission(id, body);
  if (!mission) return NextResponse.json({ success: false, error: "Mission not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: mission });
}
