// Operator provisioning: create (or find) a case and send per-language
// invitation emails. Plain `node` can run this (Node >= 22.6 type stripping).
//
// Usage: node scripts/provision-case.ts <config.json>
// Config shape:
// {
//   "case": { "title": "...", "alias": "...", "clientOrgName": "..." },
//   "invites": [
//     { "email": "...", "role": "client|lawyer|coordinator",
//       "lang": "zh-Hans|zh-Hant|vi",            // optional; default by role
//       "intro": { "zh-Hans": "...", "zh-Hant": "...", "vi": "..." } } // optional
//   ]
// }
// Env: DATABASE_URL, APP_DATA_KEY, APP_BASE_URL, SMTP_* / EMAIL_FROM.
// Prints one line per invite: email / role / code. Record those rows in the
// git-ignored ops notes; never commit the config file or this output.
//
// Keep the encryption helpers below in sync with src/modules/auth/crypto.ts
// (same convention as scripts/bootstrap-admin.ts).
import "dotenv/config";

import { createCipheriv, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { generateInviteCode, hashInviteCode } from "../src/modules/invites/code.ts";
import {
  buildInviteEmail,
  INVITE_EMAIL_LANGS,
  type InviteEmailLang,
} from "../src/modules/invites/email.ts";
import { SmtpEmailProvider } from "../src/server/providers/email/smtp.ts";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const ROLES = ["client", "lawyer", "coordinator"] as const;

function getDataKey(): Buffer {
  const hex = process.env.APP_DATA_KEY;
  if (hex && /^[0-9a-fA-F]{64}$/.test(hex)) return Buffer.from(hex, "hex");
  throw new Error("APP_DATA_KEY is missing or is not 32 bytes of hex");
}

function encryptText(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getDataKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("hex")}:${tag.toString("hex")}:${ciphertext.toString("hex")}`;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

interface ProvisionConfig {
  case: { title: string; alias?: string; clientOrgName?: string };
  invites: Array<{
    email: string;
    role: (typeof ROLES)[number];
    lang?: InviteEmailLang;
    intro?: Partial<Record<InviteEmailLang, string>>;
  }>;
}

async function main() {
  const configPath = process.argv[2];
  if (!configPath) {
    console.error("usage: node scripts/provision-case.ts <config.json>");
    process.exit(1);
  }
  const config = JSON.parse(readFileSync(configPath, "utf8")) as ProvisionConfig;
  if (!config.case?.title) throw new Error("config.case.title is required");
  if (!Array.isArray(config.invites)) throw new Error("config.invites must be an array");

  const baseUrl = (process.env.APP_BASE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });
  try {
    const admin = await prisma.user.findFirstOrThrow({
      where: { globalRole: "admin", status: "active" },
      select: { id: true },
    });

    let kase = await prisma.case.findFirst({ where: { title: config.case.title } });
    if (!kase) {
      kase = await prisma.case.create({
        data: {
          title: config.case.title,
          alias: config.case.alias ?? null,
          clientOrgName: config.case.clientOrgName ?? "",
          createdBy: admin.id,
        },
      });
      await prisma.auditLog.create({
        data: {
          actorId: admin.id,
          action: "case.create",
          result: "success",
          targetType: "case",
          targetId: kase.id,
          caseId: kase.id,
          metaJson: { origin: "operator_provision" },
        },
      });
      console.log(`case created: ${kase.id} ${kase.title}`);
    } else {
      console.log(`case exists: ${kase.id} ${kase.title}`);
    }

    const emailProvider = new SmtpEmailProvider();
    for (const entry of config.invites) {
      if (!ROLES.includes(entry.role)) throw new Error(`invalid role: ${entry.role}`);
      if (entry.lang !== undefined && !(INVITE_EMAIL_LANGS as readonly string[]).includes(entry.lang)) {
        throw new Error(`invalid lang: ${entry.lang}`);
      }
      const email = normalizeEmail(entry.email ?? "");
      if (!email || !email.includes("@")) throw new Error(`invalid email: ${entry.email}`);

      const pending = await prisma.invite.findFirst({
        where: { caseId: kase.id, role: entry.role, usedAt: null, revokedAt: null },
        select: { id: true },
      });
      if (pending) {
        console.log(`skipped (an unused ${entry.role} invite already exists): ${email}`);
        continue;
      }

      const code = generateInviteCode();
      const invite = await prisma.invite.create({
        data: {
          codeHash: hashInviteCode(code),
          sentToEnc: encryptText(email),
          caseId: kase.id,
          role: entry.role,
          expiresAt: new Date(Date.now() + INVITE_TTL_MS),
          createdBy: admin.id,
        },
      });
      await prisma.auditLog.create({
        data: {
          actorId: admin.id,
          action: "invite.create",
          result: "success",
          targetType: "invite",
          targetId: invite.id,
          caseId: kase.id,
          metaJson: { role: entry.role, origin: "operator_provision" },
        },
      });
      const lang: InviteEmailLang =
        entry.lang ??
        (entry.role === "lawyer" ? "vi" : entry.role === "client" ? "zh-Hant" : "zh-Hans");
      const mail = buildInviteEmail({
        lang,
        code,
        email,
        caseTitle: kase.title,
        baseUrl,
        intro: entry.intro,
      });
      const result = await emailProvider.send({ to: email, ...mail });
      console.log(`invite ${email} / ${entry.role} / ${lang} / code ${code} / accepted=${result.accepted}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

await main();
