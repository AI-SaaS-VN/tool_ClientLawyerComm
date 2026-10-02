import { describe, expect, it } from "vitest";

import { findRuleHits, normalizeForCheck } from "@/modules/moderation/rules";

import passCorpus from "../../fixtures/moderation/pass.json";
import reviewCorpus from "../../fixtures/moderation/review.json";

function categories(text: string): string[] {
  return findRuleHits(text).map((hit) => hit.category);
}

describe("normalizeForCheck", () => {
  it("maps full-width characters to ASCII and strips tone marks", () => {
    expect(normalizeForCheck("１３８＠ＡＢＣ")).toBe("138@abc");
    expect(normalizeForCheck("Số điện thoại")).toBe("so dien thoai");
  });

  it("keeps CJK characters", () => {
    expect(normalizeForCheck("微信")).toBe("微信");
  });
});

describe("email detection (REQ-MOD-02)", () => {
  it.each([
    ["plain", "mail me at zhang.liang@example.com"],
    ["full-width", "邮箱：ｚｈａｎｇ．ｌｉａｎｇ＠ｅｘａｍｐｌｅ．ｃｏｍ"],
    ["split", "zhang . liang @ example . com"],
  ])("hits %s emails", (_label, text) => {
    expect(categories(text)).toContain("email");
  });

  it("ignores lone @ mentions without a domain", () => {
    expect(categories("他说 @ 一下就行")).not.toContain("email");
  });
});

describe("phone detection (+86/+84 and local formats)", () => {
  it.each([
    ["CN mobile", "手机13812345678"],
    ["CN mobile split", "1 3 8 - 1 2 3 4 - 5 6 7 8"],
    ["CN mobile full-width", "１３８１２３４５６７８"],
    ["+86 prefixed", "+86 13812345678"],
    ["VN local", "sdt 0912 345 678"],
    ["+84 prefixed", "call +84 912 345 678"],
  ])("hits %s", (_label, text) => {
    expect(categories(text)).toContain("phone");
  });

  it.each([
    ["amount with separators", "损害赔偿金 2,300,000 元"],
    ["short number", "诉讼请求500万元"],
    ["date", "2026年10月15日"],
    ["six-digit code", "验证码 483920"],
  ])("ignores %s", (_label, text) => {
    expect(categories(text)).not.toContain("phone");
  });
});

describe("WeChat / Zalo detection", () => {
  it.each([
    ["微信 with ID", "加我微信：wxid_abc123def"],
    ["wechat keyword", "find me on wechat: some_id_99"],
    ["vx shorthand", "加 vx: abc123xyz"],
    ["zalo with tones", "Zalo của tôi: nguyenvan_example"],
    ["zalo tone-less", "ban co zalo khong"],
  ])("hits %s", (_label, text) => {
    const hits = categories(text);
    expect(hits.some((c) => c === "wechat" || c === "zalo")).toBe(true);
  });

  it("ignores unrelated text", () => {
    expect(categories("请把庭审笔录发给我")).toHaveLength(0);
  });
});

describe("URL detection", () => {
  it.each([
    ["https URL", "see https://fictitious-drive.example.com/case/123"],
    ["www URL", "open www.fake-news.com today"],
    ["full-width URL", "ｗｗｗ．ｆａｋｅ－ｎｅｗｓ．ｃｏｍ"],
  ])("hits %s", (_label, text) => {
    expect(categories(text)).toContain("url");
  });
});

describe("QR payload hints", () => {
  it.each([
    ["二维码", "扫这个二维码加我"],
    ["扫码", "扫码联系更方便"],
    ["tone-less ma qr", "quet ma qr nay de ket noi"],
  ])("hits %s", (_label, text) => {
    expect(categories(text)).toContain("qr");
  });
});

describe("fixture corpus rule coverage", () => {
  it("flags every rule-category review fixture with its declared category", () => {
    const missed: string[] = [];
    for (const item of reviewCorpus) {
      if (item.category === "fee_inquiry") continue; // semantic, not deterministic
      const hits = categories(item.text);
      const expected =
        item.category === "wechat" || item.category === "zalo"
          ? hits.some((c) => c === "wechat" || c === "zalo")
          : hits.includes(item.category);
      if (!expected) missed.push(item.id);
    }
    expect(missed).toEqual([]);
  });

  it("does not fire any rule on the pass corpus", () => {
    const falseBlocks: string[] = [];
    for (const item of passCorpus) {
      if (findRuleHits(item.text).length > 0) falseBlocks.push(item.id);
    }
    expect(falseBlocks).toEqual([]);
  });
});
