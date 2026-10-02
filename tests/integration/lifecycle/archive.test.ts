import { beforeEach, describe, expect, it } from "vitest";

import { POST as archiveCase } from "@/app/api/cases/[id]/archive/route";
import { POST as createInvite } from "@/app/api/cases/[id]/invites/route";
import {
  GET as listMessages,
  POST as sendMessage,
} from "@/app/api/cases/[id]/messages/route";
import { GET as getCase } from "@/app/api/cases/[id]/route";
import { POST as uploadFileRoute } from "@/app/api/cases/[id]/files/route";
import { POST as sendUrgent } from "@/app/api/cases/[id]/urgent/route";
import { POST as translateMessage } from "@/app/api/messages/[id]/translate/route";
import { prisma } from "@/lib/db";

import {
  addMember,
  cookieHeader,
  createVerifiedUser,
  postJson,
  postMessage,
  resetDatabase,
  seedCaseWithCoordinator,
  sendJson,
  sessionCookieFor,
  uploadFileRequest,
} from "../helpers";

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

async function seedChat() {
  const { coordinator, kase, cookie } = await seedCaseWithCoordinator("Archive Case");
  const { user: lawyer } = await createVerifiedUser("lawyer", "lawyer-arch@example.com");
  await addMember(kase.id, lawyer.id, "lawyer");
  const lawyerCookie = await sessionCookieFor(lawyer.id);
  return { coordinator, kase, cookie, lawyer, lawyerCookie };
}

describe("archived cases are read-only (REQ-CASE-05, REQ-OPS-03)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("forbids new messages, files, reminders, and translation requests after archive", async () => {
    const { kase, cookie, lawyer, lawyerCookie } = await seedChat();

    const sent = await sendMessage(
      postMessage(kase.id, cookie, { sourceText: "before archive" }, { "idempotency-key": "a-1" }),
      params(kase.id),
    );
    expect(sent.status).toBe(201);
    const messageId = (await sent.json()).message.id as string;

    // A queued peer_urgent task that must die with the archive.
    const urgent = await sendUrgent(
      postJson(`/api/cases/${kase.id}/urgent`, { recipientUserId: lawyer.id }, cookieHeader(cookie)),
      params(kase.id),
    );
    expect(urgent.status).toBe(201);

    const archived = await archiveCase(
      postJson(`/api/cases/${kase.id}/archive`, {}, cookieHeader(cookie)),
      params(kase.id),
    );
    expect(archived.status).toBe(200);
    expect((await archived.json()).case.status).toBe("archived");

    // The archive operation is audited (REQ-OPS-03).
    const audit = await prisma.auditLog.findFirst({
      where: { action: "case.archive", caseId: kase.id },
    });
    expect(audit).not.toBeNull();
    expect(audit!.result).toBe("success");

    // Unsent reminders were cancelled in the same transaction.
    const tasks = await prisma.notificationTask.findMany({
      where: { caseId: kase.id, kind: "peer_urgent" },
    });
    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks.every((task) => task.status === "cancelled")).toBe(true);

    for (const [label, cookieValue] of [
      ["coordinator", cookie],
      ["lawyer", lawyerCookie],
    ] as const) {
      const write = await sendMessage(
        postMessage(
          kase.id,
          cookieValue,
          { sourceText: "after archive" },
          { "idempotency-key": `a-${label}` },
        ),
        params(kase.id),
      );
      expect(write.status).toBe(409);
      expect((await write.json()).error).toBe("case_archived");

      const upload = await uploadFileRoute(
        uploadFileRequest(kase.id, cookieValue, "fictitious.pdf", Buffer.from("%PDF-1.4 fake")),
        params(kase.id),
      );
      expect(upload.status).toBe(409);

      const remind = await sendUrgent(
        postJson(
          `/api/cases/${kase.id}/urgent`,
          { recipientUserId: lawyer.id },
          cookieHeader(cookieValue),
        ),
        params(kase.id),
      );
      expect(remind.status).toBe(409);

      const translate = await translateMessage(
        postJson(
          `/api/messages/${messageId}/translate`,
          { targetLang: "vi" },
          cookieHeader(cookieValue),
        ),
        params(messageId),
      );
      expect(translate.status).toBe(409);
    }

    // New invites are writes too; membership cannot begin in an archived case.
    const invite = await createInvite(
      postJson(
        `/api/cases/${kase.id}/invites`,
        { email: "new-member@example.com", role: "client" },
        cookieHeader(cookie),
      ),
      params(kase.id),
    );
    expect(invite.status).toBe(409);

    // Reads stay open for members.
    const detail = await getCase(
      sendJson("GET", `/api/cases/${kase.id}`, {}, cookieHeader(lawyerCookie)),
      params(kase.id),
    );
    expect(detail.status).toBe(200);
    const history = await listMessages(
      sendJson("GET", `/api/cases/${kase.id}/messages`, {}, cookieHeader(lawyerCookie)),
      params(kase.id),
    );
    expect(history.status).toBe(200);
    expect((await history.json()).messages.length).toBe(1);

    // Archiving an already archived case is a 409 (requireWritableCase).
    const again = await archiveCase(
      postJson(`/api/cases/${kase.id}/archive`, {}, cookieHeader(cookie)),
      params(kase.id),
    );
    expect(again.status).toBe(409);
  });

  it("only can_manage coordinators can archive", async () => {
    const { kase, lawyerCookie } = await seedChat();
    const res = await archiveCase(
      postJson(`/api/cases/${kase.id}/archive`, {}, cookieHeader(lawyerCookie)),
      params(kase.id),
    );
    expect(res.status).toBe(403);
  });
});
