import { describe, expect, it } from "vitest";

import { cleanExtractedText, extractLocalText } from "@/modules/files/extract-text";

import { docxWithText, pdfWithText } from "../../fixtures/files/samples";

// REQ-ATT-04: selectable PDF/DOCX text is extracted on the machine.
describe("extractLocalText", () => {
  it("extracts selectable text from a PDF", async () => {
    expect(await extractLocalText("pdf", pdfWithText("Hello attachment world"))).toBe(
      "Hello attachment world",
    );
  });

  it("extracts Chinese text from a DOCX", async () => {
    expect(await extractLocalText("docx", docxWithText("甲方与乙方于见面时在合同末页签字。"))).toBe(
      "甲方与乙方于见面时在合同末页签字。",
    );
  });

  it("extracts Vietnamese text from a DOCX", async () => {
    const text = "Bên A và bên B ký vào trang cuối hợp đồng.";
    expect(await extractLocalText("docx", docxWithText(text))).toBe(text);
  });

  it("strips pdf-parse page footers", () => {
    expect(cleanExtractedText("line one\n\n-- 1 of 3 --\n\nline two\n")).toBe(
      "line one\n\nline two",
    );
  });
});
