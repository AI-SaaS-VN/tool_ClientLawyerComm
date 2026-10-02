import { createHash } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { GET as downloadFile } from "@/app/api/files/[id]/download/route";
import { GET as listFiles, POST as uploadFile } from "@/app/api/cases/[id]/files/route";
import { prisma } from "@/lib/db";
import { stubFileScanner } from "@/server/providers/scanner/stub";

import {
  addMember,
  cookieHeader,
  createVerifiedUser,
  getRequest,
  resetDatabase,
  seedCaseWithCoordinator,
  sessionCookieFor,
  uploadFileRequest,
} from "../helpers";
import { oversizedPngSample, pdfSample, pngSample } from "../../fixtures/files/samples";

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

async function seedMembers() {
  const { kase, coordinator, cookie: coordinatorCookie } =
    await seedCaseWithCoordinator("File Quarantine Case");
  const { user: client } = await createVerifiedUser("client", "client-files@example.com");
  await addMember(kase.id, client.id, "client");
  const { user: lawyer } = await createVerifiedUser("lawyer", "lawyer-files@example.com");
  await addMember(kase.id, lawyer.id, "lawyer");
  const clientCookie = await sessionCookieFor(client.id);
  const lawyerCookie = await sessionCookieFor(lawyer.id);
  return { kase, coordinator, coordinatorCookie, client, clientCookie, lawyer, lawyerCookie };
}

describe("file upload quarantine (REQ-FILE-01/02/04/05/07, AC06)", () => {
  beforeEach(async () => {
    await resetDatabase();
    stubFileScanner.reset();
  });
  afterEach(() => stubFileScanner.reset());

  it("a member upload enters pending_review with an original variant, a review task, and a coordinator alert (REQ-FILE-05, T07 link)", async () => {
    const { kase, coordinator, client, clientCookie } = await seedMembers();
    const res = await uploadFile(
      uploadFileRequest(kase.id, clientCookie, "contract.pdf", pdfSample()),
      params(kase.id),
    );
    expect(res.status).toBe(201);
    const { file } = (await res.json()) as { file: Record<string, unknown> };
    expect(file.status).toBe("pending_review");
    // REQ-FILE-02: no object address leaks through the API view.
    expect(JSON.stringify(file)).not.toContain("quarantine");
    expect(JSON.stringify(file)).not.toContain("storageKey");

    const row = await prisma.file.findUniqueOrThrow({ where: { id: file.id as string } });
    expect(row.status).toBe("pending_review");
    expect(row.uploaderId).toBe(client.id);
    // REQ-FILE-04: original hash / uploader / time are recorded.
    expect(row.origHash).toBe(createHash("sha256").update(pdfSample()).digest("hex"));
    const variant = await prisma.fileVariant.findFirstOrThrow({
      where: { fileId: row.id, kind: "original" },
    });
    expect(variant.version).toBe(1);
    expect(variant.storageKey).toContain("quarantine/");

    const task = await prisma.reviewTask.findFirstOrThrow({
      where: { targetType: "file", targetId: row.id, status: "open" },
    });
    const alert = await prisma.notificationTask.findFirst({
      where: { kind: "review_alert", reviewTaskId: task.id, recipientUserId: coordinator.id },
    });
    expect(alert).not.toBeNull();
  });

  it("a pending file is invisible to the receiver in list and download; uploader and reviewer still see it (AC06)", async () => {
    const { kase, coordinatorCookie, clientCookie, lawyerCookie } = await seedMembers();
    const uploadRes = await uploadFile(
      uploadFileRequest(kase.id, clientCookie, "evidence.png", pngSample()),
      params(kase.id),
    );
    const { file } = (await uploadRes.json()) as { file: { id: string } };

    const lawyerList = await listFiles(
      getRequest(`/api/cases/${kase.id}/files`, cookieHeader(lawyerCookie)),
      params(kase.id),
    );
    expect((await lawyerList.json()).files).toHaveLength(0);

    const lawyerDownload = await downloadFile(
      getRequest(`/api/files/${file.id}/download`, cookieHeader(lawyerCookie)),
      params(file.id),
    );
    expect(lawyerDownload.status).toBe(404);

    const clientList = await listFiles(
      getRequest(`/api/cases/${kase.id}/files`, cookieHeader(clientCookie)),
      params(kase.id),
    );
    const clientFiles = (await clientList.json()).files as Array<{ id: string; status: string }>;
    expect(clientFiles.map((f) => f.id)).toContain(file.id);
    // REQ-PM-09: no registered contact channel in the payload.
    expect(JSON.stringify(clientFiles)).not.toContain("@");

    const coordinatorList = await listFiles(
      getRequest(`/api/cases/${kase.id}/files`, cookieHeader(coordinatorCookie)),
      params(kase.id),
    );
    const coordinatorFiles = (await coordinatorList.json()).files as Array<{ id: string }>;
    expect(coordinatorFiles.map((f) => f.id)).toContain(file.id);
  });

  it("rejects forged content types and trusts magic bytes over the extension (REQ-FILE-01)", async () => {
    const { kase, clientCookie } = await seedMembers();
    const script = Buffer.from("#!/bin/sh\necho pwned\n", "utf8");
    const forged = await uploadFile(
      uploadFileRequest(kase.id, clientCookie, "looks-like.pdf", script),
      params(kase.id),
    );
    expect(forged.status).toBe(400);
    expect((await forged.json()).error).toBe("unsupported_file_type");

    // A PNG named .pdf is stored as PNG: the extension is not trusted.
    const renamed = await uploadFile(
      uploadFileRequest(kase.id, clientCookie, "mislabeled.pdf", pngSample()),
      params(kase.id),
    );
    expect(renamed.status).toBe(201);
    const { file } = (await renamed.json()) as { file: { mime: string } };
    expect(file.mime).toBe("image/png");
  });

  it("rejects files over 20MB before any storage write (REQ-FILE-01)", async () => {
    const { kase, clientCookie } = await seedMembers();
    const res = await uploadFile(
      uploadFileRequest(kase.id, clientCookie, "huge.png", oversizedPngSample()),
      params(kase.id),
    );
    expect(res.status).toBe(413);
    expect((await res.json()).error).toBe("file_too_large");
    expect(await prisma.file.count()).toBe(0);
  });

  it("runs the file name through the deterministic content rules (REQ-FILE-07)", async () => {
    const { kase, clientCookie } = await seedMembers();
    const res = await uploadFile(
      uploadFileRequest(kase.id, clientCookie, "contact-me-at-a@b.com.pdf", pdfSample()),
      params(kase.id),
    );
    expect(res.status).toBe(201);
    const { file } = (await res.json()) as { file: { id: string; status: string } };
    expect(file.status).toBe("pending_review");
    const task = await prisma.reviewTask.findFirstOrThrow({
      where: { targetType: "file", targetId: file.id },
    });
    expect(task.reason).toContain("rule:file_name:email");
  });

  it("denies uploads by non-members (REQ-PM-01)", async () => {
    const { kase } = await seedMembers();
    const { user: outsider } = await createVerifiedUser("lawyer", "outsider@example.com");
    const outsiderCookie = await sessionCookieFor(outsider.id);
    const res = await uploadFile(
      uploadFileRequest(kase.id, outsiderCookie, "x.pdf", pdfSample()),
      params(kase.id),
    );
    expect(res.status).toBe(403);
  });
});
