import { expect, request as apiRequest, test } from "@playwright/test";

import { totpCode } from "../../src/server/auth/mfa";
import { E2E_BASE_URL } from "./config";
import {
  acceptInviteViaUi,
  bootstrapAdmin,
  extractInviteCode,
  extractOtp,
  isInviteMail,
  outbox,
  runId,
  waitForEmail,
} from "./helpers";

// REQ-OPS-07 journey: a bootstrapped administrator signs in (real /login
// page), enrolls TOTP MFA, creates the fictitious triangle case, and the
// three recipients activate — each seeing only that case, with the
// administrator never in the chat.
test("admin test-case journey: bootstrap → MFA → triangle activation → isolation", async ({
  browser,
  request,
}) => {
  const id = runId();
  const adminEmail = `admin-${id}@example.com`;
  const adminDisplayName = `admin-${id}`;
  bootstrapAdmin(adminEmail, adminDisplayName);

  // Sign in through the real login page.
  const adminContext = await browser.newContext();
  const loginPage = await adminContext.newPage();
  await loginPage.goto("/login");
  await loginPage.getByTestId("login-email").fill(adminEmail);
  await loginPage.getByTestId("login-send-code").click();
  const otpMail = await waitForEmail(request, adminEmail, (e) => e.text.includes("verification code"), "login OTP");
  await loginPage.getByTestId("login-code").fill(extractOtp(otpMail.text));
  await loginPage.getByTestId("login-verify").click();
  await expect(loginPage.getByTestId("login-message")).toHaveText("Signed in.");

  // MFA enrollment and the test-case call ride on the browser session.
  const adminApi = await apiRequest.newContext({
    baseURL: E2E_BASE_URL,
    storageState: await adminContext.storageState(),
  });
  const enroll = await adminApi.post("/api/auth/mfa/enroll");
  expect(enroll.status()).toBe(201);
  const { secret } = (await enroll.json()) as { secret: string };
  const verify = await adminApi.post("/api/auth/mfa/verify", {
    data: { code: totpCode(secret, Date.now()) },
  });
  expect(verify.status()).toBe(200);

  const input = {
    title: `验收测试案件 ${id}`,
    coordinatorEmail: `coordinator-${id}@example.com`,
    clientEmail: `client-${id}@example.com`,
    lawyerEmail: `lawyer-${id}@example.com`,
  };
  const created = await adminApi.post("/api/admin/test-cases", {
    data: input,
    headers: { "x-totp-code": totpCode(secret, Date.now()) },
  });
  expect(created.status()).toBe(201);
  const body = (await created.json()) as {
    caseId: string;
    invites: Array<{ id: string; role: string }>;
  };
  expect(body.invites.map((invite) => invite.role).sort()).toEqual([
    "client",
    "coordinator",
    "lawyer",
  ]);

  // The administrator is not a chat member: case surfaces stay forbidden.
  const adminCases = await adminApi.get("/api/cases");
  expect(adminCases.status()).toBe(403);
  const adminCaseDetail = await adminApi.get(`/api/cases/${body.caseId}`);
  expect(adminCaseDetail.status()).toBe(403);

  // Exactly three activation emails went out, one per entered address, to no
  // one else (the outbox is shared across specs, so scope by address).
  const addresses = [input.coordinatorEmail, input.clientEmail, input.lawyerEmail];
  const inviteMails = (await outbox(request)).filter(
    (entry) => isInviteMail(entry) && addresses.includes(entry.to),
  );
  expect(inviteMails).toHaveLength(3);
  expect(inviteMails.map((entry) => entry.to).sort()).toEqual(
    [input.coordinatorEmail, input.clientEmail, input.lawyerEmail].sort(),
  );
  await adminApi.dispose();

  // Each recipient activates through the /invite page and sees exactly one
  // case — this one — with no administrator in the chat. Members join one by
  // one, so the full triangle is asserted on the last activator's page.
  let lastPage: import("@playwright/test").Page | null = null;
  let lastContext: import("@playwright/test").BrowserContext | null = null;
  for (const email of [input.coordinatorEmail, input.clientEmail, input.lawyerEmail]) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const mail = inviteMails.find((entry) => entry.to === email)!;
    await acceptInviteViaUi(page, request, email, extractInviteCode(mail.text));
    await page.goto("/cases");
    await expect(page.getByTestId("case-link")).toHaveCount(1);
    await expect(page.getByTestId("case-link")).toHaveText(input.title);
    await page.getByTestId("case-link").click();
    await expect(page.getByTestId("member-list")).not.toContainText(adminDisplayName);
    await lastContext?.close();
    lastContext = context;
    lastPage = page;
  }

  // After the third activation the chat holds exactly the triangle.
  const members = lastPage!.getByTestId("member-list");
  await expect(members).toContainText(`coordinator-${id}`);
  await expect(members).toContainText(`client-${id}`);
  await expect(members).toContainText(`lawyer-${id}`);
  await expect(members).not.toContainText(adminDisplayName);
  await lastContext!.close();
  await adminContext.close();

  // Activation consumed each single-use code: the invite emails are the only
  // activation mail the triangle addresses ever received.
  for (const email of [input.coordinatorEmail, input.clientEmail, input.lawyerEmail]) {
    const mails = await outbox(request, email);
    expect(mails.filter(isInviteMail)).toHaveLength(1);
  }
});
