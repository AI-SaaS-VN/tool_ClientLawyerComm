import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { GET as listMessages, POST as sendMessage } from "@/app/api/cases/[id]/messages/route";
import { POST as appealTask } from "@/app/api/review/tasks/[id]/appeal/route";
import { POST as approveTask } from "@/app/api/review/tasks/[id]/approve/route";
import { POST as rejectTask } from "@/app/api/review/tasks/[id]/reject/route";
import { POST as returnTask } from "@/app/api/review/tasks/[id]/return/route";
import { GET as listReviewTasks } from "@/app/api/review/tasks/route";
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
  const { kase, coordinator, cookie } = await seedCaseWithCoordinator("Decision Case");
  const { user: lawyer } = await createVerifiedUser("lawyer", "lawyer-decisions@example.com");
  await addMember(kase.id, lawyer.id, "lawyer");
  const lawyerCookie = await sessionCookieFor(lawyer.id);
  return { kase, coordinator, cookie, lawyer, lawyerCookie };
}

async function sendHeld(caseId: string, cookie: string, key: string) {
  const res = await sendMessage(
    postMessage(caseId, cookie, { sourceText: "这个案件你们律所收费多少？" }, { "idempotency-key": key }),
    params(caseId),
  );
  expect(res.status).toBe(201);
  const message = (await res.json()).message as Record<string, unknown>;
  expect(message.status).toBe("pending_review");
  const task = await prisma.reviewTask.findFirstOrThrow({
    where: { targetId: message.id as string },
  });
  return { message, task };
}

async function decide(
  action: "approve" | "return" | "reject",
  taskId: string,
  cookie: string,
  body: Record<string, unknown> = {},
) {
  const route = action === "approve" ? approveTask : action === "return" ? returnTask : rejectTask;
  return route(
    sendJson("POST", `/api/review/tasks/${taskId}/${action}`, body, cookieHeader(cookie)),
    params(taskId),
  );
}

async function queueFor(cookie: string) {
  const res = await listReviewTasks(sendJson("GET", "/api/review/tasks", {}, cookieHeader(cookie)));
  return { status: res.status, body: await res.json() };
}

async function receiverList(caseId: string, cookie: string) {
  const res = await listMessages(
    sendJson("GET", `/api/cases/${caseId}/messages`, {}, cookieHeader(cookie)),
    params(caseId),
  );
  return (await res.json()).messages as Array<Record<string, unknown>>;
}

describe("review console decisions (REQ-REV-01~06)", () => {
  beforeEach(async () => {
    await resetDatabase();
    setMessageCheckerForTests({ check: async () => "needs_review" });
  });
  afterEach(() => {
    setMessageCheckerForTests();
  });

  it("lists only the coordinator's assigned cases with type, case, submitter, and entry time", async () => {
    const { kase, cookie, lawyer, lawyerCookie } = await seedChat();
    const { task } = await sendHeld(kase.id, lawyerCookie, "dec-list-1");

    // A second case with its own coordinator must not leak into the queue.
    const { user: otherCoordinator } = await createVerifiedUser(
      "coordinator",
      "coordinator-other@example.com",
    );
    const otherKase = await prisma.case.create({
      data: {
        title: "Other Case",
        clientOrgName: "Fictitious Client Org",
        createdBy: otherCoordinator.id,
      },
    });
    await addMember(otherKase.id, otherCoordinator.id, "coordinator");
    const otherCookie = await sessionCookieFor(otherCoordinator.id);
    const { user: otherLawyer } = await createVerifiedUser("lawyer", "lawyer-other@example.com");
    await addMember(otherKase.id, otherLawyer.id, "lawyer");
    const otherLawyerCookie = await sessionCookieFor(otherLawyer.id);
    await sendHeld(otherKase.id, otherLawyerCookie, "dec-list-2");

    const mine = await queueFor(cookie);
    expect(mine.status).toBe(200);
    expect(mine.body.tasks).toHaveLength(1);
    const view = mine.body.tasks[0];
    expect(view.id).toBe(task.id);
    expect(view.targetType).toBe("message");
    expect(view.caseId).toBe(kase.id);
    expect(view.caseTitle).toBe("Decision Case");
    expect(view.submitterDisplayName).toBe(lawyer.displayName);
    expect(view.createdAt).toBeTruthy();
    expect(view.selfReleaseRequired).toBe(false);
    expect(view.alertIssue).toBe(false);

    const theirs = await queueFor(otherCookie);
    expect(theirs.body.tasks).toHaveLength(1);
    expect(theirs.body.tasks[0].caseId).toBe(otherKase.id);

    // REQ-REV-05/REQ-PM-09: the queue carries no contact channels anywhere.
    expect(JSON.stringify(mine.body)).not.toContain("@");
  });

  it("denies the queue to members without review duties", async () => {
    const { lawyerCookie } = await seedChat();
    const res = await listReviewTasks(
      sendJson("GET", "/api/review/tasks", {}, cookieHeader(lawyerCookie)),
    );
    expect(res.status).toBe(403);
  });

  it("approve publishes the message and records operator, time, and lifecycle stamps", async () => {
    const { kase, cookie, coordinator, lawyerCookie } = await seedChat();
    const { message, task } = await sendHeld(kase.id, lawyerCookie, "dec-appr-1");

    // Opening the queue records opened_at (REQ-NTF-09).
    await queueFor(cookie);
    const opened = await prisma.reviewTask.findUniqueOrThrow({ where: { id: task.id } });
    expect(opened.openedAt).not.toBeNull();
    expect(opened.startedAt).toBeNull();
    expect(opened.decidedAt).toBeNull();

    const res = await decide("approve", task.id, cookie);
    expect(res.status).toBe(200);

    const decided = await prisma.reviewTask.findUniqueOrThrow({ where: { id: task.id } });
    expect(decided.status).toBe("approved");
    expect(decided.decidedById).toBe(coordinator.id);
    expect(decided.decidedAt).not.toBeNull();
    expect(decided.startedAt).not.toBeNull();
    expect(decided.selfRelease).toBe(false);

    const published = await prisma.message.findUniqueOrThrow({
      where: { id: message.id as string },
    });
    expect(published.status).toBe("published");
    expect(published.publishedAt).not.toBeNull();
    expect((await receiverList(kase.id, cookie)).map((m) => m.id)).toContain(message.id);
  });

  it("return requires a reason, keeps content invisible, and records the reason", async () => {
    const { kase, cookie, lawyerCookie } = await seedChat();
    const { message, task } = await sendHeld(kase.id, lawyerCookie, "dec-ret-1");

    expect((await decide("return", task.id, cookie)).status).toBe(400);
    const res = await decide("return", task.id, cookie, { reason: "请修改后重新提交" });
    expect(res.status).toBe(200);

    const decided = await prisma.reviewTask.findUniqueOrThrow({ where: { id: task.id } });
    expect(decided.status).toBe("returned");
    expect(decided.decisionReason).toBe("请修改后重新提交");
    const row = await prisma.message.findUniqueOrThrow({ where: { id: message.id as string } });
    expect(row.status).toBe("returned");
    // REQ-REV-03: nothing is shown to the other party.
    expect(await receiverList(kase.id, cookie)).toHaveLength(0);
  });

  it("reject keeps content invisible and records a neutral reason", async () => {
    const { kase, cookie, lawyerCookie } = await seedChat();
    const { message, task } = await sendHeld(kase.id, lawyerCookie, "dec-rej-1");

    expect((await decide("reject", task.id, cookie)).status).toBe(400);
    const res = await decide("reject", task.id, cookie, { reason: "内容不符合发布规范" });
    expect(res.status).toBe(200);

    const row = await prisma.message.findUniqueOrThrow({ where: { id: message.id as string } });
    expect(row.status).toBe("rejected");
    expect(await receiverList(kase.id, cookie)).toHaveLength(0);
  });

  it("forbids the author from deciding their own task when another reviewer exists", async () => {
    const { kase, cookie } = await seedChat();
    const { user: second } = await createVerifiedUser("coordinator", "coordinator-b@example.com");
    await addMember(kase.id, second.id, "coordinator");
    const secondCookie = await sessionCookieFor(second.id);

    const { message, task } = await sendHeld(kase.id, cookie, "dec-self-1");

    // The task is offered only to the other reviewer.
    expect((await queueFor(cookie)).body.tasks).toHaveLength(0);
    expect((await queueFor(secondCookie)).body.tasks).toHaveLength(1);

    for (const action of ["approve", "return", "reject"] as const) {
      const res = await decide(action, task.id, cookie, { reason: "r", selfRelease: true });
      expect(res.status).toBe(403);
      expect((await res.json()).error).toBe("self_review_forbidden");
    }

    const res = await decide("approve", task.id, secondCookie);
    expect(res.status).toBe(200);
    const row = await prisma.message.findUniqueOrThrow({ where: { id: message.id as string } });
    expect(row.status).toBe("published");
  });

  it("sole reviewer: explicit self_release publishes with a trace; dismissal never does", async () => {
    const { kase, cookie, coordinator } = await seedChat();
    const { message, task } = await sendHeld(kase.id, cookie, "dec-sole-1");

    // The author is prompted with the self-release requirement (REQ-REV-06).
    const queue = await queueFor(cookie);
    expect(queue.body.tasks).toHaveLength(1);
    expect(queue.body.tasks[0].selfReleaseRequired).toBe(true);

    // Without the explicit flag the item stays unpublished.
    const denied = await decide("approve", task.id, cookie);
    expect(denied.status).toBe(400);
    expect((await denied.json()).error).toBe("self_release_required");
    let row = await prisma.message.findUniqueOrThrow({ where: { id: message.id as string } });
    expect(row.status).toBe("pending_review");

    // Return/reject of one's own task is not an escape hatch either.
    expect((await decide("return", task.id, cookie, { reason: "r" })).status).toBe(400);

    const res = await decide("approve", task.id, cookie, { selfRelease: true });
    expect(res.status).toBe(200);
    row = await prisma.message.findUniqueOrThrow({ where: { id: message.id as string } });
    expect(row.status).toBe("published");
    const decided = await prisma.reviewTask.findUniqueOrThrow({ where: { id: task.id } });
    expect(decided.selfRelease).toBe(true);
    expect(decided.decidedById).toBe(coordinator.id);
  });

  it("treats a configured backup as another reviewer: the author cannot self-decide", async () => {
    const { kase, cookie } = await seedChat();
    const { user: backup } = await createVerifiedUser("coordinator", "backup-b@example.com");
    await addMember(kase.id, backup.id, "coordinator", {
      canManage: false,
      canReview: false,
      isBackup: true,
    });

    const { task } = await sendHeld(kase.id, cookie, "dec-backup-1");
    const res = await decide("approve", task.id, cookie, { selfRelease: true });
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("self_review_forbidden");
  });

  it("records an appeal as a note on the original task without publishing", async () => {
    const { kase, cookie, lawyerCookie } = await seedChat();
    const { message, task } = await sendHeld(kase.id, lawyerCookie, "dec-appeal-1");

    const res = await appealTask(
      sendJson("POST", `/api/review/tasks/${task.id}/appeal`, { note: "这是客户预算范围内的常规询价" }, cookieHeader(lawyerCookie)),
      params(task.id),
    );
    expect(res.status).toBe(200);

    const appealed = await prisma.reviewTask.findUniqueOrThrow({ where: { id: task.id } });
    expect(appealed.appealNote).toBe("这是客户预算范围内的常规询价");
    expect(appealed.appealedAt).not.toBeNull();
    expect(appealed.status).toBe("open");
    const row = await prisma.message.findUniqueOrThrow({ where: { id: message.id as string } });
    expect(row.status).toBe("pending_review");
    expect(await receiverList(kase.id, cookie)).toHaveLength(0);
  });

  it("rejects appeals from anyone but the author", async () => {
    const { kase, cookie, lawyerCookie } = await seedChat();
    const { task } = await sendHeld(kase.id, lawyerCookie, "dec-appeal-2");
    const res = await appealTask(
      sendJson("POST", `/api/review/tasks/${task.id}/appeal`, { note: "x" }, cookieHeader(cookie)),
      params(task.id),
    );
    expect(res.status).toBe(403);
  });

  it("rejects decisions by non-reviewers and double decisions", async () => {
    const { kase, cookie, lawyerCookie } = await seedChat();
    const { task } = await sendHeld(kase.id, lawyerCookie, "dec-guard-1");

    expect((await decide("approve", task.id, lawyerCookie)).status).toBe(403);
    expect((await decide("approve", task.id, cookie)).status).toBe(200);
    expect((await decide("approve", task.id, cookie)).status).toBe(409);
  });
});
