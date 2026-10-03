import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { SESSION_COOKIE, getSessionUser } from "@/modules/auth/session";
import { caseStatusText, roleText, uiText } from "@/modules/i18n/copy";
import { screenLangForUser } from "@/modules/i18n/screen-lang";

import { LanguageSwitch } from "../language-switch";

export const dynamic = "force-dynamic";

export default async function CasesPage() {
  const store = await cookies();
  const auth = await getSessionUser(store.get(SESSION_COOKIE)?.value);
  if (!auth) redirect("/login");

  const memberships = await prisma.caseMember.findMany({
    where: { userId: auth.user.id, status: "active" },
    include: { case: true },
    orderBy: { case: { updatedAt: "desc" } },
  });

  const lang = screenLangForUser(auth.user);

  return (
    <main className="mx-auto max-w-2xl p-8">
      <LanguageSwitch lang={lang} role={auth.user.globalRole} />
      <h1 className="mb-4 text-xl font-semibold">{uiText(lang, "casesTitle")}</h1>
      {memberships.length === 0 ? (
        <p className="text-sm">{uiText(lang, "casesEmpty")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {memberships.map((m) => (
            <li key={m.caseId} className="border px-4 py-3">
              <Link href={`/cases/${m.caseId}`} className="font-medium underline" data-testid="case-link">
                {m.case.title}
              </Link>
              <span className="ml-3 text-sm">
                {m.case.clientOrgName} · {caseStatusText(lang, m.case.status)} · {roleText(lang, m.memberRole)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
