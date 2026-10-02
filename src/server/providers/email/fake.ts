import type { EmailMessage, EmailProvider, EmailSendResult } from "./interface";

export type OutboxEntry = EmailMessage & { at: Date };

// In-process fake provider for development and tests. Non-production only:
// recipient addresses land in this outbox, which must never exist in prod.
class FakeEmailProvider implements EmailProvider {
  readonly outbox: OutboxEntry[] = [];

  async send(message: EmailMessage): Promise<EmailSendResult> {
    this.outbox.push({ ...message, at: new Date() });
    return { accepted: true };
  }

  reset(): void {
    this.outbox.length = 0;
  }
}

export const fakeEmailProvider = new FakeEmailProvider();
