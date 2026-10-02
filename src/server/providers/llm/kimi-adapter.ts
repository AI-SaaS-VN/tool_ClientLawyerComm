import type {
  LlmTranslationProvider,
  TranslateInput,
  TranslateResult,
} from "./interface";

const KIMI_CHAT_URL = "https://api.moonshot.cn/v1/chat/completions";
const KIMI_MODEL = "kimi-k2-0905-preview";
const PROMPT_VERSION = "clc-translate-v1";
const GLOSSARY_VERSION = "clc-glossary-v1";

// REQ-TR-03: Kimi/Moonshot AI is the designated evaluation candidate. T06
// ships the skeleton only — the real call path exists but is never selected by
// default (TRANSLATION_PROVIDER stays "fake"), and a missing key fails loudly
// as "not configured" instead of silently degrading. Real enablement waits
// for the O05 data-processing check.
export class KimiTranslationProvider implements LlmTranslationProvider {
  readonly id = "kimi";

  constructor(private readonly apiKey: string | undefined) {}

  async translate(input: TranslateInput): Promise<TranslateResult> {
    if (!this.apiKey) {
      throw new Error("kimi provider is not configured (KIMI_API_KEY missing)");
    }
    const response = await fetch(KIMI_CHAT_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: KIMI_MODEL,
        temperature: 0,
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
    if (response.status === 429) throw new Error("llm rate_limited");
    if (!response.ok) throw new Error(`llm http_${response.status}`);
    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: unknown } }>;
    };
    const text = payload.choices?.[0]?.message?.content;
    if (typeof text !== "string" || text.trim().length === 0) {
      throw new Error("llm format");
    }
    return {
      text,
      model: KIMI_MODEL,
      modelVersion: KIMI_MODEL,
      promptVersion: PROMPT_VERSION,
      glossaryVersion: GLOSSARY_VERSION,
    };
  }
}
