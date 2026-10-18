import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { listCasesView } from "@/modules/admin/cases";
import { SESSION_COOKIE, getSessionUser } from "@/modules/auth/session";
import { caseStatusText, uiText } from "@/modules/i18n/copy";
import { screenLangForUser } from "@/modules/i18n/screen-lang";

import { CaseAdminPanel } from "./case-admin-panel";

export const dynamic = "force-dynamic";

// REQ-ADM-01/03: one case's console page — metadata, roster, add participant,
// revoke member. Content (messages/files) is never loaded here (REQ-PM-06).
export default async function AdminCasePage({ params }: { params: Promise<{ id: string }> }) {
  const store = await cookies();
  const auth = await getSessionUser(store.get(SESSION_COOKIE)?.value);
  if (!auth) redirect("/login");
  const lang = screenLangForUser(auth.user);
  if (auth.user.globalRole !== "admin") {
    return (
      <main className="mx-auto max-w-3xl p-8">
        <p className="text-sm">{uiText(lang, "adminForbidden")}</p>
      </main>
    );
  }

  const { id } = await params;
  const { cases } = await listCasesView();
  const kase = cases.find((entry) => entry.id === id);
  if (!kase) notFound();

  return (
    <main className="mx-auto max-w-3xl p-8">
      <p className="mb-2 text-sm">
        <Link href="/admin/cases" className="underline">
          {uiText(lang, "adminBackToCases")}
        </Link>
      </p>
      <h1 className="mb-1 text-xl font-semibold">{kase.title}</h1>
      <p className="mb-4 text-sm opacity-60">
        {kase.clientOrgName} · {caseStatusText(lang, kase.status)} ·{" "}
        {uiText(lang, "adminRosterNote")}
      </p>
      <CaseAdminPanel caseId={kase.id} lang={lang} members={kase.members} />
    </main>
  );
}
