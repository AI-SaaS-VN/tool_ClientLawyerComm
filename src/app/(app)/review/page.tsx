import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { isApiError } from "@/lib/api-error";
import { SESSION_COOKIE, getSessionUser } from "@/modules/auth/session";
import { uiText } from "@/modules/i18n/copy";
import { screenLangForUser } from "@/modules/i18n/screen-lang";
import { listReviewTasks } from "@/modules/review/service";

import { ReviewQueue } from "./review-queue";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const store = await cookies();
  const auth = await getSessionUser(store.get(SESSION_COOKIE)?.value);
  if (!auth) redirect("/login");

  let tasks: Awaited<ReturnType<typeof listReviewTasks>> | null = null;
  try {
    tasks = await listReviewTasks(auth.user);
  } catch (error) {
    if (!isApiError(error) || error.status !== 403) throw error;
  }

  const lang = screenLangForUser(auth.user);

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-4 text-xl font-semibold">{uiText(lang, "reviewTitle")}</h1>
      {tasks === null ? (
        <p className="text-sm">{uiText(lang, "reviewForbidden")}</p>
      ) : (
        <ReviewQueue
          lang={lang}
          initialTasks={tasks.map((task) => ({
            ...task,
            createdAt: task.createdAt.toISOString(),
          }))}
        />
      )}
    </main>
  );
}
