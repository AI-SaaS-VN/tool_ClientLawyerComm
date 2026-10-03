import { afterEach, describe, expect, it, vi } from "vitest";

import { getEmailProvider } from "@/server/providers/email";
import { getLlmModerationProvider, getLlmTranslationProvider } from "@/server/providers/llm";
import { getFileScanner } from "@/server/providers/scanner";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("stand-in providers", () => {
  it("refuses stand-ins in production and allows them only on the fictitious test host", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("EMAIL_PROVIDER", "fake");
    vi.stubEnv("FILE_SCANNER", "stub");
    vi.stubEnv("LLM_PROVIDER", "fake");
    vi.stubEnv("TRANSLATION_PROVIDER", "fake");
    vi.stubEnv("CLC_FICTITIOUS_TEST_HOST", "");

    expect(() => getEmailProvider()).toThrow(/not allowed in production/);
    expect(() => getFileScanner()).toThrow(/not allowed in production/);
    expect(() => getLlmModerationProvider()).toThrow(/not allowed in production/);
    expect(() => getLlmTranslationProvider()).toThrow(/not allowed in production/);

    vi.stubEnv("CLC_FICTITIOUS_TEST_HOST", "1");
    expect(getEmailProvider()).toBeTruthy();
    expect(getFileScanner()).toBeTruthy();
    expect(getLlmModerationProvider()).toBeTruthy();
    expect(getLlmTranslationProvider()).toBeTruthy();
  });
});