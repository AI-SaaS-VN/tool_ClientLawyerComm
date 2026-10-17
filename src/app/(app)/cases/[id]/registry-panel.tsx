"use client";

import { useEffect, useState } from "react";

import { uiText } from "@/modules/i18n/copy";

interface RegistryState {
  status: string;
  queryName: string | null;
  resultText: string | null;
  sourceUrl: string | null;
  lookedUpAt: string | null;
}

// REQ-REG-01/02: the coordinator-only registry block. The coordinator enters
// the target company's Vietnamese name or tax code; the result is shown only
// here, never posted to the case chat.
export function RegistryPanel({ caseId, lang }: { caseId: string; lang: string }) {
  const [registry, setRegistry] = useState<RegistryState | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [needName, setNeedName] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch(`/api/cases/${caseId}/registry`)
        .then(async (res) => {
          if (cancelled || !res.ok) return;
          const data = (await res.json()) as { registry: RegistryState };
          setRegistry(data.registry);
        })
        .catch(() => {});
    load();
    const timer = setInterval(load, 10_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [caseId]);

  async function submit() {
    if (saving) return;
    setSaving(true);
    setNeedName(false);
    try {
      const res = await fetch(`/api/cases/${caseId}/registry`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.status === 400) {
        setNeedName(true);
        return;
      }
      if (res.ok) {
        const data = (await res.json()) as { registry: RegistryState };
        setRegistry(data.registry);
      }
    } finally {
      setSaving(false);
    }
  }

  if (!registry) return null;
  const working = registry.status === "queued" || registry.status === "processing";

  return (
    <section className="mt-8" data-testid="registry-panel">
      <h2 className="mb-2 font-medium">{uiText(lang, "registryTitle")}</h2>
      <div className="rounded border p-3">
        <p className="mb-2 text-sm">{uiText(lang, "registryLead")}</p>
        <div className="mb-2 flex gap-2">
          <input
            type="text"
            className="block w-full border px-2 py-1 text-sm"
            placeholder={uiText(lang, "registryPlaceholder")}
            data-testid="registry-name"
            defaultValue={registry.queryName ?? ""}
            onChange={(event) => setName(event.target.value)}
          />
          <button
            type="button"
            className="border px-3 py-1 text-sm disabled:opacity-50"
            data-testid="registry-submit"
            disabled={saving || working}
            onClick={() => void submit()}
          >
            {uiText(lang, "registrySubmit")}
          </button>
        </div>
        {needName ? <p className="mb-2 text-sm opacity-60">{uiText(lang, "registryLead")}</p> : null}
        {working ? (
          <p className="text-sm opacity-60" data-testid="registry-working">
            {uiText(lang, "registryWorking")}
          </p>
        ) : null}
        {registry.status === "failed" ? (
          <p className="text-sm opacity-60">{uiText(lang, "registryFailed")}</p>
        ) : null}
        {registry.status === "no_match" ? (
          <p className="text-sm opacity-60" data-testid="registry-no-match">
            {uiText(lang, "registryNoMatch")}
          </p>
        ) : null}
        {registry.resultText ? (
          <div data-testid="registry-result">
            <p className="whitespace-pre-wrap text-sm">{registry.resultText}</p>
            {registry.sourceUrl ? (
              <a
                className="text-sm underline"
                href={registry.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                {uiText(lang, "registrySource")}
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
