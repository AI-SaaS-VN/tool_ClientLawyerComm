import { standInProvidersAllowed } from "../stand-in";
import {
  fakeLlmBriefProvider,
  fakeLlmModerationProvider,
  fakeLlmTranslationProvider,
  fakeLlmVisionProvider,
} from "./fake";
import type {
  LlmBriefProvider,
  LlmModerationProvider,
  LlmTranslationProvider,
  LlmVisionProvider,
} from "./interface";
import { KimiBriefProvider, KimiTranslationProvider, KimiVisionProvider } from "./kimi-adapter";

// T05 ships only the fake provider; the real Kimi adapter is T06.
export function getLlmModerationProvider(): LlmModerationProvider {
  const kind = process.env.LLM_PROVIDER ?? "fake";
  if (kind === "fake") {
    if (!standInProvidersAllowed()) {
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
    if (!standInProvidersAllowed()) {
      throw new Error("fake translation provider is not allowed in production");
    }
    return fakeLlmTranslationProvider;
  }
  if (kind === "kimi") {
    return new KimiTranslationProvider(process.env.KIMI_API_KEY);
  }
  throw new Error(`unsupported TRANSLATION_PROVIDER: ${kind}`);
}

// Attachment image reading (REQ-ATT-04) shares the translation provider seam:
// "fake" in development/tests, Kimi when TRANSLATION_PROVIDER=kimi.
export function getLlmVisionProvider(): LlmVisionProvider {
  const kind = process.env.TRANSLATION_PROVIDER ?? "fake";
  if (kind === "fake") {
    if (!standInProvidersAllowed()) {
      throw new Error("fake vision provider is not allowed in production");
    }
    return fakeLlmVisionProvider;
  }
  if (kind === "kimi") {
    return new KimiVisionProvider(process.env.KIMI_API_KEY);
  }
  throw new Error(`unsupported TRANSLATION_PROVIDER: ${kind}`);
}

// The Case Agent (REQ-BRIEF) shares the same seam and provider allow-list.
export function getLlmBriefProvider(): LlmBriefProvider {
  const kind = process.env.TRANSLATION_PROVIDER ?? "fake";
  if (kind === "fake") {
    if (!standInProvidersAllowed()) {
      throw new Error("fake brief provider is not allowed in production");
    }
    return fakeLlmBriefProvider;
  }
  if (kind === "kimi") {
    return new KimiBriefProvider(process.env.KIMI_API_KEY);
  }
  throw new Error(`unsupported TRANSLATION_PROVIDER: ${kind}`);
}
