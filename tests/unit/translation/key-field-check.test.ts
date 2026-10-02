import { describe, expect, it } from "vitest";

import { checkKeyFields } from "@/modules/translation/key-field-check";

// REQ-TR-05: numbers, currencies, dates and negations are checked
// independently between source and translation; any mismatch flags the
// version for human review.
describe("checkKeyFields (REQ-TR-05)", () => {
  it("passes when numbers, currency, dates and negations all match", () => {
    const source = "损害赔偿金 2,300,000 元，不得迟于2026年3月15日支付。";
    const translation = "Khoan boi thuong 2,300,000 nhan dan te, không được chậm quá 15/03/2026.";
    expect(checkKeyFields(source, translation)).toEqual({ ok: true, mismatches: [] });
  });

  it("passes when neither side carries any key fields", () => {
    expect(checkKeyFields("你好，请查收。", "Xin chao, vui long kiem tra.")).toEqual({
      ok: true,
      mismatches: [],
    });
  });

  it("flags a changed or dropped number", () => {
    const source = "诉讼请求金额为 500 万元。";
    expect(checkKeyFields(source, "The claim amount is 510.").mismatches).toContain("numbers");
    expect(checkKeyFields(source, "The claim amount is as stated.").mismatches).toContain(
      "numbers",
    );
  });

  it("treats grouping separators and decimals as the same number", () => {
    const result = checkKeyFields("金额 2,300,000.50 元", "amount 2300000.50 yuan");
    expect(result.ok).toBe(true);
  });

  it("flags a currency change even when the number matches", () => {
    const result = checkKeyFields("赔偿 500 元人民币", "compensation 500 USD");
    expect(result.mismatches).toContain("currency");
    expect(result.ok).toBe(false);
  });

  it("accepts the same currency rendered in another language", () => {
    expect(checkKeyFields("赔偿 500 元", "boi thuong 500 nhan dan te").ok).toBe(true);
    expect(checkKeyFields("法院诉讼费 12 万元", "court fee 120000 VND").mismatches).toContain(
      "currency",
    );
  });

  it("matches dates across zh/ISO/VN formats but flags a changed day or month", () => {
    const source = "请于2026年3月15日前答复。";
    expect(checkKeyFields(source, "Please reply before 2026-03-15.").ok).toBe(true);
    expect(checkKeyFields(source, "Vui long tra loi truoc 15/03/2026.").ok).toBe(true);
    expect(checkKeyFields(source, "Please reply before 2026-04-15.").mismatches).toContain(
      "dates",
    );
    expect(checkKeyFields(source, "Vui long tra loi truoc 16/03/2026.").mismatches).toContain(
      "dates",
    );
  });

  it("flags a dropped or added negation across zh/vi/en", () => {
    expect(checkKeyFields("本协议不得转让。", "This agreement may be transferred.").mismatches)
      .toContain("negations");
    expect(checkKeyFields("本协议不得转让。", "This agreement must not be transferred.").ok).toBe(
      true,
    );
    expect(
      checkKeyFields("我们没有收到文件。", "Chung toi chưa nhan được ho so.").ok,
    ).toBe(true);
    expect(checkKeyFields("我们没有收到文件。", "Chung toi da nhan được ho so.").mismatches)
      .toContain("negations");
  });

  it("reports every mismatched category at once, in a stable order", () => {
    const source = "赔偿 2,300,000 元，2026年3月15日前不得逾期。";
    const translation = "compensation 9,900 USD, due 2026-04-15, late payment allowed.";
    const result = checkKeyFields(source, translation);
    expect(result.ok).toBe(false);
    expect(result.mismatches).toEqual(["numbers", "currency", "dates", "negations"]);
  });
});
