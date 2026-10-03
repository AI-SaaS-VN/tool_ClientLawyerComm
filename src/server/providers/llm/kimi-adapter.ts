import { LlmFailure } from "./interface";
import type {
  LlmTranslationProvider,
  TranslateInput,
  TranslateResult,
} from "./interface";

const DEFAULT_BASE_URL = "https://api.moonshot.cn";
// kimi-k2.6 is a reasoning model: real calls measured 26–28s from the
// development VPS and >30s from the Shanghai host, so the abort budget must
// stay well above that.
const REQUEST_TIMEOUT_MS = 90_000;
const PROMPT_VERSION = "clc-translate-v1";
const GLOSSARY_VERSION = "clc-glossary-v1";

// REQ-TR-03: Kimi/Moonshot AI is the designated provider, enabled by
// TRANSLATION_PROVIDER=kimi (F07; O05 data-processing check approved by the
// user on 2026-10-03). The base URL and model come from KIMI_BASE_URL /
// KIMI_MODEL — a missing key or model fails loudly as "not configured"
// instead of silently degrading.
export class KimiTranslationProvider implements LlmTranslationProvider {
  readonly id = "kimi";

  private readonly baseUrl: string;
  private readonly model: string | undefined;

  constructor(private readonly apiKey: string | undefined) {
    const base = (process.env.KIMI_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    // KIMI_BASE_URL may or may not already carry the /v1 prefix.
    this.baseUrl = base.endsWith("/v1") ? base : `${base}/v1`;
    this.model = process.env.KIMI_MODEL;
  }

  async translate(input: TranslateInput): Promise<TranslateResult> {
    if (!this.apiKey) {
      throw new Error("kimi provider is not configured (KIMI_API_KEY missing)");
    }
    const model = this.model;
    if (!model) {
      throw new Error("kimi provider is not configured (KIMI_MODEL missing)");
    }
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.apiKey}`,
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content:
                "Translate the user's legal-case message to the target language. " +
                "Preserve numbers, currencies, dates, party names and negations exactly. " +
                "Reply with the translation only.",
            },
            { role: "user", content: `Target: ${input.targetLang}\n${input.text}` },
          ],
        }),
      });
    } catch (error) {
      if (
        error instanceof DOMException &&
        (error.name === "TimeoutError" || error.name === "AbortError")
      ) {
        throw new LlmFailure("timeout");
      }
      throw error;
    }
    // REQ-MSG-10: retryable faults are typed; nothing is faked as success.
    if (response.status === 429) throw new LlmFailure("rate_limited");
    if (response.status >= 500) throw new LlmFailure("server");
    if (!response.ok) throw new Error(`llm http_${response.status}`);
    let payload: { choices?: Array<{ message?: { content?: unknown } }> };
    try {
      payload = (await response.json()) as typeof payload;
    } catch {
      throw new LlmFailure("format");
    }
    const text = payload.choices?.[0]?.message?.content;
    if (typeof text !== "string" || text.trim().length === 0) {
      throw new LlmFailure("format");
    }
    return {
      text,
      model,
      modelVersion: model,
      promptVersion: PROMPT_VERSION,
      glossaryVersion: GLOSSARY_VERSION,
    };
  }
}
