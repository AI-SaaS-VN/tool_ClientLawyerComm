import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

// Dev-only fallback key (32 bytes, hex). Production must provide APP_DATA_KEY;
// this constant exists so local dev and tests work without secret management.
const DEV_ONLY_KEY_HEX =
  "636c632d6465762d6f6e6c792d6b65792d444f2d4e4f542d5553452d30303031";

export function getDataKey(): Buffer {
  const hex = process.env.APP_DATA_KEY;
  if (hex && /^[0-9a-fA-F]{64}$/.test(hex)) return Buffer.from(hex, "hex");
  if (process.env.NODE_ENV === "production") {
    throw new Error("APP_DATA_KEY is missing or is not 32 bytes of hex");
  }
  return Buffer.from(DEV_ONLY_KEY_HEX, "hex");
}

export function encryptText(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getDataKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("hex")}:${tag.toString("hex")}:${ciphertext.toString("hex")}`;
}

export function decryptText(encoded: string): string {
  const [version, ivHex, tagHex, ctHex] = encoded.split(":");
  if (version !== "v1" || !ivHex || !tagHex || !ctHex) {
    throw new Error("malformed encrypted value");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    getDataKey(),
    Buffer.from(ivHex, "hex"),
  );
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([
    decipher.update(Buffer.from(ctHex, "hex")),
    decipher.final(),
  ]).toString("utf8");
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function hashEmail(email: string): string {
  return createHash("sha256").update(normalizeEmail(email)).digest("hex");
}
