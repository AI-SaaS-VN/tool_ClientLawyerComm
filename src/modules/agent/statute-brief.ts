// T17 (REQ-STAT-01/02): China-and-Vietnam statute note for the coordinator
// brief. The agent suggests PUBLIC LINKS first; a statute note is stored only
// after the coordinator confirms. Material outside China and Vietnam is never
// offered as a statute result. Nothing here reaches the client or the lawyer.

import type { CaseBrief, Prisma, User } from "@prisma/client";

import { ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/db";
import { recordAudit } from "@/server/audit/log";
import { requireCaseMember, requireWritableCase } from "@/server/guards/case-guards";
import { getLlmBriefProvider } from "@/server/providers/llm";
import { LlmFailure } from "@/server/providers/llm/interface";

export interface StatuteLink {
  title: string;
  url: string;
  jurisdiction: "cn" | "vn";
}

const MAX_LINKS = 5;
const MAX_TITLE_CHARS = 200;
const MAX_URL_CHARS = 500;
const MAX_REMARK_CHARS = 500;

// The provider is asked for a JSON array of {title, url, jurisdiction}. Parse
// defensively: tolerate prose and code fences, drop malformed entries, and
// drop every jurisdiction that is not cn or vn (REQ-STAT-01).
export function parseStatuteLinks(output: string): StatuteLink[] {
  const start = output.indexOf("[");
  const end = output.lastIndexOf("]");
  if (start === -1 || end <= start) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(output.slice(start, end + 1));
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const links: StatuteLink[] = [];
  for (const item of parsed) {
    if (typeof item !== "object" || item === null) continue;
    const { title, url, jurisdiction } = item as Record<string, unknown>;
    if (typeof title !== "string" || title.trim().length === 0) continue;
    if ([...title].length > MAX_TITLE_CHARS) continue;
    if (typeof url !== "string" || !/^https?:\/\//.test(url)) continue;
    if (url.length > MAX_URL_CHARS) continue;
    if (jurisdiction !== "cn" && jurisdiction !== "vn") continue;
    links.push({ title: title.trim(), url, jurisdiction });
    if (links.length >= MAX_LINKS) break;
  }
  return links;
}

const JURISDICTION_LABEL: Record<StatuteLink["jurisdiction"], string> = {
  cn: "中国法",
  vn: "越南法",
};

// The confirmed note, coordinator-only (part of the brief record, REQ-STAT-01
// — it is never sent to the client or the lawyer as a legal opinion).
export function composeStatuteNote(links: StatuteLink[], remark: string | null): string {
  const lines = ["已确认的法条页面："];
  for (const link of links) {
    lines.push(`- ${link.title}（${JURISDICTION_LABEL[link.jurisdiction]}）`);
    lines.push(`  ${link.url}`);
  }
  const trimmed = remark?.trim();
  if (trimmed) {
    lines.push("", `备注：${[...trimmed].slice(0, MAX_REMARK_CHARS).join("")}`);
  }
  return lines.join("\n");
}

export interface StatuteState {
  statuteStatus: string;
  statuteNote: string | null;
}

// Suggest links once per brief cycle: never while queued/running, never after
// ready/failed, and never again once a note is confirmed.
export function shouldQueueStatute(brief: StatuteState): boolean {
  return brief.statuteStatus === "none" && !brief.statuteNote;
}


// --- Service (DB) ------------------------------------------------------------

async function requireCoordinatorMember(caseId: string, user: User) {
  const member = await requireCaseMember(caseId, user);
  if (member.memberRole !== "coordinator") throw new ApiError(403, "forbidden");
  return member;
}

export async function findDueStatuteRows(now: Date): Promise<CaseBrief[]> {
  return prisma.caseBrief.findMany({
    where: {
      statuteStatus: "queued",
      OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }],
    },
    orderBy: { createdAt: "asc" },
  });
}

// One queued suggestion: gather ONLY this case's published content (REQ-TR-06
// v0.13 exception), ask the provider for public links, and store the parsed,
// cn/vn-filtered list. Nothing is written to statute_note here — that waits
// for the coordinator's confirm (REQ-STAT-01). Same retry rules as the brief.
export async function runStatuteLinksStep(row: CaseBrief): Promise<CaseBrief> {
  const claimed = await prisma.caseBrief.updateMany({
    where: { id: row.id, statuteStatus: "queued" },
    data: { statuteStatus: "processing" },
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
    const result = await provider.suggestStatuteLinks({
      messageTexts: messages.map((m) => m.sourceText),
      fileNames: files.map((f) => f.originalName),
      attachmentTexts: pages.map((p) => p.sourceText!),
      lang: "zh-Hans",
    });
    const links = parseStatuteLinks(result.text);
    if (links.length === 0) throw new LlmFailure("format");
    return await prisma.caseBrief.update({
      where: { id: row.id },
      data: { statuteStatus: "ready", statuteLinks: links as unknown as Prisma.InputJsonValue },
    });
  } catch (error) {
    const kind = error instanceof LlmFailure ? error.kind : "unknown";
    console.error("statute_links_failed", {
      kind,
      attempts: current.attempts + 1,
      message: error instanceof Error ? error.message : String(error ?? ""),
    });
    if (kind === "rate_limited") {
      return prisma.caseBrief.update({
        where: { id: row.id },
        data: { statuteStatus: "queued", nextRetryAt: new Date(Date.now() + 2 * 60_000) },
      });
    }
    const attempts = current.attempts + 1;
    if (attempts >= 3) {
      return prisma.caseBrief.update({
        where: { id: row.id },
        data: { statuteStatus: "failed", attempts },
      });
    }
    return prisma.caseBrief.update({
      where: { id: row.id },
      data: {
        statuteStatus: "queued",
        attempts,
        nextRetryAt: new Date(Date.now() + attempts * 60_000),
      },
    });
  }
}

// REQ-STAT-01: the note is stored only when the coordinator confirms selected
// links. It stays in the brief record — never a chat message, never emailed,
// never a legal opinion to the client or the lawyer.
export async function confirmStatute(
  caseId: string,
  user: User,
  body: Record<string, unknown>,
): Promise<{ statuteNote: string }> {
  try {
    await requireCoordinatorMember(caseId, user);
  } catch {
    throw new ApiError(404, "not_found");
  }
  await requireWritableCase(caseId);
  const row = await prisma.caseBrief.findUnique({ where: { caseId } });
  if (!row || row.statuteStatus !== "ready" || !Array.isArray(row.statuteLinks)) {
    throw new ApiError(409, "statute_links_not_ready");
  }
  const links = row.statuteLinks as unknown as StatuteLink[];
  const selected = body.selected;
  if (!Array.isArray(selected) || selected.length === 0) {
    throw new ApiError(400, "selection_required");
  }
  const picked: StatuteLink[] = [];
  for (const index of selected) {
    if (typeof index !== "number" || !Number.isInteger(index)) {
      throw new ApiError(400, "selection_required");
    }
    const link = links[index];
    if (!link) throw new ApiError(400, "selection_required");
    picked.push(link);
  }
  const remark =
    typeof body.remark === "string" && body.remark.trim().length > 0 ? body.remark : null;
  const note = composeStatuteNote(picked, remark);
  await prisma.caseBrief.update({
    where: { caseId },
    data: { statuteNote: note },
  });
  await recordAudit(prisma, {
    actorId: user.id,
    action: "statute.confirm",
    result: "success",
    targetType: "case",
    targetId: caseId,
    caseId,
    meta: { links: picked.length },
  });
  return { statuteNote: note };
}
