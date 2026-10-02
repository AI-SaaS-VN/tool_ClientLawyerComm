import { findRuleHits } from "@/modules/moderation/rules";
import { isExplicitFeeInquiry } from "@/modules/moderation/semantic";

export interface ModerationVerdict {
  outcome: "approve" | "needs_review";
  reason: string | null;
}

// REQ-MSG-01 check stage: deterministic rules first, then the semantic
// judgment; any hit holds the message for review. Exceptions propagate —
// the caller must map them to check_failed, never to a publish.
export async function checkMessageContent(
  text: string,
  sourceLang: string,
): Promise<ModerationVerdict> {
  const hits = findRuleHits(text);
  if (hits.length > 0) {
    const categories = [...new Set(hits.map((hit) => hit.category))];
    return { outcome: "needs_review", reason: `rule:${categories.join(",")}` };
  }
  if (await isExplicitFeeInquiry(text, sourceLang)) {
    return { outcome: "needs_review", reason: "semantic:fee_inquiry" };
  }
  return { outcome: "approve", reason: null };
}
