import JSZip from "jszip";

// T09 (REQ-DOC-01~06): paragraph-numbered Chinese–Vietnamese parallel DOCX.
// Everything in this file is pure/string-level except the two jszip helpers;
// the DB and provider work lives in service.ts.

export const MAX_PAGES = 20;

export interface DocxParts {
  documentXml: string;
  hasFootnotes: boolean;
  hasComments: boolean;
}

export interface DocxParseResult {
  paragraphs: string[];
  unsupported: string[];
}

function xmlUnescape(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&amp;/g, "&");
}

export function xmlEscape(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Unzip the parts we care about. Missing word/document.xml is not a DOCX we
// can convert.
export async function readDocxParts(data: Buffer): Promise<DocxParts> {
  const zip = await JSZip.loadAsync(data);
  const document = zip.file("word/document.xml");
  if (!document) throw new Error("docx: word/document.xml missing");
  return {
    documentXml: await document.async("string"),
    hasFootnotes: zip.file("word/footnotes.xml") !== null,
    hasComments: zip.file("word/comments.xml") !== null,
  };
}

const UNSUPPORTED: Array<[RegExp, string]> = [
  [/<w:tbl[\s>]/, "table"],
  [/txbxContent/, "textbox"],
  [/<w:drawing[\s>]|<w:pict[\s>]|<w:object[\s>]/, "image"],
  [/footnoteReference|endnoteReference/, "footnote"],
  [/commentReference/, "comment"],
];

// Paragraph text = concatenated runs (w:t), tabs and breaks become spaces.
// Table contents are excluded (tables are flagged unsupported anyway).
export function parseDocxParagraphs(
  documentXml: string,
  parts: { hasFootnotes: boolean; hasComments: boolean },
): DocxParseResult {
  const unsupported: string[] = [];
  for (const [pattern, kind] of UNSUPPORTED) {
    if (pattern.test(documentXml)) unsupported.push(kind);
  }
  if (parts.hasFootnotes && !unsupported.includes("footnote")) unsupported.push("footnote");
  if (parts.hasComments && !unsupported.includes("comment")) unsupported.push("comment");

  const body = /<w:body>([\s\S]*?)<\/w:body>/.exec(documentXml)?.[1] ?? documentXml;
  // Remove table blocks entirely so cell text never leaks into paragraphs.
  const withoutTables = body.replace(/<w:tbl[\s>][\s\S]*?<\/w:tbl>/g, " ");

  const paragraphs: string[] = [];
  for (const match of withoutTables.matchAll(/<w:p[\s>][\s\S]*?<\/w:p>/g)) {
    // Tabs and breaks sit outside w:t runs; turn them into run text first.
    const inner = match[0]
      .replace(/<w:tab\s*\/>/g, "<w:t> </w:t>")
      .replace(/<w:br\s*\/>/g, "<w:t> </w:t>")
      .replace(/<w:cr\s*\/>/g, "<w:t> </w:t>");
    let text = "";
    for (const run of inner.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)) {
      text += xmlUnescape(run[1]!);
    }
    text = text.replace(/\s+/g, " ").trim();
    if (text.length > 0) paragraphs.push(text);
  }
  return { paragraphs, unsupported };
}

// REQ-DOC-02 [O06]: no office renderer is installed on the hosts, so the
// page count is the conservative estimate — whichever is larger of a tight
// characters-per-page and paragraphs-per-page bound. Overestimating is safe
// (the document is rejected), underestimating is not.
const CHARS_PER_PAGE = 400;
const PARAGRAPHS_PER_PAGE = 15;

export function estimatePages(paragraphs: string[]): number {
  const chars = paragraphs.reduce((sum, p) => sum + [...p].length, 0);
  return Math.max(
    1,
    Math.ceil(chars / CHARS_PER_PAGE),
    Math.ceil(paragraphs.length / PARAGRAPHS_PER_PAGE),
  );
}

// One translation batch carries numbered lines; the provider must return the
// same numbers. Numbers in the wire format are 1-based paragraph indexes.
export function buildNumberedBatch(paragraphs: string[], indexes: number[]): string {
  return indexes.map((i) => `[${i + 1}] ${paragraphs[i]}`).join("\n");
}

const NUMBERED_LINE = /^\s*\[(\d+)\]\s*(.*)$/;

export function parseNumberedBatch(text: string, expected: number[]): Map<number, string> | null {
  const byIndex = new Map<number, string[]>();
  let current: number | null = null;
  for (const line of text.split("\n")) {
    const match = NUMBERED_LINE.exec(line);
    if (match) {
      current = Number(match[1]) - 1;
      if (!byIndex.has(current)) byIndex.set(current, []);
      byIndex.get(current)!.push(match[2]!);
    } else if (current !== null) {
      byIndex.get(current)!.push(line);
    }
  }
  const result = new Map<number, string>();
  for (const index of expected) {
    const lines = byIndex.get(index);
    if (!lines) return null;
    const joined = lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
    if (joined.length === 0) return null;
    result.set(index, joined);
  }
  return result;
}

export interface BilingualPair {
  index: number;
  source: string;
  translated: string;
}

export interface BilingualMeta {
  sourceName: string;
  sourceLang: string;
  targetLang: string;
  model: string;
  generatedAt: string;
}

function docxParagraph(text: string): string {
  return `<w:p><w:r><w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r></w:p>`;
}

// REQ-DOC-03: numbered source/translation pairs, source file and translation
// identity, and the machine-translation marking up front. REQ-DOC-06: the
// document itself also states that layout is not replicated.
export function composeBilingualDocumentXml(
  pairs: BilingualPair[],
  meta: BilingualMeta,
): string {
  const header = [
    "中越对照文档（机器翻译，仅供参考，不构成法律意见）",
    `源文件：${meta.sourceName}`,
    `语言方向：${meta.sourceLang} → ${meta.targetLang}`,
    `翻译模型：${meta.model} · 生成时间：${meta.generatedAt}`,
    "说明：本文档按段落编号对照，不承诺原版式复刻或法律认证。",
  ];
  const body: string[] = [];
  for (const pair of pairs) {
    body.push(`[${pair.index + 1}] ${pair.source}`);
    body.push(`[${pair.index + 1}] ${pair.translated}`);
  }
  const xml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
    "<w:body>" +
    [...header, "", ...body].map((line) => docxParagraph(line)).join("") +
    "</w:body></w:document>";
  return xml;
}

export async function buildBilingualDocx(
  pairs: BilingualPair[],
  meta: BilingualMeta,
): Promise<Buffer> {
  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
      "</Types>",
  );
  zip.file(
    "_rels/.rels",
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
      "</Relationships>",
  );
  zip.file("word/document.xml", composeBilingualDocumentXml(pairs, meta));
  return zip.generateAsync({ type: "nodebuffer" });
}
