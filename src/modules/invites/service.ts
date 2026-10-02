import type { Invite, User } from "@prisma/client";

import { ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/db";
import { decryptText, encryptText, normalizeEmail } from "@/modules/auth/crypto";
import { generateInviteCode, hashInviteCode } from "@/modules/invites/code";
import {
  requireCaseManager,
  requireWritableCase,
} from "@/server/guards/case-guards";
import { getEmailProvider } from "@/server/providers/email";

export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const INVITABLE_ROLES = ["client", "lawyer", "coordinator"] as const;
export type InvitableRole = (typeof INVITABLE_ROLES)[number];

const ROLE_DEFAULT_LANG: Record<InvitableRole, string> = {
  client: "zh-Hans",
  lawyer: "vi",
  coordinator: "zh-Hans",
};

function assertInvitableRole(role: unknown): asserts role is InvitableRole {
  // REQ-AUTH-11: an invitation can never produce global_role=admin.
  if (typeof role !== "string" || !(INVITABLE_ROLES as readonly string[]).includes(role)) {
    throw new ApiError(400, "invalid_role");
  }
}

async function sendInviteEmail(to: string, code: string): Promise<void> {
  try {
    await getEmailProvider().send({
      to,
      subject: "案件邀请 / Thư mời vụ án",
      text: [
        `您的案件邀请码 / Mã mời vụ án của bạn: ${code}`,
        "",
        "【中文】您已被邀请加入一个案件。邀请码 7 天内有效，仅限使用一次。请登录平台，输入邀请码并验证您的邮箱后即可加入案件。",
        "",
        `[Tiếng Việt] Bạn đã được mời tham gia một vụ án. Mã mời có hiệu lực trong 7 ngày và chỉ sử dụng được một lần. Vui lòng đăng nhập nền tảng, nhập mã mời và xác minh email của bạn để tham gia vụ án.`,
      ].join("\n"),
    });
  } catch {
    // TODO(T11): audit
    console.error("email_send_failed", { category: "invite_activation" });
  }
}

export async function createInvite(input: {
  caseId: string;
  actor: User;
  email: string;
  role: unknown;
}): Promise<{ invite: Invite; code: string }> {
  // REQ-PM-05: only this case's can_manage coordinators may invite.
  await requireCaseManager(input.caseId, input.actor);
  await requireWritableCase(input.caseId);
  assertInvitableRole(input.role);
  const email = normalizeEmail(input.email ?? "");
  if (!email || !email.includes("@")) throw new ApiError(400, "email_required");

  const code = generateInviteCode();
  const invite = await prisma.invite.create({
    data: {
      codeHash: hashInviteCode(code),
      sentToEnc: encryptText(email),
      caseId: input.caseId,
      role: input.role,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      createdBy: input.actor.id,
    },
  });
  // TODO(T11): audit
  await sendInviteEmail(email, code);
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

// Grants membership only in the case and role named on the code (REQ-AUTH-07).
export async function acceptInvite(
  user: User,
  code: string,
  now: Date = new Date(),
): Promise<{ caseId: string; role: InvitableRole; alreadyMember: boolean }> {
  const invite = await getValidInvite(code, now);
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
  // TODO(T11): audit
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
  // TODO(T11): audit
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
  // TODO(T11): audit
  await sendInviteEmail(decryptText(invite.sentToEnc), code);
}
