import { createHash, randomBytes } from "node:crypto";

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

// Human-readable 10-char code, grouped XXXXX-XXXXX.
export function generateInviteCode(): string {
  const bytes = randomBytes(10);
  const chars = [...bytes].map((b) => CROCKFORD[b % 32]).join("");
  return `${chars.slice(0, 5)}-${chars.slice(5)}`;
}

export function normalizeInviteCode(code: string): string {
  return code.trim().toUpperCase().replace(/[^0-9A-Z]/g, "");
}

export function hashInviteCode(code: string): string {
  return createHash("sha256").update(normalizeInviteCode(code)).digest("hex");
}
