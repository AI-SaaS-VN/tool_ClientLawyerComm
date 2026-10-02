import { describe, expect, it } from "vitest";

import { convertZh } from "@/modules/translation/zh-convert";

// REQ-TR-01: zh-Hans ↔ zh-Hant may use a deterministic converter. The map is
// deliberately small (common legal/communication characters); unmapped
// characters pass through unchanged.
describe("convertZh (REQ-TR-01 deterministic converter)", () => {
  it("converts simplified legal phrasing to traditional", () => {
    expect(convertZh("诉讼请求金额为人民币500万元。", "zh-Hant")).toBe(
      "訴訟請求金額為人民幣500萬元。",
    );
  });

  it("converts traditional back to simplified", () => {
    expect(convertZh("損害賠償金請於期限內支付。", "zh-Hans")).toBe("损害赔偿金请于期限内支付。");
  });

  it("keeps numbers, dates, latin text and unmapped characters untouched", () => {
    const mixed = "2026年3月15日 meeting at 10:30, 案件编号A-1024。";
    expect(convertZh(mixed, "zh-Hant")).toBe("2026年3月15日 meeting at 10:30, 案件編號A-1024。");
    expect(convertZh(convertZh(mixed, "zh-Hant"), "zh-Hans")).toBe(mixed);
  });

  it("is a no-op when the target equals the text's own script direction is irrelevant (identity on same target)", () => {
    expect(convertZh("已经收到。", "zh-Hans")).toBe("已经收到。");
  });
});
