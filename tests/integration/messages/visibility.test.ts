import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  GET as listMessages,
  POST as sendMessage,
} from "@/app/api/cases/[id]/messages/route";
import { GET as openStream } from "@/app/api/cases/[id]/stream/route";
import { prisma } from "@/lib/db";
import { setMessageCheckerForTests } from "@/modules/messages/check";

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
  const { kase, coordinator, cookie } = await seedCaseWithCoordinator("Visibility Case");
  const { user: lawyer } = await createVerifiedUser("lawyer", "lawyer-vis@example.com");
  await addMember(kase.id, lawyer.id, "lawyer");
  const lawyerCookie = await sessionCookieFor(lawyer.id);
  return { kase, coordinator, cookie, lawyer, lawyerCookie };
}

async function listFor(caseId: string, cookie: string, query = "") {
  const res = await listMessages(
    sendJson("GET", `/api/cases/${caseId}/messages${query}`, {}, cookieHeader(cookie)),
    params(caseId),
  );
  expect(res.status).toBe(200);
  return (await res.json()).messages as Array<Record<string, unknown>>;
}

describe("message visibility (REQ-MSG-03/06, REQ-PM-09)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });
  afterEach(() => {
    setMessageCheckerForTests();
  });

  it("pending_review messages are invisible to the receiver but visible to the author", async () => {
    const { kase, cookie, lawyerCookie } = await seedChat();
    setMessageCheckerForTests({ check: async () => "needs_review" });

    const res = await sendMessage(
      postMessage(kase.id, lawyerCookie, { sourceText: "held text" }, { "idempotency-key": "v-1" }),
      params(kase.id),
    );
    expect(res.status).toBe(201);

    const authorList = await listFor(kase.id, lawyerCookie);
    expect(authorList).toHaveLength(1);
    expect(authorList[0]!.status).toBe("pending_review");

    const receiverList = await listFor(kase.id, cookie);
    expect(receiverList).toHaveLength(0);
  });

  it("check failure keeps the message in check_failed, invisible to the receiver", async () => {
    const { kase, cookie, lawyerCookie } = await seedChat();
    setMessageCheckerForTests({
      check: async () => {
        throw new Error("checker down");
      },
    });

    const res = await sendMessage(
      postMessage(kase.id, lawyerCookie, { sourceText: "unlucky" }, { "idempotency-key": "v-2" }),
      params(kase.id),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.message.status).toBe("check_failed");

    const row = await prisma.message.findUniqueOrThrow({ where: { id: body.message.id } });
    expect(row.status).toBe("check_failed");
    expect(row.publishedAt).toBeNull();

    const authorList = await listFor(kase.id, lawyerCookie);
    expect(authorList.map((m) => m.status)).toEqual(["check_failed"]);
    const receiverList = await listFor(kase.id, cookie);
    expect(receiverList).toHaveLength(0);
  });

  it("the receiver's incremental backfill skips non-published messages", async () => {
    const { kase, cookie, lawyerCookie } = await seedChat();
    setMessageCheckerForTests({ check: async () => "needs_review" });
    const held = await sendMessage(
      postMessage(kase.id, lawyerCookie, { sourceText: "held" }, { "idempotency-key": "v-3a" }),
      params(kase.id),
    );
    const heldId = (await held.json()).message.id as string;

    setMessageCheckerForTests();
    const published = await sendMessage(
      postMessage(kase.id, lawyerCookie, { sourceText: "clear" }, { "idempotency-key": "v-3b" }),
      params(kase.id),
    );
    const publishedId = (await published.json()).message.id as string;

    const backfill = await listFor(kase.id, cookie, `?after=${publishedId}`);
    expect(backfill).toHaveLength(0);
    const ids = await prisma.message.findMany({ where: { caseId: kase.id }, select: { id: true } });
    expect(ids.map((r) => r.id).sort()).toEqual([heldId, publishedId].sort());
  });

  it("published messages are visible to all members with no contact channels in the payload", async () => {
    const { kase, cookie, lawyerCookie } = await seedChat();
    await sendMessage(
      postMessage(kase.id, lawyerCookie, { sourceText: "xin chào" }, { "idempotency-key": "v-4" }),
      params(kase.id),
    );
    const receiverList = await listFor(kase.id, cookie);
    expect(receiverList).toHaveLength(1);
    expect(receiverList[0]!.status).toBe("published");
    expect(receiverList[0]!.authorDisplayName).toBe("lawyer-vis");
    expect(JSON.stringify(receiverList)).not.toContain("@");
  });

  it("SSE pushes only published messages", async () => {
    const { kase, cookie, lawyerCookie } = await seedChat();
    const streamRes = await openStream(
      sendJson("GET", `/api/cases/${kase.id}/stream`, {}, cookieHeader(cookie)),
      params(kase.id),
    );
    expect(streamRes.status).toBe(200);
    const reader = streamRes.body!.getReader();
    const decoder = new TextDecoder();
    await reader.read(); // subscription banner

    setMessageCheckerForTests({ check: async () => "needs_review" });
    const held = await sendMessage(
      postMessage(kase.id, lawyerCookie, { sourceText: "held" }, { "idempotency-key": "v-5a" }),
      params(kase.id),
    );
    const heldId = (await held.json()).message.id as string;

    setMessageCheckerForTests();
    const clear = await sendMessage(
      postMessage(kase.id, lawyerCookie, { sourceText: "clear" }, { "idempotency-key": "v-5b" }),
      params(kase.id),
    );
    const clearId = (await clear.json()).message.id as string;

    const { value } = await reader.read();
    const event = decoder.decode(value);
    expect(event).toContain(clearId);
    expect(event).not.toContain(heldId);
    await reader.cancel();
  });
});
