import { fakeLlmModerationProvider, fakeLlmTranslationProvider } from "./fake";
import type { LlmModerationProvider, LlmTranslationProvider } from "./interface";
import { KimiTranslationProvider } from "./kimi-adapter";

// T05 ships only the fake provider; the real Kimi adapter is T06.
export function getLlmModerationProvider(): LlmModerationProvider {
  const kind = process.env.LLM_PROVIDER ?? "fake";
  if (kind === "fake") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("fake llm provider is not allowed in production");
    }
    return fakeLlmModerationProvider;
  }
  throw new Error(`unsupported LLM_PROVIDER: ${kind}`);
}

// Translation runs through its own replaceable seam (REQ-TR-03). Only "fake"
// (default, refused in production) and the Kimi skeleton are authorized —
// REQ-MSG-10 forbids silently switching to any other provider on failure.
export function getLlmTranslationProvider(): LlmTranslationProvider {
  const kind = process.env.TRANSLATION_PROVIDER ?? "fake";
  if (kind === "fake") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("fake translation provider is not allowed in production");
    }
    return fakeLlmTranslationProvider;
  }
  if (kind === "kimi") {
    return new KimiTranslationProvider(process.env.KIMI_API_KEY);
  }
  throw new Error(`unsupported TRANSLATION_PROVIDER: ${kind}`);
}
