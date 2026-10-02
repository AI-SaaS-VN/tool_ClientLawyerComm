import type { FileScanner } from "./interface";
import { stubFileScanner } from "./stub";

// Only the stub exists in MVP; it is refused in production, where a clean-by-
// default verdict would be a security hole (REQ-FILE-03).
export function getFileScanner(): FileScanner {
  const kind = process.env.FILE_SCANNER ?? "stub";
  if (kind === "stub") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("stub file scanner is not allowed in production");
    }
    return stubFileScanner;
  }
  throw new Error(`unsupported FILE_SCANNER: ${kind}`);
}
