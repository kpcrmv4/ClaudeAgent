import { NextRequest, NextResponse } from "next/server";
import { getMission, updateMission } from "@/lib/db";
import { z } from "zod/v4";

const UpdateMissionSchema = z.object({
  status: z.enum(["PENDING", "RUNNING", "COMPLETED", "FAILED", "CANCELLED"]).optional(),
  output: z.string().max(100000).optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mission = getMission(id);
  if (!mission) return NextResponse.json({ success: false, error: "Mission not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: mission });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = UpdateMissionSchema.parse(body);
    const mission = updateMission(id, parsed);
    if (!mission) return NextResponse.json({ success: false, error: "Mission not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: mission });
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
