import { randomBytes } from "node:crypto";

import type { User } from "@prisma/client";

import { prisma } from "@/lib/db";

export const SESSION_COOKIE = "clc_session";
export const SESSION_ROLLING_MS = 7 * 24 * 60 * 60 * 1000;
export const SESSION_IDLE_MS = 30 * 24 * 60 * 60 * 1000;

export async function createSession(userId: string, now: Date = new Date()) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(now.getTime() + SESSION_ROLLING_MS);
  await prisma.session.create({
    data: { id: token, userId, expiresAt, lastActiveAt: now },
  });
  return { token, expiresAt };
}

// Reads the session, enforces revocation / absolute expiry / 30-day idle,
// and rolls the expiry forward to now + 7 days on activity.
export async function getSessionUser(
  token: string | undefined,
  now: Date = new Date(),
): Promise<{ user: User; sessionId: string } | null> {
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { id: token },
    include: { user: true },
  });
  if (!session || session.revokedAt) return null;
  if (session.expiresAt.getTime() <= now.getTime()) return null;
  if (session.lastActiveAt.getTime() + SESSION_IDLE_MS <= now.getTime()) return null;

  const expiresAt = new Date(now.getTime() + SESSION_ROLLING_MS);
  await prisma.session.update({
    where: { id: session.id },
    data: { lastActiveAt: now, expiresAt },
  });
  return { user: session.user, sessionId: session.id };
}

export async function revokeSession(token: string | undefined): Promise<void> {
  if (!token) return;
  await prisma.session.updateMany({
    where: { id: token, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

// REQ-AUTH-06: Secure is on unless SESSION_COOKIE_SECURE is explicitly "false"
// (the pre-ICP HTTP test entry). Never set "false" with real case data.
export function sessionCookieSecure(): boolean {
  return (process.env.SESSION_COOKIE_SECURE ?? "true") !== "false";
}

export function sessionCookieOptions(expiresAt: Date, now: Date = new Date()) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: sessionCookieSecure(),
    path: "/",
    expires: expiresAt,
    maxAge: Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000)),
  };
}
