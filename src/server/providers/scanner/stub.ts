import type { FileScanner, ScanInput, ScanVerdict } from "./interface";

// Default scanner stand-in: everything is clean unless a test injects
// verdicts (one per upcoming scan call). Never usable in production.
class StubFileScanner implements FileScanner {
  readonly calls: ScanInput[] = [];
  private queue: ScanVerdict[] = [];

  inject(...verdicts: ScanVerdict[]): void {
    this.queue.push(...verdicts);
  }

  async scan(input: ScanInput): Promise<ScanVerdict> {
    this.calls.push(input);
    return this.queue.shift() ?? { outcome: "clean" };
  }

  reset(): void {
    this.calls.length = 0;
    this.queue.length = 0;
  }
}

export const stubFileScanner = new StubFileScanner();
