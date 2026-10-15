import { Prisma, type Message, type TranslationVersion, type User } from "@prisma/client";

import { ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/db";
import { checkKeyFields } from "@/modules/translation/key-field-check";
import { defaultScreenLang } from "@/modules/i18n/screen-lang";
import { isSupportedLang, isZhConversionPair } from "@/modules/translation/langs";
import { convertZh } from "@/modules/translation/zh-convert";
import { recordAudit } from "@/server/audit/log";
import { requireCaseMember, requireWritableCase } from "@/server/guards/case-guards";
import { LlmFailure } from "@/server/providers/llm/interface";
import { getLlmTranslationProvider } from "@/server/providers/llm";

export type TranslationState =
  | "same_language"
  | "none"
  | "waiting"
  | "ready"
  | "failed"
  | "needs_review";

export interface TranslationView {
  targetLang: string;
  state: TranslationState;
  // Only a "ready" view carries text; needs_review/failed/waiting never leak
  // the stored text into reading views (REQ-TR-05, REQ-MSG-09).
  text: string | null;
  version: number | null;
}

// Account preference wins. A missing preference uses the role default:
// client zh-Hant, lawyer vi, coordinator zh-Hans (REQ-TR-01).
export function resolvePreferredLang(user: User): string {
  if (isSupportedLang(user.preferredLang)) return user.preferredLang;
  return defaultScreenLang(user.globalRole);
}

function sameLanguageView(targetLang: string): TranslationView {
  return { targetLang, state: "same_language", text: null, version: null };
}

function viewFromVersion(targetLang: string, latest: TranslationVersion | null): TranslationView {
  if (!latest) return { targetLang, state: "none", text: null, version: null };
  switch (latest.status) {
    case "done":
      return { targetLang, state: "ready", text: latest.text, version: latest.version };
    case "needs_review":
      return { targetLang, state: "needs_review", text: null, version: latest.version };
    case "failed":
      return { targetLang, state: "failed", text: null, version: latest.version };
    default:
      return { targetLang, state: "waiting", text: null, version: latest.version };
  }
}

async function latestVersion(
  messageId: string,
  targetLang: string,
): Promise<TranslationVersion | null> {
  return prisma.translationVersion.findFirst({
    where: { messageId, targetLang },
    orderBy: { version: "desc" },
  });
}

// REQ-TR-04: every attempt inserts a new row at version max+1; no row is ever
// overwritten. `attempts` counts provider tries within one auto chain; a
// nonzero `delayMs` defers the row via nextRetryAt (worker backoff, F17).
export async function queueTranslation(
  message: Message,
  targetLang: string,
  opts: { attempts?: number; delayMs?: number } = {},
): Promise<TranslationVersion> {
  const latest = await latestVersion(message.id, targetLang);
  try {
    return await prisma.translationVersion.create({
      data: {
        messageId: message.id,
        targetLang,
        version: (latest?.version ?? 0) + 1,
        status: "queued",
        attempts: opts.attempts ?? 0,
        nextRetryAt: opts.delayMs ? new Date(Date.now() + opts.delayMs) : null,
      },
    });
  } catch (error) {
    // Concurrent request lost the version-number race: return the winner.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return (await latestVersion(message.id, targetLang))!;
    }
    throw error;
  }
}

// Runs one queued version to completion: zh pairs never reach the provider;
// LLM pairs call it once. Provider faults end as status failed (REQ-MSG-10)
// with the typed category logged — this function itself only throws on
// storage errors.
export async function runTranslationVersion(row: TranslationVersion): Promise<TranslationVersion> {
  const message = await prisma.message.findUnique({ where: { id: row.messageId } });
  // The source must be published before any provider call (REQ-TR-09).
  if (!message || message.status !== "published") {
    return prisma.translationVersion.update({
      where: { id: row.id },
      data: { status: "failed" },
    });
  }
  const claimed = await prisma.translationVersion.updateMany({
    where: { id: row.id, status: "queued" },
    data: { status: "translating" },
  });
  if (claimed.count === 0) {
    // Another runner took it; report the current state.
    return prisma.translationVersion.findUniqueOrThrow({ where: { id: row.id } });
  }
  const current = (await prisma.translationVersion.findUniqueOrThrow({ where: { id: row.id } }))!;

  if (isZhConversionPair(message.sourceLang, row.targetLang)) {
    const text = convertZh(message.sourceText, row.targetLang as "zh-Hans" | "zh-Hant");
    return finishWithCheck(current, message.sourceText, text, {
      provider: "zh-converter",
      model: "static-map-v1",
      promptVersion: null,
    });
  }

  // REQ-TR-06: the payload is exactly the message body and the two language
  // codes — no contact channels, no case history.
  const provider = getLlmTranslationProvider();
  try {
    const result = await provider.translate({
      text: message.sourceText,
      sourceLang: message.sourceLang,
      targetLang: row.targetLang,
    });
    return finishWithCheck(current, message.sourceText, result.text, {
      provider: provider.id,
      model: result.model,
      promptVersion: result.promptVersion,
    });
  } catch (error) {
    const kind = error instanceof LlmFailure ? error.kind : "unknown";
    console.error("translation_failed", {
      targetLang: row.targetLang,
      kind,
      version: current.version,
    });
    const failed = await prisma.translationVersion.update({
      where: { id: row.id },
      data: { status: "failed", provider: provider.id },
    });
    await recordAudit(prisma, {
      action: "translation.run",
      result: "failed",
      targetType: "message",
      targetId: message.id,
      caseId: message.caseId,
      meta: { targetLang: row.targetLang, kind },
    });
    return failed;
  }
}

async function createAndRun(message: Message, targetLang: string): Promise<TranslationVersion> {
  const row = await queueTranslation(message, targetLang);
  return runTranslationVersion(row);
}

// REQ-TR-05: key fields are checked independently; a mismatch stores the text
// for reviewers but marks the version needs_review so reading views hide it.
async function finishWithCheck(
  row: TranslationVersion,
  sourceText: string,
  text: string,
  meta: { provider: string; model: string; promptVersion: string | null },
): Promise<TranslationVersion> {
  const check = checkKeyFields(sourceText, text);
  return prisma.translationVersion.update({
    where: { id: row.id },
    data: {
      status: check.ok ? "done" : "needs_review",
      text,
      provider: meta.provider,
      model: meta.model,
      promptVersion: meta.promptVersion,
      keyFieldCheck: check.ok ? "pass" : `mismatch:${check.mismatches.join(",")}`,
    },
  });
}

// POST /api/messages/:id/translate — manual-mode click, retry, and the
// REQ-TR-07 language-correction path (sourceLang override by the author).
export async function requestTranslation(
  messageId: string,
  user: User,
  body: Record<string, unknown>,
): Promise<{ view: TranslationView; created: boolean }> {
  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message) throw new ApiError(404, "not_found");
  await requireCaseMember(message.caseId, user);
  // REQ-CASE-05: archived cases accept no new translation requests.
  await requireWritableCase(message.caseId);

  // REQ-TR-09: only approved (published) source text may reach the provider.
  // Non-authors cannot even see unpublished messages, so they get a plain 404.
  if (message.status !== "published") {
    if (message.authorId === user.id) throw new ApiError(409, "message_not_published");
    throw new ApiError(404, "not_found");
  }

  let effective = message;
  const override = body.sourceLang;
  if (override !== undefined && override !== null) {
    if (message.authorId !== user.id) throw new ApiError(403, "forbidden");
    if (!isSupportedLang(override)) throw new ApiError(400, "invalid_source_lang");
    if (override !== message.sourceLang) {
      effective = await prisma.message.update({
        where: { id: message.id },
        data: { sourceLang: override, correctedById: user.id },
      });
      await recordAudit(prisma, {
        actorId: user.id,
        action: "translation.source_lang_corrected",
        result: "success",
        targetType: "message",
        targetId: message.id,
        caseId: message.caseId,
        meta: { sourceLang: override },
      });
    }
  }

  const targetLang = body.targetLang ?? resolvePreferredLang(user);
  if (!isSupportedLang(targetLang)) throw new ApiError(400, "invalid_target_lang");
  if (targetLang === effective.sourceLang) {
    return { view: sameLanguageView(targetLang), created: false };
  }

  const latest = await latestVersion(effective.id, targetLang);
  if (latest && latest.status !== "failed" && latest.status !== "needs_review") {
    return { view: viewFromVersion(targetLang, latest), created: false };
  }
  // No version yet, or the latest attempt failed / was flagged: the click (or
  // retry) starts a new version. History rows stay untouched (REQ-TR-04).
  const row = await createAndRun(effective, targetLang);
  await recordAudit(prisma, {
    actorId: user.id,
    action: "translation.request",
    result: "success",
    targetType: "message",
    targetId: effective.id,
    caseId: effective.caseId,
    meta: { targetLang },
  });
  return { view: viewFromVersion(targetLang, row), created: true };
}

interface MessageViewLike {
  id: string;
  status: string;
  sourceLang: string;
}

// Attaches the per-reader translation field to message views. Automatic mode
// requests missing translations for published messages; manual mode only
// reports what already exists. Unpublished messages (visible to the author
// only) always get translation: null and are never sent to the provider
// (REQ-TR-09).
export async function attachTranslations<T extends MessageViewLike>(
  views: T[],
  user: User,
  mode: "auto" | "manual",
): Promise<Array<T & { translation: TranslationView | null }>> {
  const preferred = resolvePreferredLang(user);
  const translatable = views.filter((v) => v.status === "published" && v.sourceLang !== preferred);
  const versions = translatable.length
    ? await prisma.translationVersion.findMany({
        where: {
          messageId: { in: translatable.map((v) => v.id) },
          targetLang: preferred,
        },
        orderBy: { version: "desc" },
      })
    : [];
  const latestByMessage = new Map<string, TranslationVersion>();
  for (const version of versions) {
    if (!latestByMessage.has(version.messageId)) latestByMessage.set(version.messageId, version);
  }

  // F17: LLM translations are queued for the worker (the provider account is
  // rate-capped, so inline parallel calls trip the limit). zh↔zh pairs are
  // deterministic and still resolve inline. The reader sees "waiting" until
  // the worker finishes the row.
  if (mode === "auto") {
    const missing = views.filter(
      (v) => v.status === "published" && v.sourceLang !== preferred && !latestByMessage.has(v.id),
    );
    for (const view of missing) {
      const message = await prisma.message.findUniqueOrThrow({ where: { id: view.id } });
      const row = isZhConversionPair(message.sourceLang, preferred)
        ? await createAndRun(message, preferred)
        : await queueTranslation(message, preferred);
      latestByMessage.set(row.messageId, row);
    }
  }

  const result: Array<T & { translation: TranslationView | null }> = [];
  for (const view of views) {
    if (view.status !== "published") {
      result.push({ ...view, translation: null });
      continue;
    }
    if (view.sourceLang === preferred) {
      result.push({ ...view, translation: sameLanguageView(preferred) });
      continue;
    }
    const latest = latestByMessage.get(view.id) ?? null;
    result.push({ ...view, translation: viewFromVersion(preferred, latest) });
  }
  return result;
}
