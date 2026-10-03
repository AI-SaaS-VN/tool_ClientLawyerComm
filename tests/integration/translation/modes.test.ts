import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { GET as getMe, PATCH as updateMe } from "@/app/api/auth/me/route";
import {
  GET as listMessages,
  POST as sendMessage,
} from "@/app/api/cases/[id]/messages/route";
import { POST as translateMessage } from "@/app/api/messages/[id]/translate/route";
import { prisma } from "@/lib/db";
import { setMessageCheckerForTests } from "@/modules/messages/check";
import { fakeLlmTranslationProvider } from "@/server/providers/llm/fake";
import { LlmFailure } from "@/server/providers/llm/interface";

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

interface SeedOptions {
  coordinatorLang?: string;
  lawyerLang?: string;
}

async function seedChat(options: SeedOptions = {}) {
  const { kase, coordinator, cookie } = await seedCaseWithCoordinator("Translation Case");
  const { user: lawyer } = await createVerifiedUser("lawyer", "lawyer-tr@example.com");
  await addMember(kase.id, lawyer.id, "lawyer");
  if (options.coordinatorLang) {
    await prisma.user.update({
      where: { id: coordinator.id },
      data: { preferredLang: options.coordinatorLang },
    });
  }
  if (options.lawyerLang) {
    await prisma.user.update({
      where: { id: lawyer.id },
      data: { preferredLang: options.lawyerLang },
    });
  }
  const lawyerCookie = await sessionCookieFor(lawyer.id);
  return { kase, coordinator, cookie, lawyer, lawyerCookie };
}

async function send(
  caseId: string,
  cookie: string,
  text: string,
  key: string,
  extra: Record<string, unknown> = {},
) {
  const res = await sendMessage(
    postMessage(caseId, cookie, { sourceText: text, ...extra }, { "idempotency-key": key }),
    params(caseId),
  );
  expect(res.status).toBe(201);
  return (await res.json()).message as Record<string, unknown>;
}

async function listFor(caseId: string, cookie: string, mode?: string) {
  const suffix = mode ? `?mode=${mode}` : "";
  const res = await listMessages(
    sendJson("GET", `/api/cases/${caseId}/messages${suffix}`, {}, cookieHeader(cookie)),
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

describe("translation modes (REQ-TR-01/02/03/04/07, REQ-MSG-09)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });
  afterEach(() => {
    setMessageCheckerForTests();
    fakeLlmTranslationProvider.reset();
  });

  it("auto mode translates published messages into the reader's preferred language and records provider/model/prompt version (REQ-TR-03)", async () => {
    const { kase, cookie, lawyerCookie } = await seedChat({ coordinatorLang: "en" });
    const message = await send(kase.id, lawyerCookie, "请于2026年3月15日前答复。", "t-auto-1");

    const coordinatorList = await listFor(kase.id, cookie, "auto");
    expect(coordinatorList).toHaveLength(1);
    expect(coordinatorList[0]!.translation).toEqual({
      targetLang: "en",
      state: "ready",
      text: "[en] 请于2026年3月15日前答复。",
      version: 1,
    });

    const row = await prisma.translationVersion.findFirstOrThrow({
      where: { messageId: message.id as string },
    });
    expect(row).toMatchObject({
      targetLang: "en",
      version: 1,
      status: "done",
      provider: "fake",
      model: "fake-translator",
      promptVersion: "fake-prompt-v1",
      keyFieldCheck: "pass",
    });

    // The lawyer's own default preference is vi (REQ-TR-01 role defaults).
    const lawyerList = await listFor(kase.id, lawyerCookie, "auto");
    expect(lawyerList[0]!.translation).toMatchObject({ targetLang: "vi", state: "ready" });
  });

  it("auto mode shows a waiting state while a translation is unfinished and never substitutes the foreign source (REQ-MSG-09)", async () => {
    const { kase, cookie, lawyerCookie } = await seedChat({ coordinatorLang: "en" });
    const message = await send(kase.id, lawyerCookie, "请于2026年3月15日前答复。", "t-wait-1");
    await prisma.translationVersion.create({
      data: { messageId: message.id as string, targetLang: "en", version: 1, status: "queued" },
    });

    const list = await listFor(kase.id, cookie, "auto");
    const view = list[0]!.translation as Record<string, unknown>;
    expect(view).toEqual({ targetLang: "en", state: "waiting", text: null, version: 1 });
    // The unfinished row is left alone — no new version, no provider call.
    expect(await prisma.translationVersion.count({ where: { messageId: message.id as string } })).toBe(1);
    expect(fakeLlmTranslationProvider.calls).toHaveLength(0);
  });

  it("zh-Hans ↔ zh-Hant uses the deterministic converter, still creates a version, and skips the LLM provider (REQ-TR-01)", async () => {
    const { kase, cookie, lawyerCookie } = await seedChat({
      coordinatorLang: "zh-Hant",
      lawyerLang: "zh-Hans",
    });
    await send(kase.id, lawyerCookie, "损害赔偿金 2,300,000 元。", "t-zh-1");
    const coordinatorList = await listFor(kase.id, cookie, "auto");
    expect(coordinatorList[0]!.translation).toEqual({
      targetLang: "zh-Hant",
      state: "ready",
      text: "損害賠償金 2,300,000 元。",
      version: 1,
    });

    await send(
      kase.id,
      cookie,
      "法院訴訟費約 120,000 元。",
      "t-zh-2",
      { sourceLang: "zh-Hant" },
    );
    const lawyerList = await listFor(kase.id, lawyerCookie, "auto");
    expect(lawyerList[1]!.translation).toEqual({
      targetLang: "zh-Hans",
      state: "ready",
      text: "法院诉讼费约 120,000 元。",
      version: 1,
    });

    const rows = await prisma.translationVersion.findMany();
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(row).toMatchObject({
        provider: "zh-converter",
        model: "static-map-v1",
        promptVersion: null,
        status: "done",
        keyFieldCheck: "pass",
      });
    }
    expect(fakeLlmTranslationProvider.calls).toHaveLength(0);
  });

  it("same-language messages are not re-translated and produce no version rows (REQ-TR-02)", async () => {
    const { kase, cookie, lawyerCookie } = await seedChat(); // coordinator defaults to zh-Hans
    const message = await send(kase.id, lawyerCookie, "请查收附件材料。", "t-same-1");

    const list = await listFor(kase.id, cookie, "auto");
    expect(list[0]!.translation).toEqual({
      targetLang: "zh-Hans",
      state: "same_language",
      text: null,
      version: null,
    });
    expect(await prisma.translationVersion.count({ where: { messageId: message.id as string } })).toBe(0);
    expect(fakeLlmTranslationProvider.calls).toHaveLength(0);
  });

  it("manual mode never translates on list; clicking translate creates one version and repeated clicks reuse it (REQ-TR-02)", async () => {
    const { kase, cookie, lawyerCookie } = await seedChat({ coordinatorLang: "en" });
    const message = await send(kase.id, lawyerCookie, "请查收附件材料。", "t-man-1");

    const before = await listFor(kase.id, cookie, "manual");
    expect(before[0]!.translation).toEqual({
      targetLang: "en",
      state: "none",
      text: null,
      version: null,
    });
    expect(await prisma.translationVersion.count()).toBe(0);
    expect(fakeLlmTranslationProvider.calls).toHaveLength(0);

    const first = await translate(message.id as string, cookie);
    expect(first.status).toBe(201);
    expect((await first.json()).translation).toEqual({
      targetLang: "en",
      state: "ready",
      text: "[en] 请查收附件材料。",
      version: 1,
    });

    const second = await translate(message.id as string, cookie);
    expect(second.status).toBe(200);
    expect((await second.json()).translation).toMatchObject({ state: "ready", version: 1 });
    expect(await prisma.translationVersion.count()).toBe(1);
    expect(fakeLlmTranslationProvider.calls).toHaveLength(1);

    // An explicit target language is honoured and validated.
    const vi = await translate(message.id as string, cookie, { targetLang: "vi" });
    expect(vi.status).toBe(201);
    expect((await vi.json()).translation).toMatchObject({ targetLang: "vi", state: "ready" });
    const bad = await translate(message.id as string, cookie, { targetLang: "fr" });
    expect(bad.status).toBe(400);
    expect((await bad.json()).error).toBe("invalid_target_lang");
  });

  it("language correction by the author triggers re-translation as a new version and preserves history (REQ-TR-07/REQ-TR-04)", async () => {
    const { kase, cookie, lawyer, lawyerCookie } = await seedChat({ coordinatorLang: "en" });
    // The heuristic sees CJK and stores zh-Hans, but the text is Traditional.
    const message = await send(kase.id, lawyerCookie, "損害賠償金 2,300,000 元。", "t-corr-1");
    expect(message.sourceLang).toBe("zh-Hans");

    const first = await translate(message.id as string, cookie);
    expect(first.status).toBe(201);

    // A non-author may not correct the language.
    const denied = await translate(message.id as string, cookie, { sourceLang: "zh-Hant" });
    expect(denied.status).toBe(403);

    const corrected = await translate(message.id as string, lawyerCookie, {
      sourceLang: "zh-Hant",
      targetLang: "vi",
    });
    expect(corrected.status).toBe(201);
    expect((await corrected.json()).translation).toMatchObject({
      targetLang: "vi",
      state: "ready",
      version: 1,
    });

    const row = await prisma.message.findUniqueOrThrow({ where: { id: message.id as string } });
    expect(row.sourceLang).toBe("zh-Hant");
    expect(row.correctedById).toBe(lawyer.id);

    // History is append-only: the pre-correction en version is untouched.
    const versions = await prisma.translationVersion.findMany({
      where: { messageId: message.id as string },
      orderBy: { createdAt: "asc" },
    });
    expect(versions).toHaveLength(2);
    expect(versions[0]).toMatchObject({ targetLang: "en", version: 1, status: "done" });
    expect(versions[1]).toMatchObject({ targetLang: "vi", version: 1, status: "done" });

    // A bad correction code is rejected.
    const invalid = await translate(message.id as string, lawyerCookie, { sourceLang: "jp" });
    expect(invalid.status).toBe(400);
    expect((await invalid.json()).error).toBe("invalid_source_lang");
  });

  it("auto mode backfills missing translations in parallel, and one failure never blocks the others (F07, REQ-MSG-10)", async () => {
    const { kase, cookie, lawyerCookie } = await seedChat({ coordinatorLang: "en" });
    await send(kase.id, lawyerCookie, "第一份材料已提交。", "t-par-1");
    await send(kase.id, lawyerCookie, "请确认开庭时间。", "t-par-2");
    await send(kase.id, lawyerCookie, "第三份材料稍后补交。", "t-par-3");

    let inFlight = 0;
    let maxInFlight = 0;
    let entered = 0;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const originalTranslate = fakeLlmTranslationProvider.translate;
    fakeLlmTranslationProvider.translate = async (input) => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      entered += 1;
      if (entered === 3) release();
      // Every call waits until all three have started; a serial backfill
      // would deadlock here, so the gate falls through after 3s and the
      // maxInFlight assertion below fails instead.
      await Promise.race([gate, new Promise((resolve) => setTimeout(resolve, 3000))]);
      try {
        return await originalTranslate.call(fakeLlmTranslationProvider, input);
      } finally {
        inFlight -= 1;
      }
    };
    fakeLlmTranslationProvider.setFixedResponse((input) => {
      if (input.text.includes("开庭")) throw new LlmFailure("timeout");
      return `[${input.targetLang}] ${input.text}`;
    });
    try {
      const list = await listFor(kase.id, cookie, "auto");
      expect(list).toHaveLength(3);
      // All three calls overlapped — a serial backfill would never exceed 1.
      expect(maxInFlight).toBe(3);
      const byText = new Map(list.map((m) => [m.sourceText, m.translation]));
      expect(byText.get("第一份材料已提交。")).toMatchObject({ state: "ready", version: 1 });
      expect(byText.get("请确认开庭时间。")).toEqual({
        targetLang: "en",
        state: "failed",
        text: null,
        version: 1,
      });
      expect(byText.get("第三份材料稍后补交。")).toMatchObject({ state: "ready", version: 1 });

      const rows = await prisma.translationVersion.findMany();
      expect(rows).toHaveLength(3);
      expect(rows.filter((r) => r.status === "done")).toHaveLength(2);
      expect(rows.filter((r) => r.status === "failed")).toHaveLength(1);

      // A re-list reuses the settled rows and does not re-run the failed one.
      fakeLlmTranslationProvider.reset();
      const again = await listFor(kase.id, cookie, "auto");
      expect(again.map((m) => (m.translation as Record<string, unknown>).state)).toEqual(
        expect.arrayContaining(["ready", "ready", "failed"]),
      );
      expect(fakeLlmTranslationProvider.calls).toHaveLength(0);
    } finally {
      fakeLlmTranslationProvider.translate = originalTranslate;
    }
  });

  it("PATCH /api/auth/me stores language preferences and rejects unsupported codes (REQ-TR-01)", async () => {
    const { coordinator, cookie } = await seedChat({});

    const res = await updateMe(
      sendJson(
        "PATCH",
        "/api/auth/me",
        { preferredLang: "zh-Hant", uiLang: "vi" },
        cookieHeader(cookie),
      ),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.preferredLang).toBe("zh-Hant");
    expect(body.user.uiLang).toBe("vi");
    const stored = await prisma.user.findUniqueOrThrow({ where: { id: coordinator.id } });
    expect(stored.preferredLang).toBe("zh-Hant");

    const me = await getMe(sendJson("GET", "/api/auth/me", {}, cookieHeader(cookie)));
    expect((await me.json()).user.preferredLang).toBe("zh-Hant");

    const bad = await updateMe(
      sendJson("PATCH", "/api/auth/me", { preferredLang: "fr" }, cookieHeader(cookie)),
    );
    expect(bad.status).toBe(400);
    expect((await bad.json()).error).toBe("invalid_lang");
  });
});
