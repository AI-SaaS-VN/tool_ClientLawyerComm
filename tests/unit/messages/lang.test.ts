import { describe, expect, it } from "vitest";

import { detectSourceLang } from "@/modules/messages/lang";

describe("source language heuristic (REQ-MSG, T04 simplified detection)", () => {
  it("detects Vietnamese tone-marked text", () => {
    expect(detectSourceLang("Xin chào, tôi cần hỗ trợ pháp lý")).toBe("vi");
  });

  it("detects Chinese characters as zh-Hans", () => {
    expect(detectSourceLang("你好，请问案件进展")).toBe("zh-Hans");
  });

  it("falls back to en for other scripts", () => {
    expect(detectSourceLang("Hello, any updates?")).toBe("en");
  });
});
