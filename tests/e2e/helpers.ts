import { execFileSync } from "node:child_process";

import { expect, request as apiRequest, type APIRequestContext, type Browser, type BrowserContext, type Page } from "@playwright/test";

import { totpCode } from "../../src/server/auth/mfa";
import { E2E_BASE_URL, E2E_DATABASE_URL } from "./config";

export interface OutboxEntry {
  to: string;
  subject: string;
  text: string;
  at: string;
}

export function runId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 10);
}

export async function outbox(request: APIRequestContext, to?: string): Promise<OutboxEntry[]> {
  const res = await request.get(`/api/test/outbox${to ? `?to=${encodeURIComponent(to)}` : ""}`);
  expect(res.status()).toBe(200);
  return ((await res.json()) as { entries: OutboxEntry[] }).entries;
}

// Polls the fake outbox until a matching email exists — no fixed sleeps.
export async function waitForEmail(
  request: APIRequestContext,
  to: string,
  match: (entry: OutboxEntry) => boolean,
  description: string,
): Promise<OutboxEntry> {
  let found: OutboxEntry | undefined;
  await expect
    .poll(
      async () => {
        found = (await outbox(request, to)).find(match);
        return Boolean(found);
      },
      { message: `email to ${to}: ${description}`, timeout: 15_000 },
    )
    .toBe(true);
  return found!;
}

export function extractInviteCode(text: string): string {
  const match = text.match(/\b([0-9A-Z]{5}-[0-9A-Z]{5})\b/);
  if (!match) throw new Error("no invite code in email text");
  return match[1]!;
}

export function extractOtp(text: string): string {
  const match = text.match(/verification code is: (\d{6})/);
  if (!match) throw new Error("no OTP in email text");
  return match[1]!;
}

function isOtpMail(entry: OutboxEntry): boolean {
  return entry.text.includes("verification code");
}

export function isInviteMail(entry: OutboxEntry): boolean {
  return entry.text.includes("邀请码");
}

// The local bootstrap is the only way admin accounts come into being
// (REQ-AUTH-11); it reads DATABASE_URL from the environment, so point it at
// the disposable E2E database.
export function bootstrapAdmin(email: string, displayName: string): void {
  execFileSync("node", ["scripts/bootstrap-admin.ts", email, displayName], {
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL },
    stdio: "pipe",
  });
}

export async function loginViaApi(request: APIRequestContext, email: string): Promise<void> {
  const req = await request.post("/api/auth/otp/request", { data: { email } });
  expect(req.status()).toBe(200);
  const mail = await waitForEmail(request, email, isOtpMail, "login OTP");
  const verify = await request.post("/api/auth/otp/verify", {
    data: { email, code: extractOtp(mail.text) },
  });
  expect(verify.status()).toBe(200);
}

export async function enrollMfaViaApi(request: APIRequestContext): Promise<string> {
  const enroll = await request.post("/api/auth/mfa/enroll");
  expect(enroll.status()).toBe(201);
  const { secret } = (await enroll.json()) as { secret: string };
  const verify = await request.post("/api/auth/mfa/verify", {
    data: { code: totpCode(secret, Date.now()) },
  });
  expect(verify.status()).toBe(200);
  return secret;
}

export interface TriangleInput {
  title: string;
  coordinatorEmail: string;
  clientEmail: string;
  lawyerEmail: string;
}

export interface Triangle {
  input: TriangleInput;
  caseId: string;
  adminEmail: string;
  adminDisplayName: string;
  codeFor: (email: string) => string;
}

// REQ-OPS-07 journey seed: a bootstrapped, MFA-enrolled administrator creates
// the fictitious triangle case through the real admin API.
export async function seedTriangle(request: APIRequestContext, id: string): Promise<Triangle> {
  const adminEmail = `admin-${id}@example.com`;
  const adminDisplayName = `admin-${id}`;
  bootstrapAdmin(adminEmail, adminDisplayName);
  await loginViaApi(request, adminEmail);
  const secret = await enrollMfaViaApi(request);
  const input: TriangleInput = {
    title: `E2E 测试案件 ${id}`,
    coordinatorEmail: `coordinator-${id}@example.com`,
    clientEmail: `client-${id}@example.com`,
    lawyerEmail: `lawyer-${id}@example.com`,
  };
  const created = await request.post("/api/admin/test-cases", {
    data: input,
    headers: { "x-totp-code": totpCode(secret, Date.now()) },
  });
  expect(created.status()).toBe(201);
  const body = (await created.json()) as { caseId: string };
  // The fake outbox is shared across specs in one server process, so scope
  // every assertion to this triangle's own addresses.
  const addresses = [input.coordinatorEmail, input.clientEmail, input.lawyerEmail];
  const inviteMails = (await outbox(request)).filter(
    (entry) => isInviteMail(entry) && addresses.includes(entry.to),
  );
  expect(inviteMails.map((entry) => entry.to).sort()).toEqual(addresses.sort());
  return {
    input,
    caseId: body.caseId,
    adminEmail,
    adminDisplayName,
    codeFor: (email) => extractInviteCode(inviteMails.find((entry) => entry.to === email)!.text),
  };
}

// What the /invite page does, driven at the API level for fast seeding.
export async function acceptInviteViaApi(
  request: APIRequestContext,
  email: string,
  inviteCode: string,
): Promise<void> {
  const res = await request.post("/api/invites/activate", {
    data: { email, code: inviteCode },
  });
  expect(res.status()).toBe(200);
  expect(((await res.json()) as { role: string }).role).toBeTruthy();
}

// The /invite page: invited email + activation code, then the case list.
export async function acceptInviteViaUi(
  page: Page,
  _request: APIRequestContext,
  email: string,
  inviteCode: string,
): Promise<void> {
  await page.goto("/invite");
  await page.getByTestId("invite-code").fill(inviteCode);
  await page.getByTestId("invite-email").fill(email);
  await page.getByTestId("invite-activate").click();
  await page.waitForURL("**/cases");
}

// A browser context whose session belongs to a user activated at the API
// level (used when the journey under test is not the activation itself).
export async function activatedUserContext(
  browser: Browser,
  email: string,
  inviteCode: string,
): Promise<BrowserContext> {
  const api = await apiRequest.newContext({ baseURL: E2E_BASE_URL });
  await acceptInviteViaApi(api, email, inviteCode);
  const storageState = await api.storageState();
  await api.dispose();
  return browser.newContext({ storageState });
}

export async function runWorkerOnce(request: APIRequestContext): Promise<void> {
  const res = await request.post("/api/test/worker");
  expect(res.status()).toBe(200);
}
