export const E2E_PORT = 3100;
// Playwright and `next dev` run on the development host. localhost is that
// host. It is not the laptop, and it is not the Shanghai test host: that host
// serves the deployed app on HTTP port 80, while this suite starts its own
// server. See docs/deployment.md section 5.
export const E2E_BASE_URL = `http://localhost:${E2E_PORT}`;
export const E2E_DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/clc_e2e";
