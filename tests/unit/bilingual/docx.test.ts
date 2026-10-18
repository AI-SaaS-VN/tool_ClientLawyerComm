import JSZip from "jszip";
import { describe, expect, it } from "vitest";

import {
  MAX_PAGES,
  buildBilingualDocx,
  buildNumberedBatch,
  estimatePages,
  parseDocxParagraphs,
  parseNumberedBatch,
  readDocxParts,
} from "@/modules/bilingual/docx";

const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

function documentXml(body: string): string {
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    `<w:document xmlns:w="${W}"><w:body>${body}</w:body></w:document>`
  );
}

function para(text: string): string {
  return `<w:p><w:r><w:t>${text}</w:t></w:r></w:p>`;
}

const NO_PARTS = { hasFootnotes: false, hasComments: false };

// REQ-DOC-04: paragraph extraction joins runs, decodes entities, skips empty
// paragraphs, and flags every unsupported element instead of dropping it.
describe("parseDocxParagraphs (REQ-DOC-04)", () => {
  it("joins runs, tabs and breaks; decodes entities; skips empty paragraphs", () => {
    const xml = documentXml(
      para("第一段。") +
        '<w:p><w:r><w:t>第二</w:t></w:r><w:r><w:tab/><w:t>段 &amp; 备注</w:t></w:r></w:p>' +
        "<w:p><w:r><w:t></w:t></w:r></w:p>" +
        "<w:p><w:r><w:t>第三</w:t></w:r><w:r><w:br/><w:t>段</w:t></w:r></w:p>",
    );
    const result = parseDocxParagraphs(xml, NO_PARTS);
    expect(result.paragraphs).toEqual(["第一段。", "第二 段 & 备注", "第三 段"]);
    expect(result.unsupported).toEqual([]);
  });

  it("flags tables, text boxes, images, footnote references and comments", () => {
    const xml = documentXml(
      para("正文") +
        "<w:tbl><w:tr><w:tc><w:p><w:r><w:t>表格</w:t></w:r></w:p></w:tc></w:tr></w:tbl>" +
        para("后文<w:footnoteReference w:id=\"2\"/>") +
        '<w:p><w:r><w:drawing><wp:inline xmlns:wp="x"/></w:drawing></w:r></w:p>',
    );
    const result = parseDocxParagraphs(xml, { hasFootnotes: true, hasComments: true });
    expect(result.unsupported).toEqual(
      expect.arrayContaining(["table", "footnote", "image", "comment"]),
    );
    // Table cell text must not leak into the paragraph list.
    expect(result.paragraphs.join("\n")).not.toContain("表格");
  });

  it("flags text boxes", () => {
    const xml = documentXml(
      para("正文") + '<w:p><w:r><w:pict><v:shape xmlns:v="x"><w:txbxContent/></v:shape></w:pict></w:r></w:p>',
    );
    expect(parseDocxParagraphs(xml, NO_PARTS).unsupported).toContain("textbox");
  });
});

describe("readDocxParts", () => {
  it("reads word/document.xml and reports footnotes/comments parts", async () => {
    const zip = new JSZip();
    zip.file("word/document.xml", documentXml(para("你好。")));
    zip.file("word/footnotes.xml", "<w:footnotes/>");
    const buf = await zip.generateAsync({ type: "nodebuffer" });
    const parts = await readDocxParts(buf);
    expect(parts.documentXml).toContain("你好。");
    expect(parts.hasFootnotes).toBe(true);
    expect(parts.hasComments).toBe(false);
  });

  it("rejects a buffer without word/document.xml", async () => {
    const zip = new JSZip();
    zip.file("readme.txt", "not a docx");
    const buf = await zip.generateAsync({ type: "nodebuffer" });
    await expect(readDocxParts(buf)).rejects.toThrow();
  });
});

// REQ-DOC-02: page count uses the conservative estimate when no renderer is
// available — overestimation is acceptable, underestimation is not.
describe("estimatePages (REQ-DOC-02)", () => {
  it("a short document is one page", () => {
    expect(estimatePages(["第一段。", "第二段。"])).toBe(1);
  });

  it("long documents estimate conservatively", () => {
    const long = Array.from({ length: 30 }, () => "字".repeat(300));
    expect(estimatePages(long)).toBeGreaterThan(MAX_PAGES);
  });

  it("many short paragraphs also estimate conservatively", () => {
    const many = Array.from({ length: MAX_PAGES * 15 + 1 }, () => "短句。");
    expect(estimatePages(many)).toBeGreaterThan(MAX_PAGES);
  });
});

// Batched translation: numbered lines go out; the reply must carry every
// number back, with continuation lines folded into the previous paragraph.
describe("numbered batch roundtrip", () => {
  it("builds and parses numbered paragraphs", () => {
    const paragraphs = ["第一段。", "第二段。", "第三段。"];
    const batch = buildNumberedBatch(paragraphs, [0, 2]);
    expect(batch).toBe("[1] 第一段。\n[3] 第三段。");
    const parsed = parseNumberedBatch(
      "[1] Đoạn một.\n[3] Đoạn ba\nvẫn là đoạn ba.",
      [0, 2],
    );
    expect(parsed).not.toBeNull();
    expect(parsed!.get(0)).toBe("Đoạn một.");
    expect(parsed!.get(2)).toBe("Đoạn ba\nvẫn là đoạn ba.");
  });

  it("returns null when any expected number is missing or empty", () => {
    expect(parseNumberedBatch("[1] ok", [0, 1])).toBeNull();
    expect(parseNumberedBatch("[1] \n[2] ok", [0, 1])).toBeNull();
    expect(parseNumberedBatch("no numbers at all", [0])).toBeNull();
  });
});

// REQ-DOC-03/04: the output document numbers every paragraph pair, carries
// source/translation versions and the machine-translation marking, and the
// pair count equals the source paragraph count.
describe("buildBilingualDocx (REQ-DOC-03/04)", () => {
  it("writes numbered source/translation pairs with the machine marking", async () => {
    const pairs = [
      { index: 0, source: "第一段 & <特殊>", translated: "Đoạn một." },
      { index: 1, source: "第二段。", translated: "Đoạn hai." },
    ];
    const buf = await buildBilingualDocx(pairs, {
      sourceName: "合同.docx",
      sourceLang: "zh-Hans",
      targetLang: "vi",
      model: "fake",
      generatedAt: "2026-10-18T00:00:00.000Z",
    });
    const parts = await readDocxParts(buf);
    const parsed = parseDocxParagraphs(parts.documentXml, NO_PARTS);
    const text = parsed.paragraphs.join("\n");
    expect(text).toContain("[1] 第一段 & <特殊>");
    expect(text).toContain("[1] Đoạn một.");
    expect(text).toContain("[2] 第二段。");
    expect(text).toContain("机器翻译");
    expect(text).toContain("合同.docx");
    // Two pairs → two numbered source lines and two numbered translation lines.
    expect(parsed.paragraphs.filter((p) => /^\[\d+\]/.test(p))).toHaveLength(4);
    expect(parsed.unsupported).toEqual([]);
  });
});
