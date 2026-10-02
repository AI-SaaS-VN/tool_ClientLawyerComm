import { normalizeForCheck } from "@/modules/moderation/rules";

import type {
  FeeIntentInput,
  FeeIntentVerdict,
  LlmFailureKind,
  LlmModerationProvider,
  LlmTranslationProvider,
  TranslateInput,
  TranslateResult,
} from "./interface";
import { LlmFailure } from "./interface";

// Retainer-fee markers: the subject must be the firm's own fee (律师费/代理费/
// 委托费/律所收费, phí luật sư, firm/attorney fees) combined with an inquiry or
// negotiation intent. Case Amount vocabulary (诉讼费, phí tòa án, court fees,
// 赔偿/损害赔偿, damages, settlement) is deliberately absent (REQ-MOD-01).
const ZH_FEE_SUBJECT = /(律师费|代理费|委托费|(律所|贵所|你们)(所)?[^。！？]{0,12}收费)/;
const ZH_INTENT = /(多少|怎么|如何|报价|协商|优惠|便宜|能不能少)/;
const VI_FEE_SUBJECT = /phi (luat su|uy thac|dai dien|thue)/;
const VI_INTENT = /(bao nhieu|giam|thuong luong|thoa thuan|the nao)/;
const EN_FEE_SUBJECT = /((your|the|law)\s*(firm|attorney|lawyer|counsel)['’]?\w*[^.!?]{0,40}(fee|charge)|attorney('?s)? fees?|legal fees?|retainer)/;
const EN_INTENT = /(how much|cost|charge|negotiat|discount|reduce|quote)/;

function heuristicVerdict(input: FeeIntentInput): FeeIntentVerdict {
  const text = normalizeForCheck(input.text);
  if (ZH_FEE_SUBJECT.test(text) && ZH_INTENT.test(text)) return "explicit_fee_inquiry";
  if (VI_FEE_SUBJECT.test(text) && VI_INTENT.test(text)) return "explicit_fee_inquiry";
  if (EN_FEE_SUBJECT.test(text) && EN_INTENT.test(text)) return "explicit_fee_inquiry";
  return "not_explicit";
}

// Fake provider for development and tests (the real Kimi adapter is T06). The
// default answer is a small deterministic heuristic over the normalized text;
// tests may pin a fixed verdict or force a failure.
class FakeLlmModerationProvider implements LlmModerationProvider {
  private fixedVerdict: FeeIntentVerdict | null = null;
  private shouldFail = false;

  async judgeFeeIntent(input: FeeIntentInput): Promise<FeeIntentVerdict> {
    if (this.shouldFail) {
      this.shouldFail = false;
      throw new Error("fake llm provider failure");
    }
    return this.fixedVerdict ?? heuristicVerdict(input);
  }

  setFixedVerdict(verdict: FeeIntentVerdict): void {
    this.fixedVerdict = verdict;
  }

  failNext(): void {
    this.shouldFail = true;
  }

  reset(): void {
    this.fixedVerdict = null;
    this.shouldFail = false;
  }
}

export const fakeLlmModerationProvider = new FakeLlmModerationProvider();

// Fake translation provider (REQ-TR-08: fixed mock responses verify business
// logic; real-model evaluation is a separate gate). The default answer echoes
// the source with a target-language tag, which preserves every key field;
// tests may pin a fixed response, force a typed failure, and inspect the exact
// payloads received (REQ-TR-06 minimization assertions).
class FakeLlmTranslationProvider implements LlmTranslationProvider {
  readonly id = "fake";
  readonly calls: TranslateInput[] = [];
  private fixed: string | ((input: TranslateInput) => string) | null = null;
  private failure: LlmFailureKind | null = null;

  async translate(input: TranslateInput): Promise<TranslateResult> {
    this.calls.push({ ...input });
    if (this.failure) {
      const kind = this.failure;
      this.failure = null;
      throw new LlmFailure(kind);
    }
    const text =
      typeof this.fixed === "function"
        ? this.fixed(input)
        : (this.fixed ?? `[${input.targetLang}] ${input.text}`);
    return {
      text,
      model: "fake-translator",
      modelVersion: "1",
      promptVersion: "fake-prompt-v1",
      glossaryVersion: "none",
    };
  }

  setFixedResponse(response: string | ((input: TranslateInput) => string)): void {
    this.fixed = response;
  }

  failNext(kind: LlmFailureKind): void {
    this.failure = kind;
  }

  reset(): void {
    this.calls.length = 0;
    this.fixed = null;
    this.failure = null;
  }
}

export const fakeLlmTranslationProvider = new FakeLlmTranslationProvider();
