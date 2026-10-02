import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  GET as listMessages,
  POST as sendMessage,
} from "@/app/api/cases/[id]/messages/route";
import { prisma } from "@/lib/db";
import { setMessageCheckerForTests } from "@/modules/messages/check";
import { fakeLlmModerationProvider } from "@/server/providers/llm/fake";

import {
  addMember,
  cookieHeader,
  createVerifiedUser,
  postMessage,
  resetDatabase,
  seedCaseWithCoordinator,
  sendJson,
  sessionCookieFor,
} from "../helpers";

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

async function seedChat() {
  const { kase, coordinator, cookie } = await seedCaseWithCoordinator("Moderation Case");
  const { user: lawyer } = await createVerifiedUser("lawyer", "lawyer-mod@example.com");
  await addMember(kase.id, lawyer.id, "lawyer");
  const lawyerCookie = await sessionCookieFor(lawyer.id);
  return { kase, coordinator, cookie, lawyer, lawyerCookie };
}

async function send(caseId: string, cookie: string, text: string, key: string) {
  const res = await sendMessage(
    postMessage(caseId, cookie, { sourceText: text }, { "idempotency-key": key }),
    params(caseId),
  );
  expect(res.status).toBe(201);
  return (await res.json()).message as Record<string, unknown>;
}

async function listFor(caseId: string, cookie: string) {
  const res = await listMessages(
    sendJson("GET", `/api/cases/${caseId}/messages`, {}, cookieHeader(cookie)),
    params(caseId),
  );
  expect(res.status).toBe(200);
  return (await res.json()).messages as Array<Record<string, unknown>>;
}

describe("moderation pipeline (REQ-MOD-01~03, REQ-NTF-07 registration)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });
  afterEach(() => {
    setMessageCheckerForTests();
    fakeLlmModerationProvider.reset();
  });

  it("releases ordinary Case Amounts (claims, damages, settlement, court fees) as published", async () => {
    const { kase, lawyerCookie } = await seedChat();
    const amounts = [
      "本案诉讼请求金额为人民币500万元。",
      "损害赔偿金 2,300,000 元，另加利息。",
      "和解方案：一次性支付80万元。",
      "法院诉讼费大约12万元，由败诉方承担。",
    ];
    for (const [index, text] of amounts.entries()) {
      const message = await send(kase.id, lawyerCookie, text, `m-amount-${index}`);
      expect(message.status).toBe("published");
    }
    expect(await prisma.reviewTask.count()).toBe(0);
  });

  it("sends explicit fee inquiries to pending_review and registers the review task atomically", async () => {
    const { kase, lawyerCookie, cookie } = await seedChat();
    const message = await send(
      kase.id,
      lawyerCookie,
      "这个案件你们律所收费多少？能不能给个报价？",
      "m-fee-1",
    );
    expect(message.status).toBe("pending_review");

    const tasks = await prisma.reviewTask.findMany({ where: { caseId: kase.id } });
    expect(tasks).toHaveLength(1);
    expect(tasks[0]!.targetType).toBe("message");
    expect(tasks[0]!.targetId).toBe(message.id);
    expect(tasks[0]!.status).toBe("open");
    expect(tasks[0]!.reason).toContain("fee_inquiry");

    // T04 visibility invariant: pending_review stays invisible to the receiver.
    const receiverList = await listFor(kase.id, cookie);
    expect(receiverList).toHaveLength(0);
    const authorList = await listFor(kase.id, lawyerCookie);
    expect(authorList.map((m) => m.status)).toEqual(["pending_review"]);
  });

  it("sends obfuscated contact channels to pending_review with a rule reason", async () => {
    const { kase, lawyerCookie } = await seedChat();
    const variants: Array<[string, string]> = [
      ["ｚｈａｎｇ．ｌｉａｎｇ＠ｅｘａｍｐｌｅ．ｃｏｍ", "email"],
      ["手机 1 3 8 - 1 2 3 4 - 5 6 7 8", "phone"],
      ["ban co zalo khong? ket ban nhe", "zalo"],
      ["扫这个二维码加我", "qr"],
    ];
    for (const [index, [text, category]] of variants.entries()) {
      const message = await send(kase.id, lawyerCookie, text, `m-contact-${index}`);
      expect(message.status).toBe("pending_review");
      const task = await prisma.reviewTask.findFirstOrThrow({
        where: { targetId: message.id as string },
      });
      expect(task.reason).toContain(category);
    }
  });

  it("releases ambiguous fee mentions by default (REQ-MOD-03)", async () => {
    const { kase, lawyerCookie } = await seedChat();
    const message = await send(
      kase.id,
      lawyerCookie,
      "这个案子要花多少钱打官司？想先了解大概的诉讼成本。",
      "m-vague-1",
    );
    expect(message.status).toBe("published");
    expect(await prisma.reviewTask.count()).toBe(0);
  });

  it("stops at check_failed and never publishes when the check service throws", async () => {
    const { kase, lawyerCookie, cookie } = await seedChat();
    setMessageCheckerForTests({
      check: async () => {
        throw new Error("checker down");
      },
    });
    const message = await send(kase.id, lawyerCookie, "unlucky", "m-fail-1");
    expect(message.status).toBe("check_failed");
    const row = await prisma.message.findUniqueOrThrow({
      where: { id: message.id as string },
    });
    expect(row.publishedAt).toBeNull();
    expect(await prisma.reviewTask.count()).toBe(0);
    expect(await listFor(kase.id, cookie)).toHaveLength(0);
  });

  it("rolls back the hold when task registration fails mid-transaction (no half state)", async () => {
    const { kase, lawyerCookie, cookie } = await seedChat();
    // reason violates the review_tasks length CHECK → the same-transaction
    // registration fails and the pending_review update must roll back too.
    setMessageCheckerForTests({
      check: async () => ({ outcome: "needs_review" as const, reason: "x".repeat(500) }),
    });
    const message = await send(kase.id, lawyerCookie, "held text", "m-rb-1");
    expect(message.status).toBe("check_failed");

    const row = await prisma.message.findUniqueOrThrow({
      where: { id: message.id as string },
    });
    expect(row.status).toBe("check_failed");
    expect(row.publishedAt).toBeNull();
    expect(await prisma.reviewTask.count()).toBe(0);
    expect(await listFor(kase.id, cookie)).toHaveLength(0);
  });

  it("runs coordinator messages through the same checks (REQ-PM-05)", async () => {
    const { kase, cookie } = await seedChat();
    const message = await send(kase.id, cookie, "加我微信：wxid_abc123def", "m-coord-1");
    expect(message.status).toBe("pending_review");
    expect(await prisma.reviewTask.count({ where: { targetId: message.id as string } })).toBe(1);
  });
});
