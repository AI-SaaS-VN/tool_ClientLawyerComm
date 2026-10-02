import type { Message } from "@prisma/client";

export type CheckOutcome = "approve" | "needs_review";

// T05 replaces the pass-through stub with the real deterministic rules +
// semantic judgment. Any checker exception must surface as check_failed in
// the pipeline, never as a publish.
export interface MessageChecker {
  check(message: Message): Promise<CheckOutcome>;
}

const passThroughChecker: MessageChecker = {
  check: async () => "approve",
};

let currentChecker: MessageChecker = passThroughChecker;

export function getMessageChecker(): MessageChecker {
  return currentChecker;
}

export function setMessageCheckerForTests(checker?: MessageChecker): void {
  currentChecker = checker ?? passThroughChecker;
}
