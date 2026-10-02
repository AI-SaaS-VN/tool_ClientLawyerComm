import type { Prisma, PrismaClient } from "@prisma/client";

type AuditDb = Prisma.TransactionClient | PrismaClient;

export interface AuditEntry {
  actorId?: string | null;
  action: string;
  result: "success" | "denied" | "failed" | "ignored";
  targetType?: string;
  targetId?: string | null;
  caseId?: string | null;
  meta?: Record<string, unknown>;
}

// REQ-OPS-01/02: these keys may never appear in meta_json — they are the
// shapes message bodies, OTPs, tokens, secrets, and registered contact
// channels would take. A violation throws so tests and code review catch it
// at the call site instead of leaking into the append-only log.
const FORBIDDEN_META_KEYS = new Set([
  "otp",
  "code",
  "token",
  "secret",
  "password",
  "text",
  "body",
  "content",
  "email",
  "to",
  "address",
  "note",
]);

function assertMetaSafe(meta: Record<string, unknown>): void {
  for (const key of Object.keys(meta)) {
    if (FORBIDDEN_META_KEYS.has(key.toLowerCase())) {
      throw new Error(`audit meta key forbidden by REQ-OPS-01: ${key}`);
    }
    const value = meta[key];
    if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean" && value !== null) {
      throw new Error(`audit meta values must be primitives: ${key}`);
    }
  }
}

// Writes one append-only audit row. Pass the active transaction client when
// the record must commit atomically with the business change; pass the
// global client otherwise. Audit failures fail the caller loudly — a silent
// audit gap is worse than a rejected operation.
export async function recordAudit(db: AuditDb, entry: AuditEntry): Promise<void> {
  if (entry.meta) assertMetaSafe(entry.meta);
  await db.auditLog.create({
    data: {
      actorId: entry.actorId ?? null,
      action: entry.action,
      result: entry.result,
      targetType: entry.targetType ?? null,
      targetId: entry.targetId ?? null,
      caseId: entry.caseId ?? null,
      metaJson: entry.meta ? (entry.meta as Prisma.InputJsonValue) : undefined,
    },
  });
}
