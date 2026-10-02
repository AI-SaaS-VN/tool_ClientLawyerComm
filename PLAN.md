# PLAN.md — MVP Implementation Plan / MVP 实施计划

- Version: 0.8 | Date: 2026-10-02
- 版本：0.8｜日期：2026-10-02
- Basis: SPEC.md v0.8, SOW.md v1.10. T02 implements the MVP path: the invitation code is not bound to an email (REQ-AUTH-01, REQ-AUTH-12). The activation email is still sent only to the entered address. P0 tasks are T01–T08 and T10–T12 (11 tasks). T09 and T13 are P1 and do not block P0.
- 依据：SPEC.md v0.8、SOW.md v1.10。T02 实现 MVP 路径：邀请码不绑定邮箱（REQ-AUTH-01、REQ-AUTH-12）。激活邮件仍只发给被输入的地址。P0 任务为 T01–T08 与 T10–T12（11 个）。T09 与 T13 属于 P1，不阻塞 P0。
- Slicing principle: slice by verifiable features, not by "all frontend / all backend / test at the end"; each task is accepted independently, and dependencies are expressed by task ID.
- 拆分原则：按可验证功能切片，不按「所有前端/所有后端/最后测试」；每任务独立验收，依赖以任务 ID 表示。

## Implementation Assumptions and Fixed Technical Decisions / 实施假设与技术固定点

- Runtime environment: VPS (Node v24.19.0, npm 11.17.0, Docker 29.1.3); no pnpm — npm is used uniformly; PostgreSQL and MinIO (S3-compatible) are provided via Docker Compose during development.
- 运行环境：VPS（Node v24.19.0、npm 11.17.0、Docker 29.1.3）；无 pnpm，统一用 npm；PostgreSQL 与 MinIO（S3 兼容）开发期用 Docker Compose 提供。
- Fixed technical decisions (SOW Section 10 technology defaults): Next.js (App Router) + TypeScript monolith, PostgreSQL, Prisma (migrations and type-safe access; a reversible choice, version pinned in T01), database-backed persistent task queue, SSE, Vitest (unit/integration), Playwright (end-to-end). Concrete version numbers are looked up from official sources during T01 implementation and pinned in package.json.
- 技术固定点（SOW 第10节技术默认值）：Next.js（App Router）＋TypeScript 单体、PostgreSQL、Prisma（迁移与类型安全访问，可逆选择，T01 固定版本）、数据库持久任务队列、SSE、Vitest（单元/集成）、Playwright（端到端）。具体版本号在 T01 实施时查官方资料并写入 package.json 固定。
- External Providers (Translation/Email/scanning; **SmsProvider moves to P1 together with the phone channel**) are first implemented as interfaces plus mock stand-ins. The email vendor is already selected (operator SMTP); T02–T11 still use the mock. Real email acceptance is T12. Real Kimi calls wait for the O05 data-processing check. Neither blocks T02–T11.
- 外部 Provider（Translation/Email/扫描；**SmsProvider 随手机渠道移 P1**）先实现接口＋模拟替身。邮件供应商已经选定（运营方 SMTP）；T02–T11 仍使用模拟实现。真实邮件验收在 T12。真实 Kimi 调用等待 O05 的数据处理核查。两者都不阻塞 T02–T11。
- Per-task rhythm: failing test → minimal implementation → pass → refactor → accept against SPEC → update PROGRESS.md.
- 每任务节奏：失败测试 → 最小实现 → 通过 → 重构 → 对照 SPEC 验收 → 更新 PROGRESS.md。
- Scheduling: no calendar commitments; rough magnitude is 1–3 development days per task. T12 depends on external resources (O07) and is not counted in the coding schedule.
- 排期：不给日历承诺；粗略量级为每任务 1–3 个开发日，T12 依赖外部资源（O07），不计入编码工期。

## Task Overview / 任务总览

| ID | Task / 任务 | Dependencies / 依赖 | SPEC/Acceptance / SPEC/验收 |
| --- | --- | --- | --- |
| T01 | Project skeleton and testing infrastructure<br>项目骨架与测试基建 | — | SOW Section 10<br>SOW 第10节 |
| T02 | Invitation-based registration and login (MVP: email OTP only)<br>邀请注册与登录（MVP 仅邮箱 OTP） | T01 | REQ-AUTH; R01; AC01 (mock)<br>REQ-AUTH；R01；AC01（模拟） |
| T03 | Case and member management + permission middleware<br>案件与成员管理＋权限中间件 | T02 | REQ-PM/CASE; R02; AC02/AC09 |
| T04 | Message pipeline and SSE reconnect backfill<br>消息流水线与 SSE 断线补拉 | T03 | REQ-MSG; R04; AC03 |
| T05 | Content check rules and review entry (explicit fee-inquiry trigger)<br>内容检查规则与审核入口（显式费用问询触发） | T04 | REQ-MOD; R06; AC05 |
| T06 | Translation service and dual reading modes (Simplified/Traditional Chinese / Vietnamese / English)<br>翻译服务与双阅读模式（中简繁/越/英） | T04 | REQ-TR; R05; AC03/AC04 |
| T07 | Review console + Coordinator automatic reminders (email, including notification core)<br>审核后台＋协调员自动提醒（邮件，含通知核心） | T05 | REQ-REV/NTF-07~13; R10; AC12 |
| T08 | File upload / isolation / scanning / publish / authorized download<br>文件上传/隔离/扫描/发布/授权下载 | T03、T07 | REQ-FILE; R07; AC06 |
| T09 | ~~DOCX Bilingual Parallel Document conversion~~ (moved to P1, v1.4)<br>~~DOCX 双语对照转换~~（移 P1，v1.4） | — | REQ-DOC; R08; AC07 (P1) |
| T10 | Two-way Urgent Alerts (between users, email channel)<br>双向紧急提醒（用户间，邮件渠道） | T07、T03 | REQ-NTF-01~06; R09; AC08 |
| T11 | Permission Revocation / Archive / admin MFA / Audit Trail<br>撤权/归档/管理员 MFA/审计 | T03、T04、T07、T08 | REQ-OPS/PM-08/AUTH-09; R11; AC02/09/11 |
| T12 | End-to-end dual-user + Backup and Restore drill + real-channel acceptance<br>端到端双用户＋备份恢复演练＋真实链路验收 | T01–T08、T10、T11 | AC01–AC06、AC08–AC12（AC07 属 P1）；O07/O08 |
| T13 | Daily Case Digest email (P1, added in v1.5)<br>案件日报邮件（P1，v1.5 新增） | T07、T08、T12 | REQ-DIG; REQ-CASE-01 |

---

## T01 Project Skeleton and Testing Infrastructure / T01 项目骨架与测试基建

- Goal: a runnable Next.js TS monolith skeleton + Docker Compose (PostgreSQL, MinIO) + initial Prisma migration + Vitest/Playwright testing infrastructure + npm scripts. Priority P0.
- 目标：可运行的 Next.js TS 单体骨架＋Docker Compose（PostgreSQL、MinIO）＋Prisma 初始迁移＋Vitest/Playwright 测试基建＋npm 脚本。优先级 P0。
- SPEC references: SOW Section 10 technology defaults; SPEC Section 13 (only the base users/sessions tables are created; the remaining tables migrate with their tasks).
- SPEC 引用：SOW 第10节技术默认值；SPEC 第13节（仅建 users/sessions 基础表，其余表随任务迁移）。
- Acceptance criteria: `docker compose up -d && npm run setup && npm run test && npm run test:e2e` all green; the health-check endpoint returns 200; migrations can be replayed up/down.
- 验收标准：`docker compose up -d && npm run setup && npm run test && npm run test:e2e` 全绿；健康检查端点返回 200；迁移可 up/down 重放。
- Expected new files: `package.json`, `tsconfig.json`, `next.config.ts`, `docker-compose.yml`, `prisma/schema.prisma`, `prisma/migrations/*`, `src/app/api/health/route.ts`, `src/lib/db.ts`, `vitest.config.ts`, `playwright.config.ts`, `tests/e2e/smoke.spec.ts`, `.env.example`, `.gitignore`.
- 预计新增文件：`package.json`、`tsconfig.json`、`next.config.ts`、`docker-compose.yml`、`prisma/schema.prisma`、`prisma/migrations/*`、`src/app/api/health/route.ts`、`src/lib/db.ts`、`vitest.config.ts`、`playwright.config.ts`、`tests/e2e/smoke.spec.ts`、`.env.example`、`.gitignore`。
- Tests to add/update: `tests/unit/health.test.ts`, `tests/e2e/smoke.spec.ts`.
- 同步测试：`tests/unit/health.test.ts`、`tests/e2e/smoke.spec.ts`。
- Test commands: `npm run test` (unit), `npm run test:e2e` (smoke).
- 测试命令：`npm run test`（单元）、`npm run test:e2e`（冒烟）。
- Status: Done. Re-checked 2026-10-01: containers healthy, `npm run test` 1 passed, `npm run test:e2e` health check passed. Commit cea7e37. Prisma 7 connection lives in `prisma.config.ts` with the `pg` adapter. Migration replay was verified earlier the same day and was not repeated, because reset would wipe the development database.
- 状态：已完成。2026-10-01 复核：容器健康，`npm run test` 1 项通过，`npm run test:e2e` 健康检查通过。提交 cea7e37。Prisma 7 的连接写在 `prisma.config.ts`，使用 `pg` adapter。迁移重放已在当天早些时候验证，本次未再执行，因为 reset 会清空开发数据库。

## T02 Invitation-based Registration and Login (MVP: Email OTP Only) / T02 邀请注册与登录（MVP 仅邮箱 OTP）

- Goal: enter a notification email and send an activation email only to that address; the invitation code is not bound to that email; acceptance, revocation, and resend; email OTP login (EmailProvider interface + mock; **phone OTP and SmsProvider stay P1**); accepting grants only the named Case; an already logged-in Lawyer accepts a second Case on the same account; administrator accounts stay on the local bootstrap path (MFA in T11). Priority P0.
- 目标：输入通知邮箱，且只向该地址发送激活邮件；邀请码不绑定该邮箱；接受、撤销与重发；邮箱验证码登录（EmailProvider 接口＋模拟；**手机验证码与 SmsProvider 仍为 P1**）；接受只授予所写明的案件；已登录的律师用同一账号接受第二个案件；管理员账号仍走本地引导（MFA 在 T11）。优先级 P0。
- SPEC references: REQ-AUTH-01~08, REQ-AUTH-10, REQ-AUTH-11, REQ-AUTH-12; REQ-PM-02/09/10. Acceptance: the mock-chain part of AC01 (real channels belong to T12).
- SPEC 引用：REQ-AUTH-01~08、REQ-AUTH-10、REQ-AUTH-11、REQ-AUTH-12；REQ-PM-02/09/10。验收：AC01 模拟链路部分（真实渠道属 T12）。
- Dependencies: T01.
- 依赖：T01。
- Acceptance criteria: under the mock Provider, an activation is sent only to the entered notification email; the code is not rejected because the account email differs from that address; a logged-in Lawyer accepts a second Case code on the same account and no second account is created; a different role cannot accept it; accepting grants only that Case and role; expiry/replay/wrong-code lockout/rate limiting follow REQ-AUTH-03; revoking a code invalidates it immediately; resending invalidates the old code and sends only to the original notification address; plaintext OTPs never appear in the database or logs; an invitation cannot create an administrator; on HTTP test origins the session cookie omits `Secure`, and the HTTPS configuration sets it (REQ-AUTH-06).
- 验收标准：模拟 Provider 下，激活邮件只发给被输入的通知邮箱；不因账号邮箱与该地址不同而拒绝邀请码；已登录的律师用同一账号接受第二个案件的邀请码，且不创建第二个账号；其他角色不能接受；接受后只获得该案件与角色；过期/重放/错误锁定/频率限制按 REQ-AUTH-03；撤销邀请码立即失效；重发使旧码失效且只发给原通知地址；验证码明文不出现在库与日志；邀请不能创建管理员；HTTP 测试源上的会话 Cookie 不带 `Secure`，HTTPS 配置则带上（REQ-AUTH-06）。
- Expected new/modified: `src/modules/auth/**`, `src/modules/invites/**`, `src/server/providers/email/{interface,fake}.ts`, `prisma/migrations/*` (users, contact_channels, invites, otp_challenges, sessions), `src/app/(auth)/**`. SmsProvider files are P1 and are not part of T02.
- 预计新增/修改：`src/modules/auth/**`、`src/modules/invites/**`、`src/server/providers/email/{interface,fake}.ts`、`prisma/migrations/*`（users、contact_channels、invites、otp_challenges、sessions）、`src/app/(auth)/**`。SmsProvider 文件属于 P1，不属于 T02。
- Tests to add/update: `tests/unit/auth/otp-rules.test.ts`, `tests/integration/auth/invite-flow.test.ts`, `tests/integration/auth/channel-binding.test.ts`.
- 同步测试：`tests/unit/auth/otp-rules.test.ts`、`tests/integration/auth/invite-flow.test.ts`、`tests/integration/auth/channel-binding.test.ts`。
- Test commands: `npm run test -- auth`, `npm run test:int -- auth`.
- 测试命令：`npm run test -- auth`、`npm run test:int -- auth`。
- Status: Done (2026-10-02, commit 8dcfd6a). 31/31 tests green, lint/tsc/build clean. The migration also created minimal `cases`/`case_members` (T03 extends them); `otp_challenges` gained a `purpose` column (REQ-AUTH-05); the single-use claim is atomic; the activation email is zh/vi bilingual. Details in PROGRESS.md.
- 状态：已完成（2026-10-02，提交 8dcfd6a）。31/31 测试通过，lint/tsc/build 无错误。迁移同时创建了最小版 `cases`/`case_members`（由 T03 扩展）；`otp_challenges` 增加 `purpose` 列（REQ-AUTH-05）；单次使用为原子认领；激活邮件中越双语。详见 PROGRESS.md。

## T03 Case and Member Management + Permission Middleware / T03 案件与成员管理＋权限中间件

- Goal: case creation / case-application approval / member grant and revocation / archive entry; unified server-side permission middleware; a simple case entry page (the **full Cross-case Mix-up Prevention UI — case list / persistent indicator / switch-draft isolation — moves to P1**, v1.4; server-side case-isolation permissions must be retained). Priority P0.
- 目标：案件创建/建案申请审批/成员授予与撤销/归档入口；统一服务端权限中间件；简易案件进入页（**完整防串案界面——案件列表/常驻标识/切换草稿隔离——移 P1**，v1.4；服务端案件隔离权限必须保留）。优先级 P0。
- SPEC references: REQ-PM-01~10, REQ-CASE-01~06. Acceptance: AC02 (privilege-escalation part), AC09 (archive part).
- SPEC 引用：REQ-PM-01~10、REQ-CASE-01~06。验收：AC02（越权部分）、AC09（归档部分）。
- Dependencies: T02.
- 依赖：T02。
- Acceptance criteria: creating a Case without a title of 1–80 characters is rejected (REQ-CASE-01); `POST /api/cases/:id/invites` requires an email and does not activate membership before that email accepts; when a Lawyer participates in two cases, directly requesting the other case's API is denied; any non-member request for any case resource is denied; after a member is revoked, new requests are denied immediately; a Lawyer cannot list all Clients on the platform. Client-side draft isolation is P1 (REQ-CASE-04) and is not built here.
- 验收标准：创建案件时标题不是 1–80 个字符则拒绝（REQ-CASE-01）；`POST /api/cases/:id/invites` 必须带邮箱，该邮箱接受前不激活成员资格；律师参与两案时，直接请求另一案 API 被拒；非成员请求任何案件资源被拒；撤销成员后新请求立即被拒；律师不能列全平台客户。客户端草稿隔离属于 P1（REQ-CASE-04），不在本任务实现。
- Expected new/modified: `src/modules/cases/**`, `src/modules/members/**`, `src/server/guards/**`, `src/app/(app)/cases/**`, `prisma/migrations/*` (cases with required title, case_members with can_manage/can_review, client_profiles, case_applications).
- 预计新增/修改：`src/modules/cases/**`、`src/modules/members/**`、`src/server/guards/**`、`src/app/(app)/cases/**`、`prisma/migrations/*`（cases 含必填 title，case_members 含 can_manage/can_review，client_profiles，case_applications）。
- Tests to add/update: `tests/integration/cases/cross-case-denied.test.ts`, `tests/integration/cases/revoke.test.ts`, `tests/integration/cases/title-required.test.ts`.
- 同步测试：`tests/integration/cases/cross-case-denied.test.ts`、`tests/integration/cases/revoke.test.ts`、`tests/integration/cases/title-required.test.ts`。
- Test commands: `npm run test:int -- cases`.
- 测试命令：`npm run test:int -- cases`。
- Status: Done (2026-10-02, commit 12f0329). 51/51 tests green (was 31; +18 integration in `tests/integration/cases/` + 2 unit in `tests/unit/cases/`), lint/tsc/build clean. Migration `20261002062836_t03_cases_members_profiles_applications` extends `cases` (client_org_name, ref_no, alias, created_by, title/status CHECKs) and `case_members` (digest_opt_out, role/status CHECKs) and adds `client_profiles` + `case_applications`. Guards in `src/server/guards/case-guards.ts` re-validate membership against the DB on every request; revoke is immediate; archive is read-only (409 on writes). Details in PROGRESS.md.
- 状态：已完成（2026-10-02，提交 12f0329）。51/51 测试通过（原 31；新增 `tests/integration/cases/` 18 项集成 + `tests/unit/cases/` 2 项单元），lint/tsc/build 无错误。迁移 `20261002062836_t03_cases_members_profiles_applications` 扩展 `cases`（client_org_name、ref_no、alias、created_by、title/status CHECK）与 `case_members`（digest_opt_out、角色/状态 CHECK），并新增 `client_profiles` 与 `case_applications`。权限中间件在 `src/server/guards/case-guards.ts`，每次请求重新查库校验成员资格；撤销即时生效；归档只读（写操作 409）。详见 PROGRESS.md。

## T04 Message Pipeline and SSE Reconnect Backfill / T04 消息流水线与 SSE 断线补拉

- Goal: message sending (Idempotency-Key deduplication) → restricted pending area → state-machine skeleton (a pass-through check stub is used in this task; T05 wires in the real check); SSE push after published; on disconnect, incremental backfill by last message ID; unread counts (self only); send-status display. Priority P0.
- 目标：消息发送（Idempotency-Key 去重）→ 受限待处理区 → 状态机骨架（本任务用直通检查桩，T05 接入真实检查）；published 后 SSE 推送；断线按最后消息 ID 增量补拉；未读数（仅本人）；发送状态展示。优先级 P0。
- SPEC references: REQ-MSG-01~08. Acceptance: the deduplication/reconnect parts of AC03.
- SPEC 引用：REQ-MSG-01~08。验收：AC03 的去重/重连部分。
- Dependencies: T03.
- 依赖：T03。
- Acceptance criteria: duplicate submissions/network retries produce no duplicate messages under `(case_id, author_id, idempotency_key)`; pending messages are invisible to the receiver through any interface; after an SSE disconnect, backfill has no loss and no duplication; non-members cannot subscribe to SSE; a Coordinator who is a member can post, and that message uses the same pipeline (REQ-PM-05).
- 验收标准：在 `(case_id, author_id, idempotency_key)` 下，重复提交/网络重试不产生重复消息；pending 消息对接收方各接口不可见；SSE 断开后补拉无丢失无重复；非成员无法订阅 SSE；作为成员的协调员可以发消息，且该消息走同一流水线（REQ-PM-05）。
- Expected new/modified: `src/modules/messages/**`, `src/app/api/cases/[id]/messages/route.ts`, `src/app/api/cases/[id]/stream/route.ts`, `src/server/sse/**`, `prisma/migrations/*` (messages).
- 预计新增/修改：`src/modules/messages/**`、`src/app/api/cases/[id]/messages/route.ts`、`src/app/api/cases/[id]/stream/route.ts`、`src/server/sse/**`、`prisma/migrations/*`（messages）。
- Tests to add/update: `tests/integration/messages/idempotency.test.ts`, `tests/integration/messages/visibility.test.ts`, `tests/integration/messages/sse-reconnect.test.ts`.
- 同步测试：`tests/integration/messages/idempotency.test.ts`、`tests/integration/messages/visibility.test.ts`、`tests/integration/messages/sse-reconnect.test.ts`。
- Test commands: `npm run test:int -- messages`.
- 测试命令：`npm run test:int -- messages`。
- Status: P0, not started. Implement only after the dependencies above are accepted.
- 状态：P0，未开始。须待上方依赖验收后再实现。

## Continued: T05–T12 in the Next Section (Part Two of This File) / 续：T05–T12 见下节（本文件第二部分）

## T05 Content Check Rules and Review Entry / T05 内容检查规则与审核入口

- Goal: deterministic rules (email / phone number / WeChat / Zalo ID / URL / QR code, including full-width, character-splitting, and Vietnamese tone-mark-stripped variants); semantic-judgment interface (mock LLM); **MVP triggers Pending Review only for explicit Litigation Retainer Fees inquiries/negotiations (e.g., "这个案件你们律所收费多少"); ambiguous content is allowed through by default (v1.4)**; distinguishing Litigation Retainer Fees from Case Amount; suspected restricted content becomes a review task (in the same transaction as the state change); on check failure the message stays pending. Priority P0.
- 目标：确定性规则（邮箱/手机号/WeChat/Zalo ID/URL/二维码，含全角、拆字、越南语无声调变形）；语义判断接口（模拟 LLM），**MVP 仅对显式委托费用问询/协商（如"这个案件你们律所收费多少"）触发待审，模糊内容默认放行（v1.4）**；委托费用与案件金额的区分；疑似受限转审核任务（与状态变更同事务）；检查失败保持待处理。优先级 P0。
- SPEC references: REQ-MOD-01~08, REQ-MSG-01/03, REQ-NTF-07 (task-registration part). Acceptance: AC05.
- SPEC 引用：REQ-MOD-01~08、REQ-MSG-01/03、REQ-NTF-07（任务登记部分）。验收：AC05。
- Dependencies: T04.
- 依赖：T04。
- Acceptance criteria: under the fixture corpus — ordinary Case Amounts (litigation claims / damages / settlement / court litigation fees) pass; explicit fee inquiries and obfuscated contact channels enter Pending Review; ambiguous fee mentions pass by default; when the check service fails, the message stops at check_failed and is not published; Pending Review registration and the notification event are in the same transaction; False Block / Missed Block are counted separately (REQ-MOD-08 thresholds are judged after the freeze).
- 验收标准： fixture 语料下——普通案件金额（诉讼请求/赔偿/和解/法院诉讼费）放行；显式费用问询与变形联系方式进入待审；模糊费用提及默认放行；检查服务故障时消息停 check_failed 不发布；待审登记与通知事件同事务；误拦/漏拦分别统计（REQ-MOD-08 阈值冻结后判定）。
- Expected new/modified: `src/modules/moderation/{rules,semantic,pipeline}.ts`, `src/server/providers/llm/{interface,fake}.ts`, `tests/fixtures/moderation/**`, `prisma/migrations/*` (review_tasks).
- 预计新增/修改：`src/modules/moderation/{rules,semantic,pipeline}.ts`、`src/server/providers/llm/{interface,fake}.ts`、`tests/fixtures/moderation/**`、`prisma/migrations/*`（review_tasks）。
- Tests to add/update: `tests/unit/moderation/rules.test.ts`, `tests/unit/moderation/fee-vs-amount.test.ts`, `tests/integration/moderation/pipeline.test.ts`.
- 同步测试：`tests/unit/moderation/rules.test.ts`、`tests/unit/moderation/fee-vs-amount.test.ts`、`tests/integration/moderation/pipeline.test.ts`。
- Test commands: `npm run test -- moderation`, `npm run test:int -- moderation`.
- 测试命令：`npm run test -- moderation`、`npm run test:int -- moderation`。
- Status: P0, not started. Implement only after the dependencies above are accepted.
- 状态：P0，未开始。须待上方依赖验收后再实现。

## T06 Translation Service and Dual Reading Modes (Simplified/Traditional Chinese / Vietnamese / English) / T06 翻译服务与双阅读模式（中简繁/越/英）

- Goal: TranslationProvider interface + mock implementation (Kimi adapter skeleton); language scope Chinese (Simplified/Traditional) / Vietnamese / English (v1.4); **only conversation-message translation, no document translation (v1.4)**; Translated Text versioning mapped to the Source Text; key-field (numbers/currency/dates/negations) recheck; automatic/manual dual reading modes; failure states and retry; language preference. Priority P0.
- 目标：TranslationProvider 接口＋模拟实现（Kimi 适配骨架）；语言范围中文（简体/繁体）/越南语/英语（v1.4）；**仅对话消息翻译，不含文档翻译（v1.4）**；译文版本化与源文对应；关键字段（数字/币种/日期/否定词）复核；自动/手动双阅读模式；失败状态与重试；语言偏好。优先级 P0。
- SPEC references: REQ-TR-01~09, REQ-MSG-09/10. Acceptance: AC03 (multilingual-display part), AC04.
- SPEC 引用：REQ-TR-01~09、REQ-MSG-09/10。验收：AC03（多语显示部分）、AC04。
- Dependencies: T04 (can run in parallel with T05).
- 依赖：T04（与 T05 可并行）。
- Acceptance criteria: translation is not requested for a message still in pending_review or check_failed (REQ-TR-09); in automatic mode a waiting indicator is shown before the translation completes and the foreign source is not shown as a fallback; target languages zh-Hans, zh-Hant, vi, and en are supported; zh-Hans ↔ zh-Hant may use a deterministic converter; LLM timeout/rate-limit/format anomalies are marked failed without losing the Source Text, are retryable, and never fake success; key-field mismatches enter needs_review and the doubtful translation is not displayed; manual mode translates only on click; same-language content is not re-translated; revising a translation produces a new version.
- 验收标准：仍处于 pending_review 或 check_failed 的消息不得请求翻译（REQ-TR-09）；自动模式在译文完成前显示等待提示，且不用外语源文代替；支持 zh-Hans、zh-Hant、vi、en；zh-Hans ↔ zh-Hant 可用确定性转换；LLM 超时/限流/格式异常标记 failed 且源文不丢、可重试、不伪造成功；关键字段不一致进入 needs_review 不展示存疑译文；手动模式点击才翻译；同语种不重复翻译；译文修订产生新版本。
- Expected new/modified: `src/modules/translation/**`, `src/server/providers/llm/kimi-adapter.ts` (interface skeleton only; real calls not enabled), `src/app/api/messages/[id]/translate/route.ts`, `prisma/migrations/*` (translation_versions).
- 预计新增/修改：`src/modules/translation/**`、`src/server/providers/llm/kimi-adapter.ts`（仅接口骨架，不启用真实调用）、`src/app/api/messages/[id]/translate/route.ts`、`prisma/migrations/*`（translation_versions）。
- Tests to add/update: `tests/unit/translation/key-field-check.test.ts`, `tests/integration/translation/modes.test.ts`, `tests/integration/translation/failure-states.test.ts`.
- 同步测试：`tests/unit/translation/key-field-check.test.ts`、`tests/integration/translation/modes.test.ts`、`tests/integration/translation/failure-states.test.ts`。
- Test commands: `npm run test -- translation`, `npm run test:int -- translation`.
- 测试命令：`npm run test -- translation`、`npm run test:int -- translation`。
- Status: P0, not started. Implement only after the dependencies above are accepted.
- 状态：P0，未开始。须待上方依赖验收后再实现。

## T07 Review Console + Coordinator Automatic Reminders (Including Notification Core) / T07 审核后台＋协调员自动提醒（含通知核心）

- Goal: persistent notification task queue (state machine, deduplication, cooldown, exponential-backoff retry, timeout escalation, canceling redundant tasks; **MVP: email channel only**, v1.4); Coordinator Pending Review queue with approve/return/reject; first reminder sent within 30 seconds of entering Pending Review (internal target); escalation and backup owners; stop redundant reminders after review completes. Priority P0.
- 目标：持久通知任务队列（状态机、去重、冷却、指数退避重试、超时升级、取消冗余；**MVP 仅邮件渠道**，v1.4）；协调员待审队列与批准/退回/拒绝；进入待审 30 秒内首发提醒（内部目标）；升级与备用负责人；审核完成后停止冗余提醒。优先级 P0。
- SPEC references: REQ-REV-01~06, REQ-NTF-07~13. Acceptance: AC12 (mock-channel part).
- SPEC 引用：REQ-REV-01~06、REQ-NTF-07~13。验收：AC12（模拟渠道部分）。
- Dependencies: T05.
- 依赖：T05。
- Acceptance criteria: Pending Review registration and the notification event are in the same transaction; when another reviewer or a configured backup Coordinator exists, the author is not offered their own task; when the author is the only reviewer and no backup is configured, the author is prompted and an explicit confirmation publishes the item with self_release recorded (REQ-REV-06); dismissing the prompt does not publish, and timeout never confirms; under a simulated clock, first send ≤30s, retries at 1/5/15 minutes, and final failure is visible; consecutive uploads are merged into a batch but the first item triggers immediately and nothing is missed; on timeout, escalation follows the configuration to backup Coordinator → operations lead, using elapsed time rather than a business-hours calendar; completing a review cancels unsent reminders; when no valid channel exists the submitter sees an error; the notification body contains no original message/fees/attachments.
- 验收标准：待审登记与通知事件同事务；存在其他审核人或已配置备用协调员时，作者不会被分配审核自己的任务；作者是唯一审核人且未配置备用协调员时，系统向其提示，明确确认后发布并记录 self_release（REQ-REV-06）；关闭提示不发布，超时也绝不代为确认；模拟时钟下首发 ≤30s、按 1/5/15 分钟重试、最终失败可见；连续上传合并批次但首项立即触发且不遗漏；超时按已流逝时间升级备用协调员→运营负责人，不等待工作时间日历；审核完成取消未发提醒；无有效渠道时提交人可见异常；通知正文不含原消息/费用/附件。
- Expected new/modified: `src/modules/review/**`, `src/modules/notifications/**`, `src/server/jobs/{queue,worker}.ts`, `src/app/(app)/review/**`, `prisma/migrations/*` (notification_tasks, review_tasks extension).
- 预计新增/修改：`src/modules/review/**`、`src/modules/notifications/**`、`src/server/jobs/{queue,worker}.ts`、`src/app/(app)/review/**`、`prisma/migrations/*`（notification_tasks、review_tasks 扩展）。
- Tests to add/update: `tests/integration/review/alert-lifecycle.test.ts` (covering retry/dedup/escalation/cancel), `tests/integration/review/decisions.test.ts`, `tests/unit/notifications/dedupe.test.ts`.
- 同步测试：`tests/integration/review/alert-lifecycle.test.ts`（含重试/去重/升级/取消）、`tests/integration/review/decisions.test.ts`、`tests/unit/notifications/dedupe.test.ts`。
- Test commands: `npm run test -- notifications`, `npm run test:int -- review`.
- 测试命令：`npm run test -- notifications`、`npm run test:int -- review`。
- Status: P0, not started. Implement only after the dependencies above are accepted.
- 状态：P0，未开始。须待上方依赖验收后再实现。

## T08 File Upload / Isolation / Scanning / Publish / Authorized Download / T08 文件上传/隔离/扫描/发布/授权下载

- Goal: private upload (MinIO) + real type detection + 20MB limit; scanning interface (including failure/timeout/encrypted paths); files enter review; Published Version copies separated from originals; authorized proxy download, with old links invalidated after Permission Revocation. Priority P0.
- 目标：私有上传（MinIO）＋真实类型检测＋20MB 上限；扫描接口（含失败/超时/加密路径）；文件进入审核；发布副本与原件分离；授权代理下载，撤权后旧链接失效。优先级 P0。
- SPEC references: REQ-FILE-01~08. Acceptance: AC06.
- SPEC 引用：REQ-FILE-01~08。验收：AC06。
- Dependencies: T03, T07.
- 依赖：T03、T07。
- Acceptance criteria: pending-review files are invisible to the receiver's list/preview/download/direct links; scan failure stays in check_failed, alerts the Coordinator without a file body, and does not auto-release (REQ-FILE-08); type forgery and oversize are rejected; every download after publish is re-authorized; old download URLs return 403 after revocation; file names/metadata are included in checks; entering Pending Review triggers a Coordinator reminder (linked with T07). The bilingual file kind is not added in this task.
- 验收标准：待审文件对接收方列表/预览/下载/直链均不可见；扫描失败停在 check_failed，向协调员告警且不含文件正文，不自动放行（REQ-FILE-08）；类型伪造与超限拒绝；发布后下载每次重新鉴权；撤权后旧下载地址 403；文件名/元数据纳入检查；进入待审触发协调员提醒（与 T07 联动）。本任务不加入 bilingual 文件种类。
- Expected new/modified: `src/modules/files/**`, `src/server/providers/storage/{interface,minio}.ts`, `src/server/providers/scanner/{interface,stub}.ts`, `src/app/api/files/[id]/download/route.ts`, `prisma/migrations/*` (files, file_variants).
- 预计新增/修改：`src/modules/files/**`、`src/server/providers/storage/{interface,minio}.ts`、`src/server/providers/scanner/{interface,stub}.ts`、`src/app/api/files/[id]/download/route.ts`、`prisma/migrations/*`（files、file_variants）。
- Tests to add/update: `tests/integration/files/quarantine.test.ts`, `tests/integration/files/download-auth.test.ts`, `tests/integration/files/scan-failure.test.ts`.
- 同步测试：`tests/integration/files/quarantine.test.ts`、`tests/integration/files/download-auth.test.ts`、`tests/integration/files/scan-failure.test.ts`。
- Test commands: `npm run test:int -- files`.
- 测试命令：`npm run test:int -- files`。
- Status: P0, not started. Implement only after the dependencies above are accepted.
- 状态：P0，未开始。须待上方依赖验收后再实现。

## T09 ~~DOCX Bilingual Parallel Document Conversion~~ (Moved to P1, v1.4) / T09 ~~DOCX 双语对照转换~~（已移 P1，v1.4）

- Goal: **this task is moved out of MVP entirely** (v1.4: MVP does no document translation; Word/PDF and other document translation is handled by the participants themselves). The following design is retained for direct use when P1 starts: user-initiated requests; simple DOCX paragraph extraction; page-count rendering determination (headless LibreOffice or an equivalent component inside a worker); ≤20-page limit; paragraph-numbered Chinese-Vietnamese parallel DOCX output; explicit rejection of unsupported elements; paragraph-integrity verification; output goes through publish review. Priority P1.
- 目标：**本任务整体移出 MVP**（v1.4：MVP 不做文档翻译，Word/PDF 等文档翻译由参与方自行解决）。以下设计保留供 P1 启动时直接使用：用户主动请求；简单 DOCX 段落提取；页数渲染判定（worker 内 headless LibreOffice 或等效组件）；≤20 页限制；段落编号中越对照 DOCX 输出；不支持元素明确拒绝；段落完整性校验；输出走发布审核。优先级 P1。
- SPEC references: REQ-DOC-01~06 (all marked P1). Acceptance: AC07 (P1).
- SPEC 引用：REQ-DOC-01~06（全部标 P1）。验收：AC07（P1）。
- Dependencies: (when P1 starts) T06, T08.
- 依赖：（P1 启动时）T06、T08。
- Acceptance criteria (P1): for simple-paragraph fixtures, the number of output paragraph pairs equals the source paragraph count (no silent paragraph loss); fixtures containing tables/text boxes/scanned images are explicitly rejected or routed to manual handling; >20 pages is rejected; output files carry source/translated versions and a machine-translation marking; output is invisible to the other party before review.
- 验收标准（P1）：简单段落 fixture 输出的段落对数 = 源段落数（不静默漏段）；含表格/文本框/扫描图的 fixture 明确拒绝或转人工；>20 页拒绝；输出文件带源/译文版本与机器翻译标记；输出未审核前对方不可见。
- Expected new/modified (P1): `src/modules/bilingual/**`, `src/server/jobs/docx-worker.ts`, `tests/fixtures/docx/**`, `prisma/migrations/*` (docx_jobs).
- 预计新增/修改（P1）：`src/modules/bilingual/**`、`src/server/jobs/docx-worker.ts`、`tests/fixtures/docx/**`、`prisma/migrations/*`（docx_jobs）。
- Tests to add/update (P1): `tests/unit/bilingual/paragraph-integrity.test.ts`, `tests/integration/bilingual/convert.test.ts`, `tests/integration/bilingual/reject-unsupported.test.ts`.
- 同步测试（P1）：`tests/unit/bilingual/paragraph-integrity.test.ts`、`tests/integration/bilingual/convert.test.ts`、`tests/integration/bilingual/reject-unsupported.test.ts`。
- Test commands (P1): `npm run test -- bilingual`, `npm run test:int -- bilingual`.
- 测试命令（P1）：`npm run test -- bilingual`、`npm run test:int -- bilingual`。
- Status: moved to P1 (v1.4); does not block MVP.
- 状态：已移 P1（v1.4），不阻塞 MVP。

## T10 Two-way Urgent Alerts (Between Users) / T10 双向紧急提醒（用户间）

- Goal: urgent button; recipients limited to authorized members of the same case; **MVP default channel is the recipient's verified email (primary/backup/phone channels P1**, v1.4); deduplication and 10-minute cooldown; six-state visibility (queued / provider accepted / delivered / unknown / failed / In-app Confirmation); In-app Confirmation. Priority P0.
- 目标：紧急按钮；接收人限本案授权成员；**MVP 默认渠道为收件人已验证邮箱（主备/手机渠道 P1**，v1.4）；去重与 10 分钟冷却；六态可见（排队/供应商接受/送达/未知/失败/站内确认）；站内确认。优先级 P0。
- SPEC references: REQ-NTF-01~06. Acceptance: AC08 (mock-channel part).
- SPEC 引用：REQ-NTF-01~06。验收：AC08（模拟渠道部分）。
- Dependencies: T07 (notification core), T03.
- 依赖：T07（通知核心）、T03。
- Acceptance criteria: repeated clicks are deduplicated; notifications contain no counterpart contact details/message bodies/attachments; status is visible to the sender; final failure also sends a content-free notice to reviewers (REQ-NTF-05); recipient In-app Confirmation is trackable; after Permission Revocation/Archive, unfinished reminders are re-checked and canceled.
- 验收标准：重复点击去重；通知不含对方联系方式/正文/附件；状态对发送人可见；最终失败时还向审核人发送不含正文的通知（REQ-NTF-05）；收件人站内确认可追踪；撤权/归档后未完成提醒重新检查并取消。
- Expected new/modified: `src/modules/urgent/**`, `src/app/api/cases/[id]/urgent/route.ts`, `src/app/api/notifications/**`.
- 预计新增/修改：`src/modules/urgent/**`、`src/app/api/cases/[id]/urgent/route.ts`、`src/app/api/notifications/**`。
- Tests to add/update: `tests/integration/urgent/dedupe-cooldown.test.ts`, `tests/integration/urgent/status-visibility.test.ts`, `tests/integration/urgent/confirm.test.ts`.
- 同步测试：`tests/integration/urgent/dedupe-cooldown.test.ts`、`tests/integration/urgent/status-visibility.test.ts`、`tests/integration/urgent/confirm.test.ts`。
- Test commands: `npm run test:int -- urgent`.
- 测试命令：`npm run test:int -- urgent`。
- Status: P0, not started. Implement only after the dependencies above are accepted.
- 状态：P0，未开始。须待上方依赖验收后再实现。

## T11 Permission Revocation / Archive / Admin MFA / Audit Trail / T11 撤权/归档/管理员 MFA/审计

- Goal: Permission Revocation takes effect immediately (new requests denied + existing SSE connections disconnected + unfinished tasks re-checked); Archive is read-only; administrator TOTP MFA; Audit Trail log full coverage (REQ-OPS-01 checklist). Priority P0.
- 目标：权限撤销即时生效（新请求拒绝＋存量 SSE 断开＋未完成任务重检）；归档只读；管理员 TOTP MFA；审计日志全覆盖（REQ-OPS-01 清单）。优先级 P0。
- SPEC references: REQ-PM-08, REQ-CASE-05, REQ-AUTH-09, REQ-OPS-01~03/05. Acceptance: AC02 (revocation part), AC09 (archive part), AC11 (audit/logging part).
- SPEC 引用：REQ-PM-08、REQ-CASE-05、REQ-AUTH-09、REQ-OPS-01~03/05。验收：AC02（撤权部分）、AC09（归档部分）、AC11（审计/日志部分）。
- Dependencies: T03, T04, T07, T08. Peer-urgent cancellation after revoke is covered with T10; if T11 lands first, that assertion is added when T10 exists.
- 依赖：T03、T04、T07、T08。撤权后取消用户间紧急提醒与 T10 一起覆盖；若 T11 先完成，该断言在 T10 存在时补上。
- Acceptance criteria: after revocation, existing SSE connections are closed and API/SSE/download/export are all denied; after archive, new messages/files/reminders are forbidden; administrators without MFA configured cannot perform administrative operations; audit records contain no message bodies/OTPs; routine logs contain no sensitive content (log-scan test).
- 验收标准：撤权后存量 SSE 连接关闭、API/SSE/下载/导出全部拒绝；归档后禁止新消息/文件/提醒；未配置 MFA 的管理员不能执行管理操作；审计记录无正文/验证码；常规日志无敏感内容（日志扫描测试）。
- Expected new/modified: `src/modules/admin/**`, `src/server/audit/**`, `src/server/auth/mfa.ts`, `prisma/migrations/*` (audit_logs, users.mfa).
- 预计新增/修改：`src/modules/admin/**`、`src/server/audit/**`、`src/server/auth/mfa.ts`、`prisma/migrations/*`（audit_logs、users.mfa）。
- Tests to add/update: `tests/integration/lifecycle/revoke-live.test.ts`, `tests/integration/lifecycle/archive.test.ts`, `tests/integration/admin/mfa.test.ts`, `tests/unit/audit/no-sensitive-logging.test.ts`.
- 同步测试：`tests/integration/lifecycle/revoke-live.test.ts`、`tests/integration/lifecycle/archive.test.ts`、`tests/integration/admin/mfa.test.ts`、`tests/unit/audit/no-sensitive-logging.test.ts`。
- Test commands: `npm run test:int -- lifecycle admin`, `npm run test -- audit`.
- 测试命令：`npm run test:int -- lifecycle admin`、`npm run test -- audit`。
- Status: P0, not started. Implement only after the dependencies above are accepted.
- 状态：P0，未开始。须待上方依赖验收后再实现。

## T12 End-to-end Dual-user + Backup and Restore Drill + Real-channel Acceptance / T12 端到端双用户＋备份恢复演练＋真实链路验收

- Goal: Playwright dual-browser (Chinese/Vietnamese) core journeys; a runbook that guides the bootstrapped administrator to create one fictitious test Case and enter the Coordinator, Chinese Client, and Vietnamese Lawyer emails (REQ-OPS-07); Backup and Restore drill in an isolated environment (verifying the RPO ≤24h / RTO ≤8h targets); AC01/AC08/AC12 **real email** acceptance execution (+86/+84 SMS acceptance moves to P1 with the phone channel, v1.4); AC10 China-Vietnam network experience test; deployment and operations documentation (including Shanghai test-environment IP access and main-site redirect link configuration). Priority P0 (external resource dependencies O02/O05/O07/O08).
- 目标：Playwright 双浏览器（中/越）核心旅程；一份运行指引，引导已引导创建的管理员创建一个虚构测试案件并输入协调员、中国客户、越南律师的邮箱（REQ-OPS-07）；隔离环境备份恢复演练（RPO ≤24h/RTO ≤8h 目标验证）；AC01/AC08/AC12 **真实邮件**验收执行（+86/+84 短信验收随手机渠道移 P1，v1.4）；AC10 中越网络体验测试；部署与运行说明（含上海测试环境 IP 访问与主站跳转链接配置）。优先级 P0（外部资源依赖 O02/O05/O07/O08）。
- SPEC references: all mappings in Section 17; REQ-OPS-04; REQ-OPS-07.
- SPEC 引用：第17节全部映射；REQ-OPS-04；REQ-OPS-07。
- Dependencies: T01–T08, T10, T11 (T09 has moved to P1).
- 依赖：T01–T08、T10、T11（T09 已移 P1）。
- Acceptance criteria: E2E covers the key paths of AC02/AC03/AC05/AC06/AC08/AC09/AC12. AC07 stays in T09 (P1) and is not an MVP pass condition. AC03's required browser pair is Chinese and Vietnamese; English and Traditional Chinese are already covered by T06 mock tests. The runbook is followed once: the administrator creates one fictitious test Case, three activation emails go to the Coordinator, Chinese Client, and Vietnamese Lawyer addresses, each code is not bound to that mailbox, each acceptance joins only that Case, and the administrator is not a chat member. The same-account second Case is covered by T02, not by this one-Case runbook. Restore-drill report (message/member/file association checks pass); real-email delivery report; network test report (time/network/sample size/P50/P95/failure rate). **Simulated success does not count as real delivery; when external resources are not in place, the related items are marked "Blocked" rather than passed.**
- 验收标准：E2E 覆盖 AC02/AC03/AC05/AC06/AC08/AC09/AC12 关键路径。AC07 留在 T09（P1），不是 MVP 的通过条件。AC03 的必测浏览器组合是中文与越南语；英语与繁体中文已由 T06 的模拟测试覆盖。运行指引实际走一遍：管理员创建一个虚构测试案件，三封激活邮件分别发给协调员、中国客户、越南律师的邮箱，每个邀请码都不绑定该邮箱，每次接受只加入该案件，管理员不是聊天成员。同一账号的第二个案件由 T02 覆盖，不由这份单案件运行指引覆盖。恢复演练报告（消息/成员/文件关联核查通过）；真实邮件送达报告；网络测试报告（时间/网络/样本数/P50/P95/失败率）。**模拟成功不视为真实送达；外部资源未到位时相关项标记「阻塞」而非通过。**
- Expected new/modified: `tests/e2e/**`, `src/app/(app)/admin/test-case/**`, `scripts/backup.sh`, `scripts/restore-drill.sh`, `docs/runbook/mvp-test-case.md`, `docs/deployment.md`.
- 预计新增/修改：`tests/e2e/**`、`src/app/(app)/admin/test-case/**`、`scripts/backup.sh`、`scripts/restore-drill.sh`、`docs/runbook/mvp-test-case.md`、`docs/deployment.md`。
- Tests to add/update: `tests/e2e/dual-user.spec.ts`, `tests/e2e/review-alert.spec.ts`, `tests/e2e/admin-test-case.spec.ts`.
- 同步测试：`tests/e2e/dual-user.spec.ts`、`tests/e2e/review-alert.spec.ts`、`tests/e2e/admin-test-case.spec.ts`。
- Test commands: `npm run test:e2e`, `npm run drill:restore`.
- 测试命令：`npm run test:e2e`、`npm run drill:restore`。
- Status: P0, not started. Implement only after the dependencies above are accepted.
- 状态：P0，未开始。须待上方依赖验收后再实现。

## T13 Daily Case Digest Email (P1, Added in v1.5) / T13 案件日报邮件（P1，v1.5 新增）

- Goal: every day at 00:00 (Asia/Ho_Chi_Minh), aggregate per active case the published messages and published attachments of the previous Vietnamese calendar day, and send a Daily Case Digest email to all Vietnamese Lawyers of the case (the Coordinator can turn it off per Lawyer) and the Coordinator; subject "CaseName-SendDate-Record" (e.g., DG-Juyang-2026OCT8-Record); the case name is required when creating a case. Priority P1 (the first version after MVP).
- 目标：每日 00:00（Asia/Ho_Chi_Minh）按活跃案件汇总上一越南日历日的已发布消息与已发布附件，向本案全部越南律师（协调员可按律师关闭）与协调员发送日报邮件；标题「案件名称-发送日-Record」（如 DG-Juyang-2026OCT8-Record）；创建案件时案件名称必填。优先级 P1（MVP 之后第一个版本）。
- SPEC references: REQ-DIG-01~06; REQ-CASE-01.
- SPEC 引用：REQ-DIG-01~06；REQ-CASE-01。
- Dependencies: T07 (notification core), T08 (attachment publish), T12 (real email channel).
- 依赖：T07（通知核心）、T08（附件发布）、T12（真实邮件通道）。
- Acceptance criteria: fires on time under a simulated clock; includes only published content (Pending Review/returned/rejected not included); recipients = the case's Lawyers + Coordinator, sent individually per person, can be turned off per Lawyer and recorded in the audit trail; no send when there is no new content that day; archived cases do not send; correct subject format (including case-name-required validation and 2026OCT8-style dates); oversized attachments are split by sequence number; failure retry and final failure are visible; digest_runs records are complete.
- 验收标准：模拟时钟下按时触发；仅含已发布内容（待审/退回/拒绝不纳入）；收件人 = 本案律师＋协调员、逐人单独发送、可按律师关闭且入审计；当日无新内容不发送；归档案件不发送；标题格式正确（含案件名称必填校验、2026OCT8 式日期）；附件超限按序号拆分；失败重试与最终失败可见；digest_runs 记录完整。
- Expected new/modified: `src/modules/digest/**`, `src/server/jobs/digest-worker.ts`, `prisma/migrations/*` (case_members.digest_opt_out, digest_runs, notification kind case_digest). `cases.title` is already required in T03; T13 only reads it.
- 预计新增/修改：`src/modules/digest/**`、`src/server/jobs/digest-worker.ts`、`prisma/migrations/*`（case_members.digest_opt_out、digest_runs、通知种类 case_digest）。`cases.title` 已在 T03 设为必填；T13 只读取它。
- Tests to add/update: `tests/unit/digest/subject-format.test.ts`, `tests/integration/digest/daily-run.test.ts`, `tests/integration/digest/opt-out.test.ts`.
- 同步测试：`tests/unit/digest/subject-format.test.ts`、`tests/integration/digest/daily-run.test.ts`、`tests/integration/digest/opt-out.test.ts`。
- Test commands: `npm run test -- digest`, `npm run test:int -- digest`.
- 测试命令：`npm run test -- digest`、`npm run test:int -- digest`。
- Status: P1, pending start (after MVP acceptance).
- 状态：P1 待启动（MVP 验收后）。

## Dependency Graph and Execution Order / 依赖图与执行顺序

Dependency graph:
依赖图：

```
T01 → T02 → T03 → T04 → T05 → T07 → T08 ─────────┐
                    │      ↘ T06                 ├→ T12 → T13 (P1)
                    └──────────→ T10 ← T07       │
                    └──────────→ T11 ← T04、T07、T08 ─┘
（T09 为 P1，依赖 T06 与 T08，不在 MVP 关键路径上）
```

- Parallelizable: T05 and T06; T10 and T11. Suggested order: T01→T02→T03→T04→(T05∥T06)→T07→T08→(T10∥T11)→T12.
- 可并行：T05 与 T06；T10 与 T11。建议顺序：T01→T02→T03→T04→(T05∥T06)→T07→T08→(T10∥T11)→T12。

## Completion Evidence Requirements (Per Task) / 完成证据要求（每任务）

Test output, migration records, and the list of changed files are written into PROGRESS.md; failures/not-run/blocked items are recorded truthfully, and a pass is never achieved by weakening tests.

测试输出、迁移记录、变更文件清单写入 PROGRESS.md；失败/未运行/阻塞如实记录，不以削弱测试换取通过。
