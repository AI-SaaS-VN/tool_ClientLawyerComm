import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { requestLoginOtp, requestInviteOtp, verifyLoginOtp } from "@/modules/auth/service";
import { archiveCase, createCase } from "@/modules/cases/service";
import { downloadFile, uploadFile } from "@/modules/files/service";
import {
  acceptInvite,
  createInvite,
  resendInvite,
  revokeInvite,
} from "@/modules/invites/service";
import { revokeMember, updateMemberFlags } from "@/modules/members/service";
import { sendMessage } from "@/modules/messages/service";
import { appealReviewTask, decideReviewTask } from "@/modules/review/service";
import { requestTranslation } from "@/modules/translation/service";
import { confirmUrgentAlert, sendUrgentAlerts } from "@/modules/urgent/service";
import { recordAudit } from "@/server/audit/log";
import { fakeEmailProvider } from "@/server/providers/email/fake";

import {
  addMember,
  createVerifiedUser,
  extractOtp,
  resetDatabase,
} from "../helpers";

const SECRET_BODY = "正文机密-fictitious-body-998877";
const LAWYER_EMAIL = "lawyer-audit@example.com";

function fileForm(name: string): FormData {
  const form = new FormData();
  form.set("file", new File([new Uint8Array(Buffer.from("%PDF-1.4 fictitious"))], name));
  return form;
}

async function latestReviewTaskId(targetId: string): Promise<string> {
  const task = await prisma.reviewTask.findFirstOrThrow({
    where: { targetId },
    orderBy: { createdAt: "desc" },
  });
  return task.id;
}

describe("audit trail coverage (REQ-OPS-01)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("records the full REQ-OPS-01 checklist without sensitive content", async () => {
    const { user: coordinator } = await createVerifiedUser(
      "coordinator",
      "coord-audit@example.com",
    );

    // Case creation.
    const kase = await createCase(coordinator, {
      title: "Audit Case",
      clientOrgName: "Fictitious Org",
    });

    // Invite create / accept (with the OTP login attempts around it).
    const { invite, code } = await createInvite({
      caseId: kase.id,
      actor: coordinator,
      email: LAWYER_EMAIL,
      role: "lawyer",
    });
    await requestInviteOtp(LAWYER_EMAIL, code);
    const otpEmail = fakeEmailProvider.outbox.at(-1)!;
    const otp = extractOtp(otpEmail.text);
    const login = await verifyLoginOtp({ email: LAWYER_EMAIL, code: otp, inviteCode: code });
    const lawyer = login.user;

    // A failed verification attempt.
    await requestLoginOtp(LAWYER_EMAIL, new Date(Date.now() + 61_000));
    await expect(
      verifyLoginOtp({
        email: LAWYER_EMAIL,
        code: otp === "000000" ? "000001" : "000000",
        now: new Date(Date.now() + 61_000),
      }),
    ).rejects.toMatchObject({ status: 401 });

    // Invite resend / revoke on a second invitation.
    const second = await createInvite({
      caseId: kase.id,
      actor: coordinator,
      email: "client-audit@example.com",
      role: "client",
    });
    await resendInvite(second.invite.id, coordinator);
    await revokeInvite(second.invite.id, coordinator);
    void invite;

    // Message send + translation request.
    const { view: message } = await sendMessage(
      kase.id,
      lawyer,
      { sourceText: SECRET_BODY },
      new Headers({ "idempotency-key": "aud-1" }),
    );
    await requestTranslation(message.id, coordinator, { targetLang: "vi" });

    // Urgent alert send + in-app confirmation.
    const { tasks } = await sendUrgentAlerts(kase.id, lawyer, {
      recipientUserId: coordinator.id,
    });
    await confirmUrgentAlert(tasks[0]!.id, coordinator);

    // File upload → review approve (publish) → authorized download.
    const uploaded = await uploadFile(kase.id, lawyer, fileForm("fictitious-a.pdf"));
    expect(uploaded.status).toBe("pending_review");
    await decideReviewTask(await latestReviewTaskId(uploaded.id), coordinator, "approve", {});
    await downloadFile(uploaded.id, coordinator);

    // File upload → reject → appeal by the uploader.
    const rejected = await uploadFile(kase.id, lawyer, fileForm("fictitious-b.pdf"));
    const rejectTaskId = await latestReviewTaskId(rejected.id);
    await decideReviewTask(rejectTaskId, coordinator, "reject", { reason: "fictitious reason" });
    await appealReviewTask(rejectTaskId, lawyer, { note: "fictitious appeal" });

    // Sole-reviewer self-release (REQ-REV-06): the coordinator is the only
    // reviewer, so their own file publishes only via an explicit self-release.
    const own = await uploadFile(kase.id, coordinator, fileForm("fictitious-c.pdf"));
    await decideReviewTask(await latestReviewTaskId(own.id), coordinator, "approve", {
      selfRelease: true,
    });

    // Duty-flag change and member revocation.
    const { user: secondCoordinator } = await createVerifiedUser(
      "coordinator",
      "coord2-audit@example.com",
    );
    await addMember(kase.id, secondCoordinator.id, "coordinator", { canReview: false });
    await updateMemberFlags(kase.id, secondCoordinator.id, coordinator, { canManage: false });
    await revokeMember(kase.id, lawyer.id, coordinator);

    // Archive.
    await archiveCase(kase.id, coordinator);

    const rows = await prisma.auditLog.findMany();
    const actions = new Set(rows.map((row) => row.action));
    const expected = [
      "case.create",
      "case.archive",
      "invite.create",
      "invite.accept",
      "invite.resend",
      "invite.revoke",
      "auth.otp_request",
      "auth.login",
      "message.send",
      "translation.request",
      "urgent.send",
      "urgent.confirm",
      "file.upload",
      "file.download",
      "review.decide",
      "review.appeal",
      "member.flags_update",
      "member.revoke",
    ];
    for (const action of expected) {
      expect(actions, `missing audit action ${action}`).toContain(action);
    }

    // Results distinguish success from denial.
    const loginRows = rows.filter((row) => row.action === "auth.login");
    expect(loginRows.some((row) => row.result === "success")).toBe(true);
    expect(loginRows.some((row) => row.result === "denied")).toBe(true);

    // The self-release is marked on the decision row (REQ-REV-06).
    const selfRelease = rows.find(
      (row) =>
        row.action === "review.decide" &&
        typeof row.metaJson === "object" &&
        row.metaJson !== null &&
        (row.metaJson as { selfRelease?: boolean }).selfRelease === true,
    );
    expect(selfRelease, "missing self_release audit row").toBeDefined();

    // Rows carry operator / target / case / time; auth rows are intentionally
    // case-less, everything else points at this case.
    for (const row of rows) {
      if (row.caseId !== null) expect(row.caseId).toBe(kase.id);
      expect(row.createdAt).toBeInstanceOf(Date);
    }

    // REQ-OPS-01: no message bodies, OTPs, or registered contact channels —
    // anywhere in the trail, meta_json included.
    const wholeTrail = JSON.stringify(rows);
    expect(wholeTrail).not.toContain(SECRET_BODY);
    expect(wholeTrail).not.toContain(otp);
    expect(wholeTrail).not.toContain("@example.com");
  });

  it("refuses to write sensitive meta keys", async () => {
    await expect(
      recordAudit(prisma, {
        action: "test.probe",
        result: "success",
        meta: { otp: "123456" },
      }),
    ).rejects.toThrow(/forbidden/);
    await expect(
      recordAudit(prisma, {
        action: "test.probe",
        result: "success",
        meta: { email: "x@example.com" },
      }),
    ).rejects.toThrow(/forbidden/);
    const clean = await prisma.auditLog.findMany({ where: { action: "test.probe" } });
    expect(clean).toHaveLength(0);
  });

  it("records an OTP request for an unregistered address as ignored, with no address", async () => {
    await requestLoginOtp("nobody-audit@example.com");
    const rows = await prisma.auditLog.findMany({ where: { action: "auth.otp_request" } });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.result).toBe("ignored");
    expect(JSON.stringify(rows[0])).not.toContain("@example.com");
  });

  it("acceptInvite grants membership and audits the acceptance", async () => {
    const { user: coordinator } = await createVerifiedUser(
      "coordinator",
      "coord-accept@example.com",
    );
    const kase = await createCase(coordinator, {
      title: "Accept Case",
      clientOrgName: "Fictitious Org",
    });
    const { code } = await createInvite({
      caseId: kase.id,
      actor: coordinator,
      email: "lawyer-accept@example.com",
      role: "lawyer",
    });
    const { user: lawyer } = await createVerifiedUser("lawyer", "lawyer-accept@example.com");
    await acceptInvite(lawyer, code);
    const row = await prisma.auditLog.findFirstOrThrow({
      where: { action: "invite.accept", caseId: kase.id },
    });
    expect(row.actorId).toBe(lawyer.id);
    expect(JSON.stringify(row)).not.toContain(code); // codes never enter the trail
  });
});
