// REQ-AUTH-11: administrator accounts are created only by this local
// bootstrap (never via an invitation/activation email). MFA enrolment is
// required before admin APIs work (T11).
//
// Usage: node scripts/bootstrap-admin.ts <email> [displayName]
// Reads DATABASE_URL and APP_DATA_KEY from the environment / .env.
//
// Keep the encryption helpers below in sync with src/modules/auth/crypto.ts
// (this script is intentionally self-contained so plain `node` can run it).
import "dotenv/config";

import { createCipheriv, createHash, randomBytes } from "node:crypto";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Dev-only fallback key — mirrors src/modules/auth/crypto.ts.
const DEV_ONLY_KEY_HEX =
  "636c632d6465762d6f6e6c792d6b65792d444f2d4e4f542d5553452d30303031";

function getDataKey(): Buffer {
  const hex = process.env.APP_DATA_KEY;
  if (hex && /^[0-9a-fA-F]{64}$/.test(hex)) return Buffer.from(hex, "hex");
  if (process.env.NODE_ENV === "production") {
    throw new Error("APP_DATA_KEY is missing or is not 32 bytes of hex");
  }
  return Buffer.from(DEV_ONLY_KEY_HEX, "hex");
}

function encryptText(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getDataKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("hex")}:${tag.toString("hex")}:${ciphertext.toString("hex")}`;
}

function hashEmail(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

async function main() {
  const [email, displayName] = process.argv.slice(2);
  if (!email || !email.includes("@")) {
    console.error("usage: node scripts/bootstrap-admin.ts <email> [displayName]");
    process.exit(1);
  }
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });
  try {
    const normalized = email.trim().toLowerCase();
    const existing = await prisma.contactChannel.findUnique({
      where: { valueHash: hashEmail(normalized) },
    });
    if (existing) {
      console.error("a contact channel already exists for this address");
      process.exit(1);
    }
    const user = await prisma.user.create({
      data: {
        displayName: displayName ?? normalized.split("@")[0]!,
        globalRole: "admin",
        status: "active",
      },
    });
    await prisma.contactChannel.create({
      data: {
        userId: user.id,
        valueEnc: encryptText(normalized),
        valueHash: hashEmail(normalized),
        verifiedAt: new Date(),
        isPrimary: true,
      },
    });
    console.log(`bootstrap: admin user created (id=${user.id})`);
  } finally {
    await prisma.$disconnect();
  }
}

await main();
