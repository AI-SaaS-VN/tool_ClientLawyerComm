import { describe, expect, it } from "vitest";

import { assertValidTitle } from "@/modules/cases/title";

describe("assertValidTitle (REQ-CASE-01)", () => {
  it("accepts titles of 1 to 80 characters", () => {
    expect(() => assertValidTitle("甲")).not.toThrow();
    expect(() => assertValidTitle("DG-Juyang 2026")).not.toThrow();
    expect(() => assertValidTitle("x".repeat(80))).not.toThrow();
  });

  it("rejects empty, over-long, non-string, and line-broken titles", () => {
    for (const bad of [
      "",
      "x".repeat(81),
      "line1\nline2",
      "line1\r\nline2",
      "line1\rline2",
      42,
      null,
      undefined,
      ["Case"],
    ]) {
      expect(() => assertValidTitle(bad)).toThrowError(
        expect.objectContaining({ status: 400, code: "invalid_title" }),
      );
    }
  });
});
