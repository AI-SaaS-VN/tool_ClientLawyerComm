import type { CaseBrief, User } from "@prisma/client";

import { ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/db";
import { recordAudit } from "@/server/audit/log";
import { requireCaseMember, requireWritableCase } from "@/server/guards/case-guards";
import { getLlmBriefProvider } from "@/server/providers/llm";
import { LlmFailure } from "@/server/providers/llm/interface";

// REQ-BRIEF-02: "thin" means fewer than five published messages.
const THIN_MESSAGE_COUNT = 5;
export function isThinCase(publishedMessageCount: number): boolean {
  return publishedMessageCount < THIN_MESSAGE_COUNT;
}

// The agent is asked for numbered questions; anything unprefixed is not a
// question. Cap at five so a rambling reply cannot flood the coordinator.
const QUESTION_LINE = /^\s*(?:\d+\s*[.、)]|[-•])\s*(.+?)\s*$/;
const MAX_QUESTIONS = 5;
const MAX_QUESTION_CHARS = 200;

export function parseQuestions(output: string): string[] {
  const questions: string[] = [];
  for (const line of output.split("\n")) {
    const match = QUESTION_LINE.exec(line);
    if (!match) continue;
    const question = match[1]!;
    if ([...question].length > MAX_QUESTION_CHARS) continue;
    questions.push(question);
    if (questions.length >= MAX_QUESTIONS) break;
  }
  return questions;
}

// The stored brief is plain question/answer blocks (the coordinator's own
// working note; it is never posted to the chat or emailed, REQ-BRIEF-02).
export function composeBriefText(pairs: Array<{ question: string; answer: string }>): string {
  return pairs.map((p) => `${p.question}\n${p.answer}`).join("\n\n");
}

interface BriefState {
  questionsStatus: string;
  questionsAt: Date | null;
  lastContentAt: Date | null;
  briefText: string | null;
}

// REQ-BRIEF-03: the agent may prompt when the case is new or when new
// published content appears. A confirmed brief stops prompting; a queued or
// running generation is never doubled.
export function shouldPromptBrief(
  brief: BriefState,
  content: { latestContentAt: Date | null },
): boolean {
  if (brief.briefText) return false;
  if (brief.questionsStatus === "queued" || brief.questionsStatus === "processing") return false;
  if (!brief.questionsAt) return true;
  return content.latestContentAt !== null && content.latestContentAt > (brief.lastContentAt ?? new Date(0));
}

const MAX_ANSWER_CHARS = 500;

export interface BriefView {
  questionsStatus: string;
  questions: string[] | null;
  briefText: string | null;
  confirmedAt: Date | null;
}

function toBriefView(row: CaseBrief | null): BriefView {
  if (!row) return { questionsStatus: "none", questions: null, briefText: null, confirmedAt: null };
  return {
    questionsStatus: row.questionsStatus,
    questions: Array.isArray(row.questions) ? (row.questions as string[]) : null,
    briefText: row.briefText,
    confirmedAt: row.confirmedAt,
  };
}

async function requireCoordinatorMember(caseId: string, user: User) {
  const member = await requireCaseMember(caseId, user);
  if (member.memberRole !== "coordinator") throw new ApiError(403, "forbidden");
  return member;
}

// REQ-BRIEF-01: the brief is for coordinators only. Clients and lawyers get
// the same 404 as a missing case — the brief's existence is not revealed.
export async function getBriefView(caseId: string, user: User): Promise<BriefView> {
  try {
    await requireCoordinatorMember(caseId, user);
  } catch {
    throw new ApiError(404, "not_found");
  }
  const row = await prisma.caseBrief.findUnique({ where: { caseId } });
  return toBriefView(row);
}

// REQ-BRIEF-02: the brief stores text only after the coordinator confirms.
// Every question must be answered; the composed text overwrites the brief.
export async function confirmBrief(
  caseId: string,
  user: User,
  body: Record<string, unknown>,
): Promise<BriefView> {
  try {
    await requireCoordinatorMember(caseId, user);
  } catch {
    throw new ApiError(404, "not_found");
  }
  await requireWritableCase(caseId);
  const row = await prisma.caseBrief.findUnique({ where: { caseId } });
  if (!row || row.questionsStatus !== "ready" || !Array.isArray(row.questions)) {
    throw new ApiError(409, "brief_questions_not_ready");
  }
  const questions = row.questions as string[];
  const answers = body.answers;
  if (!Array.isArray(answers) || answers.length !== questions.length) {
    throw new ApiError(400, "answers_required");
  }
  const pairs = questions.map((question, i) => {
    const raw = answers[i];
    if (typeof raw !== "string" || raw.trim().length === 0) {
      throw new ApiError(400, "answers_required");
    }
    return { question, answer: [...raw.trim()].slice(0, MAX_ANSWER_CHARS).join("") };
  });
  const text = composeBriefText(pairs);
  const updated = await prisma.caseBrief.update({
    where: { caseId },
    data: { briefText: text, confirmedById: user.id, confirmedAt: new Date() },
  });
  await recordAudit(prisma, {
    actorId: user.id,
    action: "brief.confirm",
    result: "success",
    targetType: "case",
    targetId: caseId,
    caseId,
    meta: { questions: questions.length },
  });
  return toBriefView(updated);
}

interface CaseContentStats {
  publishedMessageCount: number;
  latestContentAt: Date | null;
}

async function caseContentStats(caseId: string): Promise<CaseContentStats> {
  const [messageCount, latestMessage, latestFile] = await Promise.all([
    prisma.message.count({ where: { caseId, status: "published" } }),
    prisma.message.findFirst({
      where: { caseId, status: "published" },
      orderBy: { publishedAt: "desc" },
      select: { publishedAt: true },
    }),
    prisma.file.findFirst({
      where: { caseId, status: "published" },
      orderBy: { publishedAt: "desc" },
      select: { publishedAt: true },
    }),
  ]);
  const times = [latestMessage?.publishedAt, latestFile?.publishedAt].filter(
    (t): t is Date => t instanceof Date,
  );
  return {
    publishedMessageCount: messageCount,
    latestContentAt: times.length ? new Date(Math.max(...times.map((t) => t.getTime()))) : null,
  };
}

// Worker trigger (REQ-BRIEF-03): thin active cases with new or no prior
// content get their question generation queued. One pass is idempotent.
export async function queueBriefPrompts(): Promise<number> {
  const cases = await prisma.case.findMany({
    where: { status: "active" },
    select: { id: true },
  });
  let queued = 0;
  for (const kase of cases) {
    const stats = await caseContentStats(kase.id);
    if (!isThinCase(stats.publishedMessageCount)) continue;
    const brief = await prisma.caseBrief.upsert({
      where: { caseId: kase.id },
      create: { caseId: kase.id },
      update: {},
    });
    if (!shouldPromptBrief(brief, stats)) continue;
    await prisma.caseBrief.update({
      where: { caseId: kase.id },
      data: {
        questionsStatus: "queued",
        lastContentAt: stats.latestContentAt,
        nextRetryAt: null,
      },
    });
    queued += 1;
  }
  return queued;
}

export async function findDueBriefRows(now: Date): Promise<CaseBrief[]> {
  return prisma.caseBrief.findMany({
    where: {
      questionsStatus: "queued",
      OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }],
    },
    orderBy: { createdAt: "asc" },
  });
}

// One queued generation: gather ONLY this case's published content
// (REQ-TR-06), ask the provider for questions, and store them for the
// coordinator. Rate limiting waits two minutes without spending attempts;
// other faults retry with backoff up to three attempts, then failed.
export async function runBriefQuestionsStep(row: CaseBrief): Promise<CaseBrief> {
  const claimed = await prisma.caseBrief.updateMany({
    where: { id: row.id, questionsStatus: "queued" },
    data: { questionsStatus: "processing" },
  });
  if (claimed.count === 0) {
    return prisma.caseBrief.findUniqueOrThrow({ where: { id: row.id } });
  }
  const current = await prisma.caseBrief.findUniqueOrThrow({ where: { id: row.id } });

  try {
    const [messages, files, pages] = await Promise.all([
      prisma.message.findMany({
        where: { caseId: row.caseId, status: "published" },
        orderBy: { publishedAt: "asc" },
        select: { sourceText: true },
        take: 20,
      }),
      prisma.file.findMany({
        where: { caseId: row.caseId, status: "published" },
        select: { originalName: true },
      }),
      prisma.attachmentPage.findMany({
        where: { file: { caseId: row.caseId }, status: "ready" },
        select: { sourceText: true },
        take: 10,
      }),
    ]);
    const provider = getLlmBriefProvider();
    const result = await provider.suggestQuestions({
      messageTexts: messages.map((m) => m.sourceText),
      fileNames: files.map((f) => f.originalName),
      attachmentTexts: pages.map((p) => p.sourceText!),
      lang: "zh-Hans",
    });
    const questions = parseQuestions(result.text);
    if (questions.length === 0) throw new LlmFailure("format");
    return await prisma.caseBrief.update({
      where: { id: row.id },
      data: { questionsStatus: "ready", questions, questionsAt: new Date(), attempts: 0 },
    });
  } catch (error) {
    const kind = error instanceof LlmFailure ? error.kind : "unknown";
    console.error("brief_questions_failed", {
      kind,
      attempts: current.attempts + 1,
      message: error instanceof Error ? error.message : String(error ?? ""),
    });
    if (kind === "rate_limited") {
      return prisma.caseBrief.update({
        where: { id: row.id },
        data: { questionsStatus: "queued", nextRetryAt: new Date(Date.now() + 2 * 60_000) },
      });
    }
    const attempts = current.attempts + 1;
    if (attempts >= 3) {
      return prisma.caseBrief.update({
        where: { id: row.id },
        data: { questionsStatus: "failed", attempts },
      });
    }
    return prisma.caseBrief.update({
      where: { id: row.id },
      data: {
        questionsStatus: "queued",
        attempts,
        nextRetryAt: new Date(Date.now() + attempts * 60_000),
      },
    });
  }
}
