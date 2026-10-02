const VIETNAMESE_MARKED = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
const CJK = /[一-鿿]/;

// T04 heuristic only; full language detection is T06.
export function detectSourceLang(text: string): string {
  if (VIETNAMESE_MARKED.test(text)) return "vi";
  if (CJK.test(text)) return "zh-Hans";
  return "en";
}
