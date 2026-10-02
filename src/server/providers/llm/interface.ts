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

// REQ-TR-06: the payload is minimized to the single message body plus the two
// language codes — never registered contact channels, never the case history.
export interface TranslateInput {
  text: string;
  sourceLang: string;
  targetLang: string;
}

// REQ-TR-03: every call reports the model identity for the version record.
export interface TranslateResult {
  text: string;
  model: string;
  modelVersion: string;
  promptVersion: string;
  glossaryVersion: string;
}

export type LlmFailureKind = "timeout" | "rate_limited" | "format";

// REQ-MSG-10: provider faults are typed so callers mark the version failed;
// they are never swallowed into a fake success.
export class LlmFailure extends Error {
  constructor(readonly kind: LlmFailureKind) {
    super(`llm ${kind}`);
    this.name = "LlmFailure";
  }
}

export interface LlmTranslationProvider {
  readonly id: string;
  translate(input: TranslateInput): Promise<TranslateResult>;
}
