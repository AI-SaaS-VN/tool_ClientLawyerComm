import { createHmac, randomBytes } from "node:crypto";

// RFC 6238 TOTP (HMAC-SHA1, 30-second steps, 6 digits) with no external
// dependencies; secrets are base32 (RFC 4648) as authenticator apps expect.

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(encoded: string): Buffer {
  const clean = encoded.toUpperCase().replace(/=+$/, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of clean) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) throw new Error("invalid base32 character");
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

function hotp(secret: string, counter: number, digits: number): string {
  const key = base32Decode(secret);
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", key).update(message).digest();
  const offset = digest[digest.length - 1]! & 0x0f;
  const binary =
    ((digest[offset]! & 0x7f) << 24) |
    (digest[offset + 1]! << 16) |
    (digest[offset + 2]! << 8) |
    digest[offset + 3]!;
  return String(binary % 10 ** digits).padStart(digits, "0");
}

export function totpCode(
  secret: string,
  timeMs: number,
  options: { stepSeconds?: number; digits?: number } = {},
): string {
  const step = options.stepSeconds ?? 30;
  const digits = options.digits ?? 6;
  return hotp(secret, Math.floor(timeMs / 1000 / step), digits);
}

// ±1 time step of clock-drift tolerance (REQ-AUTH-09).
export function verifyTotpCode(
  secret: string,
  code: string,
  timeMs: number,
  options: { stepSeconds?: number; window?: number } = {},
): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  const stepMs = (options.stepSeconds ?? 30) * 1000;
  const window = options.window ?? 1;
  for (let drift = -window; drift <= window; drift += 1) {
    if (totpCode(secret, timeMs + drift * stepMs) === code) return true;
  }
  return false;
}

export function buildOtpauthUri(
  secret: string,
  accountName: string,
  issuer = "ClientLawyerComm",
): string {
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}`;
  const query = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: "6",
    period: "30",
  });
  return `otpauth://totp/${label}?${query.toString()}`;
}
