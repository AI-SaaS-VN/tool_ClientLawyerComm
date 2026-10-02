// Force every test (unit and integration) onto the disposable clc_test
// database and the fake email provider. Runs before any test file imports,
// so src/lib/db.ts picks these up when the Prisma client is first created.
process.env.DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5432/clc_test";
process.env.EMAIL_PROVIDER = "fake";
