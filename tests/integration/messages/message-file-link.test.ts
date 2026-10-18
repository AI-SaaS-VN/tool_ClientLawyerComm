import { beforeEach, describe, expect, it } from "vitest";

import { GET as listFiles, POST as uploadFile } from "@/app/api/cases/[id]/files/route";
import { GET as listMessages, POST as sendMessage } from "@/app/api/cases/[id]/messages/route";
import { prisma } from "@/lib/db";

import { pngSample } from "../../fixtures/files/samples";
import {
  addMember,
  cookieHeader,
  createVerifiedUser,
  getRequest,
  postMessage,
  resetDatabase,
  seedCaseWithCoordinator,
  sessionCookieFor,
  uploadFileRequest,
} from "../helpers";

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

async function seedChat() {
  const { kase, cookie } = await seedCaseWithCoordinator("Link Case");
  const { user: client } = await createVerifiedUser("client", "client-link@example.com");
  await addMember(kase.id, client.id, "client");
  const clientCookie = await sessionCookieFor(client.id);
  const { user: lawyer } = await createVerifiedUser("lawyer", "lawyer-link@example.com");
  await addMember(kase.id, lawyer.id, "lawyer");
  const lawyerCookie = await sessionCookieFor(lawyer.id);
  return { kase, cookie, clientCookie, lawyerCookie };
}

async function messagesOf(caseId: string, cookie: string) {
  const res = await listMessages(getRequest(`/api/cases/${caseId}/messages`, cookieHeader(cookie)), params(caseId));
  expect(res.status).toBe(200);
  return ((await res.json()) as { messages: Array<Record<string, unknown>> }).messages;
}

describe("message and file correspondence", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("sends a message with no file", async () => {
    const { kase, clientCookie } = await seedChat();
    const sent = await sendMessage(
      postMessage(kase.id, clientCookie, { sourceText: "没有附件" }, { "idempotency-key": "link-1" }),
      params(kase.id),
    );
    expect(sent.status).toBe(201);
    const [message] = await messagesOf(kase.id, clientCookie);
    expect(message!.file).toBeNull();
    expect(message!.citedFile).toBeNull();
    expect(message!.authorRole).toBe("client");
  });

  it("places an uploaded file under the message it was sent with", async () => {
    const { kase, clientCookie, lawyerCookie } = await seedChat();
    const sent = await sendMessage(
      postMessage(kase.id, clientCookie, { sourceText: "合同扫描件已上传" }, { "idempotency-key": "link-2" }),
      params(kase.id),
    );
    const messageId = ((await sent.json()) as { message: { id: string } }).message.id;
    const uploaded = await uploadFile(
      uploadFileRequest(kase.id, clientCookie, "合同扫描.png", pngSample(), messageId),
      params(kase.id),
    );
    expect(uploaded.status).toBe(201);
    const fileId = ((await uploaded.json()) as { file: { id: string; messageId: string } }).file.id;

    const [own] = await messagesOf(kase.id, clientCookie);
    expect((own!.file as { id: string }).id).toBe(fileId);

    const [seen] = await messagesOf(kase.id, lawyerCookie);
    expect((seen!.file as { originalName: string }).originalName).toBe("合同扫描.png");

    const again = await uploadFile(
      uploadFileRequest(kase.id, clientCookie, "另一份.png", pngSample(), messageId),
      params(kase.id),
    );
    expect(again.status).toBe(409);

    const stranger = await uploadFile(
      uploadFileRequest(kase.id, lawyerCookie, "别人.png", pngSample(), messageId),
      params(kase.id),
    );
    expect(stranger.status).toBe(404);
  });

  it("lets a later message point at an existing file without copying it", async () => {
    const { kase, clientCookie, lawyerCookie } = await seedChat();
    const sent = await sendMessage(
      postMessage(kase.id, clientCookie, { sourceText: "先上传" }, { "idempotency-key": "link-3a" }),
      params(kase.id),
    );
    const messageId = ((await sent.json()) as { message: { id: string } }).message.id;
    const uploaded = await uploadFile(
      uploadFileRequest(kase.id, clientCookie, "现场.png", pngSample(), messageId),
      params(kase.id),
    );
    const fileId = ((await uploaded.json()) as { file: { id: string } }).file.id;

    const reply = await sendMessage(
      postMessage(
        kase.id,
        lawyerCookie,
        { sourceText: "已看到现场照片", citedFileId: fileId },
        { "idempotency-key": "link-3b" },
      ),
      params(kase.id),
    );
    expect(reply.status).toBe(201);
    const messages = await messagesOf(kase.id, clientCookie);
    const cited = messages[1]!;
    expect(cited.file).toBeNull();
    expect(cited.citedFile).toEqual({ id: fileId, originalName: "现场.png" });
    expect(messages[0]!.file).toMatchObject({ id: fileId });

    const { user: outsider } = await createVerifiedUser("coordinator", "outsider-link@example.com");
    const otherCase = await prisma.case.create({
      data: { title: "Other Case", clientOrgName: "Fictitious Client Org", createdBy: outsider.id },
    });
    await addMember(otherCase.id, outsider.id, "coordinator");
    const outsiderCookie = await sessionCookieFor(outsider.id);
    const missing = await sendMessage(
      postMessage(
        otherCase.id,
        outsiderCookie,
        { sourceText: "不在这个案件", citedFileId: fileId },
        { "idempotency-key": "link-3c" },
      ),
      params(otherCase.id),
    );
    expect(missing.status).toBe(404);
  });

  it("keeps a file uploaded with no message in the unlinked list", async () => {
    const { kase, clientCookie } = await seedChat();
    const uploaded = await uploadFile(
      uploadFileRequest(kase.id, clientCookie, "旧文件.png", pngSample()),
      params(kase.id),
    );
    expect(uploaded.status).toBe(201);
    const body = (await uploaded.json()) as { file: { messageId: string | null } };
    expect(body.file.messageId).toBeNull();
    const listed = await listFiles(
      getRequest(`/api/cases/${kase.id}/files`, cookieHeader(clientCookie)),
      params(kase.id),
    );
    const files = ((await listed.json()) as { files: Array<{ messageId: string | null }> }).files;
    expect(files).toHaveLength(1);
    expect(files[0]!.messageId).toBeNull();
  });
});
