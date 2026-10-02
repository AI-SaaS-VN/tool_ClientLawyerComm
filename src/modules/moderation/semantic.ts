import { getLlmModerationProvider } from "@/server/providers/llm";

// REQ-MOD-03: semantic judgment runs only through the replaceable LLM
// provider interface; provider errors propagate so the pipeline fails safe.
export async function isExplicitFeeInquiry(text: string, sourceLang: string): Promise<boolean> {
  const verdict = await getLlmModerationProvider().judgeFeeIntent({ text, sourceLang });
  return verdict === "explicit_fee_inquiry";
}
