import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { GET as getBrief, POST as postBrief } from "@/app/api/cases/[id]/brief/route";
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
import { POST as sendMessage } from "@/app/api/cases/[id]/messages/route";

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

async function seedTriangle() {
  const { kase, coordinator, cookie: coordinatorCookie } =
    await seedCaseWithCoordinator("Brief Case");
  const { user: client } = await createVerifiedUser("client", "client-brief@example.com");
  await addMember(kase.id, client.id, "client");
  const { user: lawyer } = await createVerifiedUser("lawyer", "lawyer-brief@example.com");
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

describe("coordinator brief (REQ-BRIEF-01~03)", () => {
  beforeEach(async () => {
    await resetDatabase();
    fakeLlmBriefProvider.reset();
    resetTranslationPacingForTests();
  });
  afterEach(() => fakeLlmBriefProvider.reset());

  it("a thin case gets questions from the worker; the coordinator confirms; the brief is stored (REQ-BRIEF-02/03)", async () => {
    const { kase, coordinatorCookie } = await seedTriangle();
    await publishMessage(kase.id, coordinatorCookie, "合同扫描件已上传。");

    await runNotificationWorkerOnce({ translationMinIntervalMs: 0 });

    const row = await prisma.caseBrief.findUniqueOrThrow({ where: { caseId: kase.id } });
    expect(row.questionsStatus).toBe("ready");
    expect(row.questions).toEqual([
      "对方公司的越南语法定名称是什么？",
      "合同签订地在中国还是越南？",
    ]);

    const viewRes = await getBrief(
      getRequest(`/api/cases/${kase.id}/brief`, cookieHeader(coordinatorCookie)),
      params(kase.id),
    );
    expect(viewRes.status).toBe(200);
    const { brief } = (await viewRes.json()) as { brief: { questions: string[] } };
    expect(brief.questions).toHaveLength(2);

    const confirmRes = await postBrief(
      postJson(
        `/api/cases/${kase.id}/brief`,
        { answers: ["Công ty Aomaga", "越南"] },
        cookieHeader(coordinatorCookie),
      ),
      params(kase.id),
    );
    expect(confirmRes.status).toBe(200);

    const stored = await prisma.caseBrief.findUniqueOrThrow({ where: { caseId: kase.id } });
    expect(stored.briefText).toContain("Công ty Aomaga");
    expect(stored.briefText).toContain("合同签订地在中国还是越南？");
    expect(stored.confirmedAt).not.toBeNull();

    // The brief is not a case-chat message and nothing was emailed (REQ-BRIEF-02).
    expect(await prisma.message.count({ where: { caseId: kase.id } })).toBe(1);
    expect(fakeEmailProvider.outbox).toHaveLength(0);

    // The confirm is auditable (REQ-OPS-01).
    const audit = await prisma.auditLog.findFirstOrThrow({
      where: { caseId: kase.id, action: "brief.confirm" },
    });
    expect(audit.result).toBe("success");
  });

  it("clients and lawyers get a plain 404 for both read and confirm (REQ-BRIEF-01)", async () => {
    const { kase, coordinatorCookie, clientCookie, lawyerCookie } = await seedTriangle();
    await publishMessage(kase.id, coordinatorCookie, "合同扫描件已上传。");
    await runNotificationWorkerOnce({ translationMinIntervalMs: 0 });

    for (const cookie of [clientCookie, lawyerCookie]) {
      const res = await getBrief(
        getRequest(`/api/cases/${kase.id}/brief`, cookieHeader(cookie)),
        params(kase.id),
      );
      expect(res.status).toBe(404);
      const post = await postBrief(
        postJson(`/api/cases/${kase.id}/brief`, { answers: ["a", "b"] }, cookieHeader(cookie)),
        params(kase.id),
      );
      expect(post.status).toBe(404);
    }
  });

  it("only this case's published content reaches the provider (REQ-TR-06)", async () => {
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

    expect(fakeLlmBriefProvider.calls).toHaveLength(1);
    const payload = fakeLlmBriefProvider.calls[0]!;
    expect(payload.messageTexts).toEqual(["我们已经核对合同签字页。"]);
    expect(JSON.stringify(payload)).not.toContain("律所收费");
    expect(payload.lang).toBe("zh-Hans");
  });

  it("a case with five published messages is not thin and is not prompted", async () => {
    const { kase, coordinatorCookie } = await seedTriangle();
    for (let i = 1; i <= 5; i += 1) {
      await publishMessage(kase.id, coordinatorCookie, `第 ${i} 条已发布消息。`);
    }
    await runNotificationWorkerOnce({ translationMinIntervalMs: 0 });
    expect(await prisma.caseBrief.count({ where: { caseId: kase.id } })).toBe(0);
  });

  it("confirm requires every question answered and ready questions", async () => {
    const { kase, coordinatorCookie } = await seedTriangle();
    await publishMessage(kase.id, coordinatorCookie, "合同扫描件已上传。");
    await runNotificationWorkerOnce({ translationMinIntervalMs: 0 });

    const missing = await postBrief(
      postJson(`/api/cases/${kase.id}/brief`, { answers: ["Công ty Aomaga", ""] }, cookieHeader(coordinatorCookie)),
      params(kase.id),
    );
    expect(missing.status).toBe(400);
    const stored = await prisma.caseBrief.findUniqueOrThrow({ where: { caseId: kase.id } });
    expect(stored.briefText).toBeNull();
  });

  it("new published content after the questions prompts a regeneration (REQ-BRIEF-03)", async () => {
    const { kase, coordinatorCookie } = await seedTriangle();
    await publishMessage(kase.id, coordinatorCookie, "合同扫描件已上传。");
    await runNotificationWorkerOnce({ translationMinIntervalMs: 0 });
    const first = await prisma.caseBrief.findUniqueOrThrow({ where: { caseId: kase.id } });
    expect(first.questionsStatus).toBe("ready");

    await publishMessage(kase.id, coordinatorCookie, "补充：交货地为胡志明市。");
    await runNotificationWorkerOnce({ translationMinIntervalMs: 0 });
    const second = await prisma.caseBrief.findUniqueOrThrow({ where: { caseId: kase.id } });
    // Regenerated (fake returns the same text, but questionsAt advances).
    expect(second.questionsAt!.getTime()).toBeGreaterThan(first.questionsAt!.getTime());
    expect(fakeLlmBriefProvider.calls.length).toBe(2);
  });
});
