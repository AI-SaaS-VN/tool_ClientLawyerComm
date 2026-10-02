import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  GET as listMessages,
  POST as sendMessage,
} from "@/app/api/cases/[id]/messages/route";
import { POST as translateMessage } from "@/app/api/messages/[id]/translate/route";
import { prisma } from "@/lib/db";
import { setMessageCheckerForTests } from "@/modules/messages/check";
import { fakeLlmTranslationProvider } from "@/server/providers/llm/fake";
import type { LlmFailureKind } from "@/server/providers/llm/interface";

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

async function seedChat(coordinatorLang = "en") {
  const { kase, coordinator, cookie } = await seedCaseWithCoordinator("Failure Case");
  const { user: lawyer } = await createVerifiedUser("lawyer", "lawyer-fail@example.com");
  await addMember(kase.id, lawyer.id, "lawyer");
  await prisma.user.update({
    where: { id: coordinator.id },
    data: { preferredLang: coordinatorLang },
  });
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

async function listFor(caseId: string, cookie: string, mode = "auto") {
  const res = await listMessages(
    sendJson("GET", `/api/cases/${caseId}/messages?mode=${mode}`, {}, cookieHeader(cookie)),
    params(caseId),
  );
  expect(res.status).toBe(200);
  return (await res.json()).messages as Array<Record<string, unknown>>;
}

async function translate(
  messageId: string,
  cookie: string,
  body: Record<string, unknown> = {},
) {
  return translateMessage(
    sendJson("POST", `/api/messages/${messageId}/translate`, body, cookieHeader(cookie)),
    params(messageId),
  );
}

describe("translation failure states (REQ-TR-05/06/09, REQ-MSG-10, AC04)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });
  afterEach(() => {
    setMessageCheckerForTests();
    fakeLlmTranslationProvider.reset();
  });

  it("never sends pending_review or check_failed messages to the provider (REQ-TR-09)", async () => {
    const { kase, cookie, lawyerCookie } = await seedChat();
    setMessageCheckerForTests({
      check: async () => ({ outcome: "needs_review" as const, reason: "rule:test" }),
    });
    const held = await send(kase.id, lawyerCookie, "held message body", "f-hold-1");
    expect(held.status).toBe("pending_review");

    const authorAttempt = await translate(held.id as string, lawyerCookie);
    expect(authorAttempt.status).toBe(409);
    expect((await authorAttempt.json()).error).toBe("message_not_published");
    const otherAttempt = await translate(held.id as string, cookie);
    expect(otherAttempt.status).toBe(404);
    expect(fakeLlmTranslationProvider.calls).toHaveLength(0);
    expect(await prisma.translationVersion.count()).toBe(0);

    // The author's own list shows the raw status, translation null, and auto
    // mode still creates nothing.
    const authorList = await listFor(kase.id, lawyerCookie);
    expect(authorList[0]!.status).toBe("pending_review");
    expect(authorList[0]!.translation).toBeNull();
    expect(fakeLlmTranslationProvider.calls).toHaveLength(0);

    setMessageCheckerForTests({
      check: async () => {
        throw new Error("checker down");
      },
    });
    const failed = await send(kase.id, lawyerCookie, "unlucky body", "f-hold-2");
    expect(failed.status).toBe("check_failed");
    const retry = await translate(failed.id as string, lawyerCookie);
    expect(retry.status).toBe(409);
    expect(fakeLlmTranslationProvider.calls).toHaveLength(0);
    expect(await prisma.translationVersion.count()).toBe(0);
  });

  it("LLM timeout, rate-limit and format errors mark the version failed, keep the source, and never fake success (REQ-MSG-10)", async () => {
    const { kase, cookie, lawyerCookie } = await seedChat();
    const kinds: LlmFailureKind[] = ["timeout", "rate_limited", "format"];
    for (const [index, kind] of kinds.entries()) {
      const message = await send(kase.id, lawyerCookie, `请查收材料 ${index + 1} 份。`, `f-kind-${index}`);
      fakeLlmTranslationProvider.failNext(kind);
      const res = await translate(message.id as string, cookie);
      expect(res.status).toBe(201);
      expect((await res.json()).translation).toEqual({
        targetLang: "en",
        state: "failed",
        text: null,
        version: 1,
      });

      const row = await prisma.translationVersion.findFirstOrThrow({
        where: { messageId: message.id as string },
      });
      expect(row).toMatchObject({ status: "failed", text: null, provider: "fake" });

      // The source text is untouched and stays published.
      const source = await prisma.message.findUniqueOrThrow({
        where: { id: message.id as string },
      });
      expect(source.status).toBe("published");
      expect(source.sourceText).toBe(`请查收材料 ${index + 1} 份。`);

      // The reading view reports failed without auto-retrying or substituting.
      const list = await listFor(kase.id, cookie);
      expect(list[index]!.translation).toMatchObject({ state: "failed", text: null });
      expect(fakeLlmTranslationProvider.calls).toHaveLength(index + 1);
    }
  });

  it("retry after failure creates a new version without overwriting the failed one (REQ-TR-04)", async () => {
    const { kase, cookie, lawyerCookie } = await seedChat();
    const message = await send(kase.id, lawyerCookie, "请于2026年3月15日前答复。", "f-retry-1");

    fakeLlmTranslationProvider.failNext("timeout");
    const failed = await translate(message.id as string, cookie);
    expect((await failed.json()).translation).toMatchObject({ state: "failed", version: 1 });

    const retried = await translate(message.id as string, cookie);
    expect(retried.status).toBe(201);
    expect((await retried.json()).translation).toEqual({
      targetLang: "en",
      state: "ready",
      text: "[en] 请于2026年3月15日前答复。",
      version: 2,
    });

    const rows = await prisma.translationVersion.findMany({
      where: { messageId: message.id as string },
      orderBy: { version: "asc" },
    });
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ version: 1, status: "failed", text: null });
    expect(rows[1]).toMatchObject({ version: 2, status: "done" });

    // A settled translation is reused, not re-requested.
    const again = await translate(message.id as string, cookie);
    expect(again.status).toBe(200);
    expect(fakeLlmTranslationProvider.calls).toHaveLength(2);
  });

  it("key-field mismatch routes the version to needs_review and the doubtful translation is never displayed (REQ-TR-05)", async () => {
    const { kase, cookie, lawyerCookie } = await seedChat();
    const sourceText = "损害赔偿金 2,300,000 元，请于2026年3月15日前支付。";
    const message = await send(kase.id, lawyerCookie, sourceText, "f-kfc-1");
    fakeLlmTranslationProvider.setFixedResponse(
      "compensation 2,300,001 USD, please pay before 2026-03-15.",
    );

    const res = await translate(message.id as string, cookie);
    expect(res.status).toBe(201);
    expect((await res.json()).translation).toEqual({
      targetLang: "en",
      state: "needs_review",
      text: null,
      version: 1,
    });

    // The doubtful text is stored for reviewers but withheld from reading views.
    const row = await prisma.translationVersion.findFirstOrThrow({
      where: { messageId: message.id as string },
    });
    expect(row.status).toBe("needs_review");
    expect(row.keyFieldCheck).toBe("mismatch:numbers,currency");
    expect(row.text).toContain("2,300,001");

    const list = await listFor(kase.id, cookie);
    expect(list[0]!.translation).toEqual({
      targetLang: "en",
      state: "needs_review",
      text: null,
      version: 1,
    });
    const manualList = await listFor(kase.id, cookie, "manual");
    expect((manualList[0]!.translation as Record<string, unknown>).text).toBeNull();
  });

  it("the provider payload is minimized to the message body and the two language codes (REQ-TR-06)", async () => {
    const { kase, cookie, lawyerCookie } = await seedChat();
    // The author has a registered (fictitious) email channel; it must never
    // reach the provider, nor may the rest of the case history.
    const first = await send(kase.id, lawyerCookie, "第一份材料已提交。", "f-min-1");
    await send(kase.id, cookie, "received, will reply", "f-min-2");
    await translate(first.id as string, cookie);

    expect(fakeLlmTranslationProvider.calls).toHaveLength(1);
    expect(fakeLlmTranslationProvider.calls[0]).toEqual({
      text: "第一份材料已提交。",
      sourceLang: "zh-Hans",
      targetLang: "en",
    });
    expect(JSON.stringify(fakeLlmTranslationProvider.calls)).not.toContain("@");
  });
});
