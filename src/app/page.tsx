import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SESSION_COOKIE, getSessionUser } from "@/modules/auth/session";

export const dynamic = "force-dynamic";

// F03: the root sends signed-in users to their cases and everyone else to
// Sign in — no starter page is served here.
export default async function Home() {
  const store = await cookies();
  const auth = await getSessionUser(store.get(SESSION_COOKIE)?.value);
  redirect(auth ? "/cases" : "/login");
}
