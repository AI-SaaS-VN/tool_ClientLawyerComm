export interface FeeIntentInput {
  text: string;
  sourceLang: string;
}

// REQ-MOD-03: only an explicit Litigation Retainer Fees inquiry/negotiation
// may hold a message; anything vague or general is "not_explicit".
export type FeeIntentVerdict = "explicit_fee_inquiry" | "not_explicit";

export interface LlmModerationProvider {
  judgeFeeIntent(input: FeeIntentInput): Promise<FeeIntentVerdict>;
}
