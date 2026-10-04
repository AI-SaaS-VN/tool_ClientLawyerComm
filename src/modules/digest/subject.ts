// Pure digest rules (no I/O): Vietnam calendar math, subject/date formats,
// dedupe keys, and attachment part packing. DB access lives in ./service.ts.

// Asia/Ho_Chi_Minh is fixed UTC+7 with no daylight-saving time, so all
// timezone math is a constant shift (REQ-DIG-01).
export const VIETNAM_OFFSET_MS = 7 * 60 * 60_000;

const DAY_MS = 24 * 60 * 60_000;

const MONTH_ABBR = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
] as const;

export interface VietnamDay {
  // The Vietnam calendar date covered, as YYYY-MM-DD.
  digestDate: string;
  // UTC instants bounding that calendar day: [startUtc, endUtc).
  startUtc: Date;
  endUtc: Date;
}

// The Vietnamese calendar day that has just ended relative to `now`: at
// 00:00 HCMC (17:00 UTC the previous day) the digest covers the day that
// closed at that instant. Only this single day is ever considered — the
// worker replays safely, but no arbitrary backlog is generated.
export function justEndedVietnamDay(now: Date): VietnamDay {
  const vnNow = new Date(now.getTime() + VIETNAM_OFFSET_MS);
  const todayStartVn = Date.UTC(
    vnNow.getUTCFullYear(),
    vnNow.getUTCMonth(),
    vnNow.getUTCDate(),
  );
  const endUtc = new Date(todayStartVn - VIETNAM_OFFSET_MS);
  const startUtc = new Date(endUtc.getTime() - DAY_MS);
  return { digestDate: toVietnamDateString(startUtc), startUtc, endUtc };
}

export function toVietnamDateString(at: Date): string {
  const vn = new Date(at.getTime() + VIETNAM_OFFSET_MS);
  const month = String(vn.getUTCMonth() + 1).padStart(2, "0");
  const day = String(vn.getUTCDate()).padStart(2, "0");
  return `${vn.getUTCFullYear()}-${month}-${day}`;
}

// "2026-10-08 10:05" in Asia/Ho_Chi_Minh, for message timestamps in the body.
export function formatVietnamClock(at: Date): string {
  const vn = new Date(at.getTime() + VIETNAM_OFFSET_MS);
  const hh = String(vn.getUTCHours()).padStart(2, "0");
  const mm = String(vn.getUTCMinutes()).padStart(2, "0");
  return `${toVietnamDateString(at)} ${hh}:${mm}`;
}

// REQ-DIG-04: year + uppercase English month abbreviation + day with no
// leading zero (2026OCT8).
export function formatDigestSendDate(digestDate: string): string {
  const [year, month, day] = digestDate.split("-").map(Number);
  return `${year}${MONTH_ABBR[month! - 1]}${day}`;
}

// REQ-DIG-04/05: {case title}-{send date}-Record; multi-part digests append
// " (n/m)" to the subject.
export function buildDigestSubject(
  caseTitle: string,
  digestDate: string,
  part?: { index: number; total: number },
): string {
  const base = `${caseTitle}-${formatDigestSendDate(digestDate)}-Record`;
  return part && part.total > 1 ? `${base} (${part.index}/${part.total})` : base;
}

// REQ-DIG-05: one notification task per (case, day, coordinator, part).
export function digestDedupeKey(
  caseId: string,
  digestDate: string,
  userId: string,
  part: number,
): string {
  return `digest:${caseId}:${digestDate}:${userId}:${part}`;
}

const DEDUPE_PATTERN =
  /^digest:([0-9a-f-]{36}):(\d{4}-\d{2}-\d{2}):([0-9a-f-]{36}):(\d+)$/;

export function parseDigestDedupeKey(
  key: string,
): { caseId: string; digestDate: string; userId: string; part: number } | null {
  const match = DEDUPE_PATTERN.exec(key);
  if (!match) return null;
  return {
    caseId: match[1]!,
    digestDate: match[2]!,
    userId: match[3]!,
    part: Number(match[4]),
  };
}

// REQ-DIG-05 [O06]: recommended ≤20MB of attachments per email.
export const DIGEST_PART_MAX_BYTES = 20 * 1024 * 1024;

export interface DigestPartPlan {
  part: number;
  fileIds: string[];
}

// Greedy packing in the order given (the caller sorts by created_at); the
// assignment is stored on the digest run so a retry always rebuilds the same
// parts. A file that alone exceeds the cap still gets its own part.
export function packFilesIntoParts(
  files: { id: string; sizeBytes: number }[],
  maxBytes: number = DIGEST_PART_MAX_BYTES,
): DigestPartPlan[] {
  const parts: DigestPartPlan[] = [{ part: 1, fileIds: [] }];
  let used = 0;
  for (const file of files) {
    if (used > 0 && used + file.sizeBytes > maxBytes) {
      parts.push({ part: parts.length + 1, fileIds: [] });
      used = 0;
    }
    parts[parts.length - 1]!.fileIds.push(file.id);
    used += file.sizeBytes;
  }
  return parts;
}
