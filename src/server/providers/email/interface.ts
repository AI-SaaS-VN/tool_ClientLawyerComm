export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

export interface EmailSendResult {
  accepted: boolean;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<EmailSendResult>;
}
