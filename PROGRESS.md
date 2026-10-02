# PROGRESS.md — Current Progress / 当前进度

- Updated: 2026-10-02 (UTC) | Maintenance: update upon completion of each task or phase
- 更新日期：2026-10-02（UTC）｜维护方式：每完成一个任务或阶段即更新

## Current Phase / 当前阶段

**T02 done and accepted on 2026-10-02 (commit 8dcfd6a): 31/31 tests green (`npm run test`, including 15 unit + 16 integration), `npm run lint` and `npx tsc --noEmit` clean, `npm run build` succeeded. Design baseline is SOW v1.10 / SPEC v0.8 / PLAN v0.8. Next is T03 (case and member management + permission middleware).** External channels already verified: GitHub deploy key, Cloudflare API, Kimi API, Lighthouse key login, outbound email (SMTP 587/STARTTLS smoke send succeeded 2026-10-01). T01 skeleton: cea7e37.

**T02 已完成并于 2026-10-02 验收（提交 8dcfd6a）：31/31 测试通过（`npm run test`，含 15 单元＋16 集成），`npm run lint` 与 `npx tsc --noEmit` 无错误，`npm run build` 成功。设计基线为 SOW v1.10 / SPEC v0.8 / PLAN v0.8。下一项是 T03（案件与成员管理＋权限中间件）。** 外部链路已验证：GitHub deploy key、Cloudflare API、Kimi API、Lighthouse 密钥登录、邮件发信（SMTP 587/STARTTLS 冒烟发送于 2026-10-01 成功）。T01 骨架：cea7e37。

## T02 Status / T02 状态

Done / 已完成（8dcfd6a）：

- Migration `20261001171658_t02_auth_invites`: users +`preferred_lang`/`ui_lang`; new `contact_channels`, `otp_challenges`, `invites`, and minimal `cases`/`case_members` (T03 extends the remaining columns); `sessions.id` widened to TEXT to carry the opaque session token.<br>迁移 `20261001171658_t02_auth_invites`：users 增加 `preferred_lang`/`ui_lang`；新增 `contact_channels`、`otp_challenges`、`invites` 与最小版 `cases`/`case_members`（其余列由 T03 扩展）；`sessions.id` 放宽为 TEXT 以承载不透明会话令牌。
- EmailProvider interface + fake outbox (`src/server/providers/email/`); SMTP is T12. Activation email is zh/vi bilingual and goes only to the entered notification address; the code binds case+role, not the email (REQ-AUTH-01/12).<br>EmailProvider 接口＋fake outbox（`src/server/providers/email/`）；SMTP 属 T12。激活邮件中越双语、只发被输入的通知地址；邀请码绑定案件＋角色、不绑定邮箱（REQ-AUTH-01/12）。
- OTP: 6-digit / 10 min / lock 15 min after 5 tries / 60 s resend / 10 per day; hash-only storage; `purpose` column separates login from channel-binding codes (REQ-AUTH-05 cross-use rejection).<br>OTP：6 位／10 分钟／错 5 次锁 15 分钟／60 秒间隔／日 10 条；仅存哈希；`purpose` 列隔离登录与绑定用途（REQ-AUTH-05 跨用途拒绝）。
- Sessions: rolling 7 d + 30 d idle, server-side revoke; `Secure` flag via `SESSION_COOKIE_SECURE` (default true; "false" only for the HTTP test entry, REQ-AUTH-06).<br>会话：滚动 7 天＋30 天闲置，服务端可吊销；`Secure` 由 `SESSION_COOKIE_SECURE` 控制（默认开；仅 HTTP 测试入口可关，REQ-AUTH-06）。
- Single-use invite claim is atomic (conditional `updateMany`); a concurrency test proves one winner. Admin only via `scripts/bootstrap-admin.ts` (verified against clc_test); invites can never grant admin (REQ-AUTH-11).<br>邀请码单次使用为原子认领（条件 `updateMany`），并有并发测试证明只有一个成功者。管理员仅经 `scripts/bootstrap-admin.ts` 创建（已对 clc_test 实测）；邀请绝不能授予 admin（REQ-AUTH-11）。
- Deferred/known items: audit trail is T11 (`TODO(T11)` markers in code); unaccepted invite OTP requests leave `status='pending'` user rows (cleanup policy is a later task); session tokens are not hash-stored (re-evaluate at T11).<br>挂起/已知项：审计属 T11（代码中有 `TODO(T11)` 标记）；未完成的邀请 OTP 请求会留下 `status='pending'` 用户行（清理策略属后续任务）；会话令牌未哈希存储（T11 再评估）。

## Test Status / 测试状态

T01 unit + smoke passed 2026-10-01. T02 unit + integration passed 2026-10-02 (31/31, incl. cross-purpose OTP rejection, invite revoke/resend/expiry/replay, atomic concurrent accept, cookie Secure both modes, no-plaintext-OTP assertions). AC01 mock-chain part is now covered; real email delivery belongs to T12. AC02–AC12 otherwise not accepted.

T01 单元＋冒烟于 2026-10-01 通过。T02 单元＋集成于 2026-10-02 通过（31/31，含跨用途 OTP 拒绝、撤销/重发/过期/重放、原子并发接受、Cookie Secure 两种配置、OTP 无明文断言）。AC01 模拟链路部分已覆盖；真实邮件送达属 T12。其余 AC02–AC12 未验收。

## Next Steps / 下一步

1. Implement PLAN.md T03 against SPEC.md v0.8 REQ-PM-01~10 and REQ-CASE-01~06: case creation (title 1–80 required) / case-application approval / member grant+revocation / archive entry; unified server-side permission middleware; simple case entry page. Extend the minimal `cases`/`case_members` from the T02 migration. Acceptance: AC02 privilege-escalation part, AC09 archive part. Tests: `tests/integration/cases/{cross-case-denied,revoke,title-required}.test.ts`. Do not redo T01/T02.
1. 按 SPEC.md v0.8 REQ-PM-01~10 与 REQ-CASE-01~06 实现 PLAN.md T03：案件创建（title 必填 1–80）/建案申请审批/成员授予与撤销/归档入口；统一服务端权限中间件；简易案件进入页。在 T02 迁移的最小 `cases`/`case_members` 上扩展。验收：AC02 越权部分、AC09 归档部分。测试：`tests/integration/cases/{cross-case-denied,revoke,title-required}.test.ts`。不要重做 T01/T02。
