import { NextRequest } from "next/server";

import { prisma } from "@/lib/db";
import { encryptText, hashEmail } from "@/modules/auth/crypto";
import { SESSION_COOKIE, createSession } from "@/modules/auth/session";
import { fakeEmailProvider } from "@/server/providers/email/fake";

export async function resetDatabase(): Promise<void> {
  await prisma.otpChallenge.deleteMany();
  await prisma.invite.deleteMany();
  await prisma.caseMember.deleteMany();
  await prisma.contactChannel.deleteMany();
  await prisma.session.deleteMany();
  await prisma.case.deleteMany();
  await prisma.user.deleteMany();
  fakeEmailProvider.reset();
}

export function postJson(
  path: string,
  body: unknown,
  headers: Record<string, string> = {},
): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json", ...headers },
  });
}

export function cookieHeader(cookie: string | null): Record<string, string> {
  return cookie ? { cookie } : {};
}

export async function sessionCookieFor(userId: string): Promise<string> {
  const { token } = await createSession(userId);
  return `${SESSION_COOKIE}=${token}`;
}

export async function createVerifiedUser(role: string, email: string) {
  const user = await prisma.user.create({
    data: { displayName: email.split("@")[0]!, globalRole: role },
  });
  const channel = await prisma.contactChannel.create({
    data: {
      userId: user.id,
      valueEnc: encryptText(email),
      valueHash: hashEmail(email),
      verifiedAt: new Date(),
      isPrimary: true,
    },
  });
  return { user, channel };
}

export async function seedCaseWithCoordinator(title = "Fictitious Case") {
  const { user: coordinator } = await createVerifiedUser(
    "coordinator",
    "coordinator1@example.com",
  );
  const kase = await prisma.case.create({ data: { title } });
  await prisma.caseMember.create({
    data: {
      caseId: kase.id,
      userId: coordinator.id,
      memberRole: "coordinator",
      canManage: true,
      canReview: true,
    },
  });
  const cookie = await sessionCookieFor(coordinator.id);
  return { coordinator, kase, cookie };
}

export function extractInviteCode(text: string): string {
  // The invitation email carries the code in grouped form XXXXX-XXXXX;
  // the 6-digit OTP never matches this shape.
  const match = text.match(/\b([0-9A-Z]{5}-[0-9A-Z]{5})\b/);
  if (!match) throw new Error("no invite code in email text");
  return match[1]!;
}

export function extractOtp(text: string): string {
  const match = text.match(/verification code is: (\d{6})/);
  if (!match) throw new Error("no OTP in email text");
  return match[1]!;
}

export function sessionCookieFrom(setCookies: string[]): string {
  const raw = setCookies.find((c) => c.startsWith(`${SESSION_COOKIE}=`));
  if (!raw) throw new Error("no session cookie set");
  return raw.split(";")[0]!;
}
