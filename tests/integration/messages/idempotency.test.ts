import { beforeEach, describe, expect, it } from "vitest";

import { POST as sendMessage } from "@/app/api/cases/[id]/messages/route";
import { prisma } from "@/lib/db";

import {
  addMember,
  createVerifiedUser,
  postMessage,
  resetDatabase,
  seedCaseWithCoordinator,
  sessionCookieFor,
} from "../helpers";

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("message idempotency (REQ-MSG-02)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("returns the same message for a repeated submission under the same key", async () => {
    const { kase, cookie } = await seedCaseWithCoordinator("Idem Case");
    const req = () =>
      sendMessage(
        postMessage(kase.id, cookie, { sourceText: "hello" }, { "idempotency-key": "key-1" }),
        params(kase.id),
      );

    const first = await req();
    expect(first.status).toBe(201);
    const second = await req();
    expect(second.status).toBe(200);

    const firstBody = await first.json();
    const secondBody = await second.json();
    expect(secondBody.message.id).toBe(firstBody.message.id);

    const count = await prisma.message.count({ where: { caseId: kase.id } });
    expect(count).toBe(1);
  });

  it("creates distinct messages for distinct keys", async () => {
    const { kase, cookie } = await seedCaseWithCoordinator("Idem Case 2");
    const a = await sendMessage(
      postMessage(kase.id, cookie, { sourceText: "one" }, { "idempotency-key": "key-a" }),
      params(kase.id),
    );
    const b = await sendMessage(
      postMessage(kase.id, cookie, { sourceText: "two" }, { "idempotency-key": "key-b" }),
      params(kase.id),
    );
    expect(a.status).toBe(201);
    expect(b.status).toBe(201);
    const count = await prisma.message.count({ where: { caseId: kase.id } });
    expect(count).toBe(2);
  });

  it("the same key in a different case or by a different author is independent", async () => {
    const { kase, cookie } = await seedCaseWithCoordinator("Idem Case 3");
    const { user: lawyer } = await createVerifiedUser("lawyer", "lawyer-idem@example.com");
    await addMember(kase.id, lawyer.id, "lawyer");
    const lawyerCookie = await sessionCookieFor(lawyer.id);

    await sendMessage(
      postMessage(kase.id, cookie, { sourceText: "mine" }, { "idempotency-key": "key-x" }),
      params(kase.id),
    );
    const other = await sendMessage(
      postMessage(kase.id, lawyerCookie, { sourceText: "mine" }, { "idempotency-key": "key-x" }),
      params(kase.id),
    );
    expect(other.status).toBe(201);
    const count = await prisma.message.count({ where: { caseId: kase.id } });
    expect(count).toBe(2);
  });

  it("rejects a submission without an Idempotency-Key", async () => {
    const { kase, cookie } = await seedCaseWithCoordinator("Idem Case 4");
    const res = await sendMessage(
      postMessage(kase.id, cookie, { sourceText: "no key" }),
      params(kase.id),
    );
    expect(res.status).toBe(400);
  });

  it("concurrent retries with the same key produce exactly one message", async () => {
    const { kase, cookie } = await seedCaseWithCoordinator("Idem Case 5");
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        sendMessage(
          postMessage(kase.id, cookie, { sourceText: "race" }, { "idempotency-key": "key-race" }),
          params(kase.id),
        ),
      ),
    );
    const bodies = await Promise.all(results.map((r) => r.json()));
    const ids = new Set(bodies.map((b) => b.message.id));
    expect(ids.size).toBe(1);
    const count = await prisma.message.count({ where: { caseId: kase.id } });
    expect(count).toBe(1);
  });
});
