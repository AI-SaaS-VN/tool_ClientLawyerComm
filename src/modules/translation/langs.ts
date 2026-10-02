export const SUPPORTED_LANGS = ["zh-Hans", "zh-Hant", "vi", "en"] as const;

export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

export function isSupportedLang(value: unknown): value is SupportedLang {
  return typeof value === "string" && (SUPPORTED_LANGS as readonly string[]).includes(value);
}

export function isZhConversionPair(sourceLang: string, targetLang: string): boolean {
  return (
    (sourceLang === "zh-Hans" && targetLang === "zh-Hant") ||
    (sourceLang === "zh-Hant" && targetLang === "zh-Hans")
  );
}
