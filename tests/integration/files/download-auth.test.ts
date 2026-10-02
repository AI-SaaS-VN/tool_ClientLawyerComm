import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { GET as downloadFile } from "@/app/api/files/[id]/download/route";
import { POST as uploadFile } from "@/app/api/cases/[id]/files/route";
import { POST as approveTask } from "@/app/api/review/tasks/[id]/approve/route";
import { prisma } from "@/lib/db";
import { getStorageProvider } from "@/server/providers/storage";
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
    await seedCaseWithCoordinator("Download Auth Case");
  const { user: client } = await createVerifiedUser("client", "client-dl@example.com");
  await addMember(kase.id, client.id, "client");
  const { user: lawyer } = await createVerifiedUser("lawyer", "lawyer-dl@example.com");
  await addMember(kase.id, lawyer.id, "lawyer");
  const clientCookie = await sessionCookieFor(client.id);
  const lawyerCookie = await sessionCookieFor(lawyer.id);
  return { kase, coordinator, coordinatorCookie, client, clientCookie, lawyer, lawyerCookie };
}

async function publishPdf(caseId: string, uploaderCookie: string, reviewerCookie: string) {
  const uploadRes = await uploadFile(
    uploadFileRequest(caseId, uploaderCookie, "judgment.pdf", pdfSample()),
    params(caseId),
  );
  expect(uploadRes.status).toBe(201);
  const { file } = (await uploadRes.json()) as { file: { id: string; status: string } };
  expect(file.status).toBe("pending_review");
  const task = await prisma.reviewTask.findFirstOrThrow({
    where: { targetType: "file", targetId: file.id, status: "open" },
  });
  const approve = await approveTask(
    postJson(`/api/review/tasks/${task.id}/approve`, {}, cookieHeader(reviewerCookie)),
    params(task.id),
  );
  expect(approve.status).toBe(200);
  return file.id;
}

describe("authorized proxy download (REQ-FILE-04/06)", () => {
  beforeEach(async () => {
    await resetDatabase();
    stubFileScanner.reset();
  });
  afterEach(() => stubFileScanner.reset());

  it("approval creates a shared copy stored separately from the immutable original (REQ-FILE-04)", async () => {
    const { kase, clientCookie, coordinatorCookie } = await seedMembers();
    const fileId = await publishPdf(kase.id, clientCookie, coordinatorCookie);

    const row = await prisma.file.findUniqueOrThrow({ where: { id: fileId } });
    expect(row.status).toBe("published");
    expect(row.publishedAt).not.toBeNull();

    const original = await prisma.fileVariant.findFirstOrThrow({
      where: { fileId, kind: "original" },
    });
    const shared = await prisma.fileVariant.findFirstOrThrow({
      where: { fileId, kind: "shared_copy" },
    });
    expect(shared.storageKey).not.toBe(original.storageKey);
    expect(shared.sourceVersion).toBe(original.version);

    const storage = getStorageProvider();
    const [origBytes, sharedBytes] = await Promise.all([
      storage.getObject(original.storageKey),
      storage.getObject(shared.storageKey),
    ]);
    expect(sharedBytes.equals(pdfSample())).toBe(true);
    expect(origBytes.equals(pdfSample())).toBe(true);
  });

  it("every download re-validates membership and publish state; the receiver downloads the shared copy", async () => {
    const { kase, clientCookie, lawyerCookie, coordinatorCookie, lawyer } = await seedMembers();
    const fileId = await publishPdf(kase.id, clientCookie, coordinatorCookie);

    const res = await downloadFile(
      getRequest(`/api/files/${fileId}/download`, cookieHeader(lawyerCookie)),
      params(fileId),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("content-disposition")).toContain("attachment");
    const body = Buffer.from(await res.arrayBuffer());
    expect(body.equals(pdfSample())).toBe(true);

    // Permission revocation denies the very next download of the same URL.
    await prisma.caseMember.update({
      where: { caseId_userId: { caseId: kase.id, userId: lawyer.id } },
      data: { status: "revoked", revokedAt: new Date() },
    });
    const afterRevoke = await downloadFile(
      getRequest(`/api/files/${fileId}/download`, cookieHeader(lawyerCookie)),
      params(fileId),
    );
    expect(afterRevoke.status).toBe(403);
  });

  it("non-members get 403 and unpublished files are 404 to receivers", async () => {
    const { kase, clientCookie, lawyerCookie } = await seedMembers();
    const { user: outsider } = await createVerifiedUser("lawyer", "outsider-dl@example.com");
    const outsiderCookie = await sessionCookieFor(outsider.id);

    const uploadRes = await uploadFile(
      uploadFileRequest(kase.id, clientCookie, "draft.pdf", pdfSample()),
      params(kase.id),
    );
    const { file } = (await uploadRes.json()) as { file: { id: string } };

    const outsiderRes = await downloadFile(
      getRequest(`/api/files/${file.id}/download`, cookieHeader(outsiderCookie)),
      params(file.id),
    );
    expect(outsiderRes.status).toBe(403);

    const receiverRes = await downloadFile(
      getRequest(`/api/files/${file.id}/download`, cookieHeader(lawyerCookie)),
      params(file.id),
    );
    expect(receiverRes.status).toBe(404);
  });
});
