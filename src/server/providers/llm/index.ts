import { fakeLlmModerationProvider } from "./fake";
import type { LlmModerationProvider } from "./interface";

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
