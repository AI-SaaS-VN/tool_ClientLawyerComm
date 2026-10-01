import { describe, expect, it } from "vitest";

import { healthPayload } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("returns the ok payload", () => {
    expect(healthPayload()).toEqual({ status: "ok" });
  });
});
