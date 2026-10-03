import { isSupportedLang, type SupportedLang } from "@/modules/translation/langs";

// REQ-TR-01 / F14. A stored preference wins. Otherwise the role default applies:
// client Traditional Chinese, lawyer Vietnamese, coordinator Simplified Chinese.
export function defaultScreenLang(role: string): SupportedLang {
  if (role === "lawyer") return "vi";
  if (role === "client") return "zh-Hant";
  return "zh-Hans";
}

export function screenLangForUser(user: {
  preferredLang: string | null;
  globalRole: string;
}): SupportedLang {
  if (isSupportedLang(user.preferredLang)) return user.preferredLang;
  return defaultScreenLang(user.globalRole);
}

// Languages this role may switch to. The first entry is the role default.
export function screenLangOptions(role: string): SupportedLang[] {
  if (role === "lawyer") return ["vi", "zh-Hans", "zh-Hant", "en"];
  if (role === "client") return ["zh-Hant", "zh-Hans", "en"];
  return ["zh-Hans", "zh-Hant", "en"];
}

// Login and invite pages have no account yet. One language comes from the
// browser's Accept-Language. zh-CN stays Simplified; zh-TW/HK is Traditional.
export function langFromAcceptLanguage(header: string | null): SupportedLang {
  const value = (header ?? "").toLowerCase();
  if (value.includes("vi")) return "vi";
  if (value.includes("zh-hant") || value.includes("zh-tw") || value.includes("zh-hk")) return "zh-Hant";
  if (value.includes("zh")) return "zh-Hans";
  if (value.includes("en")) return "en";
  return "en";
}
