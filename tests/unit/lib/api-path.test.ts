import { afterEach, describe, expect, it } from "vitest";

import { apiPath } from "@/lib/api-path";

// The parallel /new deployment builds with NEXT_PUBLIC_BASE_PATH=/new; the
// pilot builds with it unset. Both modes must produce correct URLs.
describe("apiPath", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_BASE_PATH;
  });

  it("returns the path unchanged when no base path is set", () => {
    expect(apiPath("/api/cases")).toBe("/api/cases");
  });

  it("prefixes the base path when set", () => {
    process.env.NEXT_PUBLIC_BASE_PATH = "/new";
    expect(apiPath("/api/cases")).toBe("/new/api/cases");
    expect(apiPath("/cases")).toBe("/new/cases");
  });
});
