// Production builds constant-fold NODE_ENV, so a production bundle refuses
// stand-in providers outright. The designated fictitious-data test host is
// the exception: real SMTP and Kimi stay blocked (O05), and that host sets
// CLC_FICTITIOUS_TEST_HOST=1. The flag is read at runtime (it is not
// NEXT_PUBLIC_), so the production bundle still sees it. Never set it on a
// host that stores real case data.
export function standInProvidersAllowed(): boolean {
  if (process.env.CLC_FICTITIOUS_TEST_HOST === "1") return true;
  return process.env.NODE_ENV !== "production";
}
