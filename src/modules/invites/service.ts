import type { Invite, User } from "@prisma/client";

import { ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/db";
import { decryptText, encryptText, hashEmail, normalizeEmail } from "@/modules/auth/crypto";
import { generateInviteCode, hashInviteCode } from "@/modules/invites/code";
import { recordAudit } from "@/server/audit/log";
import {
  requireCaseManager,
  requireWritableCase,
} from "@/server/guards/case-guards";
import { getEmailProvider } from "@/server/providers/email";

import { buildInviteEmail, INVITE_EMAIL_LANGS, type InviteEmailLang } from "./email";

export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const INVITABLE_ROLES = ["client", "lawyer", "coordinator"] as const;
export type InvitableRole = (typeof INVITABLE_ROLES)[number];

const ROLE_DEFAULT_LANG: Record<InvitableRole, InviteEmailLang> = {
  client: "zh-Hant",
  lawyer: "vi",
  coordinator: "zh-Hans",
};

const INVITE_BASE_URL = process.env.APP_BASE_URL ?? "http://localhost:3000";

function assertInviteEmailLang(lang: unknown): asserts lang is InviteEmailLang {
  if (typeof lang !== "string" || !(INVITE_EMAIL_LANGS as readonly string[]).includes(lang)) {
    throw new ApiError(400, "invalid_lang");
  }
}

export type InviteIntro = Partial<Record<InviteEmailLang, string>>;

function assertInvitableRole(role: unknown): asserts role is InvitableRole {
  // REQ-AUTH-11: an invitation can never produce global_role=admin.
  if (typeof role !== "string" || !(INVITABLE_ROLES as readonly string[]).includes(role)) {
    throw new ApiError(400, "invalid_role");
  }
}

async function sendInviteEmail(input: {
  to: string;
  code: string;
  lang: InviteEmailLang;
  caseTitle: string;
  intro?: InviteIntro;
}): Promise<void> {
  try {
    await getEmailProvider().send({
      to: input.to,
      ...buildInviteEmail({
        lang: input.lang,
        code: input.code,
        email: input.to,
        caseTitle: input.caseTitle,
        baseUrl: INVITE_BASE_URL,
        intro: input.intro,
      }),
    });
  } catch {
    console.error("email_send_failed", { category: "invite_activation" });
  }
}

export async function createInvite(input: {
  caseId: string;
  actor: User;
  email: string;
  role: unknown;
  lang?: unknown;
  intro?: InviteIntro;
}): Promise<{ invite: Invite; code: string }> {
  // REQ-PM-05: only this case's can_manage coordinators may invite.
  await requireCaseManager(input.caseId, input.actor);
  await requireWritableCase(input.caseId);
  assertInvitableRole(input.role);
  if (input.lang !== undefined) assertInviteEmailLang(input.lang);
  const email = normalizeEmail(input.email ?? "");
  if (!email || !email.includes("@")) throw new ApiError(400, "email_required");

  return issueInvite({
    caseId: input.caseId,
    actorId: input.actor.id,
    email,
    role: input.role,
    lang: input.lang as InviteEmailLang | undefined,
    intro: input.intro,
  });
}

// Guard-free core shared with the REQ-OPS-07 admin test-case endpoint: one
// invite row, one audit record, one activation email to the entered address.
export async function issueInvite(input: {
  caseId: string;
  actorId: string;
  email: string;
  role: InvitableRole;
  lang?: InviteEmailLang;
  intro?: InviteIntro;
}): Promise<{ invite: Invite; code: string }> {
  const code = generateInviteCode();
  const invite = await prisma.invite.create({
    data: {
      codeHash: hashInviteCode(code),
      sentToEnc: encryptText(input.email),
      caseId: input.caseId,
      role: input.role,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      createdBy: input.actorId,
    },
  });
  await recordAudit(prisma, {
    actorId: input.actorId,
    action: "invite.create",
    result: "success",
    targetType: "invite",
    targetId: invite.id,
    caseId: input.caseId,
    meta: { role: input.role },
  });
  const kase = await prisma.case.findUniqueOrThrow({
    where: { id: input.caseId },
    select: { title: true },
  });
  await sendInviteEmail({
    to: input.email,
    code,
    lang: input.lang ?? ROLE_DEFAULT_LANG[input.role],
    caseTitle: kase.title,
    intro: input.intro,
  });
  return { invite, code };
}

export async function getValidInvite(code: string, now: Date = new Date()): Promise<Invite> {
  const invite = await prisma.invite.findUnique({ where: { codeHash: hashInviteCode(code) } });
  if (!invite) throw new ApiError(400, "invalid_invite");
  if (invite.revokedAt) throw new ApiError(410, "invite_revoked");
  if (invite.usedAt) throw new ApiError(410, "invite_used");
  if (invite.expiresAt.getTime() <= now.getTime()) throw new ApiError(410, "invite_expired");
  return invite;
}

function invitedEmail(invite: Invite): string {
  return normalizeEmail(decryptText(invite.sentToEnc));
}

// REQ-AUTH-01 (v1.11): only the invited email can accept. Checked before the
// single-use claim so a wrong email does not consume the code.
async function assertUserOwnsInvitedEmail(user: User, invite: Invite): Promise<void> {
  const channel = await prisma.contactChannel.findUnique({
    where: { valueHash: hashEmail(invitedEmail(invite)) },
  });
  if (!channel || channel.userId !== user.id) {
    throw new ApiError(403, "email_mismatch");
  }
}

async function findInviteByCode(code: string): Promise<Invite> {
  const invite = await prisma.invite.findUnique({ where: { codeHash: hashInviteCode(code) } });
  if (!invite) throw new ApiError(400, "invalid_invite");
  return invite;
}

// A code that already joined this email to the case is the return login.
// It does not create another membership. Revoked membership cannot sign in.
async function signInWithAcceptedCode(
  invite: Invite,
  email: string,
): Promise<{ user: User; caseId: string; role: InvitableRole; alreadyMember: boolean }> {
  assertInvitableRole(invite.role);
  const channel = await prisma.contactChannel.findUnique({
    where: { valueHash: hashEmail(email) },
    include: { user: true },
  });
  if (!channel || channel.user.globalRole !== invite.role) {
    throw new ApiError(403, "email_mismatch");
  }
  const member = await prisma.caseMember.findUnique({
    where: { caseId_userId: { caseId: invite.caseId, userId: channel.userId } },
  });
  if (!member || member.status !== "active") throw new ApiError(403, "email_mismatch");
  const user = await prisma.user.findUniqueOrThrow({ where: { id: channel.userId } });
  await recordAudit(prisma, {
    actorId: user.id,
    action: "auth.login",
    result: "success",
    targetType: "user",
    targetId: user.id,
    meta: { via: "invite_return" },
  });
  return { user, caseId: invite.caseId, role: invite.role, alreadyMember: true };
}

// Email plus the sent invitation code opens that case. The first use joins.
// The same email and the same code sign in again afterwards. A different
// email does not consume the code.
export async function activateByEmailAndCode(
  email: string,
  code: string,
  now: Date = new Date(),
): Promise<{ user: User; caseId: string; role: InvitableRole; alreadyMember: boolean }> {
  const normalized = normalizeEmail(email);
  if (!normalized || !normalized.includes("@")) throw new ApiError(400, "invalid_email");
  const invite = await findInviteByCode(code);
  if (invitedEmail(invite) !== normalized) throw new ApiError(403, "email_mismatch");
  if (invite.revokedAt) throw new ApiError(410, "invite_revoked");
  if (invite.usedAt) return signInWithAcceptedCode(invite, normalized);
  if (invite.expiresAt.getTime() <= now.getTime()) throw new ApiError(410, "invite_expired");
  assertInvitableRole(invite.role);
  const user = await ensureActiveRecipient(normalized, invite.role, now);
  if (user.globalRole !== invite.role) throw new ApiError(403, "role_mismatch");
  const joined = await acceptInvite(user, code, now);
  const active = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  await recordAudit(prisma, {
    actorId: active.id,
    action: "auth.login",
    result: "success",
    targetType: "user",
    targetId: active.id,
    meta: { via: "invite" },
  });
  return { user: active, ...joined };
}

async function ensureActiveRecipient(
  email: string,
  role: InvitableRole,
  now: Date,
): Promise<User> {
  const valueHash = hashEmail(email);
  const existing = await prisma.contactChannel.findUnique({
    where: { valueHash },
    include: { user: true },
  });
  if (existing) {
    if (existing.user.globalRole !== role) throw new ApiError(403, "role_mismatch");
    await prisma.contactChannel.update({
      where: { id: existing.id },
      data: { verifiedAt: existing.verifiedAt ?? now },
    });
    await prisma.user.updateMany({
      where: { id: existing.userId, status: "pending" },
      data: { status: "active" },
    });
    return prisma.user.findUniqueOrThrow({ where: { id: existing.userId } });
  }
  try {
    return await prisma.user.create({
      data: {
        displayName: email.split("@")[0] ?? "user",
        globalRole: role,
        status: "active",
        channels: {
          create: {
            valueEnc: encryptText(email),
            valueHash,
            isPrimary: true,
            verifiedAt: now,
          },
        },
      },
    });
  } catch (error) {
    const raced = await prisma.contactChannel.findUnique({
      where: { valueHash },
      include: { user: true },
    });
    if (!raced) throw error;
    if (raced.user.globalRole !== role) throw new ApiError(403, "role_mismatch");
    return raced.user;
  }
}

// Grants membership only in the case and role named on the code (REQ-AUTH-07).
export async function acceptInvite(
  user: User,
  code: string,
  now: Date = new Date(),
): Promise<{ caseId: string; role: InvitableRole; alreadyMember: boolean }> {
  const invite = await getValidInvite(code, now);
  await assertUserOwnsInvitedEmail(user, invite);
  if (user.globalRole !== invite.role) {
    throw new ApiError(403, "role_mismatch");
  }
  assertInvitableRole(invite.role);
  // Membership cannot begin in an archived case (REQ-CASE-05).
  await requireWritableCase(invite.caseId);

  // Atomically claim the single-use code: this closes the race where two
  // concurrent accepts both pass getValidInvite. The loser gets the same
  // 410 family of errors as a sequential replay.
  const claimed = await prisma.invite.updateMany({
    where: { id: invite.id, usedAt: null, revokedAt: null, expiresAt: { gt: now } },
    data: { usedAt: now },
  });
  if (claimed.count === 0) {
    const current = await prisma.invite.findUniqueOrThrow({ where: { id: invite.id } });
    if (current.revokedAt) throw new ApiError(410, "invite_revoked");
    if (current.usedAt) throw new ApiError(410, "invite_used");
    throw new ApiError(410, "invite_expired");
  }

  const existing = await prisma.caseMember.findUnique({
    where: { caseId_userId: { caseId: invite.caseId, userId: user.id } },
  });
  if (!existing) {
    const isCoordinator = invite.role === "coordinator";
    await prisma.caseMember.create({
      data: {
        caseId: invite.caseId,
        userId: user.id,
        memberRole: invite.role,
        canManage: isCoordinator,
        canReview: isCoordinator,
      },
    });
  }
  const lang = ROLE_DEFAULT_LANG[invite.role];
  await prisma.user.updateMany({
    where: { id: user.id, preferredLang: null },
    data: { preferredLang: lang, uiLang: lang },
  });
  await recordAudit(prisma, {
    actorId: user.id,
    action: "invite.accept",
    result: "success",
    targetType: "invite",
    targetId: invite.id,
    caseId: invite.caseId,
    meta: { role: invite.role, alreadyMember: Boolean(existing) },
  });
  return { caseId: invite.caseId, role: invite.role, alreadyMember: Boolean(existing) };
}

export async function revokeInvite(inviteId: string, actor: User): Promise<void> {
  const invite = await prisma.invite.findUnique({ where: { id: inviteId } });
  if (!invite) throw new ApiError(404, "not_found");
  await requireCaseManager(invite.caseId, actor);
  if (invite.usedAt) throw new ApiError(410, "invite_used");
  if (!invite.revokedAt) {
    await prisma.invite.update({ where: { id: invite.id }, data: { revokedAt: new Date() } });
  }
  await recordAudit(prisma, {
    actorId: actor.id,
    action: "invite.revoke",
    result: "success",
    targetType: "invite",
    targetId: invite.id,
    caseId: invite.caseId,
  });
}

// Resend issues a fresh code (the old one stops matching immediately) and
// mails it only to the original notification address.
export async function resendInvite(inviteId: string, actor: User): Promise<void> {
  const invite = await prisma.invite.findUnique({ where: { id: inviteId } });
  if (!invite) throw new ApiError(404, "not_found");
  await requireCaseManager(invite.caseId, actor);
  if (invite.usedAt) throw new ApiError(410, "invite_used");
  if (invite.revokedAt) throw new ApiError(410, "invite_revoked");

  const code = generateInviteCode();
  await prisma.invite.update({
    where: { id: invite.id },
    data: {
      codeHash: hashInviteCode(code),
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    },
  });
  await recordAudit(prisma, {
    actorId: actor.id,
    action: "invite.resend",
    result: "success",
    targetType: "invite",
    targetId: invite.id,
    caseId: invite.caseId,
  });
  const kase = await prisma.case.findUniqueOrThrow({
    where: { id: invite.caseId },
    select: { title: true },
  });
  assertInvitableRole(invite.role);
  await sendInviteEmail({
    to: decryptText(invite.sentToEnc),
    code,
    lang: ROLE_DEFAULT_LANG[invite.role],
    caseTitle: kase.title,
  });
}
