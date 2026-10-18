import { describe, expect, it } from "vitest";

import {
  composeStatuteNote,
  parseStatuteLinks,
  shouldQueueStatute,
} from "@/modules/agent/statute-brief";

// REQ-STAT-01: statute material is limited to China and Vietnam. The provider
// answers with a JSON array of {title, url, jurisdiction}; anything else is
// dropped, and no statute sentence is stored before the coordinator confirms.
describe("parseStatuteLinks (REQ-STAT-01)", () => {
  it("parses a well-formed JSON array", () => {
    const out = JSON.stringify([
      { title: "越南民法典 · 合同成立", url: "https://example.gov.vn/civil-code", jurisdiction: "vn" },
      { title: "中华人民共和国民法典 · 合同编", url: "https://example.gov.cn/civil-code", jurisdiction: "cn" },
    ]);
    expect(parseStatuteLinks(out)).toEqual([
      { title: "越南民法典 · 合同成立", url: "https://example.gov.vn/civil-code", jurisdiction: "vn" },
      { title: "中华人民共和国民法典 · 合同编", url: "https://example.gov.cn/civil-code", jurisdiction: "cn" },
    ]);
  });

  it("drops material outside China and Vietnam", () => {
    const out = JSON.stringify([
      { title: "UCC Article 2", url: "https://law.example.com/ucc-2", jurisdiction: "us" },
      { title: "日本民法", url: "https://law.example.jp/minpo", jurisdiction: "jp" },
      { title: "越南民法典", url: "https://example.gov.vn/civil", jurisdiction: "vn" },
    ]);
    const links = parseStatuteLinks(out);
    expect(links).toHaveLength(1);
    expect(links[0]!.jurisdiction).toBe("vn");
  });

  it("drops entries without an https url or a title", () => {
    const out = JSON.stringify([
      { title: "no url", jurisdiction: "vn" },
      { title: "ftp url", url: "ftp://example.gov.vn/x", jurisdiction: "vn" },
      { title: "", url: "https://example.gov.vn/x", jurisdiction: "cn" },
      { title: "ok", url: "http://example.gov.cn/x", jurisdiction: "cn" },
    ]);
    expect(parseStatuteLinks(out)).toEqual([
      { title: "ok", url: "http://example.gov.cn/x", jurisdiction: "cn" },
    ]);
  });

  it("caps at five links and returns [] for non-JSON output", () => {
    const many = Array.from({ length: 8 }, (_, i) => ({
      title: `t${i}`,
      url: `https://example.gov.vn/${i}`,
      jurisdiction: "vn",
    }));
    expect(parseStatuteLinks(JSON.stringify(many))).toHaveLength(5);
    expect(parseStatuteLinks("")).toEqual([]);
    expect(parseStatuteLinks("不是 JSON")).toEqual([]);
    expect(parseStatuteLinks('{"not":"an array"}')).toEqual([]);
  });

  it("tolerates JSON wrapped in prose or code fences", () => {
    const out =
      '以下是与本案相关的公开法条页面：\n```json\n[{"title":"越南民法典","url":"https://example.gov.vn/civil","jurisdiction":"vn"}]\n```';
    expect(parseStatuteLinks(out)).toEqual([
      { title: "越南民法典", url: "https://example.gov.vn/civil", jurisdiction: "vn" },
    ]);
  });
});

// REQ-STAT-01: confirming links writes the note for the coordinator only —
// the note lists the confirmed pages with their jurisdiction, plus an
// optional remark (for example a possible gap in the lawyer's work).
describe("composeStatuteNote", () => {
  const links = [
    { title: "越南民法典 · 合同成立", url: "https://example.gov.vn/civil-code", jurisdiction: "vn" as const },
    { title: "中华人民共和国民法典 · 合同编", url: "https://example.gov.cn/civil-code", jurisdiction: "cn" as const },
  ];

  it("lists each confirmed link with its jurisdiction label", () => {
    const note = composeStatuteNote(links, null);
    expect(note).toContain("越南民法典 · 合同成立");
    expect(note).toContain("https://example.gov.vn/civil-code");
    expect(note).toContain("越南法");
    expect(note).toContain("中国法");
  });

  it("appends the coordinator remark when given", () => {
    const note = composeStatuteNote(links, "越南律师尚未核对第 385 条。");
    expect(note).toContain("越南律师尚未核对第 385 条。");
  });
});

// Worker trigger: suggest links only once per brief cycle — never while
// queued/running, never after a note is confirmed.
describe("shouldQueueStatute", () => {
  it("queues a never-run suggestion", () => {
    expect(shouldQueueStatute({ statuteStatus: "none", statuteNote: null })).toBe(true);
  });

  it("never doubles a queued or running suggestion", () => {
    for (const statuteStatus of ["queued", "processing"]) {
      expect(shouldQueueStatute({ statuteStatus, statuteNote: null })).toBe(false);
    }
  });

  it("never re-runs after ready, failed, or a confirmed note", () => {
    expect(shouldQueueStatute({ statuteStatus: "ready", statuteNote: null })).toBe(false);
    expect(shouldQueueStatute({ statuteStatus: "failed", statuteNote: null })).toBe(false);
    expect(shouldQueueStatute({ statuteStatus: "ready", statuteNote: "已确认" })).toBe(false);
  });
});
