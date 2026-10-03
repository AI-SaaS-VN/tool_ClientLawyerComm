import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LlmFailure } from "@/server/providers/llm/interface";
import { KimiTranslationProvider } from "@/server/providers/llm/kimi-adapter";

// REQ-TR-03/REQ-MSG-10: the Kimi adapter is exercised against a mocked fetch;
// every provider fault surfaces as a typed LlmFailure (or a loud
// not-configured error), never as a faked success.
const INPUT = {
  text: "请于2026年3月15日前答复。",
  sourceLang: "zh-Hans",
  targetLang: "vi",
};

function okResponse(content: string) {
  return new Response(
    JSON.stringify({ choices: [{ message: { content } }] }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}

describe("KimiTranslationProvider", () => {
  beforeEach(() => {
    process.env.KIMI_BASE_URL = "https://kimi.test";
    process.env.KIMI_MODEL = "kimi-test-model";
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.KIMI_BASE_URL;
    delete process.env.KIMI_MODEL;
  });

  it("posts to KIMI_BASE_URL with the KIMI_MODEL model, an abort signal, and returns the translated text with version metadata", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse("Vui lòng trả lời trước ngày 15/3/2026."));
    vi.stubGlobal("fetch", fetchMock);

    const provider = new KimiTranslationProvider("test-key");
    const result = await provider.translate(INPUT);

    expect(result).toEqual({
      text: "Vui lòng trả lời trước ngày 15/3/2026.",
      model: "kimi-test-model",
      modelVersion: "kimi-test-model",
      promptVersion: "clc-translate-v1",
      glossaryVersion: "clc-glossary-v1",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://kimi.test/v1/chat/completions");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer test-key");
    expect(init.signal).toBeInstanceOf(AbortSignal);
    const body = JSON.parse(init.body as string) as {
      model: string;
      messages: Array<{ role: string; content: string }>;
    };
    expect(body.model).toBe("kimi-test-model");
    expect(body.messages.at(-1)!.content).toContain(INPUT.text);
    expect(body.messages.at(-1)!.content).toContain(INPUT.targetLang);
  });

  it("falls back to the default Moonshot base URL when KIMI_BASE_URL is unset", async () => {
    delete process.env.KIMI_BASE_URL;
    const fetchMock = vi.fn().mockResolvedValue(okResponse("ok"));
    vi.stubGlobal("fetch", fetchMock);

    await new KimiTranslationProvider("test-key").translate(INPUT);
    expect((fetchMock.mock.calls[0] as [string])[0]).toBe(
      "https://api.moonshot.cn/v1/chat/completions",
    );
  });

  it("does not duplicate the /v1 prefix when KIMI_BASE_URL already carries it", async () => {
    process.env.KIMI_BASE_URL = "https://kimi.test/v1/";
    const fetchMock = vi.fn().mockResolvedValue(okResponse("ok"));
    vi.stubGlobal("fetch", fetchMock);

    await new KimiTranslationProvider("test-key").translate(INPUT);
    expect((fetchMock.mock.calls[0] as [string])[0]).toBe(
      "https://kimi.test/v1/chat/completions",
    );
  });

  it("maps a 429 response to a rate_limited failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("slow down", { status: 429 })));
    const error = await new KimiTranslationProvider("k").translate(INPUT).catch((e) => e);
    expect(error).toBeInstanceOf(LlmFailure);
    expect((error as LlmFailure).kind).toBe("rate_limited");
  });

  it("maps an aborted/timed-out request to a timeout failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new DOMException("The operation timed out.", "TimeoutError")),
    );
    const error = await new KimiTranslationProvider("k").translate(INPUT).catch((e) => e);
    expect(error).toBeInstanceOf(LlmFailure);
    expect((error as LlmFailure).kind).toBe("timeout");
  });

  it("maps an empty or malformed completion to a format failure", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(okResponse("   "))
      .mockResolvedValueOnce(new Response("{}", { status: 200 }))
      .mockResolvedValueOnce(new Response("not json", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const provider = new KimiTranslationProvider("k");
    for (let i = 0; i < 3; i += 1) {
      const error = await provider.translate(INPUT).catch((e) => e);
      expect(error).toBeInstanceOf(LlmFailure);
      expect((error as LlmFailure).kind).toBe("format");
    }
  });

  it("maps 5xx responses to a retryable server failure", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("boom", { status: 500 }))
      .mockResolvedValueOnce(new Response("boom", { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);

    const provider = new KimiTranslationProvider("k");
    for (let i = 0; i < 2; i += 1) {
      const error = await provider.translate(INPUT).catch((e) => e);
      expect(error).toBeInstanceOf(LlmFailure);
      expect((error as LlmFailure).kind).toBe("server");
    }
  });

  it("keeps other 4xx responses as plain http errors (no typed retry category)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("bad", { status: 400 })));
    const error = await new KimiTranslationProvider("k").translate(INPUT).catch((e) => e);
    expect(error).not.toBeInstanceOf(LlmFailure);
    expect((error as Error).message).toBe("llm http_400");
  });

  it("fails loudly as not configured when the key or model is missing, without calling fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(new KimiTranslationProvider(undefined).translate(INPUT)).rejects.toThrow(
      /not configured/,
    );
    delete process.env.KIMI_MODEL;
    await expect(new KimiTranslationProvider("k").translate(INPUT)).rejects.toThrow(
      /not configured/,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
