import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { listCasesView } from "@/modules/admin/cases";
import { SESSION_COOKIE, getSessionUser } from "@/modules/auth/session";
import { caseStatusText, memberStatusText, roleText, uiText } from "@/modules/i18n/copy";
import { screenLangForUser } from "@/modules/i18n/screen-lang";

import { LanguageSwitch } from "../../language-switch";

import { CreateCaseForm } from "./create-case-form";

export const dynamic = "force-dynamic";

// REQ-ADM-01: the administration console lists every case with metadata and
// the member roster only. The server render uses the session; every mutation
// goes through the MFA-guarded admin APIs with a fresh TOTP code.
export default async function AdminCasesPage() {
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

  const { cases } = auth.user.mfaEnrolledAt ? await listCasesView() : { cases: [] };

  return (
    <main className="mx-auto max-w-3xl p-8">
      <LanguageSwitch lang={lang} role={auth.user.globalRole} />
      <h1 className="mb-2 text-xl font-semibold">{uiText(lang, "adminCasesTitle")}</h1>
      <p className="mb-4 text-sm opacity-60">{uiText(lang, "adminRosterNote")}</p>
      {!auth.user.mfaEnrolledAt ? (
        <p className="text-sm" data-testid="admin-mfa-hint">
          {uiText(lang, "adminMfaHint")}
        </p>
      ) : (
        <>
          {cases.length === 0 ? (
            <p className="text-sm">{uiText(lang, "adminCasesEmpty")}</p>
          ) : (
            <ul className="mb-8 flex flex-col gap-2" data-testid="admin-case-list">
              {cases.map((kase) => (
                <li key={kase.id} className="border px-4 py-3">
                  <div>
                    <Link
                      href={`/admin/cases/${kase.id}`}
                      className="font-medium underline"
                      data-testid="admin-case-link"
                    >
                      {kase.title}
                    </Link>
                    <span className="ml-3 text-sm">
                      {kase.clientOrgName} · {caseStatusText(lang, kase.status)}
                    </span>
                  </div>
                  <ul className="mt-1 text-sm" data-testid="admin-case-roster">
                    {kase.members.map((member, index) => (
                      <li key={member.userId ?? `${kase.id}-pending-${index}`}>
                        {(member.displayName ?? member.email) ?? ""} —{" "}
                        {roleText(lang, member.role)} —{" "}
                        {memberStatusText(lang, member.status)}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
          <CreateCaseForm lang={lang} />
        </>
      )}
    </main>
  );
}
