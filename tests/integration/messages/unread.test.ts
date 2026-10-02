import { beforeEach, describe, expect, it } from "vitest";

import { GET as listMyCases } from "@/app/api/cases/route";
import { GET as getCase } from "@/app/api/cases/[id]/route";
import {
  GET as listMessages,
  POST as sendMessage,
} from "@/app/api/cases/[id]/messages/route";

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
  const { kase, cookie } = await seedCaseWithCoordinator("Unread Case");
  const { user: lawyer } = await createVerifiedUser("lawyer", "lawyer-unread@example.com");
  await addMember(kase.id, lawyer.id, "lawyer");
  const lawyerCookie = await sessionCookieFor(lawyer.id);
  return { kase, cookie, lawyerCookie };
}

async function unreadFromList(cookie: string, caseId: string): Promise<number> {
  const res = await listMyCases(sendJson("GET", "/api/cases", {}, cookieHeader(cookie)));
  expect(res.status).toBe(200);
  const { cases } = await res.json();
  const mine = cases.find((c: { id: string }) => c.id === caseId);
  return mine.unreadCount as number;
}

describe("unread counts (REQ-MSG-07)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("counts only published messages from other members, visible to the owner only", async () => {
    const { kase, cookie, lawyerCookie } = await seedChat();
    expect(await unreadFromList(cookie, kase.id)).toBe(0);

    await sendMessage(
      postMessage(kase.id, cookie, { sourceText: "one" }, { "idempotency-key": "u-1" }),
      params(kase.id),
    );
    await sendMessage(
      postMessage(kase.id, cookie, { sourceText: "two" }, { "idempotency-key": "u-2" }),
      params(kase.id),
    );

    expect(await unreadFromList(lawyerCookie, kase.id)).toBe(2);
    // the author's own messages are not unread for the author
    expect(await unreadFromList(cookie, kase.id)).toBe(0);
  });

  it("case detail carries the requester's unread count", async () => {
    const { kase, cookie, lawyerCookie } = await seedChat();
    await sendMessage(
      postMessage(kase.id, cookie, { sourceText: "ping" }, { "idempotency-key": "u-3" }),
      params(kase.id),
    );
    const res = await getCase(
      sendJson("GET", `/api/cases/${kase.id}`, {}, cookieHeader(lawyerCookie)),
      params(kase.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.case.unreadCount).toBe(1);
  });

  it("reading the message list clears the unread count", async () => {
    const { kase, cookie, lawyerCookie } = await seedChat();
    await sendMessage(
      postMessage(kase.id, cookie, { sourceText: "one" }, { "idempotency-key": "u-4" }),
      params(kase.id),
    );
    await sendMessage(
      postMessage(kase.id, cookie, { sourceText: "two" }, { "idempotency-key": "u-5" }),
      params(kase.id),
    );
    expect(await unreadFromList(lawyerCookie, kase.id)).toBe(2);

    const read = await listMessages(
      sendJson("GET", `/api/cases/${kase.id}/messages`, {}, cookieHeader(lawyerCookie)),
      params(kase.id),
    );
    expect(read.status).toBe(200);
    expect(await unreadFromList(lawyerCookie, kase.id)).toBe(0);

    await sendMessage(
      postMessage(kase.id, cookie, { sourceText: "three" }, { "idempotency-key": "u-6" }),
      params(kase.id),
    );
    expect(await unreadFromList(lawyerCookie, kase.id)).toBe(1);
  });
});
