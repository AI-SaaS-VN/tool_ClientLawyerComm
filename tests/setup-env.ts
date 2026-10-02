// Force every test (unit and integration) onto the disposable clc_test
// database and the fake email provider. Runs before any test file imports,
// so src/lib/db.ts picks these up when the Prisma client is first created.
process.env.DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5432/clc_test";
process.env.EMAIL_PROVIDER = "fake";
// Files: disposable MinIO bucket and the injectable stub scanner.
process.env.MINIO_ENDPOINT = "localhost";
process.env.MINIO_PORT = "9000";
process.env.MINIO_USE_SSL = "false";
process.env.MINIO_ACCESS_KEY = "minioadmin";
process.env.MINIO_SECRET_KEY = "minioadmin";
process.env.MINIO_BUCKET = "clc-test-uploads";
process.env.FILE_SCANNER = "stub";
