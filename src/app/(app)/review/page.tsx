import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { isApiError } from "@/lib/api-error";
import { SESSION_COOKIE, getSessionUser } from "@/modules/auth/session";
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

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-4 text-xl font-semibold">审核队列 / Hàng đợi duyệt</h1>
      {tasks === null ? (
        <p className="text-sm">您没有审核权限。 / Bạn không có quyền duyệt.</p>
      ) : (
        <ReviewQueue
          initialTasks={tasks.map((task) => ({
            ...task,
            createdAt: task.createdAt.toISOString(),
          }))}
        />
      )}
    </main>
  );
}
