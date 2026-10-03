"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";

import { uiText } from "@/modules/i18n/copy";
import type { SupportedLang } from "@/modules/translation/langs";

export function InviteForm({ lang }: { lang: SupportedLang }) {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  async function activate(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    setPending(true);
    try {
      const res = await fetch("/api/invites/activate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code: inviteCode }),
      });
      if (res.ok) {
        const { caseId } = (await res.json()) as { caseId: string };
        router.push(`/cases/${caseId}`);
        router.refresh();
        return;
      }
      setMessage(uiText(lang, "inviteMismatch"));
    } catch {
      setMessage(uiText(lang, "inviteUnavailable"));
    } finally {
      setPending(false);
    }
  }

  async function acceptWhileLoggedIn() {
    setMessage("");
    setPending(true);
    try {
      const res = await fetch("/api/invites/accept", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: inviteCode }),
      });
      if (res.ok) {
        const { caseId } = (await res.json()) as { caseId: string };
        router.push(`/cases/${caseId}`);
        router.refresh();
        return;
      }
      setMessage(uiText(lang, "inviteMismatch"));
    } catch {
      setMessage(uiText(lang, "inviteUnavailable"));
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm p-8">
      <h1 className="mb-4 text-xl font-semibold">{uiText(lang, "inviteTitle")}</h1>
      <p className="mb-4 text-sm">{uiText(lang, "inviteHelp")}</p>
      <form onSubmit={activate} className="flex flex-col gap-3">
        <input
          required
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          placeholder={uiText(lang, "inviteCodePlaceholder")}
          data-testid="invite-code"
          className="border px-3 py-2"
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={uiText(lang, "inviteEmailPlaceholder")}
          data-testid="invite-email"
          className="border px-3 py-2"
        />
        <button
          type="submit"
          className="border px-3 py-2"
          data-testid="invite-activate"
          disabled={!mounted || pending}
        >
          {uiText(lang, "inviteActivate")}
        </button>
        <button
          type="button"
          onClick={acceptWhileLoggedIn}
          className="border px-3 py-2"
          data-testid="invite-accept-direct"
          disabled={!mounted || pending}
        >
          {uiText(lang, "inviteAcceptSignedIn")}
        </button>
      </form>
      {message && (
        <p className="mt-4 text-sm" data-testid="invite-message">
          {message}
        </p>
      )}
    </main>
  );
}
