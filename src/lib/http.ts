import { NextResponse } from "next/server";

import { ApiError, isApiError } from "./api-error";

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = (await req.json()) as unknown;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new ApiError(400, "invalid_body");
    }
    return body as Record<string, unknown>;
  } catch (error) {
    if (isApiError(error)) throw error;
    throw new ApiError(400, "invalid_json");
  }
}

export function errorResponse(error: unknown): NextResponse {
  if (isApiError(error)) {
    return NextResponse.json({ error: error.code }, { status: error.status });
  }
  // Log the category only — never request bodies, addresses, or codes.
  console.error("unhandled_error", { category: "internal" });
  return NextResponse.json({ error: "internal_error" }, { status: 500 });
}
