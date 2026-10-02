import { NextResponse, type NextRequest } from "next/server";

import { fakeEmailProvider } from "@/server/providers/email/fake";

export const dynamic = "force-dynamic";

// E2E assertion hook: exposes the fake provider's in-process outbox over HTTP
// so out-of-process browser tests can read activation codes and OTPs. Exists
// only outside production and only while the fake provider is selected — the
// same conditions under which the outbox itself may exist.
function hooksEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" && (process.env.EMAIL_PROVIDER ?? "fake") === "fake"
  );
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
