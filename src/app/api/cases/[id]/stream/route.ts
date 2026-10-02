import type { NextRequest } from "next/server";

import { errorResponse } from "@/lib/http";
import { requireUser } from "@/modules/auth/require-user";
import { requireCaseMember } from "@/server/guards/case-guards";
import { subscribeCase } from "@/server/sse/hub";

export const dynamic = "force-dynamic";

// REQ-MSG-05: live push of published messages over SSE. History is never
// replayed here — after a disconnect the client backfills via
// GET /api/cases/:id/messages?after=<last received id>.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    const { id: caseId } = await params;
    // Membership is re-validated against the database on every connection.
    await requireCaseMember(caseId, user);
    // TODO(T11): audit; close this stream immediately when the membership is revoked.

    const encoder = new TextEncoder();
    let unsubscribe: (() => void) | undefined;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(": subscribed\n\n"));
        unsubscribe = subscribeCase(caseId, {
          send: (chunk) => {
            try {
              controller.enqueue(encoder.encode(chunk));
            } catch {
              // client disconnected between publish and enqueue
            }
          },
        });
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(": ping\n\n"));
          } catch {
            clearInterval(heartbeat);
          }
        }, 25_000);
        req.signal.addEventListener("abort", () => {
          clearInterval(heartbeat);
          unsubscribe?.();
          try {
            controller.close();
          } catch {
            // already closed
          }
        });
      },
      cancel() {
        unsubscribe?.();
      },
    });
    return new Response(stream, {
      headers: {
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
        connection: "keep-alive",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
