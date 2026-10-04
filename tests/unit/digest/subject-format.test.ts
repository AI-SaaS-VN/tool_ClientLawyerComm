import { describe, expect, it } from "vitest";

import {
  DIGEST_PART_MAX_BYTES,
  buildDigestSubject,
  digestDedupeKey,
  formatDigestSendDate,
  formatVietnamClock,
  justEndedVietnamDay,
  packFilesIntoParts,
  parseDigestDedupeKey,
} from "@/modules/digest/subject";

describe("formatDigestSendDate (REQ-DIG-04)", () => {
  it("formats year + uppercase month abbreviation + day with no leading zero", () => {
    expect(formatDigestSendDate("2026-10-08")).toBe("2026OCT8");
    expect(formatDigestSendDate("2026-01-05")).toBe("2026JAN5");
    expect(formatDigestSendDate("2026-12-31")).toBe("2026DEC31");
  });

  it("uses the English month abbreviations for every month", () => {
    const expected = [
      "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
      "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
    ];
    expected.forEach((abbr, index) => {
      const month = String(index + 1).padStart(2, "0");
      expect(formatDigestSendDate(`2026-${month}-15`)).toBe(`2026${abbr}15`);
    });
  });
});

describe("buildDigestSubject (REQ-DIG-04/05)", () => {
  it("is {case title}-{send date}-Record", () => {
    expect(buildDigestSubject("DG-Juyang", "2026-10-08")).toBe("DG-Juyang-2026OCT8-Record");
  });

  it("appends the part suffix only for multi-part digests", () => {
    expect(buildDigestSubject("DG-Juyang", "2026-10-08", { index: 1, total: 1 })).toBe(
      "DG-Juyang-2026OCT8-Record",
    );
    expect(buildDigestSubject("DG-Juyang", "2026-10-08", { index: 1, total: 3 })).toBe(
      "DG-Juyang-2026OCT8-Record (1/3)",
    );
    expect(buildDigestSubject("DG-Juyang", "2026-10-08", { index: 3, total: 3 })).toBe(
      "DG-Juyang-2026OCT8-Record (3/3)",
    );
  });
});

describe("justEndedVietnamDay (REQ-DIG-01: Asia/Ho_Chi_Minh is fixed UTC+7, no DST)", () => {
  it("at 00:00 HCMC (17:00 UTC the previous day) covers the day that just closed", () => {
    const day = justEndedVietnamDay(new Date("2026-10-08T17:00:00Z")); // 2026-10-09 00:00 HCMC
    expect(day.digestDate).toBe("2026-10-08");
    expect(day.startUtc.toISOString()).toBe("2026-10-07T17:00:00.000Z");
    expect(day.endUtc.toISOString()).toBe("2026-10-08T17:00:00.000Z");
  });

  it("one second before midnight HCMC still covers the day before last", () => {
    const day = justEndedVietnamDay(new Date("2026-10-08T16:59:59Z")); // 2026-10-08 23:59:59 HCMC
    expect(day.digestDate).toBe("2026-10-07");
    expect(day.startUtc.toISOString()).toBe("2026-10-06T17:00:00.000Z");
    expect(day.endUtc.toISOString()).toBe("2026-10-07T17:00:00.000Z");
  });

  it("a daytime run covers the previous Vietnam day", () => {
    const day = justEndedVietnamDay(new Date("2026-10-09T02:00:00Z")); // 2026-10-09 09:00 HCMC
    expect(day.digestDate).toBe("2026-10-08");
  });

  it("handles month and year boundaries", () => {
    expect(justEndedVietnamDay(new Date("2026-10-31T17:00:00Z")).digestDate).toBe("2026-10-31");
    expect(justEndedVietnamDay(new Date("2026-11-01T17:00:00Z")).digestDate).toBe("2026-11-01");
    expect(justEndedVietnamDay(new Date("2026-12-31T17:00:00Z")).digestDate).toBe("2026-12-31");
    expect(justEndedVietnamDay(new Date("2027-01-01T17:00:00Z")).digestDate).toBe("2027-01-01");
  });
});

describe("formatVietnamClock", () => {
  it("renders the wall clock in Asia/Ho_Chi_Minh", () => {
    expect(formatVietnamClock(new Date("2026-10-08T03:05:00Z"))).toBe("2026-10-08 10:05");
    expect(formatVietnamClock(new Date("2026-10-08T17:30:00Z"))).toBe("2026-10-09 00:30");
  });
});

describe("digestDedupeKey / parseDigestDedupeKey (REQ-DIG-05)", () => {
  it("round-trips digest:{case_id}:{digest_date}:{user_id}:{part}", () => {
    const caseId = "11111111-2222-3333-4444-555555555555";
    const userId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    const key = digestDedupeKey(caseId, "2026-10-08", userId, 2);
    expect(key).toBe(`digest:${caseId}:2026-10-08:${userId}:2`);
    expect(parseDigestDedupeKey(key)).toEqual({
      caseId,
      digestDate: "2026-10-08",
      userId,
      part: 2,
    });
  });

  it("rejects keys of other kinds", () => {
    expect(parseDigestDedupeKey("review_alert:task:user:l0")).toBeNull();
    expect(parseDigestDedupeKey("digest:not-a-date")).toBeNull();
  });
});

describe("packFilesIntoParts (REQ-DIG-05: ≤20MB per email, greedy in given order)", () => {
  it("is a single part when nothing is attached", () => {
    expect(packFilesIntoParts([])).toEqual([{ part: 1, fileIds: [] }]);
  });

  it("keeps everything in one part while it fits", () => {
    const files = [
      { id: "a", sizeBytes: 10 * 1024 * 1024 },
      { id: "b", sizeBytes: 10 * 1024 * 1024 },
    ];
    expect(packFilesIntoParts(files)).toEqual([{ part: 1, fileIds: ["a", "b"] }]);
    expect(DIGEST_PART_MAX_BYTES).toBe(20 * 1024 * 1024);
  });

  it("starts a new part when the next file would overflow, keeping order", () => {
    const files = [
      { id: "a", sizeBytes: 12 * 1024 * 1024 },
      { id: "b", sizeBytes: 12 * 1024 * 1024 },
      { id: "c", sizeBytes: 5 * 1024 * 1024 },
    ];
    expect(packFilesIntoParts(files)).toEqual([
      { part: 1, fileIds: ["a"] },
      { part: 2, fileIds: ["b", "c"] },
    ]);
  });

  it("fills parts greedily with small files", () => {
    const files = [
      { id: "a", sizeBytes: 8 },
      { id: "b", sizeBytes: 6 },
      { id: "c", sizeBytes: 4 },
    ];
    expect(packFilesIntoParts(files, 10)).toEqual([
      { part: 1, fileIds: ["a"] },
      { part: 2, fileIds: ["b", "c"] },
    ]);
  });
});
