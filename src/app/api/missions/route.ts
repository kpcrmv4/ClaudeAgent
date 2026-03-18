import { NextRequest, NextResponse } from "next/server";
import { getAllMissions } from "@/lib/db";
import { dispatchMission, autoDispatchMission } from "@/lib/agent-manager";
import { z } from "zod/v4";

const DispatchMissionSchema = z.object({
  agentId: z.string().min(1).max(50).optional(),
  title: z.string().max(200).optional(),
  input: z.string().min(1).max(50000),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional().default("NORMAL"),
  auto: z.boolean().optional(),
});

export async function GET() {
  const missions = getAllMissions();
  return NextResponse.json({ success: true, data: missions });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = DispatchMissionSchema.parse(body);
    const { agentId, title, input, priority, auto } = parsed;

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
