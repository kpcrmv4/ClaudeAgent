import { NextRequest, NextResponse } from "next/server";
import { getAllMissions } from "@/lib/db";
import { dispatchMission, autoDispatchMission } from "@/lib/agent-manager";

export async function GET() {
  const missions = getAllMissions();
  return NextResponse.json({ success: true, data: missions });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentId, title, input, priority, auto } = body;

    if (auto) {
      const mission = autoDispatchMission({
        title: title || input.slice(0, 50),
        input,
        priority,
      });
      return NextResponse.json({
        success: true,
        data: mission,
        message: "Mission queued for auto-dispatch. Cowork จะหยิบงานนี้ไปประมวลผล",
      });
    }

    if (agentId) {
      const mission = dispatchMission({
        agentId,
        title: title || input.slice(0, 50),
        input,
        priority,
      });
      return NextResponse.json({
        success: true,
        data: mission,
        message: `Mission dispatched to ${agentId}. Cowork จะหยิบงานนี้ไปประมวลผล`,
      });
    }

    return NextResponse.json({ success: false, error: "agentId or auto flag required" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
