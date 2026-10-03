import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { GET as downloadFile } from "@/app/api/files/[id]/download/route";
import { GET as listFiles, POST as uploadFile } from "@/app/api/cases/[id]/files/route";
import { POST as rejectFile } from "@/app/api/files/[id]/reject/route";
import { POST as retryScan } from "@/app/api/files/[id]/scan-retry/route";
import { fakeEmailProvider } from "@/server/providers/email/fake";
import { runNotificationWorkerOnce } from "@/server/jobs/worker";
import { prisma } from "@/lib/db";
import { stubFileScanner } from "@/server/providers/scanner/stub";

import {
  addMember,
  cookieHeader,
  createVerifiedUser,
  getRequest,
  postJson,
  resetDatabase,
  seedCaseWithCoordinator,
  sessionCookieFor,
  uploadFileRequest,
} from "../helpers";
import { pdfSample } from "../../fixtures/files/samples";

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

async function seedMembers() {
  const { kase, coordinator, cookie: coordinatorCookie } =
    await seedCaseWithCoordinator("Scan Failure Case");
  const { user: client } = await createVerifiedUser("client", "client-scan@example.com");
  await addMember(kase.id, client.id, "client");
  const { user: lawyer } = await createVerifiedUser("lawyer", "lawyer-scan@example.com");
  await addMember(kase.id, lawyer.id, "lawyer");
  const clientCookie = await sessionCookieFor(client.id);
  const lawyerCookie = await sessionCookieFor(lawyer.id);
  return { kase, coordinator, coordinatorCookie, client, clientCookie, lawyer, lawyerCookie };
}

async function uploadPdf(caseId: string, cookie: string, name = "filing.pdf") {
  const res = await uploadFile(uploadFileRequest(caseId, cookie, name, pdfSample()), params(caseId));
  expect(res.status).toBe(201);
  return ((await res.json()) as { file: { id: string; status: string } }).file;
}

describe("scan failure paths (REQ-FILE-03/08)", () => {
  beforeEach(async () => {
    await resetDatabase();
    stubFileScanner.reset();
  });
  afterEach(() => stubFileScanner.reset());

  it.each(["timeout", "encrypted", "unparseable", "malicious"] as const)(
    "scan %s stops at check_failed with a same-transaction content-free alert, never published",
    async (failure) => {
      const { kase, coordinator, clientCookie } = await seedMembers();
      stubFileScanner.inject({ outcome: failure, reason: `simulated ${failure}` });
      const file = await uploadPdf(kase.id, clientCookie, `evidence-${failure}.pdf`);

      expect(file.status).toBe("check_failed");
      const row = await prisma.file.findUniqueOrThrow({ where: { id: file.id } });
      expect(row.status).toBe("check_failed");
      expect(row.publishedAt).toBeNull();
      expect(await prisma.reviewTask.count({ where: { targetId: file.id } })).toBe(0);

      const alert = await prisma.notificationTask.findFirst({
        where: { kind: "check_failed_alert", recipientUserId: coordinator.id, status: "queued" },
      });
      expect(alert).not.toBeNull();

      // The alert body is content-free: no file name, no file content, no "@".
      await runNotificationWorkerOnce();
      const sent = fakeEmailProvider.outbox.find((m) =>
        m.text.includes(alert!.id.slice(0, 8)) || m.subject.includes("安全检查"),
      );
      expect(sent).toBeDefined();
      expect(sent!.text).not.toContain(`evidence-${failure}`);
      expect(sent!.text).not.toContain("@");
    },
  );

  it("check_failed is visible only to the uploader and can_review coordinators (REQ-FILE-08)", async () => {
    const { kase, coordinatorCookie, clientCookie, lawyerCookie } = await seedMembers();
    stubFileScanner.inject({ outcome: "timeout", reason: "simulated" });
    const file = await uploadPdf(kase.id, clientCookie);

    const lawyerList = await listFiles(
      getRequest(`/api/cases/${kase.id}/files`, cookieHeader(lawyerCookie)),
      params(kase.id),
    );
    expect((await lawyerList.json()).files).toHaveLength(0);

    const coordinatorList = await listFiles(
      getRequest(`/api/cases/${kase.id}/files`, cookieHeader(coordinatorCookie)),
      params(kase.id),
    );
    const coordinatorFiles = (await coordinatorList.json()).files as Array<{
      id: string;
      status: string;
    }>;
    expect(coordinatorFiles.find((f) => f.id === file.id)?.status).toBe("check_failed");

    const clientList = await listFiles(
      getRequest(`/api/cases/${kase.id}/files`, cookieHeader(clientCookie)),
      params(kase.id),
    );
    const clientFiles = (await clientList.json()).files as Array<{ id: string }>;
    expect(clientFiles.map((f) => f.id)).toContain(file.id);

    // The receiver cannot pull any part of the failed file.
    const lawyerDownload = await downloadFile(
      getRequest(`/api/files/${file.id}/download`, cookieHeader(lawyerCookie)),
      params(file.id),
    );
    expect(lawyerDownload.status).toBe(404);
  });

  it("scan-retry by a can_review coordinator re-runs the scan and publishes a clean file", async () => {
    const { kase, coordinatorCookie, clientCookie } = await seedMembers();
    stubFileScanner.inject({ outcome: "timeout", reason: "simulated" });
    const file = await uploadPdf(kase.id, clientCookie);
    expect(file.status).toBe("check_failed");

    const retry = await retryScan(
      postJson(`/api/files/${file.id}/scan-retry`, {}, cookieHeader(coordinatorCookie)),
      params(file.id),
    );
    expect(retry.status).toBe(200);
    const retried = ((await retry.json()) as { file: { status: string } }).file;
    expect(retried.status).toBe("published");
    const task = await prisma.reviewTask.findFirst({
      where: { targetType: "file", targetId: file.id, status: "open" },
    });
    expect(task).toBeNull();
  });

  it("scan-retry is forbidden for non-reviewers and conflicts outside check_failed", async () => {
    const { kase, coordinatorCookie, clientCookie, lawyerCookie } = await seedMembers();
    stubFileScanner.inject({ outcome: "timeout", reason: "simulated" });
    const file = await uploadPdf(kase.id, clientCookie);

    const byLawyer = await retryScan(
      postJson(`/api/files/${file.id}/scan-retry`, {}, cookieHeader(lawyerCookie)),
      params(file.id),
    );
    expect(byLawyer.status).toBe(403);

    const clean = await uploadPdf(kase.id, clientCookie, "clean.pdf");
    expect(clean.status).toBe("published");
    const conflict = await retryScan(
      postJson(`/api/files/${clean.id}/scan-retry`, {}, cookieHeader(coordinatorCookie)),
      params(clean.id),
    );
    expect(conflict.status).toBe(409);
  });

  it("a coordinator can reject a check_failed file; it stays invisible to the receiver", async () => {
    const { kase, coordinatorCookie, clientCookie, lawyerCookie } = await seedMembers();
    stubFileScanner.inject({ outcome: "malicious", reason: "simulated" });
    const file = await uploadPdf(kase.id, clientCookie);

    const res = await rejectFile(
      postJson(`/api/files/${file.id}/reject`, { reason: "unsafe" }, cookieHeader(coordinatorCookie)),
      params(file.id),
    );
    expect(res.status).toBe(200);
    const row = await prisma.file.findUniqueOrThrow({ where: { id: file.id } });
    expect(row.status).toBe("rejected");
    expect(row.publishedAt).toBeNull();

    const lawyerList = await listFiles(
      getRequest(`/api/cases/${kase.id}/files`, cookieHeader(lawyerCookie)),
      params(kase.id),
    );
    expect((await lawyerList.json()).files).toHaveLength(0);
  });
});
