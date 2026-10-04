import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

import type { EmailMessage, EmailProvider, EmailSendResult } from "./interface";

// F06/O05: real SMTP provider backed by the operator's QQ/foxmail mailbox,
// enabled by EMAIL_PROVIDER=smtp. Configuration comes from SMTP_HOST /
// SMTP_PORT / SMTP_SECURE ("starttls" on 587, "ssl" for implicit TLS on 465)
// / SMTP_USER / SMTP_AUTH_CODE / EMAIL_FROM; anything missing fails loudly at
// construction instead of silently degrading to the fake provider.
export class SmtpEmailProvider implements EmailProvider {
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(env: NodeJS.ProcessEnv = process.env) {
    const host = env.SMTP_HOST;
    const user = env.SMTP_USER;
    const pass = env.SMTP_AUTH_CODE;
    const from = env.EMAIL_FROM;
    const missing = [
      ["SMTP_HOST", host],
      ["SMTP_USER", user],
      ["SMTP_AUTH_CODE", pass],
      ["EMAIL_FROM", from],
    ]
      .filter(([, value]) => !value)
      .map(([key]) => key);
    if (missing.length > 0) {
      throw new Error(`smtp provider is not configured (${missing.join(", ")} missing)`);
    }
    const secure = env.SMTP_SECURE === "ssl";
    const port = Number(env.SMTP_PORT ?? (secure ? "465" : "587"));
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      requireTLS: !secure,
      auth: { user, pass },
    });
    this.from = from!;
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    const info = await this.transporter.sendMail({
      from: this.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      ...(message.attachments ? { attachments: message.attachments } : {}),
    });
    const accepted = Array.isArray(info.accepted) && info.accepted.length > 0;
    return { accepted };
  }
}
