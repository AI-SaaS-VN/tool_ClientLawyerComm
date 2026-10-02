import { execFileSync, execSync } from "node:child_process";

import { E2E_DATABASE_URL } from "./config";

// clc_e2e is a disposable database dedicated to the browser tests: it is
// dropped and rebuilt from the migrations on every run, so specs start from
// a clean, migrated schema. clc_dev is never touched.
export default function globalSetup(): void {
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
}
