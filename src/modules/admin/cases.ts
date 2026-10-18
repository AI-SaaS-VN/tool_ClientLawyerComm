import type { User } from "@prisma/client";

import { ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/db";
import { decryptText, encryptText, hashEmail, normalizeEmail } from "@/modules/auth/crypto";
import { assertValidTitle } from "@/modules/cases/title";
import {
  INVITABLE_ROLES,
  issueInvite,
  type InvitableRole,
} from "@/modules/invites/service";
import { INVITE_EMAIL_LANGS, type InviteEmailLang } from "@/modules/invites/email";
import { revokeMemberRecord } from "@/modules/members/service";
import { recordAudit } from "@/server/audit/log";
import { requireWritableCase } from "@/server/guards/case-guards";

export interface ParticipantEntry {
  role: InvitableRole;
  email: string;
  displayName: string | null;
  lang?: InviteEmailLang;
}

function readEmail(value: unknown): string {
  const email = typeof value === "string" ? normalizeEmail(value) : "";
  if (!email || !email.includes("@")) throw new ApiError(400, "invalid_email");
  return email;
}

function readDisplayName(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || [...value].length > 80 || /[\r\n]/.test(value)) {
    throw new ApiError(400, "invalid_display_name");
  }
  return value;
}

// REQ-ADM-02 follows REQ-CASE-01: the client organization is required here
// (unlike the test-case endpoint, which fills in a fictitious default).
function readClientOrgName(value: unknown): string {
  if (typeof value !== "string" || [...value].length < 1 || [...value].length > 200 || /[\r\n]/.test(value)) {
    throw new ApiError(400, "invalid_client_org");
  }
  return value;
}

function readRole(value: unknown): InvitableRole {
  // REQ-AUTH-11: an invitation can never produce global_role=admin.
  if (typeof value !== "string" || !(INVITABLE_ROLES as readonly string[]).includes(value)) {
    throw new ApiError(400, "invalid_role");
  }
  return value as InvitableRole;
}

function readLang(value: unknown): InviteEmailLang | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string" || !(INVITE_EMAIL_LANGS as readonly string[]).includes(value)) {
    throw new ApiError(400, "invalid_lang");
  }
  return value as InviteEmailLang;
}

// REQ-ADM-02: one or more Chinese Clients, Vietnamese Lawyers, and
// Coordinators — the initial roster needs at least one of each role, and no
// address may appear twice.
function readParticipants(value: unknown): ParticipantEntry[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new ApiError(400, "invalid_participants");
  }
  const entries = value.map((raw): ParticipantEntry => {
    const item = (raw ?? {}) as Record<string, unknown>;
    return {
      role: readRole(item.role),
      email: readEmail(item.email),
      displayName: readDisplayName(item.displayName),
      lang: readLang(item.lang),
    };
  });
  if (new Set(entries.map((entry) => entry.email)).size !== entries.length) {
    throw new ApiError(400, "invalid_email");
  }
  for (const role of INVITABLE_ROLES) {
    if (!entries.some((entry) => entry.role === role)) {
      throw new ApiError(400, "invalid_participants");
    }
  }
  return entries;
}

// REQ-ADM-05: an invite for an email whose existing account has a different
// global role is rejected at creation time, not left to fail at activation.
async function assertNoRoleMismatch(entries: ParticipantEntry[]): Promise<void> {
  for (const entry of entries) {
    const channel = await prisma.contactChannel.findUnique({
      where: { valueHash: hashEmail(entry.email) },
      include: { user: true },
    });
    if (channel && channel.user.globalRole !== entry.role) {
      throw new ApiError(409, "role_mismatch");
    }
  }
}

// A recipient row exists so an optional display name survives until the
// person activates. One-step activation reuses this channel and marks the
// pending user active.
export async function ensurePendingRecipient(entry: ParticipantEntry): Promise<void> {
  const existing = await prisma.contactChannel.findUnique({
    where: { valueHash: hashEmail(entry.email) },
  });
  if (existing) return;
  const user = await prisma.user.create({
    data: {
      displayName: entry.displayName ?? entry.email.split("@")[0] ?? "user",
      globalRole: entry.role,
      status: "pending",
    },
  });
  await prisma.contactChannel.create({
    data: {
      userId: user.id,
      valueEnc: encryptText(entry.email),
      valueHash: hashEmail(entry.email),
      isPrimary: true,
    },
  });
}

export interface AdminRosterEntry {
  userId: string | null;
  displayName: string | null;
  email: string | null;
  role: InvitableRole;
  status: "pending" | "active" | "revoked";
}

export interface AdminCaseView {
  id: string;
  title: string;
  clientOrgName: string;
  status: string;
  createdAt: Date;
  members: AdminRosterEntry[];
}

// REQ-ADM-01: metadata and the member roster only — message and file content
// is never read here (REQ-PM-06). Pending roster rows come from unused,
// unrevoked invites; the entered notification address is visible only on this
// console (REQ-ADM-04).
export async function listCasesView(): Promise<{ cases: AdminCaseView[] }> {
  const cases = await prisma.case.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      members: { include: { user: true }, orderBy: { createdAt: "asc" } },
      invites: { where: { usedAt: null, revokedAt: null }, orderBy: { createdAt: "asc" } },
    },
  });

  const pendingEmails = cases.flatMap((kase) =>
    kase.invites.map((invite) => hashEmail(normalizeEmail(decryptText(invite.sentToEnc)))),
  );
  const pendingChannels = pendingEmails.length
    ? await prisma.contactChannel.findMany({
        where: { valueHash: { in: pendingEmails } },
        include: { user: true },
      })
    : [];
  const pendingNameByHash = new Map(
    pendingChannels.map((channel) => [channel.valueHash, channel.user.displayName]),
  );

  return {
    cases: cases.map((kase) => ({
      id: kase.id,
      title: kase.title,
      clientOrgName: kase.clientOrgName,
      status: kase.status,
      createdAt: kase.createdAt,
      members: [
        ...kase.members.map((member): AdminRosterEntry => {
          return {
            userId: member.userId,
            displayName: member.user.displayName,
            email: null,
            role: member.memberRole as InvitableRole,
            status: member.status === "revoked" ? "revoked" : "active",
          };
        }),
        ...kase.invites.map((invite): AdminRosterEntry => {
          const email = normalizeEmail(decryptText(invite.sentToEnc));
          return {
            userId: null,
            displayName: pendingNameByHash.get(hashEmail(email)) ?? null,
            email,
            role: invite.role as InvitableRole,
            status: "pending",
          };
        }),
      ],
    })),
  };
}

export async function listCases(admin: User): Promise<{ cases: AdminCaseView[] }> {
  const view = await listCasesView();
  await recordAudit(prisma, {
    actorId: admin.id,
    action: "admin.cases_list",
    result: "success",
  });
  return view;
}

// REQ-ADM-02/03/04: the console creates a Case and mails exactly one
// activation email per entered address through the standard invitation flow.
// The administrator is recorded as the operator in audit but never becomes a
// case member.
export async function createCaseWithParticipants(
  admin: User,
  body: Record<string, unknown>,
): Promise<{ caseId: string; title: string; invites: Array<{ id: string; role: InvitableRole; email: string }> }> {
  assertValidTitle(body.title);
  const clientOrgName = readClientOrgName(body.clientOrgName);
  const entries = readParticipants(body.participants);
  await assertNoRoleMismatch(entries);

  const kase = await prisma.case.create({
    data: {
      title: body.title,
      clientOrgName,
      createdBy: admin.id,
    },
  });
  await recordAudit(prisma, {
    actorId: admin.id,
    action: "case.create",
    result: "success",
    targetType: "case",
    targetId: kase.id,
    caseId: kase.id,
    meta: { origin: "admin_console" },
  });

  const invites: Array<{ id: string; role: InvitableRole; email: string }> = [];
  for (const entry of entries) {
    await ensurePendingRecipient(entry);
    const { invite } = await issueInvite({
      caseId: kase.id,
      actorId: admin.id,
      email: entry.email,
      role: entry.role,
      lang: entry.lang,
    });
    invites.push({ id: invite.id, role: entry.role, email: entry.email });
  }
  return { caseId: kase.id, title: kase.title, invites };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Case ids are Postgres UUIDs; a malformed id would make Prisma throw a
// validation error. The console answers 404 for anything that cannot be a
// case, same as an unknown one.
async function requireExistingWritableCase(caseId: string) {
  if (!UUID_RE.test(caseId)) throw new ApiError(404, "not_found");
  return requireWritableCase(caseId);
}

// REQ-ADM-03: adding a participant to an existing Case reuses the standard
// invitation flow, with the same creation-time role-mismatch rejection.
export async function addParticipant(
  admin: User,
  caseId: string,
  body: Record<string, unknown>,
): Promise<{ inviteId: string }> {
  await requireExistingWritableCase(caseId);
  const entry: ParticipantEntry = {
    role: readRole(body.role),
    email: readEmail(body.email),
    displayName: readDisplayName(body.displayName),
    lang: readLang(body.lang),
  };
  await assertNoRoleMismatch([entry]);
  await ensurePendingRecipient(entry);
  const { invite } = await issueInvite({
    caseId,
    actorId: admin.id,
    email: entry.email,
    role: entry.role,
    lang: entry.lang,
  });
  return { inviteId: invite.id };
}

// REQ-ADM-03: revoking a member from the console follows the coordinator
// revoke semantics (REQ-PM-08 immediate effect) with the admin as actor.
export async function revokeMemberAsAdmin(
  admin: User,
  caseId: string,
  targetUserId: string,
): Promise<void> {
  await requireExistingWritableCase(caseId);
  await revokeMemberRecord(caseId, targetUserId, admin.id);
}
