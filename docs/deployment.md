# 部署与运行说明 / Deployment and Operations Guide

适用范围:MVP 试点环境。本文不含任何真实密钥、真实邮箱或拓扑细节;那些只存在于目标主机上的 `.env`(git 忽略)中。

Scope: the MVP pilot environment. This document contains no real secrets, mailboxes, or topology details — those live only in the git-ignored `.env` on the target host.

## 1. 服务组成 / Service composition

| 组件 Component | 说明 Notes |
| --- | --- |
| Next.js 16 App(Node runtime) | `npm run build` 后 `npm run start`;开发用 `npm run dev`。唯一对外 HTTP 入口。 |
| PostgreSQL 16 | 应用库;本地开发由 `docker compose up -d` 提供(`clc-postgres`)。 |
| MinIO(S3 兼容) | 私有 bucket 存文件原件/共享副本;无预签名 URL,下载一律经服务端授权代理。 |
| 通知 worker | **由 Web 进程内驱动**:`src/instrumentation.ts` 在服务启动时以 10 秒间隔跑持久队列的幂等趟次(at-least-once,崩溃重放不丢)。设 `NOTIFICATION_WORKER=off` 可关闭(仅当改用外部驱动时;E2E 即如此,改由 `POST /api/test/worker` 显式触发)。 |

Notification worker: driven **in-process** — `src/instrumentation.ts` starts `startNotificationWorker()` at server boot (idempotent 10s passes over the persistent queue; at-least-once, crash replay loses nothing). Set `NOTIFICATION_WORKER=off` only when an external driver is used (E2E does this and triggers passes explicitly via `POST /api/test/worker`).

## 2. 环境变量 / Environment variables

完整清单与占位见 `.env.example`(只含占位,不含真实值)。关键点:

See `.env.example` for the full list (placeholders only, never real values). Key points:

- `DATABASE_URL` — 应用库连接串。
- `MINIO_*` / `STORAGE_PROVIDER=minio` — 私有对象存储。
- `APP_DATA_KEY` — 32 字节 hex 的 AES-256-GCM 密钥,加密联系方式与 MFA secret;`openssl rand -hex 32` 生成;**轮换即失效**,丢失则已加密数据不可读。
- `EMAIL_PROVIDER` / `TRANSLATION_PROVIDER` / `LLM_PROVIDER` / `FILE_SCANNER` — 目前只有 `fake`/`stub` 实现,**生产环境会被拒绝启动**;真实 SMTP 与 Kimi 接入属外部资源待落实项(O05),接入前生产部署无法合法运行。
- `SESSION_COOKIE_SECURE` — 默认 `true`。**仅**在备案前的 HTTP-IP 测试入口(虚构数据)可设 `false`;接入任何真实数据前必须恢复 `true`(REQ-AUTH-06)。
- `APP_BASE_URL` — 提醒邮件中的登录链接前缀(不含路径)。
- `NOTIFICATION_WORKER` — 默认 `on`,见上表。

## 3. 迁移 / Migrations

```bash
npx prisma migrate deploy
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

按 SOW O02(2026-10-01 决定):备案完成前,测试环境**只能以 `http://<IP>:<端口>` 形式访问**——把主站/子域名指向境内实例的 80/443 会被云厂商拦截。因此:

Per SOW O02 (decided 2026-10-01): until ICP filing completes, the test environment is reachable **only as `http://<IP>:<port>`** — pointing the main site or a subdomain at a mainland instance's 80/443 is blocked by the cloud provider. Therefore:

1. 该入口**无 TLS**,`SESSION_COOKIE_SECURE=false` 仅限此场景,且只允许虚构数据;接入真实案情前必须关闭该例外。
   This entry has **no TLS**; `SESSION_COOKIE_SECURE=false` applies only here and only with fictitious data, and the exception must be removed before any real case data connects.
2. 主站跳转链接指向 `http://<IP>:<端口>` 而非域名;备案完成后再切换为域名 + HTTPS。
   The main-site redirect link points to `http://<IP>:<port>`, not a domain; switch to domain + HTTPS after filing.
3. `APP_BASE_URL` 必须与实际入口一致,否则提醒邮件中的登录链接无效。
   `APP_BASE_URL` must match the actual entry, or login links in alert emails break.

具体主机地址与拓扑只记录在运维侧的私有笔记中,不进入本仓库。

Concrete host addresses and topology live only in the operations side's private notes, never in this repository.

## 6. 端到端测试 / End-to-end tests

`npm run test:e2e`:Playwright 在独立端口(3100)与独立数据库(`clc_e2e`,每次运行重建)上起专用 dev server;邮件走 fake outbox,经 `GET /api/test/outbox` 断言钩子读取激活码/验证码(仅非生产 + fake provider 时存在);通知队列经 `POST /api/test/worker` 显式驱动。无固定 sleep,全部等待走 Playwright 自动等待/轮询。

`npm run test:e2e`: Playwright starts a dedicated dev server on its own port (3100) and database (`clc_e2e`, rebuilt every run); mail goes to the fake outbox, read through the `GET /api/test/outbox` assertion hook (present only outside production with the fake provider); the notification queue is driven explicitly via `POST /api/test/worker`. No fixed sleeps — all waiting uses Playwright auto-waiting/polling.
