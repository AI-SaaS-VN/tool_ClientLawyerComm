import { execFileSync, execSync } from "node:child_process";

import { E2E_BASE_URL, E2E_DATABASE_URL } from "./config";

// clc_e2e is a disposable database dedicated to the browser tests: it is
// dropped and rebuilt from the migrations on every run, so specs start from
// a clean, migrated schema. clc_dev is never touched.
export default async function globalSetup(): Promise<void> {
  execSync(
    'docker exec clc-postgres psql -U postgres -c "DROP DATABASE IF EXISTS clc_e2e WITH (FORCE)"',
    { stdio: "inherit" },
  );
  execSync("docker exec clc-postgres createdb -U postgres clc_e2e", { stdio: "inherit" });
  // dotenv inside prisma.config.ts must not override this explicit value.
  execFileSync("npx", ["prisma", "migrate", "deploy"], {
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL },
    stdio: "inherit",
  });
  await warmRoutes();
}

// The dev server compiles every route on first hit, and a cold compile can
// eat a whole expect window mid-test (a real source of the dual-user
// visibility timeout). Compile the journey routes here, outside any
// assertion window. Responses are unauthenticated 401/redirects — only the
// compilation side effect matters.
async function warmRoutes(): Promise<void> {
  const probe = "00000000-0000-0000-0000-000000000000";
  const targets: Array<[string, string]> = [
    ["GET", "/login"],
    ["GET", "/invite"],
    ["GET", "/cases"],
    ["GET", `/cases/${probe}`],
    ["GET", "/review"],
    ["GET", `/api/cases/${probe}/messages`],
    ["GET", `/api/cases/${probe}/files`],
    ["POST", `/api/cases/${probe}/files`],
    ["POST", `/api/cases/${probe}/messages`],
    ["GET", `/api/cases/${probe}/stream`],
    ["GET", `/api/files/${probe}/download`],
    ["POST", `/api/messages/${probe}/translate`],
    ["GET", "/api/review/tasks"],
    ["POST", "/api/invites/activate"],
  ];
  for (const [method, path] of targets) {
    try {
      await fetch(`${E2E_BASE_URL}${path}`, { method, redirect: "manual" });
    } catch (error) {
      throw new Error(`e2e warmup failed for ${method} ${path}: ${String(error)}`);
    }
  }
}
