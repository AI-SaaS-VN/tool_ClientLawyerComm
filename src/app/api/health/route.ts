import { NextResponse } from "next/server";

export function healthPayload() {
  return { status: "ok" } as const;
}

export async function GET() {
  return NextResponse.json(healthPayload());
}
