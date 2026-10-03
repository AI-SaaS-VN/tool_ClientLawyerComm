import { defineConfig } from "@playwright/test";

import { E2E_BASE_URL, E2E_DATABASE_URL, E2E_PORT } from "./tests/e2e/config";

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  // One worker: the specs share the single clc_e2e database and fake outbox.
  workers: 1,
  // Generous ceilings: the dev server compiles each route on first hit, and a
  // cold compile can land mid-test inside an auto-wait window.
  timeout: 180_000,
  expect: { timeout: 30_000 },
  use: {
    baseURL: E2E_BASE_URL,
    navigationTimeout: 60_000,
    // Keep a full trace when a journey fails so flakes can be diagnosed from
    // evidence instead of re-runs.
    trace: "retain-on-failure",
  },
  webServer: {
    // A dedicated dev server on its own port and database (clc_e2e), never
    // the developer's clc_dev server on :3000. The worker is off: browser
    // tests drive queue passes explicitly via POST /api/test/worker.
    command: `npx next dev -p ${E2E_PORT}`,
    url: `${E2E_BASE_URL}/api/health`,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      DATABASE_URL: E2E_DATABASE_URL,
      EMAIL_PROVIDER: "fake",
      LLM_PROVIDER: "fake",
      TRANSLATION_PROVIDER: "fake",
      FILE_SCANNER: "stub",
      MINIO_ENDPOINT: "localhost",
      MINIO_PORT: "9000",
      MINIO_USE_SSL: "false",
      MINIO_ACCESS_KEY: "minioadmin",
      MINIO_SECRET_KEY: "minioadmin",
      MINIO_BUCKET: "clc-e2e-uploads",
      SESSION_COOKIE_SECURE: "false",
      NOTIFICATION_WORKER: "off",
      APP_BASE_URL: E2E_BASE_URL,
    },
  },
});
