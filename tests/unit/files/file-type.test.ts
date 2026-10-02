import { describe, expect, it } from "vitest";

import { MAX_FILE_BYTES, detectFileType } from "@/modules/files/file-type";

import { docxSample, jpgSample, pdfSample, pngSample } from "../../fixtures/files/samples";

describe("detectFileType (REQ-FILE-01 magic bytes)", () => {
  it("detects PDF by magic bytes", () => {
    expect(detectFileType(pdfSample())).toEqual({ kind: "pdf", mime: "application/pdf" });
  });

  it("detects PNG by magic bytes", () => {
    expect(detectFileType(pngSample())).toEqual({ kind: "png", mime: "image/png" });
  });

  it("detects JPG by magic bytes", () => {
    expect(detectFileType(jpgSample())).toEqual({ kind: "jpg", mime: "image/jpeg" });
  });

  it("detects DOCX (ZIP container) by magic bytes", () => {
    expect(detectFileType(docxSample())?.kind).toBe("docx");
  });

  it("rejects unknown content regardless of any claimed extension", () => {
    expect(detectFileType(Buffer.from("#!/bin/sh\nrm -rf /\n", "utf8"))).toBeNull();
    expect(detectFileType(Buffer.from("MZ", "utf8"))).toBeNull();
    expect(detectFileType(Buffer.alloc(0))).toBeNull();
  });

  it("enforces the 20MB single-file limit constant", () => {
    expect(MAX_FILE_BYTES).toBe(20 * 1024 * 1024);
  });
});
