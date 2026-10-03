import { expect, test } from "@playwright/test";

test("GET /api/health returns 200 and ok payload", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual({ status: "ok" });
});

// F03: the root no longer serves the starter page — without a session it
// redirects to Sign in.
test("GET / without a session lands on /login", async ({ request }) => {
  const res = await request.get("/");
  expect(res.url()).toContain("/login");
});
