import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// F06/O05: the SMTP adapter is exercised against a mocked nodemailer
// transport; misconfiguration fails loudly at construction, and a rejected
// send propagates instead of being faked as success.
const sendMail = vi.fn();
const createTransport = vi.fn((options: unknown) => {
  void options;
  return { sendMail };
});

vi.mock("nodemailer", () => ({
  default: { createTransport: (options: unknown) => createTransport(options) },
}));

import { SmtpEmailProvider } from "@/server/providers/email/smtp";

const ENV_KEYS = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_SECURE",
  "SMTP_USER",
  "SMTP_AUTH_CODE",
  "EMAIL_FROM",
] as const;

function setSmtpEnv(overrides: Record<string, string> = {}) {
  const env: Record<string, string> = {
    SMTP_HOST: "smtp.qq.com",
    SMTP_PORT: "587",
    SMTP_SECURE: "starttls",
    SMTP_USER: "ops@example.com",
    SMTP_AUTH_CODE: "auth-code",
    EMAIL_FROM: "ops@example.com",
    ...overrides,
  };
  for (const key of ENV_KEYS) delete process.env[key];
  Object.assign(process.env, env);
}

describe("SmtpEmailProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setSmtpEnv();
  });
  afterEach(() => {
    for (const key of ENV_KEYS) delete process.env[key];
  });

  it("builds a STARTTLS transport on 587 by default, authenticating with SMTP_USER/SMTP_AUTH_CODE", () => {
    new SmtpEmailProvider();

    expect(createTransport).toHaveBeenCalledWith({
      host: "smtp.qq.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: { user: "ops@example.com", pass: "auth-code" },
    });
  });

  it("SMTP_SECURE=ssl uses implicit TLS (port 465 by default)", () => {
    setSmtpEnv({ SMTP_SECURE: "ssl" });
    delete process.env.SMTP_PORT;

    new SmtpEmailProvider();

    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ port: 465, secure: true, requireTLS: false }),
    );
  });

  it("honours an explicit SMTP_PORT", () => {
    setSmtpEnv({ SMTP_PORT: "2525" });

    new SmtpEmailProvider();

    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ port: 2525 }),
    );
  });

  it.each([
    "SMTP_HOST",
    "SMTP_USER",
    "SMTP_AUTH_CODE",
    "EMAIL_FROM",
  ] as const)("throws loudly when %s is missing", (key) => {
    delete process.env[key];

    expect(() => new SmtpEmailProvider()).toThrow(/not configured/);
    expect(createTransport).not.toHaveBeenCalled();
  });

  it("sends from EMAIL_FROM and reports accepted when the server accepted a recipient", async () => {
    sendMail.mockResolvedValue({ accepted: ["client@example.com"], rejected: [] });
    const provider = new SmtpEmailProvider();

    const result = await provider.send({
      to: "client@example.com",
      subject: "案件邀请 / Thư mờ i vụ án",
      text: "您的邀请码 / Mã mờ i của bạn: ABC123",
    });

    expect(result).toEqual({ accepted: true });
    expect(sendMail).toHaveBeenCalledWith({
      from: "ops@example.com",
      to: "client@example.com",
      subject: "案件邀请 / Thư mờ i vụ án",
      text: "您的邀请码 / Mã mờ i của bạn: ABC123",
    });
  });

  it("reports accepted=false when every recipient was rejected", async () => {
    sendMail.mockResolvedValue({ accepted: [], rejected: ["gone@example.com"] });
    const provider = new SmtpEmailProvider();

    const result = await provider.send({
      to: "gone@example.com",
      subject: "s",
      text: "t",
    });

    expect(result).toEqual({ accepted: false });
  });

  it("propagates transport failures instead of faking success", async () => {
    sendMail.mockRejectedValue(new Error("535 auth failed"));
    const provider = new SmtpEmailProvider();

    await expect(
      provider.send({ to: "a@example.com", subject: "s", text: "t" }),
    ).rejects.toThrow("535 auth failed");
  });
});
