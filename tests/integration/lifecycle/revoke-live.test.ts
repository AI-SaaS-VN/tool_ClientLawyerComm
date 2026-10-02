import { beforeEach, describe, expect, it } from "vitest";

import { randomUUID } from "node:crypto";

import {
  GET as listMessages,
  POST as sendMessage,
} from "@/app/api/cases/[id]/messages/route";
import { DELETE as revokeMember } from "@/app/api/cases/[id]/members/[uid]/route";
import { GET as getCase } from "@/app/api/cases/[id]/route";
import { GET as openStream } from "@/app/api/cases/[id]/stream/route";
import {
  GET as listFiles,
  POST as uploadFileRoute,
} from "@/app/api/cases/[id]/files/route";
import {
  GET as listUrgent,
  POST as sendUrgent,
} from "@/app/api/cases/[id]/urgent/route";
import { GET as downloadFile } from "@/app/api/files/[id]/download/route";
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

function memberParams(id: string, uid: string) {
  return { params: Promise.resolve({ id, uid }) };
}

async function seedChat() {
  const { coordinator, kase, cookie } = await seedCaseWithCoordinator("Revoke Live Case");
  const { user: lawyer } = await createVerifiedUser("lawyer", "lawyer-live@example.com");
  await addMember(kase.id, lawyer.id, "lawyer");
  const lawyerCookie = await sessionCookieFor(lawyer.id);
  return { coordinator, kase, cookie, lawyer, lawyerCookie };
}

async function publish(caseId: string, cookie: string, key: string, text: string) {
  const res = await sendMessage(
    postMessage(caseId, cookie, { sourceText: text }, { "idempotency-key": key }),
    params(caseId),
  );
  expect(res.status).toBe(201);
  return (await res.json()).message.id as string;
}

describe("revocation takes effect immediately (REQ-PM-08)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("force-closes the revoked member's live SSE connection", async () => {
    const { kase, cookie, lawyer, lawyerCookie } = await seedChat();

    const res = await openStream(
      sendJson("GET", `/api/cases/${kase.id}/stream`, {}, cookieHeader(lawyerCookie)),
      params(kase.id),
    );
    expect(res.status).toBe(200);
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    await reader.read(); // subscription banner

    const messageId = await publish(kase.id, cookie, "rl-1", "before revoke");
    const event = decoder.decode((await reader.read()).value);
    expect(event).toContain(messageId);

    const revoke = await revokeMember(
      sendJson("DELETE", `/api/cases/${kase.id}/members/${lawyer.id}`, {}, cookieHeader(cookie)),
      memberParams(kase.id, lawyer.id),
    );
    expect(revoke.status).toBe(200);

    // The committed revocation closes the existing stream without a new
    // request from the client.
    const closed = await reader.read();
    expect(closed.done).toBe(true);
  });

  it("denies every case resource family on the very next request", async () => {
    const { kase, cookie, lawyer, lawyerCookie } = await seedChat();
    const messageId = await publish(kase.id, cookie, "rl-2", "visible before revoke");

    // A published file with a shared copy, inserted directly (the T08 upload
    // pipeline is covered elsewhere; only authorization matters here).
    const file = await prisma.file.create({
      data: {
        caseId: kase.id,
        uploaderId: lawyer.id,
        origHash: randomUUID().replaceAll("-", ""),
        storageKey: `quarantine/${kase.id}/x/original`,
        mime: "application/pdf",
        sizeBytes: 10,
        originalName: "fictitious.pdf",
        status: "published",
        publishedAt: new Date(),
        variants: {
          create: [
            { kind: "original", version: 1, storageKey: `quarantine/${kase.id}/x/original` },
            { kind: "shared_copy", version: 1, storageKey: `shared/${kase.id}/x/v1`, sourceVersion: 1 },
          ],
        },
      },
    });

    // A queued peer_urgent task for the soon-to-be-revoked member.
    const urgent = await sendUrgent(
      postJson(
        `/api/cases/${kase.id}/urgent`,
        { recipientUserId: lawyer.id },
        cookieHeader(cookie),
      ),
      params(kase.id),
    );
    expect(urgent.status).toBe(201);

    const revoke = await revokeMember(
      sendJson("DELETE", `/api/cases/${kase.id}/members/${lawyer.id}`, {}, cookieHeader(cookie)),
      memberParams(kase.id, lawyer.id),
    );
    expect(revoke.status).toBe(200);
    const auth = cookieHeader(lawyerCookie);

    const caseRes = await getCase(sendJson("GET", `/api/cases/${kase.id}`, {}, auth), params(kase.id));
    expect(caseRes.status).toBe(403);

    const send = await sendMessage(
      postMessage(kase.id, lawyerCookie, { sourceText: "after revoke" }, { "idempotency-key": "rl-3" }),
      params(kase.id),
    );
    expect(send.status).toBe(403);

    const list = await listMessages(sendJson("GET", `/api/cases/${kase.id}/messages`, {}, auth), params(kase.id));
    expect(list.status).toBe(403);

    const stream = await openStream(sendJson("GET", `/api/cases/${kase.id}/stream`, {}, auth), params(kase.id));
    expect(stream.status).toBe(403);

    const fileList = await listFiles(sendJson("GET", `/api/cases/${kase.id}/files`, {}, auth), params(kase.id));
    expect(fileList.status).toBe(403);

    const upload = await uploadFileRoute(
      uploadFileRequest(kase.id, lawyerCookie, "fictitious.pdf", Buffer.from("%PDF-1.4 fake")),
      params(kase.id),
    );
    expect(upload.status).toBe(403);

    const download = await downloadFile(
      sendJson("GET", `/api/files/${file.id}/download`, {}, auth),
      params(file.id),
    );
    expect(download.status).toBe(403);

    const translate = await translateMessage(
      postJson(`/api/messages/${messageId}/translate`, { targetLang: "vi" }, auth),
      params(messageId),
    );
    expect(translate.status).toBe(403);

    const urgentSend = await sendUrgent(
      postJson(`/api/cases/${kase.id}/urgent`, { recipientUserId: kase.createdBy }, auth),
      params(kase.id),
    );
    expect(urgentSend.status).toBe(403);

    const urgentList = await listUrgent(sendJson("GET", `/api/cases/${kase.id}/urgent`, {}, auth), params(kase.id));
    expect(urgentList.status).toBe(403);

    // Unsent alerts to the revoked member were cancelled in the same
    // transaction (REQ-NTF-05).
    const tasks = await prisma.notificationTask.findMany({
      where: { caseId: kase.id, recipientUserId: lawyer.id, kind: "peer_urgent" },
    });
    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks.every((task) => task.status === "cancelled")).toBe(true);

    // The revocation itself is in the audit trail (REQ-OPS-01).
    const audit = await prisma.auditLog.findFirst({
      where: { action: "member.revoke", caseId: kase.id },
    });
    expect(audit).not.toBeNull();
    expect(audit!.result).toBe("success");
  });
});
