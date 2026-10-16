import { LlmFailure } from "./interface";
import type {
  BriefQuestionsInput,
  BriefQuestionsResult,
  LlmBriefProvider,
  LlmTranslationProvider,
  LlmVisionProvider,
  ReadImageTextInput,
  ReadImageTextResult,
  TranslateInput,
  TranslateResult,
} from "./interface";

const DEFAULT_BASE_URL = "https://api.moonshot.cn";
// kimi-k2.6 is a reasoning model: real calls measured 26–28s from the
// development VPS and >30s from the Shanghai host, so the abort budget must
// stay well above that.
const REQUEST_TIMEOUT_MS = 90_000;
// Vision transcription of a dense scan can run minutes server-side; aborting
// early wastes the call (the account allows one concurrent request, and the
// server keeps processing after a client abort), so the budget is generous.
const VISION_TIMEOUT_MS = 240_000;
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

// REQ-ATT-04: image attachments are read by Kimi's vision endpoint. The model
// comes from KIMI_VISION_MODEL (falling back to KIMI_MODEL) so a
// vision-capable deployment can be configured without code changes; the same
// typed faults apply (REQ-MSG-10).
export class KimiVisionProvider implements LlmVisionProvider {
  readonly id = "kimi";

  private readonly baseUrl: string;
  private readonly model: string | undefined;

  constructor(private readonly apiKey: string | undefined) {
    const base = (process.env.KIMI_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.baseUrl = base.endsWith("/v1") ? base : `${base}/v1`;
    this.model = process.env.KIMI_VISION_MODEL ?? process.env.KIMI_MODEL;
  }

  async readImageText(input: ReadImageTextInput): Promise<ReadImageTextResult> {
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
        signal: AbortSignal.timeout(VISION_TIMEOUT_MS),
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text:
                    "Transcribe every word visible in this document image, in reading order. " +
                    "Reply with the transcribed text only — no commentary, no translation.",
                },
                {
                  type: "image_url",
                  image_url: { url: `data:${input.mime};base64,${input.dataBase64}` },
                },
              ],
            },
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
    if (response.status === 429) throw new LlmFailure("rate_limited");
    if (response.status >= 500) throw new LlmFailure("server");
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`llm http_${response.status}: ${body.slice(0, 300)}`);
    }
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
    return { text, model };
  }
}

// REQ-BRIEF-02: the Case Agent lists missing facts as short numbered
// questions for the coordinator. The payload is only this case's published
// content (REQ-TR-06 v0.13 exception); the same typed faults apply.
export class KimiBriefProvider implements LlmBriefProvider {
  readonly id = "kimi";

  private readonly baseUrl: string;
  private readonly model: string | undefined;

  constructor(private readonly apiKey: string | undefined) {
    const base = (process.env.KIMI_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.baseUrl = base.endsWith("/v1") ? base : `${base}/v1`;
    this.model = process.env.KIMI_MODEL;
  }

  async suggestQuestions(input: BriefQuestionsInput): Promise<BriefQuestionsResult> {
    if (!this.apiKey) {
      throw new Error("kimi provider is not configured (KIMI_API_KEY missing)");
    }
    const model = this.model;
    if (!model) {
      throw new Error("kimi provider is not configured (KIMI_MODEL missing)");
    }
    const sections: string[] = [];
    if (input.messageTexts.length > 0) {
      sections.push(`Published messages:\n${input.messageTexts.join("\n---\n")}`);
    }
    if (input.fileNames.length > 0) {
      sections.push(`Published file names:\n${input.fileNames.join("\n")}`);
    }
    if (input.attachmentTexts.length > 0) {
      sections.push(`Extracted attachment texts:\n${input.attachmentTexts.join("\n---\n")}`);
    }
    const body = sections.length > 0 ? sections.join("\n\n") : "(no published content yet)";
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
                "You help the coordinator of a China–Vietnam legal case. From the published " +
                "case content below, list up to 3 missing facts the coordinator should supply, " +
                "as short numbered questions. Write the questions in the requested language. " +
                "Reply with the numbered questions only — no commentary.",
            },
            { role: "user", content: `Language: ${input.lang}\n${body}` },
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
    if (response.status === 429) throw new LlmFailure("rate_limited");
    if (response.status >= 500) throw new LlmFailure("server");
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`llm http_${response.status}: ${text.slice(0, 300)}`);
    }
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
    return { text, model };
  }
}
