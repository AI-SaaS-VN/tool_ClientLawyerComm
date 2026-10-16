import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

// pdf-parse v2 appends a "-- N of M --" footer line per page; it is not
// document content, so it is stripped before the text is stored or shown.
const PAGE_FOOTER = /^\s*-- \d+ of \d+ --\s*$/;

export function cleanExtractedText(text: string): string {
  return text
    .split("\n")
    .filter((line) => !PAGE_FOOTER.test(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// REQ-ATT-04: selectable PDF and DOCX text is extracted on the machine — no
// LLM call, no separate OCR service. Returns "" when the file yields no
// selectable text (e.g. a scanned PDF); the caller marks the page no_text.
export async function extractLocalText(kind: "pdf" | "docx", data: Buffer): Promise<string> {
  if (kind === "docx") {
    const result = await mammoth.extractRawText({ buffer: data });
    return cleanExtractedText(result.value);
  }
  const parser = new PDFParse({ data: new Uint8Array(data) });
  try {
    const result = await parser.getText();
    return cleanExtractedText(result.text);
  } finally {
    await parser.destroy();
  }
}
