import { isExplicitFeeInquiry } from "@/modules/moderation/semantic";

export interface ModerationVerdict {
  outcome: "approve" | "needs_review";
  reason: string | null;
}

// Only an explicit question or negotiation about the firm's litigation
// retainer fee holds the text. Contact details, case amounts, and ordinary
// sentences publish. Exceptions propagate — the caller maps them to
// check_failed, never to a publish.
export async function checkMessageContent(
  text: string,
  sourceLang: string,
): Promise<ModerationVerdict> {
  if (await isExplicitFeeInquiry(text, sourceLang)) {
    return { outcome: "needs_review", reason: "semantic:fee_inquiry" };
  }
  return { outcome: "approve", reason: null };
}
