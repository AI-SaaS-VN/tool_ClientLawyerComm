# 部署与运行说明 / Deployment and Operations Guide

适用范围:MVP 试点环境。本文不含任何真实密钥、真实邮箱或拓扑细节;那些只存在于目标主机上的 `.env`(git 忽略)中。

Scope: the MVP pilot environment. This document contains no real secrets, mailboxes, or topology details — those live only in the git-ignored `.env` on the target host.

## 1. 服务组成 / Service composition

| 组件 Component | 说明 Notes |
| --- | --- |
| Next.js 16 App(Node runtime) | `npm run build` 后 `npm run start`;开发用 `npm run dev`。唯一对外 HTTP 入口。 |
| PostgreSQL 16 | 应用库;本地开发由 `docker compose up -d` 提供(`clc-postgres`)。 |
| MinIO(S3 兼容) | 私有 bucket 存文件原件/共享副本;无预签名 URL,下载一律经服务端授权代理。 |
| 通知 worker | **由 Web 进程内驱动**:`src/instrumentation.ts` 在服务启动时以 10 秒间隔跑持久队列的幂等趟次(at-least-once,崩溃重放不丢)。设 `NOTIFICATION_WORKER=off` 可关闭(仅当改用外部驱动时;E2E 即如此,改由 `POST /api/test/worker` 显式触发)。2026-10-19 起，这个 worker 不再生成案件日报邮件（REQ-DIG）。审核提醒、紧急提醒和翻译仍由它发送。 |

Notification worker: driven **in-process** — `src/instrumentation.ts` starts `startNotificationWorker()` at server boot (idempotent 10s passes over the persistent queue; at-least-once, crash replay loses nothing). Set `NOTIFICATION_WORKER=off` only when an external driver is used (E2E does this and triggers passes explicitly via `POST /api/test/worker`). From 2026-10-19 this worker no longer generates the Daily Case Digest email (REQ-DIG). Review alerts, urgent notices, and translation still go through it.

## 2. 环境变量 / Environment variables

完整清单与占位见 `.env.example`(只含占位,不含真实值)。关键点:

See `.env.example` for the full list (placeholders only, never real values). Key points:

- `DATABASE_URL` — 应用库连接串。
- `MINIO_*` / `STORAGE_PROVIDER=minio` — 私有对象存储。
- `APP_DATA_KEY` — 32 字节 hex 的 AES-256-GCM 密钥,加密联系方式与 MFA secret;`openssl rand -hex 32` 生成;**轮换即失效**,丢失则已加密数据不可读。
- `EMAIL_PROVIDER` / `TRANSLATION_PROVIDER` / `LLM_PROVIDER` / `FILE_SCANNER` — 真实实现已落地两个:`EMAIL_PROVIDER=smtp`(F06,2026-10-03;`SmtpEmailProvider` 经 `SMTP_HOST`/`SMTP_PORT`/`SMTP_SECURE`/`SMTP_USER`/`SMTP_AUTH_CODE`/`EMAIL_FROM` 走运营方邮箱,587/STARTTLS 或 465 隐式 TLS)与 `TRANSLATION_PROVIDER=kimi`(F07;读 `KIMI_BASE_URL`/`KIMI_MODEL`,2026-10-03 经用户批准 O05)。T15(2026-10-16)起同一 provider 接缝还承担附件图片读字:JPG/PNG 经 Kimi 视觉模型转写,模型取 `KIMI_VISION_MODEL`,缺省回落 `KIMI_MODEL`;与消息翻译共用进程内 worker 的定速预算(账号上限 3 RPM)。`LLM_PROVIDER`(审核语义判断)与 `FILE_SCANNER` 仍只有替身,**生产环境会拒绝替身**;指定的虚构数据测试机是替身的唯一例外:设 `CLC_FICTITIOUS_TEST_HOST=1`(见下)。该开关不得用于存放真实案情的主机。
- `SESSION_COOKIE_SECURE` — 默认 `true`。**仅**在备案前的 HTTP-IP 测试入口(虚构数据)可设 `false`;接入任何真实数据前必须恢复 `true`(REQ-AUTH-06)。
- `APP_BASE_URL` — 提醒邮件中的登录链接前缀(不含路径)。
- `NOTIFICATION_WORKER` — 默认 `on`,见上表。

## 3. 迁移 / Migrations

```bash
npx prisma migrate deploy
# schema 有变更时还要重建 Prisma Client(migrate deploy 不做这件事),否则 build 类型检查会失败:
# When the schema changed, also regenerate the Prisma Client (migrate deploy does not), or the build's type check fails:
npx prisma generate
```

对新环境先建库再执行;不要对含数据的环境使用 `migrate reset`。CI/集成测试的 `clc_test` 与 E2E 的 `clc_e2e` 由各自 globalSetup 自动建库并重放迁移。

Create the database first, then run the deploy command. Never `migrate reset` an environment that holds data. The CI `clc_test` and E2E `clc_e2e` databases are created and migrated automatically by their global setups.

## 4. 备份与恢复 / Backup and restore (REQ-OPS-04)

- 备份 / Backup:`BACKUP_ENCRYPTION_KEY=<经环境传入,不落盘> bash scripts/backup.sh [库名]` — `pg_dump`(经 `docker exec`)+ AES-256-CBC(PBKDF2)加密,输出到 git 忽略的 `backups/`。密钥只经环境变量传入,绝不写入仓库。
- 恢复演练 / Restore drill:`npm run drill:restore`(未设 `BACKUP_ENCRYPTION_KEY` 时自动生成一次性密钥)或 `bash scripts/restore-drill.sh <备份文件>` — 解密并恢复到隔离的临时库 `clc_restore_check`,跑行数对照(与源库)与关联完整性核查(成员/消息/文件/审核/通知/翻译/审计的孤儿行必须为零),打印计时报告后清理临时库与临时文件。
- RPO ≤24h / RTO ≤8h 是**待演练验证的目标**,不是已达标承诺:演练报告记录的是实测备份年龄与恢复耗时。本次本地演练结果见 `PROGRESS.md`(数据量极小,生产规模演练待 O08 资源)。
- 生产还应把 `backups/` 的加密产物异地留存并限制访问;对象存储(MinIO bucket)的备份随基础设施方案另行落实。

RPO ≤24h / RTO ≤8h are **targets to be validated by drills**, not achieved commitments: the drill report records the measured backup age and restore duration. See `PROGRESS.md` for this environment's run (trivial data volume; a production-scale drill awaits O08 resources). Off-site, access-restricted copies of the encrypted artifacts and object-storage backup are infrastructure follow-ups.

## 5. 测试期访问入口(上海测试环境)/ Test-period entry (Shanghai test environment)

2026-10-04 用户确认这次上线保持现状：一个真实案件加一个测试案件，不做域名、HTTPS 和正式文件扫描。2026-10-03 已把本应用部署到 SOW O02 指定的上海测试主机。对外入口是该机的 **HTTP 80 端口**(备案完成前没有 TLS)。主机上的 `.env` 设置 `CLC_FICTITIOUS_TEST_HOST=1`、`SESSION_COOKIE_SECURE=false`、`APP_BASE_URL` 为该 HTTP 入口;文件扫描仍用替身实现,而邮件自 F06(2026-10-03)起走真实 SMTP(`EMAIL_PROVIDER=smtp`,运营方邮箱),翻译自 F07(2026-10-03)起走真实 Kimi(`TRANSLATION_PROVIDER=kimi`,模型 kimi-k2.6)。只允许虚构数据。邀请邮件真实送达受邀邮箱;`/api/test/` 对外返回 404。激活是一步:受邀邮箱加上激活码,再次进入仍用同一组邮箱和邀请码,不另发 6 位验证码。客户默认屏幕为繁体中文、律师为越南语、时间戳按电脑时区标注，这三条已在界面实现。越南语与繁体中文的自动翻译实测单向约 16–34 秒。案件日报自 F16(2026-10-04)起只发本案协调员:每个越南日历日结束后由进程内 worker 生成,当日无新发布内容则不发送。具体 IP 不写入本仓库。

研发主机上的自动化测试仍访问 `http://localhost:3100`:Playwright 和开发服务器在同一台机器上。笔记本的 `127.0.0.1` 不是研发主机,也不是测试机。

On 2026-10-04 the user kept this launch as it is: one real Case plus one test Case, with no domain, no HTTPS, and no real file scanner. On 2026-10-03 this application was deployed to the Shanghai test host named in SOW O02. The public entry is **HTTP port 80** on that host (no TLS until ICP filing). That host's `.env` sets `CLC_FICTITIOUS_TEST_HOST=1`, `SESSION_COOKIE_SECURE=false`, and `APP_BASE_URL` to that HTTP entry; file scanning stays on the stand-in, while mail uses real SMTP since F06 (2026-10-03, `EMAIL_PROVIDER=smtp`, operator mailbox) and translation uses real Kimi calls since F07 (2026-10-03, `TRANSLATION_PROVIDER=kimi`, model kimi-k2.6). Fictitious data only. Invitation emails are really delivered to the invited addresses; `/api/test/` returns 404 to the public. Activation is one step: the invited email plus the activation code, with no second 6-digit code. The Daily Case Digest (F16, 2026-10-04) goes only to the case's coordinators, generated by the in-process worker after each Vietnam calendar day closes; a day with no newly published content sends nothing. The concrete IP is not written in this repository.

Automated tests on the development host still use `http://localhost:3100`, because Playwright and the dev server run on that same machine. The laptop's `127.0.0.1` is neither the development host nor the test host.

按 SOW O02(2026-10-01 决定):备案完成前,测试环境在**完成部署之后**只能以 `http://<IP>:<端口>` 形式访问——把主站/子域名指向境内实例的 80/443 会被云厂商拦截。因此:

Per SOW O02 (decided 2026-10-01): after a deploy, and until ICP filing completes, the test environment is reachable **only as `http://<IP>:<port>`** — pointing the main site or a subdomain at a mainland instance's 80/443 is blocked by the cloud provider. Therefore:

1. 该入口**无 TLS**,`SESSION_COOKIE_SECURE=false` 仅限此场景,且只允许虚构数据;接入真实案情前必须关闭该例外。
   This entry has **no TLS**; `SESSION_COOKIE_SECURE=false` applies only here and only with fictitious data, and the exception must be removed before any real case data connects.
2. 主站跳转链接指向 `http://<IP>:<端口>` 而非域名;备案完成后再切换为域名 + HTTPS。
   The main-site redirect link points to `http://<IP>:<port>`, not a domain; switch to domain + HTTPS after filing.
3. `APP_BASE_URL` 必须与实际入口一致,否则提醒邮件中的登录链接无效。
   `APP_BASE_URL` must match the actual entry, or login links in alert emails break.

具体主机地址与拓扑只记录在运维侧的私有笔记中,不进入本仓库。

Concrete host addresses and topology live only in the operations side's private notes, never in this repository.

### /new 隔离测试实例（2026-10-18）/ The isolated /new test instance (2026-10-18)

应用户要求（2026-10-18），上海测试机在不影响试点（`/`）的前提下新增一个隔离测试实例，入口 `http://<IP>/new/`。同日用户再确认：以后的新测试都走这个入口，不走美国测试机。要点：

- 代码支持 basePath 部署：`next.config.ts` 读 `BASE_PATH`；客户端的 fetch/EventSource/裸 `<a>`/location.assign 统一经 `src/lib/api-path.ts` 加 `NEXT_PUBLIC_BASE_PATH` 前缀（Next 只自动给 `<Link>` 与 next/navigation 跳转加前缀）。会话 Cookie 路径由 `SESSION_COOKIE_PATH` 控制，/new 实例设为 `/new`，与试点的 Cookie 互不干扰。
- 拓扑：systemd 单元 `clc-web-new`（127.0.0.1:3001，目录 `/home/ubuntu/ClientLawyerComm-new`，独立 `.env`）；独立数据库 `clc_new`；nginx 在 80 端口把 `/new` 与 `/new/` 都反代到 3001，`location /new/api/test/` 与试点一样返回 404。`/new` 不能再 308 到 `/new/`：应用会把 `/new/` 转回 `/new`，两条合在一起就是无限跳转。`/NEW` 等大小写不同的地址 308 到小写 `/new`。试点实例 `clc-web`（3000）与数据库完全不动。
- 新实例的管理员由 `scripts/bootstrap-admin.ts` 创建（主机上 Node 20 不能直接跑 .ts，经 SSH 隧道从研发机执行）；首次使用在 /new/login 用管理员邮箱收 OTP，再经 MFA 登记接口登记 TOTP，之后可用 /new/admin/cases。
- 升级 /new：rsync 到 `ClientLawyerComm-new` →（有迁移时 `migrate deploy` + `prisma generate`）→ `BASE_PATH=/new NEXT_PUBLIC_BASE_PATH=/new npm run build` → `sudo systemctl restart clc-web-new`。主机地址等细节只记 `LOCAL_DEV_NOTES.md`。不要覆盖该目录的 `.env`，也不要重启 `clc-web`。
- 2026-10-18 当晚：T19 只部署到 `/new`。`clc_new` 换成 `clc_dev` 的副本，再应用迁移 `20261018143000_message_file_link`。两个实例共用同一个文件桶，复制过去的附件行可以下载。此前只建在 `/new` 上的管理员被这份副本覆盖。进入复制过来的案件，用原来的邮箱和邀请码打开 `/new/invite`。已经发出的邮件仍指向试点的 `/invite`。`clc-web` 没有重启。
- 2026-10-19：`/new` 再次换成当时的 `clc_dev` 副本，并应用 `20261019120000_file_message_sitting`。还没有对应消息的附件，挂到同一作者 60 分钟内最近的那条消息下面。一条消息可以显示多份这样的附件。新发送仍然至多带一个文件。`clc-web` 没有重启。
- 2026-10-20：`/new` 的 `.env` 把 `KIMI_BASE_URL`、`KIMI_API_KEY`、`KIMI_MODEL`、`KIMI_VISION_MODEL` 指到 DeepSeek（`https://api.deepseek.com`，模型 `deepseek-flash`）。`TRANSLATION_PROVIDER` 仍写 `kimi`。试点的 `.env` 没有改。改完后要重启 `clc-web-new`，进程才会读到新值。
- 2026-10-20：协调员「查看待审译文」补上 `apiPath`（提交 `875badf`），只重新构建并重启了 `clc-web-new`。客户端的 fetch、EventSource、裸链接和 `location.assign` 都要走 `apiPath`；漏一处就会打到试点。`<Link>` 和 `router.push` 由 Next 加前缀。
- 2026-10-22：`/new` 是正在使用的实例，翻译走 DeepSeek。新消息和新发布的附件使用固定提示词 `clc-translate-v2`。已经存下的消息译文和附件页不重译。升级 `/new` 的代码时才重建并重启 `clc-web-new`；不要为了这份提示词再重启它。同日应用户要求，试点代码也放上同一份提示词，`clc-web` 于 19:18（UTC+8）重启。试点的 `.env` 仍指向 Kimi，该账户因余额不足被暂停。`clc_new` 没有改写旧译文。

At the user's request (2026-10-18), the Shanghai test host runs an isolated test instance at `http://<IP>/new/` alongside the pilot at `/`. The same day the user confirmed that later tests use this entry, not the US test machine. Key points:

- The code supports basePath deployment: `next.config.ts` reads `BASE_PATH`; client-side fetch/EventSource/plain-`<a>`/location.assign URLs go through `src/lib/api-path.ts` with the `NEXT_PUBLIC_BASE_PATH` prefix (Next auto-prefixes only `<Link>` and next/navigation redirects). The session cookie path comes from `SESSION_COOKIE_PATH` — `/new` for the new instance, so the two instances' cookies never collide.
- Topology: systemd unit `clc-web-new` (127.0.0.1:3001, directory `/home/ubuntu/ClientLawyerComm-new`, own `.env`); its own database `clc_new`; nginx on port 80 proxies both `/new` and `/new/` to 3001, and `location /new/api/test/` returns 404 like the pilot. Do not 308 `/new` to `/new/`: the app redirects `/new/` back to `/new`, and the pair loops. Other capitalizations such as `/NEW` 308 to lowercase `/new`. The pilot unit `clc-web` (3000) and its database are untouched.
- The new instance's administrator was created with `scripts/bootstrap-admin.ts` (the host's Node 20 cannot run .ts directly, so it ran from the development machine over an SSH tunnel); first sign-in at /new/login with the admin mailbox OTP, then TOTP enrollment via the MFA API, then /new/admin/cases works.
- Updating /new: rsync into `ClientLawyerComm-new` → (`migrate deploy` + `prisma generate` when migrations exist) → `BASE_PATH=/new NEXT_PUBLIC_BASE_PATH=/new npm run build` → `sudo systemctl restart clc-web-new`. Host details stay in `LOCAL_DEV_NOTES.md`. Do not overwrite that directory's `.env`, and do not restart `clc-web`.
- Later the same day: T19 was deployed only to `/new`. `clc_new` was replaced with a copy of `clc_dev`, then migration `20261018143000_message_file_link` was applied. The two instances share one file bucket, so the copied attachment rows download. The administrator that existed only on `/new` was replaced by that copy. The copied case opens at `/new/invite` with the original email and code. Mail already sent still links to the pilot `/invite`. `clc-web` was not restarted.
- 2026-10-19: `/new` was replaced again with the pilot database as of that moment, then `20261019120000_file_message_sitting` was applied. A file that had no message is shown under the nearest message by the same author within 60 minutes. One message may show several of those files. A new send still attaches at most one file. `clc-web` was not restarted.
- 2026-10-20: the `/new` `.env` points `KIMI_BASE_URL`, `KIMI_API_KEY`, `KIMI_MODEL`, and `KIMI_VISION_MODEL` at DeepSeek (`https://api.deepseek.com`, model `deepseek-flash`). `TRANSLATION_PROVIDER` stays `kimi`. The pilot `.env` was not changed. Restart `clc-web-new` after editing that file, or the process keeps the previous values.
- 2026-10-20: the coordinator's flagged-translation request now uses `apiPath` (commit `875badf`). Only `clc-web-new` was rebuilt and restarted. Every client fetch, EventSource, plain link, and `location.assign` must go through `apiPath`; a missing prefix hits the pilot. Next prefixes `<Link>` and `router.push`.
- 2026-10-22: `/new` is the instance in use, and it translates through DeepSeek. New messages and newly published attachments use the fixed prompt `clc-translate-v2`. Stored message translations and attachment pages are not redone. Rebuild and restart `clc-web-new` only when its code must change; do not restart it again for this prompt. The same day, at the user's request, the pilot code received the same prompt and `clc-web` was restarted at 19:18 CST. The pilot `.env` still points at Kimi, and that account remains suspended for insufficient balance. `clc_new` was not rewritten.

### 美国测试机 / US test machine (2026-10-09)

2026-10-09 起，后续测试部署改到美国测试机。上海那台继续称为上海测试机。美国测试机上的 PostgreSQL 16 与 MinIO 已在本机回环地址运行。应用代码、设计文档和主机环境文件都还没有放上去，因此还不能对外提供页面。这台机器没有 systemd，Docker 守护进程是手动启动的，重启后需要再启动。上海测试机继续服务已经在跑的试点，这次不把那个案件迁走。所在地、主机名和端口只记在 `LOCAL_DEV_NOTES.md`。研发机上，项目根目录的 `.env` 现为美国测试机配置，原先的文件改名为 `.env.lighthouse-test`。部署时仍排除 `.env`、`.env.lighthouse-test`、`LOCAL_DEV_NOTES.md` 与文档工作副本；装到美国测试机时只放 `.env`，不写入仓库。

From 2026-10-09, later test deployments go to the US test machine. The Shanghai machine keeps the name Shanghai test machine. PostgreSQL 16 and MinIO are already running on the US test machine's loopback address. Application code, design documents, and the host env file are not on it yet, so it does not serve pages. The machine has no systemd, so the Docker daemon was started by hand and must be started again after a reboot. The Shanghai test machine keeps the pilot already running there; this decision does not move that case. Place, hostname, and ports stay in `LOCAL_DEV_NOTES.md`. On the development machine, the project-root `.env` is now the US test machine configuration, and the previous file is `.env.lighthouse-test`. A deploy still excludes `.env`, `.env.lighthouse-test`, `LOCAL_DEV_NOTES.md`, and the documentation working copy. Only `.env` is installed on the US test machine, and it is never committed.

### 目标公司工商查询（T18）的网络限制 / Network limit for the registry lookup (T18)

2026-10-17 实测：masothue.com（T18 的工作数据源）从上海测试机访问返回 Cloudflare 403 挑战页（数据中心 IP 被拦），thongtincongty.com / tracuunnt.gdt.gov.vn / dangkyquamang.dkkd.gov.vn 从该机均连接超时。研发机（境外 IP）抓取正常。上海机 `.env` 已设 `REGISTRY_PROVIDER=masothue`；在该机上发起的查询会在重试后定格 failed，界面提示「查询失败，稍后再试」。已为协调员提供手工录入入口（2026-10-18，SPEC v0.18）：案件页查询块内可折叠的「手工录入」表单接受正文＋可选来源链接，按原文保存并记审计。另一后续选项：把自动查询移到境外可达的机器执行。试点期间工商信息也可由运维侧在境外机器查询后转交协调员录入。

Verified 2026-10-17: from the Shanghai test host, masothue.com (the T18 working source) answers with a Cloudflare 403 challenge (datacenter IP), and thongtincongty.com / tracuunnt.gdt.gov.vn / dangkyquamang.dkkd.gov.vn all time out. Fetches work from the development machine (overseas IP). The Shanghai `.env` carries `REGISTRY_PROVIDER=masothue`; lookups started there retry and end as failed with an on-screen note. The coordinator manual-entry path is implemented (2026-10-18, SPEC v0.18): a collapsible form in the registry block takes free text plus an optional source link, stores it verbatim, and audits it. Remaining option: run automatic lookups from a host with working access. During the pilot, operations can also look the record up on an overseas machine and hand it to the coordinator to enter.

## 6. 端到端测试 / End-to-end tests

`npm run test:e2e`:Playwright 在独立端口(3100)与独立数据库(`clc_e2e`,每次运行重建)上起专用 dev server;邮件走 fake outbox,经 `GET /api/test/outbox` 断言钩子读取激活码/验证码(仅非生产 + fake provider 时存在);通知队列经 `POST /api/test/worker` 显式驱动。无固定 sleep,全部等待走 Playwright 自动等待/轮询。

`npm run test:e2e`: Playwright starts a dedicated dev server on its own port (3100) and database (`clc_e2e`, rebuilt every run); mail goes to the fake outbox, read through the `GET /api/test/outbox` assertion hook (present only outside production with the fake provider); the notification queue is driven explicitly via `POST /api/test/worker`. No fixed sleeps — all waiting uses Playwright auto-waiting/polling.
