import { execFileSync, execSync } from "node:child_process";

export const TEST_DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5432/clc_test";

export default function setup(): void {
  try {
    execSync("docker exec clc-postgres createdb -U postgres clc_test", {
      stdio: "ignore",
    });
  } catch {
    // database already exists
  }
  // dotenv inside prisma.config.ts must not override this explicit value.
  execFileSync("npx", ["prisma", "migrate", "deploy"], {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: "inherit",
  });
  process.env.DATABASE_URL = TEST_DATABASE_URL;
}
