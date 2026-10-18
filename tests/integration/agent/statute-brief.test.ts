import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { GET as getBrief } from "@/app/api/cases/[id]/brief/route";
import { POST as postStatute } from "@/app/api/cases/[id]/statute/route";
import { POST as sendMessage } from "@/app/api/cases/[id]/messages/route";
import { prisma } from "@/lib/db";
import { resetTranslationPacingForTests, runNotificationWorkerOnce } from "@/server/jobs/worker";
import { fakeEmailProvider } from "@/server/providers/email/fake";
import { fakeLlmBriefProvider } from "@/server/providers/llm/fake";

import {
  addMember,
  cookieHeader,
  createVerifiedUser,
  getRequest,
  postJson,
  postMessage,
  resetDatabase,
  seedCaseWithCoordinator,
  sessionCookieFor,
} from "../helpers";

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

async function seedTriangle() {
  const { kase, coordinator, cookie: coordinatorCookie } =
    await seedCaseWithCoordinator("Statute Case");
  const { user: client } = await createVerifiedUser("client", "client-stat@example.com");
  await addMember(kase.id, client.id, "client");
  const { user: lawyer } = await createVerifiedUser("lawyer", "lawyer-stat@example.com");
  await addMember(kase.id, lawyer.id, "lawyer");
  const clientCookie = await sessionCookieFor(client.id);
  const lawyerCookie = await sessionCookieFor(lawyer.id);
  return { kase, coordinator, coordinatorCookie, client, clientCookie, lawyer, lawyerCookie };
}

async function publishMessage(caseId: string, cookie: string, text: string) {
  const res = await sendMessage(
    postMessage(caseId, cookie, { sourceText: text }, { "idempotency-key": crypto.randomUUID() }),
    params(caseId),
  );
  expect(res.status).toBe(201);
}

describe("statute note (REQ-STAT-01~02)", () => {
  beforeEach(async () => {
    await resetDatabase();
    fakeLlmBriefProvider.reset();
    resetTranslationPacingForTests();
  });
  afterEach(() => fakeLlmBriefProvider.reset());

  it("a thin case gets statute links; confirming a selection stores the coordinator-only note", async () => {
    const { kase, coordinatorCookie } = await seedTriangle();
    await publishMessage(kase.id, coordinatorCookie, "合同扫描件已上传。");

    await runNotificationWorkerOnce({ translationMinIntervalMs: 0 });

    const row = await prisma.caseBrief.findUniqueOrThrow({ where: { caseId: kase.id } });
    expect(row.statuteStatus).toBe("ready");
    const links = row.statuteLinks as Array<{ title: string; url: string; jurisdiction: string }>;
    expect(links).toHaveLength(2);
    expect(links.map((l) => l.jurisdiction).sort()).toEqual(["cn", "vn"]);
    expect(row.statuteNote).toBeNull();

    // The coordinator sees the links through the brief view.
    const viewRes = await getBrief(
      getRequest(`/api/cases/${kase.id}/brief`, cookieHeader(coordinatorCookie)),
      params(kase.id),
    );
    expect(viewRes.status).toBe(200);
    const { brief } = (await viewRes.json()) as {
      brief: { statuteStatus: string; statuteLinks: unknown[] };
    };
    expect(brief.statuteStatus).toBe("ready");
    expect(brief.statuteLinks).toHaveLength(2);

    const confirmRes = await postStatute(
      postJson(
        `/api/cases/${kase.id}/statute`,
        { selected: [0, 1], remark: "越南律师尚未核对合同成立要件。" },
        cookieHeader(coordinatorCookie),
      ),
      params(kase.id),
    );
    expect(confirmRes.status).toBe(200);

    const stored = await prisma.caseBrief.findUniqueOrThrow({ where: { caseId: kase.id } });
    expect(stored.statuteNote).toContain("越南民法典");
    expect(stored.statuteNote).toContain("https://example.gov.cn/civil-code");
    expect(stored.statuteNote).toContain("越南律师尚未核对合同成立要件。");

    // Not a case-chat message, nothing emailed (REQ-STAT-01).
    expect(await prisma.message.count({ where: { caseId: kase.id } })).toBe(1);
    expect(fakeEmailProvider.outbox).toHaveLength(0);

    const audit = await prisma.auditLog.findFirstOrThrow({
      where: { caseId: kase.id, action: "statute.confirm" },
    });
    expect(audit.result).toBe("success");
  });

  it("clients and lawyers get a plain 404 for the statute confirm (REQ-BRIEF-01)", async () => {
    const { kase, coordinatorCookie, clientCookie, lawyerCookie } = await seedTriangle();
    await publishMessage(kase.id, coordinatorCookie, "合同扫描件已上传。");
    await runNotificationWorkerOnce({ translationMinIntervalMs: 0 });

    for (const cookie of [clientCookie, lawyerCookie]) {
      const res = await postStatute(
        postJson(`/api/cases/${kase.id}/statute`, { selected: [0] }, cookieHeader(cookie)),
        params(kase.id),
      );
      expect(res.status).toBe(404);
    }
  });

  it("material outside China and Vietnam is never offered (REQ-STAT-01)", async () => {
    const { kase, coordinatorCookie } = await seedTriangle();
    fakeLlmBriefProvider.setFixedStatuteResponse(
      JSON.stringify([
        { title: "UCC Article 2", url: "https://law.example.com/ucc-2", jurisdiction: "us" },
        { title: "越南民法典", url: "https://example.gov.vn/civil", jurisdiction: "vn" },
      ]),
    );
    await publishMessage(kase.id, coordinatorCookie, "合同扫描件已上传。");
    await runNotificationWorkerOnce({ translationMinIntervalMs: 0 });

    const row = await prisma.caseBrief.findUniqueOrThrow({ where: { caseId: kase.id } });
    const links = row.statuteLinks as Array<{ jurisdiction: string }>;
    expect(links).toHaveLength(1);
    expect(links[0]!.jurisdiction).toBe("vn");
  });

  it("confirm requires ready links and a non-empty selection", async () => {
    const { kase, coordinatorCookie } = await seedTriangle();
    await publishMessage(kase.id, coordinatorCookie, "合同扫描件已上传。");

    // Nothing generated yet → 409.
    const early = await postStatute(
      postJson(`/api/cases/${kase.id}/statute`, { selected: [0] }, cookieHeader(coordinatorCookie)),
      params(kase.id),
    );
    expect(early.status).toBe(409);

    await runNotificationWorkerOnce({ translationMinIntervalMs: 0 });
    const empty = await postStatute(
      postJson(`/api/cases/${kase.id}/statute`, { selected: [] }, cookieHeader(coordinatorCookie)),
      params(kase.id),
    );
    expect(empty.status).toBe(400);
    const outOfRange = await postStatute(
      postJson(`/api/cases/${kase.id}/statute`, { selected: [9] }, cookieHeader(coordinatorCookie)),
      params(kase.id),
    );
    expect(outOfRange.status).toBe(400);
    const stored = await prisma.caseBrief.findUniqueOrThrow({ where: { caseId: kase.id } });
    expect(stored.statuteNote).toBeNull();
  });

  it("only this case's published content reaches the statute provider (REQ-TR-06)", async () => {
    const { kase, clientCookie } = await seedTriangle();
    await publishMessage(kase.id, clientCookie, "我们已经核对合同签字页。");
    // An explicit retainer-fee inquiry stays unpublished (pending_review).
    await sendMessage(
      postMessage(
        kase.id,
        clientCookie,
        { sourceText: "你们律所收费多少？" },
        { "idempotency-key": crypto.randomUUID() },
      ),
      params(kase.id),
    );

    await runNotificationWorkerOnce({ translationMinIntervalMs: 0 });

    expect(fakeLlmBriefProvider.statuteCalls).toHaveLength(1);
    const payload = fakeLlmBriefProvider.statuteCalls[0]!;
    expect(payload.messageTexts).toEqual(["我们已经核对合同签字页。"]);
    expect(JSON.stringify(payload)).not.toContain("律所收费");
  });
});
