// REQ-FILE-01: real file-type detection from magic bytes; extensions and
// declared content types are never trusted. Whitelist: PDF, DOCX, JPG, PNG.
export const MAX_FILE_BYTES = 20 * 1024 * 1024;

export interface DetectedFileType {
  kind: "pdf" | "docx" | "jpg" | "png";
  mime: string;
}

const PDF_MAGIC = Buffer.from("%PDF-", "ascii");
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

export function detectFileType(buf: Buffer): DetectedFileType | null {
  if (buf.length >= PDF_MAGIC.length && buf.subarray(0, PDF_MAGIC.length).equals(PDF_MAGIC)) {
    return { kind: "pdf", mime: "application/pdf" };
  }
  if (buf.length >= PNG_MAGIC.length && buf.subarray(0, PNG_MAGIC.length).equals(PNG_MAGIC)) {
    return { kind: "png", mime: "image/png" };
  }
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { kind: "jpg", mime: "image/jpeg" };
  }
  // DOCX is a ZIP container. MVP limitation: any ZIP passes as DOCX; deep
  // container parsing ([Content_Types].xml, embedded objects) is not done.
  if (buf.length >= ZIP_MAGIC.length && buf.subarray(0, ZIP_MAGIC.length).equals(ZIP_MAGIC)) {
    return {
      kind: "docx",
      mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
  }
  return null;
}
