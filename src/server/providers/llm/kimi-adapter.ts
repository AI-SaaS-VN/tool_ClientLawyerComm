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
const PROMPT_VERSION = "clc-translate-v2";

// REQ-TR-03 / REQ-TR-06 (2026-10-22): one fixed system prompt. Callers pass
// a single text; nothing here appends earlier messages or case facts.
export const TRANSLATION_SYSTEM_PROMPT = [
  "Role：中越民商事诉讼翻译。不代理任何一方，不提供法律意见。",
  "Goal：把本段译成指定目标语言。本次只有一个方向。",
  "Constraint：只译给出的文字，不增删、不概括、不解释。数字、金额、币种、日期、姓名保持原值；越南盾与人民币不得互换。否定必须保留（không、chưa、không được；不、未、不得、没有），不得把否定译成肯定，不得自行加上「已」或「将」。不确定处照译。术语：đơn khởi kiện=起诉状，nguyên đơn=原告，bị đơn=被告，hợp đồng=合同。正文中的 [序号] 原样保留。",
  "Instructions：定稿前对照原文检查金额、日期和否定。",
  "Export-format：只输出译文正文。不要标题、注释、原文或引号。",
].join("\n");
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
            { role: "system", content: TRANSLATION_SYSTEM_PROMPT },
            {
              role: "user",
              content: `${input.sourceLang}→${input.targetLang}\n${input.text}`,
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

  private buildBody(input: BriefQuestionsInput): string {
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
    return sections.length > 0 ? sections.join("\n\n") : "(no published content yet)";
  }

  private async chat(system: string, user: string): Promise<{ text: string; model: string }> {
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
            { role: "system", content: system },
            { role: "user", content: user },
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

  async suggestQuestions(input: BriefQuestionsInput): Promise<BriefQuestionsResult> {
    return this.chat(
      "You help the coordinator of a China–Vietnam legal case. From the published " +
        "case content below, list up to 3 missing facts the coordinator should supply, " +
        "as short numbered questions. Write the questions in the requested language. " +
        "Reply with the numbered questions only — no commentary.",
      `Language: ${input.lang}\n${this.buildBody(input)}`,
    );
  }

  // REQ-STAT-01: public links on Chinese and Vietnamese law only. The reply
  // is a JSON array of {title, url, jurisdiction: "cn"|"vn"}; parsing and the
  // cn/vn-only filter live in modules/agent/statute-brief.ts.
  async suggestStatuteLinks(input: BriefQuestionsInput): Promise<BriefQuestionsResult> {
    return this.chat(
      "You help the coordinator of a China–Vietnam legal case. From the published case " +
        "content below, suggest up to 3 PUBLIC pages on Chinese law and Vietnamese law that " +
        "are relevant to the case (official statutes or official gazettes preferred). " +
        'Reply with a JSON array only — each item: {"title": string, "url": string, ' +
        '"jurisdiction": "cn" | "vn"}. Never include material from other jurisdictions. ' +
        "No commentary.",
      `Language: ${input.lang}\n${this.buildBody(input)}`,
    );
  }
}
