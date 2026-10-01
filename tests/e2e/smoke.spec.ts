import { expect, test } from "@playwright/test";

test("GET /api/health returns 200 and ok payload", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual({ status: "ok" });
});
