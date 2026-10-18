import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  GET as listMessages,
  POST as sendMessage,
} from "@/app/api/cases/[id]/messages/route";
import { POST as translateMessage } from "@/app/api/messages/[id]/translate/route";
import { POST as releaseTranslation } from "@/app/api/messages/[id]/translate/release/route";
import { GET as reviewTranslation } from "@/app/api/messages/[id]/translate/review/route";
import { prisma } from "@/lib/db";
import { fakeLlmTranslationProvider } from "@/server/providers/llm/fake";

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
  const { kase, coordinator, cookie: coordinatorCookie } =
    await seedCaseWithCoordinator("Release Case");
  await prisma.user.update({
    where: { id: coordinator.id },
    data: { preferredLang: "en" },
  });
  const { user: lawyer } = await createVerifiedUser("lawyer", "lawyer-rel@example.com");
  await addMember(kase.id, lawyer.id, "lawyer");
  const lawyerCookie = await sessionCookieFor(lawyer.id);
  return { kase, coordinator, coordinatorCookie, lawyer, lawyerCookie };
}

// A translation whose numbers diverge from the source ends as needs_review.
async function seedFlagged(kase: { id: string }, coordinatorCookie: string, lawyerCookie: string) {
  const sent = await sendMessage(
    postMessage(
      kase.id,
      lawyerCookie,
      { sourceText: "损害赔偿金 2,300,000 元，请于2026年3月15日前支付。" },
      { "idempotency-key": "rel-1" },
    ),
    params(kase.id),
  );
  expect(sent.status).toBe(201);
  const message = (await sent.json()).message as { id: string };
  fakeLlmTranslationProvider.setFixedResponse(
    "compensation 2,300,001 USD, please pay before 2026-03-15.",
  );
  const res = await translateMessage(
    sendJson("POST", `/api/messages/${message.id}/translate`, {}, cookieHeader(coordinatorCookie)),
    params(message.id),
  );
  expect(res.status).toBe(201);
  expect((await res.json()).translation.state).toBe("needs_review");
  return message;
}

describe("needs_review release (REQ-TR-05)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });
  afterEach(() => fakeLlmTranslationProvider.reset());

  it("the coordinator reviews the flagged text and releases it; readers then see it", async () => {
    const { kase, coordinatorCookie, lawyerCookie } = await seedChat();
    const message = await seedFlagged(kase, coordinatorCookie, lawyerCookie);

    // Before release the reading view never carries the doubtful text (the
    // coordinator reads with targetLang en in this fixture).
    const before = await listMessages(
      sendJson(
        "GET",
        `/api/cases/${kase.id}/messages?mode=auto`,
        {},
        cookieHeader(coordinatorCookie),
      ),
      params(kase.id),
    );
    const beforeItem = (await before.json()).messages[0];
    expect(beforeItem.translation.state).toBe("needs_review");
    expect(beforeItem.translation.text).toBeNull();

    // The coordinator fetches the flagged text plus the checker verdict.
    const review = await reviewTranslation(
      sendJson(
        "GET",
        `/api/messages/${message.id}/translate/review?targetLang=en`,
        {},
        cookieHeader(coordinatorCookie),
      ),
      params(message.id),
    );
    expect(review.status).toBe(200);
    const reviewBody = await review.json();
    expect(reviewBody.review.text).toContain("2,300,001");
    expect(reviewBody.review.keyFieldCheck).toBe("mismatch:numbers,currency");
    expect(reviewBody.review.version).toBe(1);

    const released = await releaseTranslation(
      sendJson(
        "POST",
        `/api/messages/${message.id}/translate/release`,
        { targetLang: "en" },
        cookieHeader(coordinatorCookie),
      ),
      params(message.id),
    );
    expect(released.status).toBe(200);
    expect((await released.json()).translation).toMatchObject({ state: "ready" });

    const row = await prisma.translationVersion.findFirstOrThrow({
      where: { messageId: message.id },
    });
    expect(row.status).toBe("done");

    // After release the reading view carries the text (machine tag included).
    const after = await listMessages(
      sendJson(
        "GET",
        `/api/cases/${kase.id}/messages?mode=auto`,
        {},
        cookieHeader(coordinatorCookie),
      ),
      params(kase.id),
    );
    const afterItem = (await after.json()).messages[0];
    expect(afterItem.translation.state).toBe("ready");
    expect(afterItem.translation.text).toContain("2,300,001");

    const audit = await prisma.auditLog.findFirstOrThrow({
      where: { targetId: message.id, action: "translation.release" },
    });
    expect(audit.result).toBe("success");
  });

  it("clients and lawyers get a plain 404 for review and release", async () => {
    const { kase, coordinatorCookie, lawyerCookie } = await seedChat();
    const message = await seedFlagged(kase, coordinatorCookie, lawyerCookie);

    const review = await reviewTranslation(
      sendJson(
        "GET",
        `/api/messages/${message.id}/translate/review?targetLang=en`,
        {},
        cookieHeader(lawyerCookie),
      ),
      params(message.id),
    );
    expect(review.status).toBe(404);
    const release = await releaseTranslation(
      sendJson(
        "POST",
        `/api/messages/${message.id}/translate/release`,
        { targetLang: "en" },
        cookieHeader(lawyerCookie),
      ),
      params(message.id),
    );
    expect(release.status).toBe(404);

    const row = await prisma.translationVersion.findFirstOrThrow({
      where: { messageId: message.id },
    });
    expect(row.status).toBe("needs_review");
  });

  it("release is 409 when the latest version is not needs_review", async () => {
    const { kase, coordinatorCookie, lawyerCookie } = await seedChat();
    const message = await seedFlagged(kase, coordinatorCookie, lawyerCookie);

    // Releasing twice: the second attempt finds a done version.
    const first = await releaseTranslation(
      sendJson(
        "POST",
        `/api/messages/${message.id}/translate/release`,
        { targetLang: "en" },
        cookieHeader(coordinatorCookie),
      ),
      params(message.id),
    );
    expect(first.status).toBe(200);
    const second = await releaseTranslation(
      sendJson(
        "POST",
        `/api/messages/${message.id}/translate/release`,
        { targetLang: "en" },
        cookieHeader(coordinatorCookie),
      ),
      params(message.id),
    );
    expect(second.status).toBe(409);
  });
});
