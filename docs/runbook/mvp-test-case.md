# MVP 测试案件运行指引 / MVP Test-Case Runbook (REQ-OPS-07)

给已引导创建、且已登记 TOTP MFA 的管理员：创建一个虚构测试案件，向协调员、中国客户、越南律师三个虚构邮箱各发一封激活邮件。

For the bootstrapped administrator with TOTP MFA already enrolled: create one fictitious test case and send one activation email to each of three fictitious addresses — coordinator, Chinese client, Vietnamese lawyer.

**规则 / Rules:** 只使用虚构邮箱（如 `@example.com` / `@test.invalid`）与虚构案情，绝不使用真实个人地址或真实案情。邀请码不绑定邮箱（REQ-AUTH-01/12），但激活邮件只发往被输入的地址。

Use fictitious mailboxes only (e.g. `@example.com` / `@test.invalid`) and fictitious case facts — never real personal addresses or real case facts. The invitation code is not bound to a mailbox (REQ-AUTH-01/12), but the activation email goes only to the entered address.

## 1. 前提 / Prerequisites

1. 管理员账号已由 `node scripts/bootstrap-admin.ts <email> [displayName]` 在目标环境本地创建（REQ-AUTH-11，无其他途径）。
   The admin account was created locally on the target host by `node scripts/bootstrap-admin.ts <email> [displayName]` (REQ-AUTH-11 — there is no other path).
2. 管理员已登录（`/login` 邮箱验证码）并完成 MFA 登记：`POST /api/auth/mfa/enroll` 返回一次性 secret 与 otpauth:// URI，导入认证器后经 `POST /api/auth/mfa/verify` 确认。
   The admin has signed in (`/login` email OTP) and enrolled MFA: `POST /api/auth/mfa/enroll` returns the secret + otpauth:// URI exactly once; confirm via `POST /api/auth/mfa/verify`.
3. 之后**每一次**管理 API 调用都必须在请求头携带当前 TOTP 验证码：`x-totp-code: <6 位>`,缺失或错误返回 403 `mfa_invalid`。
   Every subsequent admin API call must carry a currently valid TOTP code in the `x-totp-code` header; a missing or wrong code returns 403 `mfa_invalid`.

## 2. 创建测试案件 / Create the test case

```bash
curl -X POST "$APP_BASE_URL/api/admin/test-cases" \
  -H "content-type: application/json" \
  -H "cookie: clc_session=<管理员会话 cookie>" \
  -H "x-totp-code: <当前 6 位 TOTP>" \
  -d '{
    "title": "虚构测试案件 Fictitious Test Case",
    "coordinatorEmail": "coordinator@example.com",
    "clientEmail": "client@example.com",
    "lawyerEmail": "lawyer@example.com",
    "coordinatorDisplayName": "Test Coordinator",
    "clientDisplayName": "Test Client",
    "lawyerDisplayName": "Test Lawyer"
  }'
```

- `title` 必填,1–80 字符、不含换行；三个邮箱必填且互不相同;`*DisplayName` 可选(缺省取邮箱前缀,仅对尚未注册的地址生效);`clientOrgName` 可选(缺省为虚构占位名)。
  `title` is required (1–80 chars, no line breaks); the three emails are required and must be distinct; `*DisplayName` is optional (defaults to the email prefix; only effective for not-yet-registered addresses); `clientOrgName` is optional (a fictitious placeholder by default).
- 成功返回 `201`:`{ caseId, title, invites: [{ id, role }] }`(三个 role 为 coordinator/client/lawyer)。
  On success: `201` with `{ caseId, title, invites: [{ id, role }] }`.
- 常见错误 / Errors: `401` 未登录;`403 forbidden` 非管理员;`403 mfa_not_enrolled` / `403 mfa_invalid`;`400 invalid_title` / `invalid_email` / `invalid_display_name` / `invalid_client_org`。

## 3. 三角激活 / Triangle activation

每位收件人打开 `$APP_BASE_URL/invite`:

1. 输入邮件中的邀请码(XXXXX-XXXXX 形式)与**自己的**邮箱(即被输入的那个地址);
2. 点「Send verification code」,到该邮箱查收 6 位验证码;
3. 输入验证码点「Verify and join」,显示 "Invitation accepted." 即加入案件。

Each recipient opens `$APP_BASE_URL/invite`, enters the invitation code from the activation email plus their own address (the one entered in step 2), requests the 6-digit verification code, and completes "Verify and join" — "Invitation accepted." confirms membership.

## 4. 验收观察点 / Acceptance checkpoints

- 三封激活邮件**只**发往被输入的三个地址,没有第四封;验证码邮件同理。
  Exactly three activation emails go to the three entered addresses and no one else; the same holds for OTP emails.
- 每位收件人登录后 `/cases` **只见这一个案件**,案件页成员列表恰好三人(协调员/客户/律师),角色与指定一致。
  Each recipient sees exactly this one case in `/cases`; the case page lists exactly the three members with the assigned roles.
- **管理员不在案件聊天成员中**:管理员访问 `GET /api/cases` 或案件页返回 403/404;案件 `case_members` 表无管理员行。
  The administrator is not a chat member: `GET /api/cases` and the case page deny the admin (403/404); `case_members` has no admin row.
- 邀请码不绑定邮箱:任一邀请码可被任一地址的 OTP 流程使用(但每码仅一次,角色以码上记录为准)。
  Codes are not mailbox-bound: any code works with any address's OTP flow (single use; the role comes from the code).
- 全程可审计:`GET /api/admin/audit-logs?caseId=<caseId>`(带 `x-totp-code`)可见 `case.create`(meta.origin=admin_test_case)与三条 `invite.create`,actor 均为管理员;随后每个激活产生 `invite.accept` 与 `auth.login` 行。
  Everything is auditable: `GET /api/admin/audit-logs?caseId=<caseId>` (with `x-totp-code`) shows `case.create` (meta.origin=admin_test_case) and three `invite.create` rows by the admin; each activation adds `invite.accept` and `auth.login` rows.

同一律师账号的第二个案件由 T02 的集成测试证明(REQ-AUTH-12),不在本指引范围内。

A second case on the same lawyer account is proved by the T02 integration tests (REQ-AUTH-12), not by this one-case runbook.
