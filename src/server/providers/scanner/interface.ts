// Malicious-content scanning seam (REQ-FILE-03). Anything that is not a
// clean verdict — threat, timeout, encrypted/unparseable content, or a
// scanner exception — moves the file to check_failed, never to published.
export interface ScanInput {
  storageKey: string;
  mime: string;
  sizeBytes: number;
  sha256: string;
}

export type ScanVerdict =
  | { outcome: "clean" }
  | { outcome: "malicious" | "timeout" | "encrypted" | "unparseable"; reason: string };

export interface FileScanner {
  scan(input: ScanInput): Promise<ScanVerdict>;
}
