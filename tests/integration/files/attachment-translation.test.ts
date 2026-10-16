import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { GET as listFiles, POST as uploadFile } from "@/app/api/cases/[id]/files/route";
import { POST as approveTask } from "@/app/api/review/tasks/[id]/approve/route";
import { prisma } from "@/lib/db";
import { getAttachmentPageView } from "@/modules/files/attachment-translation";
import { resetTranslationPacingForTests, runNotificationWorkerOnce } from "@/server/jobs/worker";
import { fakeLlmTranslationProvider, fakeLlmVisionProvider } from "@/server/providers/llm/fake";
import { stubFileScanner } from "@/server/providers/scanner/stub";

import {
  addMember,
  cookieHeader,
  createVerifiedUser,
  getRequest,
  resetDatabase,
  seedCaseWithCoordinator,
  sendJson,
  sessionCookieFor,
  uploadFileRequest,
} from "../helpers";
import { docxWithText, jpgSample, pdfSample } from "../../fixtures/files/samples";

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

const ZH_TEXT = "甲方与乙方于见面时在合同末页签字。交货地为胡志明市。";
const VI_TEXT = "Bên A và bên B ký vào trang cuối hợp đồng khi gặp mặt.";

async function seedMembers() {
  const { kase, coordinator, cookie: coordinatorCookie } =
    await seedCaseWithCoordinator("Attachment Translation Case");
  const { user: client } = await createVerifiedUser("client", "client-att@example.com");
  await addMember(kase.id, client.id, "client");
  const { user: lawyer } = await createVerifiedUser("lawyer", "lawyer-att@example.com");
  await addMember(kase.id, lawyer.id, "lawyer");
  const clientCookie = await sessionCookieFor(client.id);
  const lawyerCookie = await sessionCookieFor(lawyer.id);
  return { kase, coordinator, coordinatorCookie, client, clientCookie, lawyer, lawyerCookie };
}

async function uploadPublished(
  caseId: string,
  cookie: string,
  name: string,
  bytes: Buffer,
): Promise<string> {
  const res = await uploadFile(uploadFileRequest(caseId, cookie, name, bytes), params(caseId));
  expect(res.status).toBe(201);
  const { file } = (await res.json()) as { file: { id: string; status: string } };
  expect(file.status).toBe("published");
  return file.id;
}

// Extraction and translation are separate paced steps, so a complete page
// takes two worker passes (three for an image that also needs reading).
async function driveWorker(passes = 2) {
  for (let i = 0; i < passes; i += 1) {
    await runNotificationWorkerOnce({ translationMinIntervalMs: 0 });
  }
}

async function attachmentStateOf(caseId: string, cookie: string, fileId: string) {
  const res = await listFiles(getRequest(`/api/cases/${caseId}/files`, cookieHeader(cookie)), params(caseId));
  expect(res.status).toBe(200);
  const { files } = (await res.json()) as {
    files: Array<{ id: string; attachmentState?: string }>;
  };
  return files.find((f) => f.id === fileId)?.attachmentState;
}

describe("attachment translation page (REQ-ATT-01~04)", () => {
  beforeEach(async () => {
    await resetDatabase();
    stubFileScanner.reset();
    fakeLlmTranslationProvider.reset();
    fakeLlmVisionProvider.reset();
    resetTranslationPacingForTests();
  });
  afterEach(() => {
    stubFileScanner.reset();
    fakeLlmTranslationProvider.reset();
    fakeLlmVisionProvider.reset();
  });

  it("a published DOCX with Chinese text gets a page: source text, then Vietnamese (REQ-ATT-02)", async () => {
    const { kase, clientCookie, client } = await seedMembers();
    const fileId = await uploadPublished(kase.id, clientCookie, "contract.docx", docxWithText(ZH_TEXT));

    // Publishing queued the page row.
    let page = await prisma.attachmentPage.findUnique({ where: { fileId } });
    expect(page?.status).toBe("pending");

    await driveWorker();

    page = await prisma.attachmentPage.findUnique({ where: { fileId } });
    expect(page?.status).toBe("ready");
    expect(page?.sourceLang).toBe("zh-Hans");
    expect(page?.targetLang).toBe("vi");
    expect(page?.sourceText).toBe(ZH_TEXT);
    expect(page?.translatedText).toBe(`[vi] ${ZH_TEXT}`);

    const view = await getAttachmentPageView(fileId, client);
    expect(view.sourceText).toBe(ZH_TEXT);
    expect(view.translatedText).toBe(`[vi] ${ZH_TEXT}`);

    expect(await attachmentStateOf(kase.id, clientCookie, fileId)).toBe("ready");
  });

  it("a published DOCX with Vietnamese text gets Traditional Chinese after the source", async () => {
    const { kase, lawyerCookie, lawyer } = await seedMembers();
    const fileId = await uploadPublished(kase.id, lawyerCookie, "don-kien.docx", docxWithText(VI_TEXT));

    await driveWorker();

    const page = await prisma.attachmentPage.findUnique({ where: { fileId } });
    expect(page?.status).toBe("ready");
    expect(page?.targetLang).toBe("zh-Hant");
    expect(page?.translatedText).toBe(`[zh-Hant] ${VI_TEXT}`);

    const view = await getAttachmentPageView(fileId, lawyer);
    expect(view.targetLang).toBe("zh-Hant");
  });

  it("a JPG photo is read by the vision provider, then translated (REQ-ATT-04)", async () => {
    const { kase, clientCookie } = await seedMembers();
    fakeLlmVisionProvider.setFixedResponse(VI_TEXT);
    const fileId = await uploadPublished(kase.id, clientCookie, "scan.jpg", jpgSample());

    await driveWorker(3);

    const page = await prisma.attachmentPage.findUnique({ where: { fileId } });
    expect(page?.status).toBe("ready");
    expect(page?.sourceText).toBe(VI_TEXT);
    expect(page?.targetLang).toBe("zh-Hant");

    // The provider received exactly the image bytes and the mime — nothing else.
    expect(fakeLlmVisionProvider.calls).toHaveLength(1);
    const call = fakeLlmVisionProvider.calls[0]!;
    expect(call.mime).toBe("image/jpeg");
    expect(Buffer.from(call.dataBase64, "base64").equals(jpgSample())).toBe(true);
  });

  it("a file whose text is neither Chinese nor Vietnamese gets no page, and the row says so (REQ-ATT-04)", async () => {
    const { kase, client, clientCookie } = await seedMembers();
    const fileId = await uploadPublished(
      kase.id,
      clientCookie,
      "letter.docx",
      docxWithText("The parties signed the contract on page one."),
    );

    await driveWorker();

    const page = await prisma.attachmentPage.findUnique({ where: { fileId } });
    expect(page?.status).toBe("no_text");
    expect(page?.translatedText).toBeNull();
    expect(await attachmentStateOf(kase.id, clientCookie, fileId)).toBe("unavailable");
    await expect(getAttachmentPageView(fileId, client)).rejects.toMatchObject({
      status: 404,
    });
  });

  it("an unparseable PDF is deterministic: no page, no retries, and the row says so (REQ-ATT-04)", async () => {
    const { kase, clientCookie } = await seedMembers();
    // pdfSample() is a magic-byte stub that pdf.js cannot parse.
    const fileId = await uploadPublished(kase.id, clientCookie, "broken.pdf", pdfSample());

    await runNotificationWorkerOnce({ translationMinIntervalMs: 0 });
    const page = await prisma.attachmentPage.findUniqueOrThrow({ where: { fileId } });
    expect(page.status).toBe("no_text");
    expect(page.attempts).toBe(0);
    expect(await attachmentStateOf(kase.id, clientCookie, fileId)).toBe("unavailable");
  });

  it("rate limiting is congestion, not a row failure: retried without spending attempts", async () => {
    const { kase, clientCookie } = await seedMembers();
    fakeLlmVisionProvider.failNext("rate_limited");
    const fileId = await uploadPublished(kase.id, clientCookie, "scan.jpg", jpgSample());

    await runNotificationWorkerOnce({ translationMinIntervalMs: 0 });
    const page = await prisma.attachmentPage.findUniqueOrThrow({ where: { fileId } });
    expect(page.status).toBe("pending");
    expect(page.attempts).toBe(0);
    expect(page.nextRetryAt).not.toBeNull();

    // The next attempt succeeds; the page completes.
    fakeLlmVisionProvider.setFixedResponse(VI_TEXT);
    await prisma.attachmentPage.update({
      where: { fileId },
      data: { nextRetryAt: new Date(Date.now() - 1000) },
    });
    await driveWorker(2);
    const done = await prisma.attachmentPage.findUniqueOrThrow({ where: { fileId } });
    expect(done.status).toBe("ready");
  });

  it("a vision failure retries with backoff, then stays failed after the attempt budget", async () => {
    const { kase, clientCookie } = await seedMembers();
    fakeLlmVisionProvider.failNext("server");
    const fileId = await uploadPublished(kase.id, clientCookie, "scan.jpg", jpgSample());

    await runNotificationWorkerOnce({ translationMinIntervalMs: 0 });
    let page = await prisma.attachmentPage.findUniqueOrThrow({ where: { fileId } });
    expect(page.status).toBe("pending");
    expect(page.attempts).toBe(1);
    expect(page.nextRetryAt).not.toBeNull();

    // Simulate the budget being spent: last allowed attempt fails too.
    await prisma.attachmentPage.update({
      where: { fileId },
      data: { attempts: 2, nextRetryAt: new Date(Date.now() - 1000) },
    });
    fakeLlmVisionProvider.failNext("server");
    await runNotificationWorkerOnce({ translationMinIntervalMs: 0 });
    page = await prisma.attachmentPage.findUniqueOrThrow({ where: { fileId } });
    expect(page.status).toBe("failed");
    expect(await attachmentStateOf(kase.id, clientCookie, fileId)).toBe("unavailable");
  });

  it("authorization mirrors the download: members only, published only (REQ-ATT-03)", async () => {
    const { kase, clientCookie, lawyer } = await seedMembers();
    const fileId = await uploadPublished(kase.id, clientCookie, "contract.docx", docxWithText(ZH_TEXT));
    await driveWorker();

    // Another member can open the page.
    const view = await getAttachmentPageView(fileId, lawyer);
    expect(view.fileId).toBe(fileId);

    // A non-member gets nothing.
    const { user: outsider } = await createVerifiedUser("lawyer", "outsider-att@example.com");
    await expect(getAttachmentPageView(fileId, outsider)).rejects.toMatchObject({ status: 403 });

    // Permission revocation denies the very next open (AC02/AC06).
    await prisma.caseMember.update({
      where: { caseId_userId: { caseId: kase.id, userId: lawyer.id } },
      data: { status: "revoked", revokedAt: new Date() },
    });
    await expect(getAttachmentPageView(fileId, lawyer)).rejects.toMatchObject({ status: 403 });
  });

  it("an unpublished file has no page — not even for the uploader (REQ-ATT-03)", async () => {
    const { kase, client, clientCookie, coordinatorCookie, lawyer } = await seedMembers();
    // A file name that explicitly asks the firm's retainer fee is held.
    const res = await uploadFile(
      uploadFileRequest(kase.id, clientCookie, "你们律所收费多少.pdf", pdfSample()),
      params(kase.id),
    );
    const { file } = (await res.json()) as { file: { id: string; status: string } };
    expect(file.status).toBe("pending_review");

    expect(await prisma.attachmentPage.findUnique({ where: { fileId: file.id } })).toBeNull();
    await expect(getAttachmentPageView(file.id, client)).rejects.toMatchObject({ status: 404 });
    await expect(getAttachmentPageView(file.id, lawyer)).rejects.toMatchObject({ status: 404 });

    // Approving the held file publishes it and queues the page row (the
    // second publish path, via the review console).
    const task = await prisma.reviewTask.findFirstOrThrow({
      where: { caseId: kase.id, targetType: "file", targetId: file.id, status: "open" },
    });
    const approveRes = await approveTask(
      sendJson("POST", `/api/review/tasks/${task.id}/approve`, {}, cookieHeader(coordinatorCookie)),
      params(task.id),
    );
    expect(approveRes.status).toBe(200);
    const page = await prisma.attachmentPage.findUnique({ where: { fileId: file.id } });
    expect(page?.status).toBe("pending");
  });
});
