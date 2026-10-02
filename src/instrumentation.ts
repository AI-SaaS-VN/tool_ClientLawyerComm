// Server startup hook (Next 16 instrumentation convention). The notification
// worker is driven in-process by default; set NOTIFICATION_WORKER=off when an
// external driver is used instead (E2E drives it explicitly via
// POST /api/test/worker). Every queue pass is idempotent, so a restart simply
// re-drives what is still queued.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NOTIFICATION_WORKER === "off") return;
  const { startNotificationWorker } = await import("@/server/jobs/worker");
  startNotificationWorker();
}
