import { NextResponse, type NextRequest } from "next/server";

import { fakeEmailProvider } from "@/server/providers/email/fake";

export const dynamic = "force-dynamic";

// E2E assertion hook: exposes the fake provider's in-process outbox over HTTP
// so out-of-process browser tests can read activation codes and OTPs. Exists
// only while the fake provider is selected, and only outside production or on
// the designated fictitious-data test host. On that host nginx returns 404
// for /api/test/ to the public; the process itself listens on localhost.
function hooksEnabled(): boolean {
  if ((process.env.EMAIL_PROVIDER ?? "fake") !== "fake") return false;
  if (process.env.CLC_FICTITIOUS_TEST_HOST === "1") return true;
  return process.env.NODE_ENV !== "production";
}

export async function GET(req: NextRequest) {
  if (!hooksEnabled()) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const to = req.nextUrl.searchParams.get("to");
  const entries = fakeEmailProvider.outbox
    .filter((entry) => !to || entry.to === to)
    .map((entry) => ({ to: entry.to, subject: entry.subject, text: entry.text, at: entry.at }));
  return NextResponse.json({ entries });
}

export async function DELETE() {
  if (!hooksEnabled()) return NextResponse.json({ error: "not_found" }, { status: 404 });
  fakeEmailProvider.reset();
  return NextResponse.json({ ok: true });
}
