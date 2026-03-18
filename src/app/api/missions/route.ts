import { NextRequest } from "next/server";
import { getAllMissions } from "@/lib/db";
import { dispatchMission, autoDispatch } from "@/lib/agent-manager";

export async function GET() {
  const missions = getAllMissions();
  return Response.json({ success: true, data: missions });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { agentId, title, input, priority, auto } = body;

  // Create a streaming response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (auto) {
          // Auto-dispatch: secretary routes the task
          const result = await autoDispatch({
            title: title || input.slice(0, 50),
            input,
            priority,
          });
          controller.enqueue(encoder.encode(result.result));
        } else if (agentId) {
          // Direct dispatch to specific agent
          const result = await dispatchMission({
            agentId,
            title: title || input.slice(0, 50),
            input,
            priority,
          });
          controller.enqueue(encoder.encode(result.result));
        } else {
          controller.enqueue(encoder.encode("Error: agentId or auto flag required"));
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(`Error: ${err instanceof Error ? err.message : "Unknown error"}`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
