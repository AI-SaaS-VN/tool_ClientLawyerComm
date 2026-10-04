import { convertZh } from "../translation/zh-convert.ts";

// Per-language invitation email. One language per recipient (the role default
// or an explicit per-invite override) instead of the earlier bilingual
// combined mail: every mail carries the invite code, the login URL, and the
// usage steps, and may lead with an operator-supplied intro naming the
// inviter and the case (e.g. the pilot's real case).
export const INVITE_EMAIL_LANGS = ["zh-Hans", "zh-Hant", "vi"] as const;
export type InviteEmailLang = (typeof INVITE_EMAIL_LANGS)[number];

export interface InviteEmailInput {
  lang: InviteEmailLang;
  code: string;
  email: string;
  caseTitle: string;
  baseUrl: string;
  intro?: Partial<Record<InviteEmailLang, string>>;
}

function defaultIntro(lang: InviteEmailLang, caseTitle: string): string {
  if (lang === "zh-Hant") return `本郵件邀請您使用本系統，交換關於案件「${caseTitle}」的資訊。`;
  if (lang === "vi") return `Email này mời bạn sử dụng hệ thống để trao đổi thông tin về vụ án "${caseTitle}".`;
  return `本邮件邀请您使用本系统，交换关于案件「${caseTitle}」的信息。`;
}

function resolveIntro(input: InviteEmailInput): string {
  const exact = input.intro?.[input.lang];
  if (exact) return exact;
  // Best-effort fallback for a Traditional reader when only the Simplified
  // intro was supplied: the char map is partial, so provisioning should
  // rather pass an explicit zh-Hant intro.
  if (input.lang === "zh-Hant" && input.intro?.["zh-Hans"]) {
    return convertZh(input.intro["zh-Hans"], "zh-Hant");
  }
  return defaultIntro(input.lang, input.caseTitle);
}

export function buildInviteEmail(input: InviteEmailInput): { subject: string; text: string } {
  const intro = resolveIntro(input);
  const loginUrl = `${input.baseUrl}/invite`;
  if (input.lang === "zh-Hant") {
    return {
      subject: `案件邀請：${input.caseTitle}`,
      text: [
        intro,
        "",
        `邀請碼：${input.code}`,
        `登入網址：${loginUrl}`,
        "",
        "使用方式：",
        "1. 用瀏覽器開啟上面的登入網址。",
        `2. 輸入本信箱（${input.email}）和上面的邀請碼，即可進入對應案件。第一次使用即加入。`,
        "3. 之後仍用同一信箱和同一邀請碼進入該案件，不需要另外的 6 位驗證碼。",
        "",
        "進入案件後，您可以傳送訊息和檔案。您輸入的中文，律師那邊會自動顯示為越南語；對方的越南語，您這邊會自動顯示為中文。",
        "邀請碼只綁定本信箱，請勿轉寄。尚未使用的邀請碼 7 天內有效。",
      ].join("\n"),
    };
  }
  if (input.lang === "vi") {
    return {
      subject: `Thư mời vụ án: ${input.caseTitle}`,
      text: [
        intro,
        "",
        `Mã mời của bạn: ${input.code}`,
        `Trang đăng nhập: ${loginUrl}`,
        "",
        "Cách sử dụng:",
        "1. Mở trang đăng nhập ở trên bằng trình duyệt.",
        `2. Nhập email này (${input.email}) và mã mời ở trên để vào đúng vụ án. Lần đầu là tham gia.`,
        "3. Sau đó vẫn dùng cùng email và cùng mã mời để vào lại vụ án, không cần mã 6 số khác.",
        "",
        "Trong vụ án, bạn có thể gửi tin nhắn và tệp. Tiếng Việt bạn nhập sẽ tự động hiển thị thành tiếng Trung cho khách hàng; tiếng Trung của khách hàng cũng tự động hiển thị thành tiếng Việt cho bạn.",
        "Mã mời chỉ gắn với email này, vui lòng không chuyển tiếp. Mã chưa dùng có hiệu lực trong 7 ngày.",
      ].join("\n"),
    };
  }
  return {
    subject: `案件邀请：${input.caseTitle}`,
    text: [
      intro,
      "",
      `邀请码：${input.code}`,
      `登录网址：${loginUrl}`,
      "",
      "使用方法：",
      "1. 用浏览器打开上面的登录网址。",
      `2. 输入本邮箱（${input.email}）和上面的邀请码，即可进入对应案件。第一次使用即加入。`,
      "3. 之后仍用同一邮箱和同一邀请码进入该案件，不需要另外的 6 位验证码。",
      "",
      "进入案件后，您可以发送消息和文件。您输入的中文，律师那边会自动显示为越南语；对方的越南语，您这边会自动显示为中文。",
      "邀请码只绑定本邮箱，请勿转发。尚未使用的邀请码 7 天内有效。",
    ].join("\n"),
  };
}
