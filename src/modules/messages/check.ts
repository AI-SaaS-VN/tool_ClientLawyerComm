import type { Message } from "@prisma/client";

import { checkMessageContent } from "@/modules/moderation/pipeline";

export type CheckOutcome = "approve" | "needs_review";

export interface CheckResult {
  outcome: CheckOutcome;
  reason: string | null;
}

// The real T05 checker runs the moderation pipeline. Any checker exception
// must surface as check_failed in the pipeline, never as a publish.
export interface MessageChecker {
  check(message: Message): Promise<CheckOutcome | CheckResult>;
}

export function normalizeCheckResult(raw: CheckOutcome | CheckResult): CheckResult {
  return typeof raw === "string" ? { outcome: raw, reason: null } : raw;
}

const defaultChecker: MessageChecker = {
  check: (message) => checkMessageContent(message.sourceText, message.sourceLang),
};

let currentChecker: MessageChecker = defaultChecker;

export function getMessageChecker(): MessageChecker {
  return currentChecker;
}

export function setMessageCheckerForTests(checker?: MessageChecker): void {
  currentChecker = checker ?? defaultChecker;
}
