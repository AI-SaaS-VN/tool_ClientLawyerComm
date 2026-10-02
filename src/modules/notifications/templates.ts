// REQ-NTF-08: the alert body carries only neutral wording, a non-sensitive
// task reference, and a login-required link — never the original message,
// fee content, attachments, or anyone's contact address (REQ-NTF-01).
export function buildReviewAlertEmail(input: {
  pendingCount: number;
  taskRef: string;
  baseUrl: string;
}): { subject: string; text: string } {
  const link = `${input.baseUrl}/review`;
  return {
    subject: "有案件内容待审核 / Nội dung vụ án đang chờ duyệt",
    text: [
      `您有 ${input.pendingCount} 项案件内容待审核，请尽快登录处理。`,
      `Bạn có ${input.pendingCount} nội dung vụ án đang chờ duyệt, vui lòng đăng nhập để xử lý sớm.`,
      `任务标识 / Mã tham chiếu: ${input.taskRef}`,
      `链接（需登录）/ Liên kết (cần đăng nhập): ${link}`,
    ].join("\n"),
  };
}

// REQ-FILE-08 / REQ-NTF-05: check_failed alerts carry only neutral wording,
// a non-sensitive alert reference, and a login-required link — never the
// file name, file content, or anyone's contact address.
export function buildCheckFailedAlertEmail(input: {
  alertRef: string;
  baseUrl: string;
}): { subject: string; text: string } {
  const link = `${input.baseUrl}/review`;
  return {
    subject: "案件内容安全检查未通过 / Nội dung vụ án không vượt qua kiểm tra an toàn",
    text: [
      "案件中有内容未通过安全检查，已暂停发布，请登录处理。",
      "Có nội dung vụ án không vượt qua kiểm tra an toàn, đã tạm dừng xuất bản, vui lòng đăng nhập để xử lý.",
      `任务标识 / Mã tham chiếu: ${input.alertRef}`,
      `链接（需登录）/ Liên kết (cần đăng nhập): ${link}`,
    ].join("\n"),
  };
}

// REQ-NTF-01/03: the urgent alert goes out in the platform's name, in the
// recipient's own language, with neutral "please log in to view" wording —
// no counterparty contact details, no message bodies or attachments, no
// sensitive case titles, and never the counterparty as Reply-To.
const PEER_URGENT_COPY: Record<
  string,
  { subject: string; body: string; ref: string; link: string }
> = {
  "zh-Hans": {
    subject: "您有案件紧急事项待处理",
    body: "您有案件紧急事项，请登录查看。",
    ref: "任务标识",
    link: "链接（需登录）",
  },
  "zh-Hant": {
    subject: "您有案件緊急事項待處理",
    body: "您有案件緊急事項，請登入查看。",
    ref: "任務標識",
    link: "連結（需登入）",
  },
  vi: {
    subject: "Bạn có việc khẩn cấp trong vụ án cần xử lý",
    body: "Bạn có việc khẩn cấp trong vụ án, vui lòng đăng nhập để xem.",
    ref: "Mã tham chiếu",
    link: "Liên kết (cần đăng nhập)",
  },
  en: {
    subject: "You have an urgent case matter to handle",
    body: "You have an urgent case matter. Please log in to view it.",
    ref: "Reference",
    link: "Link (login required)",
  },
};

export function buildPeerUrgentEmail(input: {
  lang: string | null;
  taskRef: string;
  caseId: string;
  baseUrl: string;
}): { subject: string; text: string } {
  const copy = (input.lang && PEER_URGENT_COPY[input.lang]) || PEER_URGENT_COPY["zh-Hans"]!;
  return {
    subject: copy.subject,
    text: [
      copy.body,
      `${copy.ref}: ${input.taskRef}`,
      `${copy.link}: ${input.baseUrl}/cases/${input.caseId}`,
    ].join("\n"),
  };
}

// REQ-NTF-05: when a peer urgent alert reaches its final failure, each
// can_review coordinator gets this content-free notice so the delivery
// failure is not silent — no message body and no contact address.
export function buildUrgentFailedAlertEmail(input: {
  alertRef: string;
  baseUrl: string;
}): { subject: string; text: string } {
  return {
    subject: "案件紧急提醒未能送达 / Lợi nhắc khẩn cấp không gửi được",
    text: [
      "案件中的一条紧急提醒多次尝试后未能送达，请登录后台跟进。",
      "Một lợi nhắc khẩn cấp trong vụ án không gửi được sau nhiều lần thử, vui lòng đăng nhập để xử lý.",
      `任务标识 / Mã tham chiếu: ${input.alertRef}`,
      `链接（需登录）/ Liên kết (cần đăng nhập): ${input.baseUrl}`,
    ].join("\n"),
  };
}
