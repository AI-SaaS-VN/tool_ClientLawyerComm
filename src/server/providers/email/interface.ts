export interface EmailAttachment {
  filename: string;
  content: Buffer;
}

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  // REQ-DIG-05: digest emails carry the day's published files as real
  // attachments; every other mail kind leaves this unset.
  attachments?: EmailAttachment[];
}

export interface EmailSendResult {
  accepted: boolean;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<EmailSendResult>;
}
