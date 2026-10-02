import { beforeEach, describe, expect, it } from "vitest";

import { randomUUID } from "node:crypto";

import {
  GET as listMessages,
  POST as sendMessage,
} from "@/app/api/cases/[id]/messages/route";
import { GET as openStream } from "@/app/api/cases/[id]/stream/route";

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
  const { kase, cookie } = await seedCaseWithCoordinator("Stream Case");
  const { user: lawyer } = await createVerifiedUser("lawyer", "lawyer-sse@example.com");
  await addMember(kase.id, lawyer.id, "lawyer");
  const lawyerCookie = await sessionCookieFor(lawyer.id);
  return { kase, cookie, lawyer, lawyerCookie };
}

async function publish(caseId: string, cookie: string, key: string, text: string) {
  const res = await sendMessage(
    postMessage(caseId, cookie, { sourceText: text }, { "idempotency-key": key }),
    params(caseId),
  );
  expect(res.status).toBe(201);
  return (await res.json()).message.id as string;
}

describe("SSE subscription and reconnect backfill (REQ-MSG-05, REQ-PM-08)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("members can subscribe and receive published message events", async () => {
    const { kase, cookie, lawyerCookie } = await seedChat();
    const res = await openStream(
      sendJson("GET", `/api/cases/${kase.id}/stream`, {}, cookieHeader(lawyerCookie)),
      params(kase.id),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    const banner = decoder.decode((await reader.read()).value);
    expect(banner.length).toBeGreaterThan(0);

    const messageId = await publish(kase.id, cookie, "s-1", "first message");
    const event = decoder.decode((await reader.read()).value);
    expect(event).toContain("event: message");
    expect(event).toContain(messageId);
    expect(event).not.toContain("@");
    await reader.cancel();
  });

  it("non-members cannot subscribe", async () => {
    const { kase } = await seedChat();
    const { user: outsider } = await createVerifiedUser("lawyer", "outsider@example.com");
    const outsiderCookie = await sessionCookieFor(outsider.id);
    const res = await openStream(
      sendJson("GET", `/api/cases/${kase.id}/stream`, {}, cookieHeader(outsiderCookie)),
      params(kase.id),
    );
    expect(res.status).toBe(403);
  });

  it("unauthenticated requests cannot subscribe", async () => {
    const { kase } = await seedChat();
    const res = await openStream(
      sendJson("GET", `/api/cases/${kase.id}/stream`, {}),
      params(kase.id),
    );
    expect(res.status).toBe(401);
  });

  it("a revoked member is denied on a fresh subscription", async () => {
    const { kase, cookie, lawyer, lawyerCookie } = await seedChat();
    const { DELETE: revokeMember } = await import("@/app/api/cases/[id]/members/[uid]/route");
    const revoke = await revokeMember(
      sendJson("DELETE", `/api/cases/${kase.id}/members/${lawyer.id}`, {}, cookieHeader(cookie)),
      { params: Promise.resolve({ id: kase.id, uid: lawyer.id }) },
    );
    expect(revoke.status).toBe(200);

    const res = await openStream(
      sendJson("GET", `/api/cases/${kase.id}/stream`, {}, cookieHeader(lawyerCookie)),
      params(kase.id),
    );
    expect(res.status).toBe(403);
  });

  it("backfill after a disconnect loses nothing and duplicates nothing", async () => {
    const { kase, cookie, lawyerCookie } = await seedChat();
    const first = await publish(kase.id, cookie, "b-1", "one");
    await publish(kase.id, cookie, "b-2", "two");
    // client "disconnects" having seen only the first two messages
    const third = await publish(kase.id, cookie, "b-3", "three");
    const fourth = await publish(kase.id, cookie, "b-4", "four");

    const res = await listMessages(
      sendJson("GET", `/api/cases/${kase.id}/messages?after=${first}`, {}, cookieHeader(lawyerCookie)),
      params(kase.id),
    );
    expect(res.status).toBe(200);
    const { messages } = await res.json();
    const ids = messages.map((m: { id: string }) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(3);
    expect(ids).toContain(third);
    expect(ids).toContain(fourth);
    expect(ids).not.toContain(first);
  });

  it("after= with the newest message returns an empty list", async () => {
    const { kase, cookie, lawyerCookie } = await seedChat();
    await publish(kase.id, cookie, "c-1", "one");
    const last = await publish(kase.id, cookie, "c-2", "two");
    const res = await listMessages(
      sendJson("GET", `/api/cases/${kase.id}/messages?after=${last}`, {}, cookieHeader(lawyerCookie)),
      params(kase.id),
    );
    expect(res.status).toBe(200);
    const { messages } = await res.json();
    expect(messages).toEqual([]);
  });

  it("after= with an unknown message id is rejected", async () => {
    const { kase, lawyerCookie } = await seedChat();
    const res = await listMessages(
      sendJson(
        "GET",
        `/api/cases/${kase.id}/messages?after=${randomUUID()}`,
        {},
        cookieHeader(lawyerCookie),
      ),
      params(kase.id),
    );
    expect(res.status).toBe(400);
  });

  it("non-members cannot list or backfill messages", async () => {
    const { kase } = await seedChat();
    const { user: outsider } = await createVerifiedUser("lawyer", "outsider2@example.com");
    const outsiderCookie = await sessionCookieFor(outsider.id);
    const res = await listMessages(
      sendJson("GET", `/api/cases/${kase.id}/messages`, {}, cookieHeader(outsiderCookie)),
      params(kase.id),
    );
    expect(res.status).toBe(403);
  });
});
