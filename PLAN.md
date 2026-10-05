# PLAN.md — MVP Implementation Plan / MVP 实施计划

- Version: 0.12 | Date: 2026-10-05
- 版本：0.12｜日期：2026-10-05
- Basis: SPEC.md v0.12, SOW.md v1.12 plus the 2026-10-04 scope note. The decided activation path is one step: the invited email plus the activation code, and only that email can accept that code (REQ-AUTH-01, REQ-AUTH-12). The repository implements that one-step path (F02). Invitation codes do not expire (v1.12): the same code is the return sign-in credential. P0 tasks are T01–T08, T10–T12, and T13. T09 and T14 stay P1. v0.11 moves T13 into the MVP and narrows it: the daily email goes only to the Case Coordinator. The case-creation page (T14) stays the next version. Until that page exists, an operator creates cases and writes the provisioning rows in `LOCAL_DEV_NOTES.md` (git-ignored).
- 依据：SPEC.md v0.12、SOW.md v1.12 加上 2026-10-04 的范围说明。已决定的激活路径是一步：受邀邮箱加上激活码，且只有该邮箱能接受该码（REQ-AUTH-01、REQ-AUTH-12）。本仓库已实现这一步激活（F02）。邀请码长期有效（v1.12）：同一邀请码即再次登录的凭证。P0 任务为 T01–T08、T10–T12 与 T13。T09 与 T14 仍是 P1。v0.11 把 T13 纳入 MVP，并收窄为只发给案件协调员。建案页面（T14）留在下一版本。该页面出现之前，由操作者建案，并把建案记录写在 `LOCAL_DEV_NOTES.md`（不入库）。
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
| T13 | Daily Case Digest email to the Coordinator only (MVP as of 2026-10-04)<br>案件日报邮件，只发给协调员（2026-10-04 起属于 MVP） | T07、T08、T12 | REQ-DIG; REQ-CASE-01 |
| T14 | Administration Console: Case creation and participant setup (next version after MVP)<br>管理控制台：案件创建与参与人设置（MVP 之后的下一版本） | T03、T11 | REQ-ADM-01~05 |

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

- Goal, as built in T02 (v1.10): enter a notification email and send an activation email only to that address; the invitation code is not bound to that email; acceptance still uses a 6-digit OTP; revocation and resend; email OTP login (EmailProvider interface + mock; **phone OTP and SmsProvider stay P1**); accepting grants only the named Case; an already logged-in Lawyer accepts a second Case on the same account; administrator accounts stay on the local bootstrap path (MFA in T11). Priority P0. **v1.11 supersedes the unbound rule.** F02 changed this path to one step: the invited email plus the activation code, and only that email can accept it.
- 目标，按 T02 已实现的版本（v1.10）：输入通知邮箱，且只向该地址发送激活邮件；邀请码不绑定该邮箱；接受仍使用 6 位验证码；撤销与重发；邮箱验证码登录（EmailProvider 接口＋模拟；**手机验证码与 SmsProvider 仍为 P1**）；接受只授予所写明的案件；已登录的律师用同一账号接受第二个案件；管理员账号仍走本地引导（MFA 在 T11）。优先级 P0。**v1.11 取代不绑定规则。** F02 已把这条路径改成一步：受邀邮箱加上激活码，且只有该邮箱能接受。
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
- Status: Done (2026-10-02, commit 52143e0). 80/80 tests green (was 51; +26 integration in `tests/integration/messages/` + 3 unit in `tests/unit/messages/lang.test.ts`), lint/tsc/build clean. Migration `20261002095350_t04_messages_unread` adds `messages` (full SPEC 5.1 status CHECK, `seq` cursor, `published_at`, unique `(case_id, author_id, idempotency_key)`) and `case_members.last_read_message_id`. The check stage is the pass-through stub `src/modules/messages/check.ts` (tests inject needs_review/throw); SSE is an in-process hub behind `GET /api/cases/:id/stream`, backfill is `GET .../messages?after=` with a `(published_at, id)` cursor (late-published messages still surface). Unread counts ride on `GET /api/cases` and `GET /api/cases/:id` (self only). Details in PROGRESS.md.
- 状态：已完成（2026-10-02，提交 52143e0）。80/80 测试通过（原 51；新增 `tests/integration/messages/` 26 项集成＋`tests/unit/messages/lang.test.ts` 3 项单元），lint/tsc/build 无错误。迁移 `20261002095350_t04_messages_unread` 新增 `messages`（SPEC 5.1 完整状态 CHECK、`seq` 游标、`published_at`、唯一约束 `(case_id, author_id, idempotency_key)`）与 `case_members.last_read_message_id`。检查阶段为直通桩 `src/modules/messages/check.ts`（测试注入 needs_review/抛错）；SSE 为进程内 hub，挂载在 `GET /api/cases/:id/stream`；补拉走 `GET .../messages?after=`，游标为 `(published_at, id)`（延迟发布的消息也能浮出）。未读数挂在 `GET /api/cases` 与 `GET /api/cases/:id`（仅本人）。详见 PROGRESS.md。

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
- Status: Done (2026-10-02). 140/140 tests green (was 80; +30 unit `tests/unit/moderation/rules.test.ts`, +23 unit `tests/unit/moderation/fee-vs-amount.test.ts`, +7 integration `tests/integration/moderation/pipeline.test.ts`), lint/tsc/build clean. Migration `20261002102258_t05_review_tasks` adds `review_tasks` with target_type/status/reason CHECKs. The T04 pass-through stub in `src/modules/messages/check.ts` is replaced by the real pipeline (`src/modules/moderation/{rules,semantic,pipeline}.ts` + `src/server/providers/llm/{interface,fake,index}.ts`); the hold and the review task register in one transaction, registration failure rolls back to check_failed. Fixture corpus: 14 pass + 19 review samples (zh/vi/en). Details in PROGRESS.md.
- 状态：已完成（2026-10-02）。140/140 测试通过（原 80；新增 30 单元 `tests/unit/moderation/rules.test.ts`、23 单元 `tests/unit/moderation/fee-vs-amount.test.ts`、7 集成 `tests/integration/moderation/pipeline.test.ts`），lint/tsc/build 无错误。迁移 `20261002102258_t05_review_tasks` 新增 `review_tasks` 并带 target_type/status/reason CHECK。`src/modules/messages/check.ts` 的 T04 直通桩已替换为真实管线（`src/modules/moderation/{rules,semantic,pipeline}.ts`＋`src/server/providers/llm/{interface,fake,index}.ts`）；挂起与审核任务在一个事务内登记，登记失败回滚至 check_failed。fixture 语料：14 条放行＋19 条待审（中越英）。详见 PROGRESS.md。

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
- Follow-up F07 (2026-10-03): automatic mode calls Kimi for Vietnamese → Traditional Chinese (what the client sees) and Traditional Chinese → Vietnamese (what the lawyer sees). Done 2026-10-03: the O05 data-processing check was approved by the user for translation on 2026-10-03, the Kimi adapter now reads `KIMI_BASE_URL`/`KIMI_MODEL` from the environment with a 90s timeout and typed failures (timeout/rate_limited/server/format), automatic-mode backfill runs in parallel, and the test host serves real Kimi translations (`TRANSLATION_PROVIDER=kimi`).
- 后续 F07（2026-10-03）：自动模式调用 Kimi，把越南语译成客户看到的繁体中文，把繁体中文译成律师看到的越南语。2026-10-03 完成：翻译方向的 O05 数据处理核查已由用户于 2026-10-03 批准；Kimi 适配改为从环境变量读取 `KIMI_BASE_URL`/`KIMI_MODEL`，超时 90 秒并带类型化故障（timeout/rate_limited/server/format）；自动模式补建改为并行；测试机已用真实 Kimi 翻译（`TRANSLATION_PROVIDER=kimi`）。
- Status: Done (2026-10-02). 165/165 tests green (was 140; +9 unit `tests/unit/translation/key-field-check.test.ts`, +4 unit `tests/unit/translation/zh-convert.test.ts`, +7 integration `tests/integration/translation/modes.test.ts`, +5 integration `tests/integration/translation/failure-states.test.ts`), lint/tsc/build clean. Migration `20261002104346_t06_translation_versions` adds `translation_versions` (unique (message_id, target_lang, version); status/target_lang CHECKs). The translation surface extends the T05 LLM provider seam (`LlmTranslationProvider` in `src/server/providers/llm/interface.ts`; the fake records payloads and injects fixed responses/typed failures; `kimi-adapter.ts` is a skeleton — never the default, loud "not configured" without a key). zh-Hans ↔ zh-Hant uses the deterministic converter `src/modules/translation/zh-convert.ts` and still writes version rows with provider `zh-converter`. Key-field recheck (numbers/currency/dates/negations) is the pure function `src/modules/translation/key-field-check.ts`; mismatches land in needs_review and reading views withhold the text. Details in PROGRESS.md.
- 状态：已完成（2026-10-02）。165/165 测试通过（原 140；新增 9 单元 `tests/unit/translation/key-field-check.test.ts`、4 单元 `tests/unit/translation/zh-convert.test.ts`、7 集成 `tests/integration/translation/modes.test.ts`、5 集成 `tests/integration/translation/failure-states.test.ts`），lint/tsc/build 无错误。迁移 `20261002104346_t06_translation_versions` 新增 `translation_versions`（唯一约束 (message_id, target_lang, version)；status/target_lang CHECK）。翻译面复用 T05 的 LLM provider 接缝（`src/server/providers/llm/interface.ts` 的 `LlmTranslationProvider`；fake 记录载荷并可注入固定响应/类型化故障；`kimi-adapter.ts` 仅骨架——绝不做默认，无 key 时明确报未配置）。zh-Hans ↔ zh-Hant 走确定性转换器 `src/modules/translation/zh-convert.ts`，仍生成 provider 为 `zh-converter` 的版本行。关键字段复核（数字/币种/日期/否定词）为纯函数 `src/modules/translation/key-field-check.ts`；不一致进入 needs_review，阅读视图不返回其文本。详见 PROGRESS.md。

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
- Status: Done (2026-10-02). 198/198 tests green (was 165; +10 unit `tests/unit/notifications/dedupe.test.ts`, +12 integration `tests/integration/review/alert-lifecycle.test.ts`, +11 integration `tests/integration/review/decisions.test.ts`), lint/tsc/build clean. Migration `20261002112314_t07_notification_tasks_review_console` adds `notification_tasks` (kind/status CHECKs, unique dedupe_key), extends `review_tasks` (opened/started/decided stamps, decided_by, decision_reason, self_release, appeal_note), and adds `case_members.is_backup` (coordinator-only CHECK). `holdForReview` now registers one alert per recipient in the hold's transaction; the worker (`src/server/jobs/worker.ts`) runs on an injectable clock with 1/5/15-minute backoff (max 5 attempts), batch merging per (case, recipient), 30-minute/2-hour escalation to backup coordinator → operations lead (`ops_lead` global role), and pre-send re-validation of task status and coordinator permission. Details in PROGRESS.md.
- 状态：已完成（2026-10-02）。198/198 测试通过（原 165；新增 10 单元 `tests/unit/notifications/dedupe.test.ts`、12 集成 `tests/integration/review/alert-lifecycle.test.ts`、11 集成 `tests/integration/review/decisions.test.ts`），lint/tsc/build 无错误。迁移 `20261002112314_t07_notification_tasks_review_console` 新增 `notification_tasks`（kind/status CHECK、唯一 dedupe_key），扩展 `review_tasks`（打开/接手/完成时间戳、decided_by、decision_reason、self_release、appeal_note），并新增 `case_members.is_backup`（仅协调员 CHECK）。`holdForReview` 现在在挂起事务内按接收人登记提醒；worker（`src/server/jobs/worker.ts`）使用可注入时钟，1/5/15 分钟退避（最多 5 次）、按（案件， 接收人）合并批次、30 分钟/2 小时升级至备用协调员→运营负责人（`ops_lead` 全局角色），发送前重新校验任务状态与协调员权限。详见 PROGRESS.md。

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
- Status: Done (2026-10-02). 221/221 tests green (was 198; +6 unit `tests/unit/files/file-type.test.ts`, +17 integration in `tests/integration/files/`: 6 quarantine + 8 scan-failure + 3 download-auth), lint/tsc/build clean. Migration `20261002122818_t08_files_file_variants` adds `files` (SPEC 8.1 status CHECK, orig_hash sha256, quarantine storage_key) and `file_variants` (kind CHECK original/shared_copy, unique (file_id, kind, version)). Storage seam `src/server/providers/storage/` (private MinIO, `minio@8.0.7` pinned) + scanner seam `src/server/providers/scanner/` (stub, refused in production); magic-byte detection (PDF/PNG/JPG/DOCX) with extensions never trusted; 20MB rejected before storage; every clean file waits for coordinator review (review task + alerts in one transaction, T07 link); check_failed gets same-transaction content-free `check_failed_alert` (now also for message check failures) with scan-retry/reject endpoints; approve creates a separately stored shared_copy; download re-authorizes per request (post-revocation 403). Details in PROGRESS.md.
- 状态：已完成（2026-10-02）。221/221 测试通过（原 198；新增 6 单元 `tests/unit/files/file-type.test.ts`、17 集成 `tests/integration/files/`：6 隔离＋8 扫描失败＋3 下载鉴权），lint/tsc/build 无错误。迁移 `20261002122818_t08_files_file_variants` 新增 `files`（SPEC 8.1 状态 CHECK、orig_hash sha256、隔离 storage_key）与 `file_variants`（kind CHECK original/shared_copy、唯一约束 (file_id, kind, version)）。存储接缝 `src/server/providers/storage/`（MinIO 私有，`minio@8.0.7` 固定）＋扫描接缝 `src/server/providers/scanner/`（stub，生产禁用）；magic bytes 检测（PDF/PNG/JPG/DOCX）不信扩展名；>20MB 在存储前拒绝；所有通过扫描的文件等待协调员审核（任务＋提醒一个事务，与 T07 联动）；check_failed 同事务登记不含正文的 `check_failed_alert`（消息检查失败同样登记）并有 scan-retry/reject 端点；批准生成独立存储的 shared_copy；下载每次重新鉴权（撤权后 403）。详见 PROGRESS.md。

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
- Status: Done (2026-10-02). 243/243 tests green (was 221; +2 unit `tests/unit/notifications/dedupe.test.ts`, +20 integration in `tests/integration/urgent/`: 7 dedupe-cooldown + 8 status-visibility + 5 confirm), lint/tsc/build clean. Migrations `20261002125310_t10_peer_urgent` (notification_tasks +sender_user_id FK SET NULL + index) and `20261002130200_t10_urgent_failed_alert_kind` (kind CHECK gains 'urgent_failed_alert'). `POST /api/cases/:id/urgent` creates one peer_urgent task per active-member recipient (10-minute cooldown reuses a live task; per-sequence dedupe key; no channel → visible failed/no_channel); `GET` on the same route shows the sender every state including final failure and in-app confirmation; `GET /api/notifications` is the recipient inbox; `POST /api/notifications/:id/confirm` records confirmed_at + in_app_confirmed (recipient only). The worker sends peer_urgent with a recipient-language neutral template (no "@" anywhere) and, on final failure, registers one content-free urgent_failed_alert per can_review coordinator. Revocation and archive cancel queued tasks in the same transaction; the worker pre-send re-check is the backstop. Details in PROGRESS.md.
- 状态：已完成（2026-10-02）。243/243 测试通过（原 221；新增 2 单元 `tests/unit/notifications/dedupe.test.ts`、20 集成 `tests/integration/urgent/`：7 去重冷却＋8 状态可见＋5 站内确认），lint/tsc/build 无错误。迁移 `20261002125310_t10_peer_urgent`（notification_tasks 增加 sender_user_id 外键 SET NULL＋索引）与 `20261002130200_t10_urgent_failed_alert_kind`（kind CHECK 增加 'urgent_failed_alert'）。`POST /api/cases/:id/urgent` 按本案有效成员接收人各建一条 peer_urgent 任务（10 分钟冷却内复用未终态任务；按序号去重键；无渠道 → 可见的 failed/no_channel）；同路由 `GET` 让发送人看到含最终失败与站内确认的全部状态；`GET /api/notifications` 为接收人收件箱；`POST /api/notifications/:id/confirm` 记录 confirmed_at＋in_app_confirmed（仅接收人本人）。worker 用收件人语言的中性模板发送 peer_urgent（全文无 "@"），最终失败时按本案每位 can_review 协调员登记一条不含正文的 urgent_failed_alert。撤权与归档在同一事务取消 queued 任务，worker 发送前重检兜底。详见 PROGRESS.md。

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
- Status: Done (2026-10-02). 274/274 tests green (was 243; +16 unit `tests/unit/auth/totp.test.ts`, +1 unit `tests/unit/audit/no-sensitive-logging.test.ts`, +6 integration `tests/integration/admin/mfa.test.ts`, +4 integration `tests/integration/lifecycle/` (revoke-live 2 + archive 2), +4 integration `tests/integration/audit/trail.test.ts`), lint/tsc/build clean. Migration `20261002132754_t11_audit_mfa` adds append-only `audit_logs` and `users.mfa_secret_ref`/`mfa_enrolled_at`. The SSE hub force-closes a revoked member's live streams after the revocation transaction commits (`disconnectCaseUser`); revoke-live and archive tests assert per-resource-family denial (403) and read-only 409s. Zero-dependency RFC 6238 TOTP (`src/server/auth/mfa.ts`) with enroll/verify endpoints; `requireAdminMfa` gates all admin APIs (`x-totp-code` per request, 403 `mfa_not_enrolled`/`mfa_invalid`); `GET /api/admin/audit-logs` is MFA-guarded with case/action/actor filters. All 31 `TODO(T11)` markers are real audit rows via `src/server/audit/log.ts` (same-transaction writes where atomicity matters; meta_json forbidden-key guard). The REQ-OPS-01 checklist and the no-sensitive-content trail scan are asserted end-to-end; a console-capture test covers REQ-OPS-02. Details in PROGRESS.md.
- 状态：已完成（2026-10-02）。274/274 测试通过（原 243；新增 16 单元 `tests/unit/auth/totp.test.ts`、1 单元 `tests/unit/audit/no-sensitive-logging.test.ts`、6 集成 `tests/integration/admin/mfa.test.ts`、4 集成 `tests/integration/lifecycle/`（撤权 2＋归档 2）、4 集成 `tests/integration/audit/trail.test.ts`），lint/tsc/build 无错误。迁移 `20261002132754_t11_audit_mfa` 新增 append-only 表 `audit_logs` 与 `users.mfa_secret_ref`/`mfa_enrolled_at`。SSE hub 在撤权事务提交后强制关闭被撤成员存量连接（`disconnectCaseUser`）；撤权/归档测试逐资源族断言拒绝（403）与只读 409。零依赖 RFC 6238 TOTP（`src/server/auth/mfa.ts`）＋登记/验证端点；`requireAdminMfa` 拦截全部管理 API（每请求 `x-totp-code`，403 `mfa_not_enrolled`/`mfa_invalid`）；`GET /api/admin/audit-logs` 受 MFA 守卫并支持 case/action/actor 过滤。31 个 `TODO(T11)` 标记全部经 `src/server/audit/log.ts` 落为真实审计行（须原子处同事务写入；meta_json 禁用键守卫）。REQ-OPS-01 清单与无敏感内容整轨扫描均有端到端断言；REQ-OPS-02 由 console 捕获测试覆盖。详见 PROGRESS.md。

## T12 End-to-end Dual-user + Backup and Restore Drill + Real-channel Acceptance / T12 端到端双用户＋备份恢复演练＋真实链路验收

- Goal: Playwright dual-browser (Chinese/Vietnamese) core journeys; a runbook that guides the bootstrapped administrator to create one fictitious test Case and enter the Coordinator, Chinese Client, and Vietnamese Lawyer emails (REQ-OPS-07); Backup and Restore drill in an isolated environment (verifying the RPO ≤24h / RTO ≤8h targets); AC01/AC08/AC12 **real email** acceptance execution (+86/+84 SMS acceptance moves to P1 with the phone channel, v1.4); AC10 China-Vietnam network experience test; deployment and operations documentation (including Shanghai test-environment IP access and main-site redirect link configuration). Priority P0 (external resource dependencies O02/O05/O07/O08).
- 目标：Playwright 双浏览器（中/越）核心旅程；一份运行指引，引导已引导创建的管理员创建一个虚构测试案件并输入协调员、中国客户、越南律师的邮箱（REQ-OPS-07）；隔离环境备份恢复演练（RPO ≤24h/RTO ≤8h 目标验证）；AC01/AC08/AC12 **真实邮件**验收执行（+86/+84 短信验收随手机渠道移 P1，v1.4）；AC10 中越网络体验测试；部署与运行说明（含上海测试环境 IP 访问与主站跳转链接配置）。优先级 P0（外部资源依赖 O02/O05/O07/O08）。
- SPEC references: all mappings in Section 17; REQ-OPS-04; REQ-OPS-07.
- SPEC 引用：第17节全部映射；REQ-OPS-04；REQ-OPS-07。
- Dependencies: T01–T08, T10, T11 (T09 has moved to P1).
- 依赖：T01–T08、T10、T11（T09 已移 P1）。
- Acceptance criteria: E2E covers the key paths of AC02/AC03/AC05/AC06/AC08/AC09/AC12. AC07 stays in T09 (P1) and is not an MVP pass condition. AC03's required browser pair is Chinese and Vietnamese; English and Traditional Chinese are already covered by T06 mock tests. The runbook is followed once: the administrator creates one fictitious test Case, three activation emails go to the Coordinator, Chinese Client, and Vietnamese Lawyer addresses, each code is not bound to that mailbox, each acceptance joins only that Case, and the administrator is not a chat member. The same-account second Case is covered by T02, not by this one-Case runbook. This paragraph records the v1.10 build. F02 changed the live path: each code is bound to the invited email, and activation does not use a second OTP. The runbook matches F02. Restore-drill report (message/member/file association checks pass); real-email delivery report; network test report (time/network/sample size/P50/P95/failure rate). **Simulated success does not count as real delivery; when external resources are not in place, the related items are marked "Blocked" rather than passed.**
- 验收标准：E2E 覆盖 AC02/AC03/AC05/AC06/AC08/AC09/AC12 关键路径。AC07 留在 T09（P1），不是 MVP 的通过条件。AC03 的必测浏览器组合是中文与越南语；英语与繁体中文已由 T06 的模拟测试覆盖。运行指引实际走一遍：管理员创建一个虚构测试案件，三封激活邮件分别发给协调员、中国客户、越南律师的邮箱，每个邀请码都不绑定该邮箱，每次接受只加入该案件，管理员不是聊天成员。同一账号的第二个案件由 T02 覆盖，不由这份单案件运行指引覆盖。本段记录的是 v1.10 的构建。F02 已改现场路径：每个激活码绑定受邀邮箱，激活不再使用第二个验证码。运行指引与 F02 一致。恢复演练报告（消息/成员/文件关联核查通过）；真实邮件送达报告；网络测试报告（时间/网络/样本数/P50/P95/失败率）。**模拟成功不视为真实送达；外部资源未到位时相关项标记「阻塞」而非通过。**
- Expected new/modified: `tests/e2e/**`, `src/app/(app)/admin/test-case/**`, `scripts/backup.sh`, `scripts/restore-drill.sh`, `docs/runbook/mvp-test-case.md`, `docs/deployment.md`.
- 预计新增/修改：`tests/e2e/**`、`src/app/(app)/admin/test-case/**`、`scripts/backup.sh`、`scripts/restore-drill.sh`、`docs/runbook/mvp-test-case.md`、`docs/deployment.md`。
- Tests to add/update: `tests/e2e/dual-user.spec.ts`, `tests/e2e/review-alert.spec.ts`, `tests/e2e/admin-test-case.spec.ts`.
- 同步测试：`tests/e2e/dual-user.spec.ts`、`tests/e2e/review-alert.spec.ts`、`tests/e2e/admin-test-case.spec.ts`。
- Test commands: `npm run test:e2e`, `npm run drill:restore`.
- 测试命令：`npm run test:e2e`、`npm run drill:restore`。
- Status: P0, coding side done (2026-10-02); real-channel acceptance items Blocked on external resources. 280/280 tests green (was 274; +6 integration `tests/integration/admin/test-cases.test.ts`), E2E 4/4 green (3 new specs + smoke), lint/tsc/build clean, `npm run drill:restore` executed with PASS. `POST /api/admin/test-cases` (REQ-OPS-07) live behind `requireAdminMfa`; Playwright dual-browser journeys cover AC03/AC05/AC12 key paths on the mock chain; `docs/runbook/mvp-test-case.md` + `docs/deployment.md` written; worker is driven in-process via `src/instrumentation.ts` (`NOTIFICATION_WORKER=off` for external drivers). Blocked (external resources, not passable by simulation): real email delivery acceptance (AC01/AC08/AC12 real-channel parts — needs the operator SMTP mailbox wired to a real EmailProvider and real recipient addresses, O05/O07), AC10 China-Vietnam real-network test (needs the O07 test window/devices), production-scale recovery drill (needs O08 environment resources; local drill at trivial data volume done and passing). Details in PROGRESS.md.
- 状态：P0，编码侧已完成（2026-10-02）；真实渠道验收项因外部资源阻塞。280/280 测试通过（原 274；新增 6 个集成测试 `tests/integration/admin/test-cases.test.ts`），E2E 4/4 通过（3 个新 spec＋冒烟），lint/tsc/build 无错误，`npm run drill:restore` 实际执行为 PASS。`POST /api/admin/test-cases`（REQ-OPS-07）在 `requireAdminMfa` 后上线；Playwright 双浏览器旅程在模拟链路上覆盖 AC03/AC05/AC12 关键路径；`docs/runbook/mvp-test-case.md` 与 `docs/deployment.md` 已写；worker 经 `src/instrumentation.ts` 进程内驱动（外部驱动时设 `NOTIFICATION_WORKER=off`）。阻塞项（外部资源，不以模拟冒充）：真实邮件送达验收（AC01/AC08/AC12 真实渠道部分——需要运营方 SMTP 接入真实 EmailProvider 并用真实收件地址验证，O05/O07）、AC10 中越真机网络测试（需 O07 测试窗口/设备）、生产规模恢复演练（需 O08 环境资源；本地小数据量演练已完成且通过）。详见 PROGRESS.md。

## T13 Daily Case Digest Email to the Coordinator (MVP as of 2026-10-04) / T13 发给协调员的案件日报（2026-10-04 起属于 MVP）

- Goal: every day at 00:00 (Asia/Ho_Chi_Minh), aggregate per active case the published messages and published attachments of the previous Vietnamese calendar day, and email that digest only to the Case Coordinator. The Coordinator forwards it to other people. Lawyers and Clients are not recipients in this MVP. Subject "CaseName-SendDate-Record" (e.g., DG-Juyang-2026OCT8-Record). Priority P0. Not implemented yet. The 2026-10-04 decision replaces the v1.5 recipient list (lawyers plus coordinators).
- 目标：每日 00:00（Asia/Ho_Chi_Minh）按活跃案件汇总上一越南日历日的已发布消息与已发布附件，只把这份日报寄给案件协调员。协调员再转给其他人。本 MVP 不发给律师和客户。标题「案件名称-发送日-Record」（如 DG-Juyang-2026OCT8-Record）。优先级 P0。尚未实现。2026-10-04 的决定取代 v1.5 的收件人（律师加协调员）。
- SPEC references: REQ-DIG-01~06; REQ-CASE-01.
- SPEC 引用：REQ-DIG-01~06；REQ-CASE-01。
- Dependencies: T07 (notification core), T08 (attachment publish), T12 (real email channel, already wired as F06).
- 依赖：T07（通知核心）、T08（附件发布）、T12（真实邮件通道，F06 已接通）。
- Acceptance criteria: fires on time under a simulated clock; includes only published content (Pending Review/returned/rejected not included); the only recipients are the case's active Coordinators, one message each; Lawyers and Clients receive nothing; no per-lawyer opt-out in this slice; no send when there is no new published content that day; archived cases do not send; correct subject format (2026OCT8-style dates); oversized attachments are split by sequence number; failure retry and final failure are visible; digest_runs records are complete.
- 验收标准：模拟时钟下按时触发；仅含已发布内容（待审/退回/拒绝不纳入）；收件人只有本案有效协调员，每人一封；律师和客户不收到；本切片不做按律师关闭；当日没有新发布内容则不发送；归档案件不发送；标题格式正确（2026OCT8 式日期）；附件超限按序号拆分；失败重试与最终失败可见；digest_runs 记录完整。
- Expected new/modified: `src/modules/digest/**`, a scheduled pass beside the existing notification worker, `prisma/migrations/*` (`digest_runs`, notification kind `case_digest`). `cases.title` and `case_members.digest_opt_out` already exist from T03. T13 does not build an opt-out screen. `digest_opt_out` stays unused until a later version sends the digest to Lawyers.
- 预计新增/修改：`src/modules/digest/**`、挂在现有通知 worker 旁的定时趟次、`prisma/migrations/*`（`digest_runs`、通知种类 `case_digest`）。`cases.title` 与 `case_members.digest_opt_out` 已在 T03 存在。T13 不做关闭开关界面。在后续版本把日报发给律师之前，`digest_opt_out` 保持不用。
- Tests to add/update: `tests/unit/digest/subject-format.test.ts`, `tests/integration/digest/daily-run.test.ts` (coordinator receives it; lawyer and client do not; empty day skips; archived case skips).
- 同步测试：`tests/unit/digest/subject-format.test.ts`、`tests/integration/digest/daily-run.test.ts`（协调员收到；律师和客户收不到；当日无内容跳过；归档案件跳过）。
- Test commands: `npm run test -- digest`.
- 测试命令：`npm run test -- digest`。
- Status: P0, done (2026-10-04). Implemented as specced: `src/modules/digest/{subject,service}.ts`, migration `20261004022028_t13_digest_runs` (digest_runs + `case_digest` kind), the in-process worker generates the just-ended Vietnam day's digest every pass (`digest: true`, idempotent on unique (case_id, digest_date)), and sends one email per (coordinator, part) with the published shared-copy files attached. 329/329 tests (was 306; +15 unit, +8 integration), tsc/lint/build clean. Recorded deviations: `digest_runs` carries `body_text`/`parts_json` beyond the SPEC §13 field list (body frozen at generation), run status adds `queued`, and `error` doubles as the skip reason.
- 状态：P0，已完成（2026-10-04）。按规格实现：`src/modules/digest/{subject,service}.ts`、迁移 `20261004022028_t13_digest_runs`（digest_runs 表＋`case_digest` 类型）、进程内 worker 每趟为刚结束的越南日生成日报（`digest: true`，以 (case_id, digest_date) 唯一约束幂等），并按（协调员 × 分卷）各发一封、随附已发布共享副本文件。329/329 测试通过（原 306；新增 15 单测＋8 集成），tsc/lint/build 无错误。已记录的偏离：`digest_runs` 在 SPEC §13 字段之外多了 `body_text`/`parts_json`（生成时冻结正文），运行状态增加 `queued`，`error` 兼作跳过原因。

## T14 Administration Console: Case Creation and Participant Setup (P1, Added in v0.10) / T14 管理控制台：案件创建与参与人设置（P1，v0.10 新增）

- Goal: the System Operations Administrator has a web page to create a Case and to set each Case's Chinese Clients, Vietnamese Lawyers, and Coordinators (user request 2026-10-03). Participant setup reuses the standard invitation flow (one activation email per entered address; the code binds that email, the Case, and the role). The administrator is never a member and never sees Case content. Priority: the next version after this MVP. Confirmed again 2026-10-04: do not build this page for the current launch. An operator creates the one real case and the test case, and records each invite in `LOCAL_DEV_NOTES.md`.
- 目标：系统运维管理员有一个网页，可以创建案件并设置每个案件的中国客户、越南律师与协调员（用户 2026-10-03 提出）。参与人设置复用标准邀请流程（每个被输入地址一封激活邮件；激活码绑定该邮箱、案件与角色）。管理员绝不成为成员、绝不查看案件正文。优先级：本 MVP 之后的下一版本。2026-10-04 再次确认：这次上线不建这个页面。操作者建立那一个真实案件和测试案件，并把每条邀请记入 `LOCAL_DEV_NOTES.md`。
- SPEC references: REQ-ADM-01~05; REQ-CASE-01; REQ-AUTH-01/12; REQ-PM-06/10; REQ-OPS-01.
- SPEC 引用：REQ-ADM-01~05；REQ-CASE-01；REQ-AUTH-01/12；REQ-PM-06/10；REQ-OPS-01。
- Dependencies: T03 (cases/members/invites), T11 (admin MFA + audit). Real delivery of the activation emails depends on the real EmailProvider (F06/O05); development uses the fake provider.
- 依赖：T03（案件/成员/邀请）、T11（管理员 MFA＋审计）。激活邮件的真实送达依赖真实 EmailProvider（F06/O05）；开发期用模拟 provider。
- Acceptance criteria: every console route requires `requireAdminMfa` (no MFA → 403); the case list shows metadata and member roster only (no message/file content); creating a Case with title/client organization and one or more Chinese Clients, Vietnamese Lawyers, Coordinators sends exactly one activation email per entered address and adds the administrator as no member; adding a participant to an existing Case and revoking a member follow the coordinator invite/revoke semantics (REQ-PM-08 immediate effect); an invite whose email belongs to an account with a different global role is rejected at creation time (REQ-ADM-05); every operation writes an audit row.
- 验收标准：控制台全部路由经 `requireAdminMfa`（未登记 MFA → 403）；案件列表仅展示元数据与成员名册（无消息/文件正文）；以案件名称/客户组织及一名或多名中国客户、越南律师、协调员创建案件时，恰向每个被输入地址发一封激活邮件，且管理员不成为成员；向既有案件追加参与人与撤销成员遵循协调员邀请/撤销语义（REQ-PM-08 即时生效）；目标邮箱已有账号且全局角色不符的邀请在创建时即拒绝（REQ-ADM-05）；每个操作写入审计行。
- Expected new/modified: `src/app/(app)/admin/cases/**` (list + create form + per-case participant management), `src/app/api/admin/cases/route.ts`, `src/app/api/admin/cases/[id]/{invites,members}/**`, `src/modules/admin/cases.ts`. Reuse `issueInvite` (src/modules/invites/service.ts) and the member services. No new tables.
- 预计新增/修改：`src/app/(app)/admin/cases/**`（列表＋创建表单＋单案参与人管理）、`src/app/api/admin/cases/route.ts`、`src/app/api/admin/cases/[id]/{invites,members}/**`、`src/modules/admin/cases.ts`。复用 `issueInvite`（src/modules/invites/service.ts）与成员服务。不新增数据表。
- Tests to add/update: `tests/integration/admin/console-cases.test.ts` (MFA gating, metadata-only roster, one email per address, admin never a member, add/revoke semantics, role-mismatch rejection at creation, audit rows).
- 同步测试：`tests/integration/admin/console-cases.test.ts`（MFA 拦截、名册仅元数据、每地址一封、管理员非成员、追加/撤销语义、创建期角色不符拒绝、审计行）。
- Test commands: `npm run test -- admin`.
- 测试命令：`npm run test -- admin`。
- Status: next version after MVP. Not started. Do not build it in the current launch (user, 2026-10-04).
- 状态：MVP 之后的下一版本。未开始。这次上线不要做（用户，2026-10-04）。

## Dependency Graph and Execution Order / 依赖图与执行顺序

Dependency graph:
依赖图：

```
T01 → T02 → T03 → T04 → T05 → T07 → T08 ─────────┐
                    │      ↘ T06                 ├→ T12 → T13 (MVP, coordinator only)
                    └──────────→ T10 ← T07       │
                    └──────────→ T11 ← T04、T07、T08 ─┘
（T09 为 P1，依赖 T06 与 T08，不在 MVP 关键路径上）
```

- Parallelizable: T05 and T06; T10 and T11. Suggested order: T01→T02→T03→T04→(T05∥T06)→T07→T08→(T10∥T11)→T12.
- 可并行：T05 与 T06；T10 与 T11。建议顺序：T01→T02→T03→T04→(T05∥T06)→T07→T08→(T10∥T11)→T12。

## Completion Evidence Requirements (Per Task) / 完成证据要求（每任务）

Test output, migration records, and the list of changed files are written into PROGRESS.md; failures/not-run/blocked items are recorded truthfully, and a pass is never achieved by weakening tests.

测试输出、迁移记录、变更文件清单写入 PROGRESS.md；失败/未运行/阻塞如实记录，不以削弱测试换取通过。

## Pilot Follow-ups after the 2026-10-03 Shanghai Test / 2026-10-03 上海试点之后的跟进

The three roles are in the fictitious case and can see the client's three identical messages. The lawyer's phone had dropped its session and was sent to Sign in; a new login now opens `/cases`. The items below are the remaining work, ordered by what blocks this pilot. On 2026-10-04 the user moved T13 into the MVP (coordinator only) and left T14 for the next version. T09 stays P1. 2026-10-04/05: the one real case is provisioned on the Shanghai test host and all four invitations are delivered; the coordinator and the lawyer have signed in and exchanged messages, and v1.12 (invitation codes do not expire) is deployed.

三方已在虚构案件中，并能看到客户发出的三句相同消息。律师手机丢失了登录状态并被送到登录页；现在重新登录会打开 `/cases`。下面按是否挡住这次试点排序。2026-10-04 用户把 T13 纳入 MVP（只发给协调员），T14 留到下一版本。T09 仍是 P1。2026-10-04/05：那一个真实案件已在上海测试机开通，四封邀请全部送达；协调员与律师已登录并互发消息，v1.12（邀请码长期有效）已部署。

| Order | ID | Task | Compared with the three requested changes | Status |
| --- | --- | --- | --- | --- |
| 1 | F01 | Case-page attachment control. T08 already uploads, scans, holds for review, and downloads through the API. The case page has no button, so the pilot cannot exchange files. | This is requested change 3. It blocks the live case. Do it before the registration and landing leftovers. | Done |
| 2 | F02 | One-step activation (v1.11, decided 2026-10-03). The invited person enters their own email and the activation code. The code is bound to that email, one case, and one role. Only that email can accept it. Email plus code is the check; there is no second 6-digit code during activation. Any browser can join while the code is unused (codes do not expire, v1.12). The same email accepts a later code for another case on the same account. A different role is rejected. Implemented in the repository and covered by the invite integration tests. A later visit uses the same email and invitation code (F12). The administrator still uses the email OTP. | This is requested change 2. | Done |
| 3 | F03 | Finish where a successful login lands. Login already goes to `/cases` (deployed 2026-10-03). Done 2026-10-03 (later session): `/` redirects by session state (signed in → `/cases`, otherwise → `/login`) instead of serving the Next.js starter page; a successful invitation acceptance now opens the joined case page directly (the activate/accept responses carry `caseId`). The session cookie `maxAge` was added earlier and needed no further change. | This is requested change 1. All parts are now in the repository. | Done |
| 4 | F04 | One click sends one message. The client clicked three times and created three identical messages, because the button did not show that a send was in progress. Disable the button while the request runs, and show the new message without requiring another click. | Not one of the three requests. Seen on 2026-10-03. Done with F01: the button disables and shows a sending state while the request is in flight (plus a re-entry guard), and the list refetches from the POST response. E2E asserts rapid repeated clicks produce exactly one message. | Done |
| 5 | F05 | Commit the test-host fixes that are deployed and not yet in git: HTTP send no longer calls `crypto.randomUUID()`, login opens `/cases`, fictitious-test-host provider flag, and the deployment notes. | Bookkeeping. Verified 2026-10-03: all four fixes are in commit 3182639 and the working tree was clean, so this item was already done by the F02 session. | Done |
| 6 | F06 | Deliver the activation email to real mailboxes (O05). Done 2026-10-03: `SmtpEmailProvider` (`src/server/providers/email/smtp.ts`, nodemailer over SMTP 587/STARTTLS against the operator's QQ mailbox) is selected by `EMAIL_PROVIDER=smtp`; missing `SMTP_*`/`EMAIL_FROM` config fails loudly at construction. 10 unit tests against a mocked transport; a real smoke send through the app code path was accepted by smtp.qq.com. The Shanghai test host now runs `EMAIL_PROVIDER=smtp` with the `SMTP_*`/`EMAIL_FROM` set written into its .env. Known-open: R7 (invite send failure surfaces only as a generic failure; per CURSOR_REVIEW Section 11 it is recorded, fix deferred by user decision). Deliverability to Vietnamese mailboxes is still verified in AC01/AC08/AC12 (O07). | The one-step flow needs the code to arrive; real delivery is now wired. | Done |
| 7 | F07 | Automatic Kimi translation of the pilot pair (REQ-TR-02/03). Vietnamese written by the lawyer is shown to the client as Traditional Chinese. Traditional Chinese written by the client is shown to the lawyer as Vietnamese. Same-language text is not sent to Kimi. `zh-Hans` ↔ `zh-Hant` stays the local character map. | Requested and done 2026-10-03. The O05 data-processing check was approved by the user on 2026-10-03 for translation. The adapter reads `KIMI_BASE_URL`/`KIMI_MODEL` (no hardcoded model), 90s `AbortSignal.timeout`, typed failures (timeout/rate_limited/server/format), 5xx mapped to a retryable category; automatic-mode backfill is parallel with per-message isolation. Real smoke passed both directions (kimi-k2.6); the Shanghai test host runs `TRANSLATION_PROVIDER=kimi` and the on-host service path wrote a provider=`kimi` done version. | Done |
| 8 | F08 | T12 leftovers: AC10 China–Vietnam network test, production-scale restore drill (O07/O08). | After the pilot UI. Blocked on external resources. | Blocked |
| 9 | F09 | P0 review gaps already found: display names are not checked for contact channels (REQ-MOD-02); no account-recovery API (REQ-AUTH-10); no API for a later administrator; session tokens are stored in plaintext. The 2026-10-03 code review expanded this list — CURSOR_REVIEW.md Section 10 items R1–R9 must be fixed before real data, R10–R22 right after. | After F01–F05. Expanded by the 2026-10-03 code review. | Later |
| 10 | F10 | Re-run the three failing end-to-end journeys from the 2026-10-03 review, after F01 and F04. | Quality. Done 2026-10-03: all specs pass in three consecutive full runs (7/7 each). The dual-user visibility timeout did not recur; the leading suspect (cold dev-server compiles consuming the expect window) is addressed by compiling the journey routes in global setup, and `trace: retain-on-failure` now captures evidence on any recurrence. No sleeps added, no assertion weakened. | Done |
| 11 | T09 | DOCX bilingual conversion. | Stays P1. | P1 |
| 12 | F11 | Publish ordinary messages and clean files immediately. Hold only a message or file name that explicitly asks about or negotiates the firm's litigation retainer fee. Contact details in a message or file name publish. A display name that contains a contact channel is still rejected on save. Scan failure stays unpublished. | Requested 2026-10-03 after the Shanghai pilot: not every attachment or message waits for review. | Done |
| 13 | F12 | Case entry is the invited email plus the invitation code that was sent. The first use joins the case. The same pair signs in to that case again from any browser. Case entry does not ask for a 6-digit code. The administrator still uses the email OTP. | Requested 2026-10-03: the client was stopped on the 6-digit code page. | Done |
| 14 | F13 | Show a timestamp on every conversation record and every upload record the viewer can see (REQ-MSG-11, REQ-FILE-04). Format it with the timezone set on that computer, and print the offset beside the time. A UTC+8 computer shows UTC+8. A UTC+7 computer shows UTC+7 for the same instant. The role does not choose the offset. The message list and the file list both print that labeled time. | Requested 2026-10-03. The timezone rule was set the same evening: the lawyer's computer is UTC+7, the client's computer is UTC+8, and each computer's own setting is what gets labeled. The screen now does this. | Done |
| 15 | F14 | A Chinese client's default screen is Traditional Chinese. A Vietnamese lawyer's default screen is Vietnamese. A coordinator's default screen is Simplified Chinese. Labels, buttons, placeholders, status text, and automatic-mode messages from other people use that one language. The two languages are not written on the same control. Real Vietnamese wording of Chinese messages stays F07. | Restated 2026-10-03 from the lawyer's phone. The screen now uses one language per control. | Done |
| 16 | F15 | Administration Console: the administrator has a page to create a Case and to set each Case's Chinese Clients, Vietnamese Lawyers, and Coordinators. Written into SPEC (REQ-ADM-01~05) as task T14. | Requested 2026-10-03. Confirmed 2026-10-04: the next version after this MVP. The current launch creates cases by hand and records them in `LOCAL_DEV_NOTES.md`. | Next version |
| 17 | F16 | Daily email to the Coordinator only (T13). 00:00 Asia/Ho_Chi_Minh, previous Vietnamese calendar day, published messages and published attachments, subject `{Case name}-{send date}-Record`. Lawyers and Clients are not recipients. | Moved into the MVP on 2026-10-04. Done the same day: generation is idempotent on (case, day), one email per coordinator per ≤20MB part, empty days and archived cases record a skipped run. | Done |

| 顺序 | ID | 任务 | 与提出的三处修改比较 | 状态 |
| --- | --- | --- | --- | --- |
| 1 | F01 | 案件页增加附件控件。T08 已能通过接口上传、扫描、送审和下载。案件页没有按钮，试点无法交换文件。 | 这是第 3 项修改。它挡住正在进行的案件，排在注册和登录去向的剩余项之前。 | 已完成 |
| 2 | F02 | 一步激活（v1.11，2026-10-03 决定）。受邀人输入本人邮箱和激活码。激活码绑定该邮箱、一个案件和一个角色。只有该邮箱能接受。邮箱加激活码就是校验，激活过程不再另要 6 位验证码。激活码未使用时，换一个浏览器也可以进入该案件（邀请码长期有效，v1.12）。同一邮箱以后接受另一个案件的激活码时，加入同一账号。角色不符则拒绝。已在仓库实现，并由邀请集成测试覆盖。之后再次进入仍用同一邮箱和邀请码（F12）。管理员仍用邮箱验证码。 | 这是已确认的第 2 项修改。 | 已完成 |
| 3 | F03 | 补完登录成功后的去向。登录已经会打开 `/cases`（2026-10-03 已部署）。2026-10-03（后续会话）完成剩余项：`/` 按会话状态跳转（已登录 → `/cases`，未登录 → `/login`），不再显示 Next.js 起始页；接受邀请成功后直接打开所加入案件的页面（activate/accept 响应已带 `caseId`）。会话 Cookie 的 `maxAge` 此前已加，无需再改。 | 这是第 1 项修改。各部分现都已进入仓库。 | 已完成 |
| 4 | F04 | 一次点击只发出一条消息。客户连点三次，产生三句相同消息，因为按钮没有表示正在发送。请求进行时禁用按钮，并在不必再点一次的情况下显示新消息。 | 不是那三项修改。2026-10-03 观察到。已与 F01 一起完成：请求在途时按钮禁用并显示发送中状态（另有重入守卫），POST 响应后立即重拉列表。E2E 断言快速连点只产生一条消息。 | 已完成 |
| 5 | F05 | 提交已经部署、尚未进 Git 的测试机修复：HTTP 页面发送不再调用 `crypto.randomUUID()`、登录打开 `/cases`、虚构测试机的提供者开关，以及部署说明。 | 记账项。2026-10-03 核实：四项修复都在 commit 3182639 中且工作区干净，该项已由 F02 会话完成。 | 已完成 |
| 6 | F06 | 把激活邮件送到真实邮箱（O05）。2026-10-03 完成：`SmtpEmailProvider`（`src/server/providers/email/smtp.ts`，nodemailer 经 SMTP 587/STARTTLS 连运营方 QQ 邮箱）由 `EMAIL_PROVIDER=smtp` 选用；`SMTP_*`/`EMAIL_FROM` 缺失时在构造时明确报错。10 个单测对模拟 transport 通过；经应用代码路径的真实冒烟发送已被 smtp.qq.com 接受。上海测试机已设 `EMAIL_PROVIDER=smtp` 并写入 `SMTP_*`/`EMAIL_FROM`。已知未决：R7（邀请邮件发送失败只表现为泛化失败；按 CURSOR_REVIEW 第 11 节记录在案，用户决定暂缓修复）。对越南邮箱的送达仍在 AC01/AC08/AC12 验证（O07）。 | 一步激活需要激活码送达；真实送达现已接通。 | 已完成 |
| 7 | F07 | 自动模式用 Kimi 翻译这一对方向（REQ-TR-02/03）。律师写的越南语，客户看到繁体中文。客户写的繁体中文，律师看到越南语。同语种不发给 Kimi。`zh-Hans` ↔ `zh-Hant` 仍用本地逐字对照。 | 2026-10-03 提出并完成。翻译方向的 O05 数据处理核查已由用户于 2026-10-03 批准。适配器改读 `KIMI_BASE_URL`/`KIMI_MODEL`（不再硬编码模型），90 秒 `AbortSignal.timeout`，类型化故障（timeout/rate_limited/server/format），5xx 归入可重试类别；自动模式补建并行且各消息互不影响。真实冒烟双向通过（kimi-k2.6）；上海测试机已设 `TRANSLATION_PROVIDER=kimi`，并经验证经服务路径落了一条 provider=`kimi` 的 done 版本。 | 已完成 |
| 8 | F08 | T12 剩余项：AC10 中越网络测试、生产规模恢复演练（O07/O08）。 | 排在试点界面之后。外部资源阻塞。 | 阻塞 |
| 9 | F09 | 已发现的 P0 复核缺口：显示名未按联系渠道检查（REQ-MOD-02）；没有账号找回接口（REQ-AUTH-10）；没有后续管理员接口；会话令牌明文存放。2026-10-03 代码复核扩充了这份清单——CURSOR_REVIEW.md 第 10 节 R1–R9 须在接入真实数据前修复，R10–R22 紧随其后。 | 排在 F01–F05 之后。已由 2026-10-03 代码复核扩充。 | 稍后 |
| 10 | F10 | F01 与 F04 之后，重跑 2026-10-03 复核里失败的三段端到端旅程。 | 质量项。2026-10-03 完成：连续三轮完整运行全部通过（每轮 7/7）。双用户可见性超时未再出现；首要嫌疑（dev server 冷编译占满 expect 窗口）已通过在 global setup 预编译旅程路由解决，并加入 `trace: retain-on-failure` 以便复发时留证。未加 sleep，未削弱断言。 | 已完成 |
| 11 | T09 | DOCX 双语转换。 | 仍是 P1。 | P1 |
| 12 | F11 | 普通消息和扫描通过的文件立即发布。只有消息或文件名显式询问或协商律所诉讼委托费用时才待审。消息或文件名里的联系方式直接发布。显示名含联系渠道时仍拒绝保存。扫描失败不发布。 | 2026-10-03 上海试点之后提出：不是每条消息和每个附件都要等审核。 | 已完成 |
| 13 | F12 | 进入案件使用受邀邮箱加上已经发出的邀请码。第一次使用即加入该案件。之后同一组邮箱和邀请码可以从任意浏览器再次进入该案件。案件入口不再要 6 位验证码。管理员仍用邮箱验证码。 | 2026-10-03 提出：客户停在 6 位验证码页面。 | 已完成 |
| 14 | F13 | 观看者能看到的每条对话记录和每条上传记录都显示时间戳（REQ-MSG-11、REQ-FILE-04）。按那台电脑的时区设置换算，并在时间旁边标出时区。设为 UTC+8 的电脑标 UTC+8。同一时刻在设为 UTC+7 的电脑上标 UTC+7。时区不按角色写死。消息列表和文件列表都标出这个时间。 | 2026-10-03 提出。当晚补上时区规则：律师的电脑是 UTC+7，客户的电脑是 UTC+8，各自电脑的设置就是要标出的时区。界面已按此显示。 | 已完成 |
| 15 | F14 | 中国客户默认看到繁体中文。越南律师默认看到越南语。协调员默认看到简体中文。按钮、提示、状态文字，以及自动模式下别人发来的消息，都用这一种语言。同一控件上不并列两种语言。中文消息的真实越南语译文仍是 F07。 | 2026-10-03 从律师手机再次确认。界面已改成同一控件只用一种语言。 | 已完成 |
| 16 | F15 | 管理控制台：管理员有一个页面，可以添加案件，并设置每个案件的中国客户、越南律师与协调员。已写入 SPEC（REQ-ADM-01~05），即任务 T14。 | 2026-10-03 提出。2026-10-04 确认：留在本 MVP 之后的下一版本。这次上线由操作者建案，并记入 `LOCAL_DEV_NOTES.md`。 | 下一版本 |
| 17 | F16 | 只发给协调员的每日邮件（T13）。Asia/Ho_Chi_Minh 00:00，上一越南日历日，已发布消息与已发布附件，标题 `{案件名称}-{发送日}-Record`。律师和客户不是收件人。 | 2026-10-04 纳入 MVP。当天完成：以（案件, 日）幂等生成，每名协调员每 ≤20MB 分卷一封邮件，无内容日与归档案件记为跳过的运行。 | 已完成 |

## Launch scope decided 2026-10-04 / 2026-10-04 确定的上线范围

This launch has one real Case and one test Case. The user deferred a domain, HTTPS, and a real file scanner for this launch. The current Shanghai host stays the entry: HTTP, `SESSION_COOKIE_SECURE=false`, stub file scanner under `CLC_FICTITIOUS_TEST_HOST=1`. Do not treat those three as work for the next coding task.

这次上线是一个真实案件加一个测试案件。用户把域名、HTTPS 和正式文件扫描推迟到这次上线之后。上海主机仍是入口：HTTP、`SESSION_COOKIE_SECURE=false`、在 `CLC_FICTITIOUS_TEST_HOST=1` 下使用替身文件扫描。下一件编码工作不要改这三件。

Case creation has no product screen in this MVP. The operator creates the cases. Each invite is one row in `LOCAL_DEV_NOTES.md` (git-ignored). Do not copy the row into PLAN, SPEC, PROGRESS, SESSIONS, or any other committed file. The columns are:

本 MVP 没有建案页面。操作者建案。每条邀请在 `LOCAL_DEV_NOTES.md`（不入库）里占一行。不要把该行抄进 PLAN、SPEC、PROGRESS、SESSIONS 或其他会提交的文件。列是：

| Column | What to write |
| --- | --- |
| case | Case id and title |
| email | Address the invitation was sent to |
| role | client, lawyer, or coordinator |
| invite_code | The code in that email |
| sent_at | When the invitation email was sent |
| first_login_at | When that email and code first signed in. Leave blank until the audit row `auth.login` with `via: invite` exists for that membership. Then fill this cell. |

| 列 | 写什么 |
| --- | --- |
| case | 案件 id 与标题 |
| email | 邀请发往的邮箱 |
| role | client、lawyer 或 coordinator |
| invite_code | 那封邮件里的邀请码 |
| sent_at | 邀请邮件发出的时间 |
| first_login_at | 该邮箱与邀请码第一次登录的时间。在该成员出现 `auth.login` 且 `via: invite` 的审计行之前留空。出现后填上。 |
