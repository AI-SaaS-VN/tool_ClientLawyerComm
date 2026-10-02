export type RuleCategory = "email" | "phone" | "wechat" | "zalo" | "url" | "qr";

export interface RuleHit {
  category: RuleCategory;
  match: string;
}

// Full-width characters fold to ASCII, Vietnamese tone marks drop, so the
// detectors below see one canonical form regardless of obfuscation.
export function normalizeForCheck(text: string): string {
  return text
    .normalize("NFKC")
    .normalize("NFD")
    .toLowerCase()
    .replace(/\p{M}+/gu, "")
    .replace(/đ/g, "d");
}

// Removing everything that is not letter/digit/connector defeats character
// splitting ("z h a n g @ e x a m p l e . c o m" still resolves).
function compactForCheck(text: string): string {
  return normalizeForCheck(text).replace(/[^\p{L}\p{N}@.+\-_]/gu, "");
}

const EMAIL = /[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}/;
const URL =
  /(https?:\/\/[^\s]+|www\.[a-z0-9-]+(\.[a-z0-9-]+)+|\b[a-z0-9-]{2,}\.(com|net|org|vn|cn|io|xyz|top|info)\b)/i;
const WECHAT = /(wechat|weixin|微信|威信)|\b(vx|wx)\s*[:：]?\s*[a-z0-9_-]{4,}/;
const ZALO = /zalo/;
const QR = /(二维码|扫码|扫一扫|qr\s*code|qrcode|\bqr\b|ma\s*qr|quet\s*ma)/;

// Digit runs may be broken by spaces/punctuation; amounts with separators are
// classified by digit count and prefix, so ordinary Case Amounts never match.
const PHONE_CANDIDATE = /\+?\d[\d\s.,()\-]{6,}\d/g;
const PHONE_PATTERNS = [
  /^1[3-9]\d{9}$/, // CN mobile
  /^861[3-9]\d{9}$/, // CN mobile, country code
  /^0[35789]\d{8}$/, // VN local mobile
  /^84[35789]\d{8}$/, // VN mobile, country code
];

function phoneMatches(normalized: string): string[] {
  const hits: string[] = [];
  for (const run of normalized.match(PHONE_CANDIDATE) ?? []) {
    const digits = run.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 13) continue;
    if (PHONE_PATTERNS.some((pattern) => pattern.test(digits))) hits.push(run);
  }
  return hits;
}

// REQ-MOD-02 deterministic checks. Pure function over the message body; every
// hit moves the object to pending_review (the caller owns the state change).
export function findRuleHits(text: string): RuleHit[] {
  const normalized = normalizeForCheck(text);
  const compact = compactForCheck(text);
  const hits: RuleHit[] = [];

  const email = normalized.match(EMAIL) ?? compact.match(EMAIL);
  if (email) hits.push({ category: "email", match: email[0] });

  const phones = phoneMatches(normalized);
  if (phones.length > 0) hits.push({ category: "phone", match: phones[0]! });

  const wechat = normalized.match(WECHAT) ?? compact.match(WECHAT);
  if (wechat) hits.push({ category: "wechat", match: wechat[0] });

  const zalo = normalized.match(ZALO) ?? compact.match(ZALO);
  if (zalo) hits.push({ category: "zalo", match: zalo[0] });

  const url = normalized.match(URL) ?? compact.match(URL);
  if (url) hits.push({ category: "url", match: url[0] });

  const qr = normalized.match(QR);
  if (qr) hits.push({ category: "qr", match: qr[0] });

  return hits;
}
