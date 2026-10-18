import JSZip from "jszip";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { GET as listFiles, POST as uploadFile } from "@/app/api/cases/[id]/files/route";
import { GET as getBilingual, POST as requestBilingual } from "@/app/api/files/[id]/bilingual/route";
import { POST as approveTask } from "@/app/api/review/tasks/[id]/approve/route";
import { GET as downloadFile } from "@/app/api/files/[id]/download/route";
import { prisma } from "@/lib/db";
import { parseDocxParagraphs, readDocxParts } from "@/modules/bilingual/docx";
import { resetTranslationPacingForTests, runNotificationWorkerOnce } from "@/server/jobs/worker";
import { fakeLlmTranslationProvider } from "@/server/providers/llm/fake";

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

const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

async function docxWithParagraphs(paragraphs: string[], extraBody = ""): Promise<Buffer> {
  const body =
    paragraphs
      .map((t) => `<w:p><w:r><w:t>${t.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</w:t></w:r></w:p>`)
      .join("") + extraBody;
  const zip = new JSZip();
  zip.file(
    "word/document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<w:document xmlns:w="${W}"><w:body>${body}</w:body></w:document>`,
  );
  return zip.generateAsync({ type: "nodebuffer" });
}

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

async function seedMembers() {
  const { kase, coordinator, cookie: coordinatorCookie } =
    await seedCaseWithCoordinator("Bilingual Case");
  const { user: client } = await createVerifiedUser("client", "client-bi@example.com");
  await addMember(kase.id, client.id, "client");
  const { user: lawyer } = await createVerifiedUser("lawyer", "lawyer-bi@example.com");
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

describe("bilingual DOCX conversion (REQ-DOC-01~06)", () => {
  beforeEach(async () => {
    await resetDatabase();
    resetTranslationPacingForTests();
    // The fake echoes the numbered batch with a VI: marker so the
    // translation is distinguishable from the source in the output.
    fakeLlmTranslationProvider.setFixedResponse((input) =>
      input.text
        .split("\n")
        .map((line) => line.replace(/^(\[\d+\]\s*)/, "$1VI:"))
        .join("\n"),
    );
  });
  afterEach(() => fakeLlmTranslationProvider.reset());

  it("full flow: request → worker → parallel docx → review → publish (REQ-DOC-01/03/04/05)", async () => {
    const { kase, coordinator, coordinatorCookie, lawyerCookie } = await seedMembers();
    const fileId = await uploadPublished(
      kase.id,
      lawyerCookie,
      "合同.docx",
      await docxWithParagraphs(["第一段：合同成立。", "第二段：付款方式。", "第三段：争议解决。"]),
    );

    const res = await requestBilingual(
      postJson(`/api/files/${fileId}/bilingual`, {}, cookieHeader(lawyerCookie)),
      params(fileId),
    );
    expect(res.status).toBe(201);
    const { job } = (await res.json()) as { job: { status: string } };
    expect(job.status).toBe("queued");

    await runNotificationWorkerOnce({ translationMinIntervalMs: 0 });

    const stored = await prisma.docxJob.findFirstOrThrow({ where: { fileId } });
    expect(stored.status).toBe("done");
    expect(stored.sourceLang).toBe("zh-Hans");
    expect(stored.targetLang).toBe("vi");
    expect(stored.paragraphCount).toBe(3);
    expect(stored.outputFileId).not.toBeNull();

    // REQ-DOC-05: the output is a new file awaiting publish review, invisible
    // to other members until approved.
    const output = await prisma.file.findUniqueOrThrow({
      where: { id: stored.outputFileId! },
    });
    expect(output.status).toBe("pending_review");
    expect(output.originalName).toBe("合同-中越对照.docx");
    const task = await prisma.reviewTask.findFirstOrThrow({
      where: { targetType: "file", targetId: output.id, status: "open" },
    });
    expect(task.reason).toBe("bilingual_output");

    // REQ-DOC-03/04: paragraph pairs = source paragraphs; machine marking.
    const download = await downloadFile(
      getRequest(`/api/files/${output.id}/download`, cookieHeader(lawyerCookie)),
      params(output.id),
    );
    expect(download.status).toBe(200);
    const buf = Buffer.from(await (await download.blob()).arrayBuffer());
    const parts = await readDocxParts(buf);
    const parsed = parseDocxParagraphs(parts.documentXml, parts);
    const numbered = parsed.paragraphs.filter((p) => /^\[\d+\]/.test(p));
    expect(numbered).toHaveLength(6);
    expect(numbered[0]).toBe("[1] 第一段：合同成立。");
    expect(numbered[1]).toBe("[1] VI:第一段：合同成立。");
    const whole = parsed.paragraphs.join("\n");
    expect(whole).toContain("机器翻译");
    expect(whole).toContain("合同.docx");

    // Approve publishes the output for every member.
    const approve = await approveTask(
      postJson(
        `/api/review/tasks/${task.id}/approve`,
        coordinator.id ? {} : {},
        cookieHeader(coordinatorCookie),
      ),
      params(task.id),
    );
    expect(approve.status).toBe(200);
    const published = await prisma.file.findUniqueOrThrow({ where: { id: output.id } });
    expect(published.status).toBe("published");

    const list = await listFiles(
      getRequest(`/api/cases/${kase.id}/files`, cookieHeader(lawyerCookie)),
      params(kase.id),
    );
    const names = ((await list.json()) as { files: Array<{ originalName: string }> }).files.map(
      (f) => f.originalName,
    );
    expect(names).toContain("合同-中越对照.docx");

    const audit = await prisma.auditLog.findFirstOrThrow({
      where: { caseId: kase.id, action: "bilingual.done" },
    });
    expect(audit.result).toBe("success");
  });

  it("rejects tables explicitly (REQ-DOC-04) and never produces an output", async () => {
    const { kase, lawyerCookie } = await seedMembers();
    const fileId = await uploadPublished(
      kase.id,
      lawyerCookie,
      "表格.docx",
      await docxWithParagraphs(
        ["正文。"],
        "<w:tbl><w:tr><w:tc><w:p><w:r><w:t>表格</w:t></w:r></w:p></w:tc></w:tr></w:tbl>",
      ),
    );
    await requestBilingual(
      postJson(`/api/files/${fileId}/bilingual`, {}, cookieHeader(lawyerCookie)),
      params(fileId),
    );
    await runNotificationWorkerOnce({ translationMinIntervalMs: 0 });
    const job = await prisma.docxJob.findFirstOrThrow({ where: { fileId } });
    expect(job.status).toBe("rejected_unsupported");
    expect(job.error).toContain("table");
    expect(job.outputFileId).toBeNull();
    // No provider call was made for a rejected document.
    expect(fakeLlmTranslationProvider.calls).toHaveLength(0);
  });

  it("rejects over-limit documents (REQ-DOC-02)", async () => {
    const { kase, lawyerCookie } = await seedMembers();
    const many = Array.from({ length: 320 }, (_, i) => `第 ${i + 1} 段。`);
    const fileId = await uploadPublished(
      kase.id,
      lawyerCookie,
      "长文档.docx",
      await docxWithParagraphs(many),
    );
    await requestBilingual(
      postJson(`/api/files/${fileId}/bilingual`, {}, cookieHeader(lawyerCookie)),
      params(fileId),
    );
    await runNotificationWorkerOnce({ translationMinIntervalMs: 0 });
    const job = await prisma.docxJob.findFirstOrThrow({ where: { fileId } });
    expect(job.status).toBe("rejected_too_long");
    expect(job.pageEstimate).toBeGreaterThan(20);
    expect(fakeLlmTranslationProvider.calls).toHaveLength(0);
  });

  it("rejects non-Chinese/non-Vietnamese sources", async () => {
    const { kase, lawyerCookie } = await seedMembers();
    const fileId = await uploadPublished(
      kase.id,
      lawyerCookie,
      "english.docx",
      await docxWithParagraphs(["This is an English document.", "It has two paragraphs."]),
    );
    await requestBilingual(
      postJson(`/api/files/${fileId}/bilingual`, {}, cookieHeader(lawyerCookie)),
      params(fileId),
    );
    await runNotificationWorkerOnce({ translationMinIntervalMs: 0 });
    const job = await prisma.docxJob.findFirstOrThrow({ where: { fileId } });
    expect(job.status).toBe("rejected_lang");
  });

  it("refuses non-DOCX files, duplicate active jobs, and inaccessible files (REQ-DOC-01)", async () => {
    const { kase, coordinatorCookie, clientCookie, lawyerCookie } = await seedMembers();
    const fileId = await uploadPublished(
      kase.id,
      lawyerCookie,
      "材料.docx",
      await docxWithParagraphs(["第一段。"]),
    );
    const first = await requestBilingual(
      postJson(`/api/files/${fileId}/bilingual`, {}, cookieHeader(lawyerCookie)),
      params(fileId),
    );
    expect(first.status).toBe(201);
    const dup = await requestBilingual(
      postJson(`/api/files/${fileId}/bilingual`, {}, cookieHeader(coordinatorCookie)),
      params(fileId),
    );
    expect(dup.status).toBe(409);

    // A non-DOCX file cannot be converted.
    const { pngSample } = await import("../../fixtures/files/samples");
    const pngId = await uploadPublished(kase.id, lawyerCookie, "photo.png", pngSample());
    const notDocx = await requestBilingual(
      postJson(`/api/files/${pngId}/bilingual`, {}, cookieHeader(lawyerCookie)),
      params(pngId),
    );
    expect(notDocx.status).toBe(400);

    // An unpublished file of someone else's is invisible (404) to a plain member.
    const { pdfSample } = await import("../../fixtures/files/samples");
    await uploadFile(
      uploadFileRequest(kase.id, lawyerCookie, "你们律所收费多少.pdf", pdfSample()),
      params(kase.id),
    );
    const held = await prisma.file.findFirstOrThrow({ where: { caseId: kase.id, status: "pending_review" } });
    const hidden = await requestBilingual(
      postJson(`/api/files/${held.id}/bilingual`, {}, cookieHeader(clientCookie)),
      params(held.id),
    );
    expect(hidden.status).toBe(404);
  });

  it("a rate-limited batch requeues without spending attempts", async () => {
    const { kase, lawyerCookie } = await seedMembers();
    const fileId = await uploadPublished(
      kase.id,
      lawyerCookie,
      "合同.docx",
      await docxWithParagraphs(["第一段。", "第二段。"]),
    );
    await requestBilingual(
      postJson(`/api/files/${fileId}/bilingual`, {}, cookieHeader(lawyerCookie)),
      params(fileId),
    );
    fakeLlmTranslationProvider.failNext("rate_limited");
    await runNotificationWorkerOnce({ translationMinIntervalMs: 0 });
    let job = await prisma.docxJob.findFirstOrThrow({ where: { fileId } });
    expect(job.status).toBe("queued");
    expect(job.attempts).toBe(0);
    expect(job.nextRetryAt).not.toBeNull();

    // The retry succeeds and completes the job.
    await prisma.docxJob.update({ where: { id: job.id }, data: { nextRetryAt: null } });
    await runNotificationWorkerOnce({ translationMinIntervalMs: 0 });
    job = await prisma.docxJob.findFirstOrThrow({ where: { fileId } });
    expect(job.status).toBe("done");
  });

  it("job status is readable via GET for members who can see the file", async () => {
    const { kase, lawyerCookie, clientCookie } = await seedMembers();
    const fileId = await uploadPublished(
      kase.id,
      lawyerCookie,
      "材料.docx",
      await docxWithParagraphs(["第一段。"]),
    );
    await requestBilingual(
      postJson(`/api/files/${fileId}/bilingual`, {}, cookieHeader(lawyerCookie)),
      params(fileId),
    );
    const res = await getBilingual(
      getRequest(`/api/files/${fileId}/bilingual`, cookieHeader(clientCookie)),
      params(fileId),
    );
    expect(res.status).toBe(200);
    const { job } = (await res.json()) as { job: { status: string } };
    expect(job.status).toBe("queued");
  });
});
