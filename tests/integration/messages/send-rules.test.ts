import { beforeEach, describe, expect, it } from "vitest";

import {
  GET as listMessages,
  POST as sendMessage,
} from "@/app/api/cases/[id]/messages/route";
import { POST as archiveCase } from "@/app/api/cases/[id]/archive/route";

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
  const { kase, cookie } = await seedCaseWithCoordinator("Rules Case");
  const { user: lawyer } = await createVerifiedUser("lawyer", "lawyer-rules@example.com");
  await addMember(kase.id, lawyer.id, "lawyer");
  const lawyerCookie = await sessionCookieFor(lawyer.id);
  return { kase, cookie, lawyerCookie };
}

describe("message send rules (REQ-MSG-08, REQ-CASE-05, REQ-PM-05)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("rejects text over 4000 characters and accepts exactly 4000", async () => {
    const { kase, cookie } = await seedChat();
    const tooLong = await sendMessage(
      postMessage(kase.id, cookie, { sourceText: "a".repeat(4001) }, { "idempotency-key": "r-1" }),
      params(kase.id),
    );
    expect(tooLong.status).toBe(400);

    const atLimit = await sendMessage(
      postMessage(kase.id, cookie, { sourceText: "汉".repeat(4000) }, { "idempotency-key": "r-2" }),
      params(kase.id),
    );
    expect(atLimit.status).toBe(201);
  });

  it("rejects empty or non-string text", async () => {
    const { kase, cookie } = await seedChat();
    const empty = await sendMessage(
      postMessage(kase.id, cookie, { sourceText: "" }, { "idempotency-key": "r-3" }),
      params(kase.id),
    );
    expect(empty.status).toBe(400);
    const missing = await sendMessage(
      postMessage(kase.id, cookie, {}, { "idempotency-key": "r-4" }),
      params(kase.id),
    );
    expect(missing.status).toBe(400);
  });

  it("rejects posting to an archived case with 409", async () => {
    const { kase, cookie } = await seedChat();
    const archived = await archiveCase(
      sendJson("POST", `/api/cases/${kase.id}/archive`, {}, cookieHeader(cookie)),
      params(kase.id),
    );
    expect(archived.status).toBe(200);

    const res = await sendMessage(
      postMessage(kase.id, cookie, { sourceText: "too late" }, { "idempotency-key": "r-5" }),
      params(kase.id),
    );
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe("case_archived");
  });

  it("a coordinator member posts through the same pipeline and is visible to others", async () => {
    const { kase, cookie, lawyerCookie } = await seedChat();
    const res = await sendMessage(
      postMessage(kase.id, cookie, { sourceText: "coordinator note" }, { "idempotency-key": "r-6" }),
      params(kase.id),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.message.status).toBe("published");

    const list = await listMessages(
      sendJson("GET", `/api/cases/${kase.id}/messages`, {}, cookieHeader(lawyerCookie)),
      params(kase.id),
    );
    const { messages } = await list.json();
    expect(messages).toHaveLength(1);
    expect(messages[0].sourceText).toBe("coordinator note");
  });

  it("heuristic source language is applied and an explicit value wins", async () => {
    const { kase, cookie } = await seedChat();
    const vi = await sendMessage(
      postMessage(kase.id, cookie, { sourceText: "Xin chào, tôi cần hỗ trợ" }, { "idempotency-key": "r-7" }),
      params(kase.id),
    );
    expect((await vi.json()).message.sourceLang).toBe("vi");

    const zh = await sendMessage(
      postMessage(kase.id, cookie, { sourceText: "你好，请问进展如何" }, { "idempotency-key": "r-8" }),
      params(kase.id),
    );
    expect((await zh.json()).message.sourceLang).toBe("zh-Hans");

    const explicit = await sendMessage(
      postMessage(
        kase.id,
        cookie,
        { sourceText: "hello", sourceLang: "en" },
        { "idempotency-key": "r-9" },
      ),
      params(kase.id),
    );
    expect((await explicit.json()).message.sourceLang).toBe("en");
  });
});
