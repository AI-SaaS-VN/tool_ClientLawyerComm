import { describe, expect, it } from "vitest";

import {
  base32Decode,
  base32Encode,
  buildOtpauthUri,
  generateTotpSecret,
  totpCode,
  verifyTotpCode,
} from "@/server/auth/mfa";

// RFC 6238 Appendix B SHA-1 test vectors: the seed is the ASCII string
// "12345678901234567890" (20 bytes), 30-second time step, 8 digits.
const RFC_SECRET = base32Encode(Buffer.from("12345678901234567890", "ascii"));
const RFC_VECTORS: Array<[number, string]> = [
  [59, "94287082"],
  [1111111109, "07081804"],
  [1111111111, "14050471"],
  [1234567890, "89005924"],
  [2000000000, "69279037"],
  [20000000000, "65353130"],
];

describe("base32 codec (RFC 4648)", () => {
  it("encodes without padding and round-trips", () => {
    const buf = Buffer.from("12345678901234567890", "ascii");
    expect(base32Encode(buf)).toBe("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
    expect(base32Decode("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ").equals(buf)).toBe(true);
  });

  it("decodes case-insensitively and ignores padding", () => {
    const buf = Buffer.from("hi", "ascii");
    expect(base32Decode("nbuq====").equals(buf)).toBe(true);
  });

  it("rejects invalid characters", () => {
    expect(() => base32Decode("not-valid!")).toThrow();
  });
});

describe("totpCode (RFC 6238)", () => {
  it.each(RFC_VECTORS)("matches the RFC vector at T=%s", (seconds, expected) => {
    expect(totpCode(RFC_SECRET, seconds * 1000, { digits: 8 })).toBe(expected);
  });

  it("defaults to 6 digits (truncated RFC values)", () => {
    expect(totpCode(RFC_SECRET, 59 * 1000)).toBe("287082");
    expect(totpCode(RFC_SECRET, 1234567890 * 1000)).toBe("005924");
  });

  it("zero-pads short codes", () => {
    const code = totpCode(RFC_SECRET, 1111111109 * 1000);
    expect(code).toMatch(/^\d{6}$/);
  });
});

describe("verifyTotpCode", () => {
  const now = 1_700_000_000_000;

  it("accepts the current step and one step of clock drift either way", () => {
    for (const offset of [-30_000, 0, 30_000]) {
      const code = totpCode(RFC_SECRET, now + offset);
      expect(verifyTotpCode(RFC_SECRET, code, now)).toBe(true);
    }
  });

  it("rejects codes outside the ±1 step window", () => {
    const code = totpCode(RFC_SECRET, now + 60_000);
    expect(verifyTotpCode(RFC_SECRET, code, now)).toBe(false);
  });

  it("rejects malformed codes", () => {
    expect(verifyTotpCode(RFC_SECRET, "12345", now)).toBe(false);
    expect(verifyTotpCode(RFC_SECRET, "abcdef", now)).toBe(false);
    expect(verifyTotpCode(RFC_SECRET, "", now)).toBe(false);
  });
});

describe("generateTotpSecret", () => {
  it("returns a decodable 160-bit secret and never repeats", () => {
    const a = generateTotpSecret();
    const b = generateTotpSecret();
    expect(a).not.toBe(b);
    expect(base32Decode(a)).toHaveLength(20);
    expect(a).toMatch(/^[A-Z2-7]+$/);
  });
});

describe("buildOtpauthUri", () => {
  it("produces an otpauth:// URI authenticator apps accept", () => {
    const uri = buildOtpauthUri("ABC123", "admin@example.com");
    expect(uri).toBe(
      "otpauth://totp/ClientLawyerComm:admin%40example.com?secret=ABC123&issuer=ClientLawyerComm&algorithm=SHA1&digits=6&period=30",
    );
  });
});
