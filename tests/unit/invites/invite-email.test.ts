import { describe, expect, it } from "vitest";

import { buildInviteEmail } from "@/modules/invites/email";

// The invitation email is single-language per recipient (role default or an
// explicit per-invite override), always carries the login URL and the usage
// steps, and can lead with an operator-supplied intro naming the inviter and
// the case.
const BASE = {
  code: "ABCDE-12345",
  email: "invitee@example.com",
  caseTitle: "DG-Juyang2026OCT",
  baseUrl: "http://entry.example",
};

describe("buildInviteEmail", () => {
  it("zh-Hans: Simplified subject and body with code, login URL, usage steps, and the default intro naming the case", () => {
    const mail = buildInviteEmail({ ...BASE, lang: "zh-Hans" });

    expect(mail.subject).toBe("案件邀请：DG-Juyang2026OCT");
    expect(mail.text).toContain("邀请码：ABCDE-12345");
    expect(mail.text).toContain("登录网址：http://entry.example/invite");
    expect(mail.text).toContain("invitee@example.com");
    expect(mail.text).toContain("使用方法");
    expect(mail.text).toContain("DG-Juyang2026OCT");
    expect(mail.text).toContain("邀请码长期有效");
    expect(mail.text).not.toContain("7 天");
    expect(mail.text).toContain("律师那边会自动显示为越南语");
    expect(mail.text).not.toContain("越南律师");
    expect(mail.text).not.toContain("Mã mờ" + "i");
  });

  it("zh-Hant: Traditional subject and body (Taiwan wording)", () => {
    const mail = buildInviteEmail({ ...BASE, lang: "zh-Hant" });

    expect(mail.subject).toBe("案件邀請：DG-Juyang2026OCT");
    expect(mail.text).toContain("邀請碼：ABCDE-12345");
    expect(mail.text).toContain("登入網址：http://entry.example/invite");
    expect(mail.text).toContain("使用方式");
    expect(mail.text).toContain("邀請碼長期有效");
    expect(mail.text).not.toContain("7 天");
    expect(mail.text).not.toContain("邀请码");
  });

  it("vi: Vietnamese subject and body without Chinese characters", () => {
    const mail = buildInviteEmail({ ...BASE, lang: "vi" });

    expect(mail.subject).toBe("Thư mờ" + "i vụ án: DG-Juyang2026OCT");
    expect(mail.text).toContain("Mã mờ" + "i của bạn: ABCDE-12345");
    expect(mail.text).toContain("Trang đăng nhập: http://entry.example/invite");
    expect(mail.text).toContain("Cách sử dụng");
    expect(mail.text).toContain("hiệu lực lâu dài");
    expect(mail.text).not.toContain("7 ngày");
    expect(mail.text).not.toMatch(/[一-鿿]/);
  });

  it("uses a custom per-language intro verbatim when supplied", () => {
    const introVi = "Luat Su Phong mờ" + "i bạn tham gia vụ án Dongguan Juyang.";
    const mail = buildInviteEmail({ ...BASE, lang: "vi", intro: { vi: introVi } });

    expect(mail.text).toContain(introVi);
  });

  it("falls back to a best-effort conversion of the Simplified intro for a zh-Hant recipient", () => {
    // The fallback rides on the translation module's char map, which is
    // partial; provisioning should pass an explicit zh-Hant intro instead.
    const mail = buildInviteEmail({
      ...BASE,
      lang: "zh-Hant",
      intro: { "zh-Hans": "刘锋律师邀请您使用本系统来交换关于起诉案件的信息。" },
    });

    expect(mail.text).toContain("刘锋律師邀請您使用本系统來交换關於起訴案件的信息。");
  });

  it("falls back to the default intro in the recipient's language when no intro matches", () => {
    const mail = buildInviteEmail({ ...BASE, lang: "vi", intro: { "zh-Hans": "只给中文的开场。" } });

    expect(mail.text).toContain('vụ án "DG-Juyang2026OCT"');
    expect(mail.text).not.toContain("只给中文的开场");
  });
});
