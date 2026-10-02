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
