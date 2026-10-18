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

export type LlmFailureKind = "timeout" | "rate_limited" | "format" | "server";

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

// REQ-ATT-04: photos and scanned pages (JPG/PNG) are read by the existing
// Kimi — the image bytes and nothing else cross the provider boundary.
export interface ReadImageTextInput {
  dataBase64: string;
  mime: string;
}

export interface ReadImageTextResult {
  text: string;
  model: string;
}

export interface LlmVisionProvider {
  readonly id: string;
  readImageText(input: ReadImageTextInput): Promise<ReadImageTextResult>;
}

// REQ-BRIEF-02/03 with the REQ-TR-06 v0.13 exception: the Case Agent receives
// only this case's published message texts, published file names, and
// extracted attachment texts — nothing pending, nothing from other cases,
// no contact channels.
export interface BriefQuestionsInput {
  messageTexts: string[];
  fileNames: string[];
  attachmentTexts: string[];
  // Screen language the questions are written in (the coordinator's).
  lang: string;
}

export interface BriefQuestionsResult {
  text: string;
  model: string;
}

export interface LlmBriefProvider {
  readonly id: string;
  suggestQuestions(input: BriefQuestionsInput): Promise<BriefQuestionsResult>;
  // REQ-STAT-01: suggest public links on Chinese and Vietnamese law. The
  // reply is a JSON array of {title, url, jurisdiction: "cn"|"vn"}; parsing
  // and jurisdiction filtering live in modules/agent/statute-brief.ts. Same
  // payload minimization as suggestQuestions.
  suggestStatuteLinks(input: BriefQuestionsInput): Promise<BriefQuestionsResult>;
}
