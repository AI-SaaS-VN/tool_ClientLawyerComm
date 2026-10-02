import { fakeEmailProvider } from "./fake";
import type { EmailProvider } from "./interface";

// T02 ships only the fake provider; the real SMTP adapter is T12.
export function getEmailProvider(): EmailProvider {
  const kind = process.env.EMAIL_PROVIDER ?? "fake";
  if (kind === "fake") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("fake email provider is not allowed in production");
    }
    return fakeEmailProvider;
  }
  throw new Error(`unsupported EMAIL_PROVIDER: ${kind}`);
}
