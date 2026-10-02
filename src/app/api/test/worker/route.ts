import { NextResponse } from "next/server";

import { runNotificationWorkerOnce } from "@/server/jobs/worker";

export const dynamic = "force-dynamic";

// E2E worker driver: runs one pass of the persistent notification queue on
// demand, so browser tests do not depend on wall-clock worker ticks. The dev
// and production servers instead drive the queue from instrumentation.ts
// (see docs/deployment.md). Non-production + fake email provider only.
export async function POST() {
  const enabled =
    process.env.NODE_ENV !== "production" && (process.env.EMAIL_PROVIDER ?? "fake") === "fake";
  if (!enabled) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const summary = await runNotificationWorkerOnce();
  return NextResponse.json({ summary });
}
