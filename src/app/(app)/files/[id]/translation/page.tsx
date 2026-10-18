import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { apiPath } from "@/lib/api-path";
import { SESSION_COOKIE, getSessionUser } from "@/modules/auth/session";
import { getAttachmentPageView } from "@/modules/files/attachment-translation";
import { uiText } from "@/modules/i18n/copy";
import { screenLangForUser } from "@/modules/i18n/screen-lang";

export const dynamic = "force-dynamic";

// REQ-ATT-01/02/03: the HTML Attachment Translation Page — extracted source
// text first, then the one translation. Authorization re-validates membership
// and publish state inside getAttachmentPageView on every request; anything
// unauthorized or unpublished is a plain 404. Page wording follows the
// viewer's screen language.
export default async function AttachmentTranslationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const store = await cookies();
  const auth = await getSessionUser(store.get(SESSION_COOKIE)?.value);
  if (!auth) redirect("/login");

  let view;
  try {
    view = await getAttachmentPageView(id, auth.user);
  } catch {
    notFound();
  }

  const lang = screenLangForUser(auth.user);
  const translationLabel =
    view.targetLang === "vi"
      ? uiText(lang, "translationViLabel")
      : uiText(lang, "translationZhHantLabel");

  return (
    <main className="mx-auto max-w-2xl p-8">
      <p className="mb-4 text-sm">
        <a className="underline" href={apiPath(`/cases/${view.caseId}`)}>
          {uiText(lang, "backToCase")}
        </a>
      </p>
      <h1 className="mb-1 text-xl font-semibold">{uiText(lang, "attachmentTitle")}</h1>
      <p className="mb-6 text-sm opacity-60" data-testid="attachment-file">
        {view.originalName}
      </p>
      <article className="mb-6 rounded border p-4">
        <h2 className="mb-2 font-medium">{uiText(lang, "sourceLabel")}</h2>
        <p className="whitespace-pre-wrap text-sm" data-testid="attachment-source">
          {view.sourceText}
        </p>
      </article>
      <article className="rounded border p-4">
        <h2 className="mb-2 font-medium">{translationLabel}</h2>
        <p className="whitespace-pre-wrap text-sm" data-testid="attachment-translation">
          {view.translatedText}
        </p>
      </article>
    </main>
  );
}
