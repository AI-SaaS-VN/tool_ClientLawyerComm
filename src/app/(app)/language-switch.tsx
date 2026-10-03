"use client";

import { useRouter } from "next/navigation";

import { LANG_NAME, uiText } from "@/modules/i18n/copy";
import { screenLangOptions } from "@/modules/i18n/screen-lang";
import type { SupportedLang } from "@/modules/translation/langs";

export function LanguageSwitch({ lang, role }: { lang: SupportedLang; role: string }) {
  const router = useRouter();

  async function onChange(next: string) {
    const res = await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ preferredLang: next, uiLang: next }),
    });
    if (res.ok) router.refresh();
  }

  return (
    <label className="mb-4 flex items-center gap-2 text-sm">
      {uiText(lang, "language")}
      <select
        className="border px-2 py-1"
        data-testid="language-switch"
        value={lang}
        onChange={(event) => void onChange(event.target.value)}
      >
        {screenLangOptions(role).map((code) => (
          <option key={code} value={code}>
            {LANG_NAME[code]}
          </option>
        ))}
      </select>
    </label>
  );
}
