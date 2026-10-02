import type { User } from "@prisma/client";
import type { NextRequest } from "next/server";

import { ApiError } from "@/lib/api-error";
import { SESSION_COOKIE, getSessionUser } from "@/modules/auth/session";

export async function requireUser(req: NextRequest): Promise<User> {
  const auth = await getSessionUser(req.cookies.get(SESSION_COOKIE)?.value);
  if (!auth) throw new ApiError(401, "unauthenticated");
  return auth.user;
}
