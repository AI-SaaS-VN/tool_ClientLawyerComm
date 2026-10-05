export type KeyFieldCategory = "numbers" | "currency" | "dates" | "negations";

export interface KeyFieldCheckResult {
  ok: boolean;
  mismatches: KeyFieldCategory[];
}

function sortedNumbers(text: string): string[] {
  const matches = text.match(/\d+(?:,\d{3})*(?:\.\d+)?/g) ?? [];
  return matches
    .map((m) => m.replace(/,/g, "").replace(/^0+(?=\d)/, ""))
    .sort();
}

const CURRENCY_TOKENS: Array<[RegExp, string]> = [
  [/人民币|人民幣|¥|￥|\bRMB\b|\bCNY\b|yuan|nhân dân tệ|nhan dan te/gi, "CNY"],
  // đồng/dong only count when they follow a number: bare "đồng" is also part
  // of everyday words like hợp đồng (合同/contract), which must not read as
  // a currency mention. 越盾/VND are unambiguous on their own.
  [/越盾|\bVND\b|\d[\d.,]*\s*(?:đồng|dong)\b/gi, "VND"],
  [/美元|\$|\bUSD\b|dollars?/gi, "USD"],
];

function currencySet(text: string): string[] {
  const found = new Set<string>();
  for (const [pattern, code] of CURRENCY_TOKENS) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) found.add(code);
  }
  // 元 alone is a CNY marker, but 美元/美元 was already captured as USD above;
  // a bare 元 still counts as CNY.
  if (/[^美]元/.test(text) || text.startsWith("元")) found.add("CNY");
  return [...found].sort();
}

function sortedDates(text: string): string[] {
  const dates: string[] = [];
  const push = (y: string, m: string, d: string) =>
    dates.push(`${Number(y)}-${Number(m)}-${Number(d)}`);
  for (const match of text.matchAll(/(\d{4})年(\d{1,2})月(\d{1,2})日?/g)) {
    push(match[1]!, match[2]!, match[3]!);
  }
  for (const match of text.matchAll(/(\d{4})-(\d{1,2})-(\d{1,2})/g)) {
    push(match[1]!, match[2]!, match[3]!);
  }
  // dd/mm/yyyy (Vietnamese convention)
  for (const match of text.matchAll(/(?<![\d/-])(\d{1,2})\/(\d{1,2})\/(\d{4})(?![\d/-])/g)) {
    push(match[3]!, match[2]!, match[1]!);
  }
  return dates.sort();
}

const NEGATION_PATTERNS = [
  /不|没|无|無|未|否|勿|莫|别|別|非/g,
  /không|khong|chưa|chua|đừng|dung|chẳng|chang/gi,
  /\b(?:not|no|never|none|cannot)\b|n't/gi,
];

function negationCount(text: string): number {
  let count = 0;
  for (const pattern of NEGATION_PATTERNS) {
    pattern.lastIndex = 0;
    count += (text.match(pattern) ?? []).length;
  }
  return count;
}

function sameMultiset(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

// REQ-TR-05: independent post-translation check of key fields. Conservative by
// design — a false positive only routes the version to human review; a miss
// never does. Numbers are compared literally (万/亿 magnitudes are not
// expanded), so a translator re-expressing 12万 as 120000 is flagged.
export function checkKeyFields(sourceText: string, translatedText: string): KeyFieldCheckResult {
  const mismatches: KeyFieldCategory[] = [];
  if (!sameMultiset(sortedNumbers(sourceText), sortedNumbers(translatedText))) {
    mismatches.push("numbers");
  }
  if (!sameMultiset(currencySet(sourceText), currencySet(translatedText))) {
    mismatches.push("currency");
  }
  if (!sameMultiset(sortedDates(sourceText), sortedDates(translatedText))) {
    mismatches.push("dates");
  }
  if (negationCount(sourceText) !== negationCount(translatedText)) {
    mismatches.push("negations");
  }
  return { ok: mismatches.length === 0, mismatches };
}
