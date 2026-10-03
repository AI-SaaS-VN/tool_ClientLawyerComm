import { standInProvidersAllowed } from "../stand-in";
import { fakeEmailProvider } from "./fake";
import { SmtpEmailProvider } from "./smtp";
import type { EmailProvider } from "./interface";

// F06: EMAIL_PROVIDER=smtp selects the real SMTP adapter (O05); "fake" stays
// restricted to non-production hosts and the fictitious-data test host.
export function getEmailProvider(): EmailProvider {
  const kind = process.env.EMAIL_PROVIDER ?? "fake";
  if (kind === "smtp") {
    return new SmtpEmailProvider();
  }
  if (kind === "fake") {
    if (!standInProvidersAllowed()) {
      throw new Error("fake email provider is not allowed in production");
    }
    return fakeEmailProvider;
  }
  throw new Error(`unsupported EMAIL_PROVIDER: ${kind}`);
}
