// Production builds constant-fold NODE_ENV, so a production bundle refuses
// stand-in providers outright. The designated fictitious-data test host is
// the exception: it sets CLC_FICTITIOUS_TEST_HOST=1 so the fake providers
// stay selectable there (O05 real-channel approval on 2026-10-03 covers the
// real SMTP and Kimi adapters selected via EMAIL_PROVIDER/TRANSLATION_PROVIDER).
// The flag is read at runtime (it is not NEXT_PUBLIC_), so the production
// bundle still sees it. Never set it on a host that stores real case data.
export function standInProvidersAllowed(): boolean {
  if (process.env.CLC_FICTITIOUS_TEST_HOST === "1") return true;
  return process.env.NODE_ENV !== "production";
}
