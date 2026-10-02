import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { SESSION_COOKIE, getSessionUser } from "@/modules/auth/session";

import { MessagesPanel } from "./messages-panel";

export const dynamic = "force-dynamic";

export default async function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: caseId } = await params;
  const store = await cookies();
  const auth = await getSessionUser(store.get(SESSION_COOKIE)?.value);
  if (!auth) redirect("/login");

  // Server-side case isolation: non-members (and revoked members) get a plain
  // 404, revealing nothing about the case (REQ-CASE-06).
  const membership = await prisma.caseMember.findUnique({
    where: { caseId_userId: { caseId, userId: auth.user.id } },
  });
  if (auth.user.globalRole === "admin" || !membership || membership.status !== "active") {
    notFound();
  }

  const kase = await prisma.case.findUnique({
    where: { id: caseId },
    include: { members: { include: { user: true } } },
  });
  if (!kase) notFound();

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-1 text-xl font-semibold">{kase.title}</h1>
      <p className="mb-6 text-sm">
        {kase.clientOrgName} · {kase.status}
        {kase.refNo ? ` · ${kase.refNo}` : ""}
        {kase.alias ? ` · ${kase.alias}` : ""}
      </p>
      <h2 className="mb-2 font-medium">成员 / Thành viên</h2>
      <ul className="flex flex-col gap-1">
        {kase.members
          .filter((m) => m.status === "active")
          .map((m) => (
            <li key={m.id} className="text-sm">
              {m.user.displayName} — {m.memberRole}
              {m.memberRole === "coordinator"
                ? ` (manage: ${m.canManage ? "on" : "off"}, review: ${m.canReview ? "on" : "off"})`
                : ""}
            </li>
          ))}
      </ul>
      <MessagesPanel caseId={caseId} />
    </main>
  );
}
