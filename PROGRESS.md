# PROGRESS.md — Current Progress / 当前进度

- Updated: 2026-10-01 (UTC) | Maintenance: update upon completion of each task or phase
- 更新日期：2026-10-01（UTC）｜维护方式：每完成一个任务或阶段即更新

## Current Phase / 当前阶段

**Preparation phase complete. T01 done and re-checked on 2026-10-01 (`npm run test` 1 passed, `npm run test:e2e` health check passed). Design baseline is SOW v1.9 / SPEC v0.7 / PLAN v0.7. Next is T02, and the MVP activation is bound to the entered email.** External channels already verified: GitHub deploy key, Cloudflare API, Kimi API, Lighthouse key login, outbound email (SMTP 587/STARTTLS smoke send succeeded 2026-10-01). Docs on GitHub through 228a748; v1.9 is local until the next commit. T01 skeleton: cea7e37.

**准备阶段已完成。T01 已完成，并于 2026-10-01 复核（`npm run test` 1 项通过，`npm run test:e2e` 健康检查通过）。设计基线为 SOW v1.9 / SPEC v0.7 / PLAN v0.7。下一项是 T02，且 MVP 的激活绑定被输入的邮箱。** 外部链路已验证：GitHub deploy key、Cloudflare API、Kimi API、Lighthouse 密钥登录、邮件发信（SMTP 587/STARTTLS 冒烟发送于 2026-10-01 成功）。GitHub 上的文档截至 228a748；v1.9 仍在本地，待下次提交。T01 骨架：cea7e37。

The earlier "T01 blocked on Prisma 7 datasource url" note is obsolete. `prisma.config.ts`, the `pg` adapter, `migrate dev --name init`, `migrate reset`, `npm run test`, and `npm run test:e2e` were completed in the same day. Do not repeat that work.

早先「T01 卡在 Prisma 7 datasource url」的记录已经过时。`prisma.config.ts`、`pg` adapter、`migrate dev --name init`、`migrate reset`、`npm run test` 与 `npm run test:e2e` 已在同一天完成。不要重做。

## T01 Status / T01 状态

Done / 已完成（cea7e37）：

- Next.js 16.3.8, React 19.2.8, Tailwind 4, TypeScript 5. Read `node_modules/next/dist/docs/` before writing application code; this Next.js version differs from older training data.<br>Next.js 16.3.8、React 19.2.8、Tailwind 4、TypeScript 5。编写应用代码前先读 `node_modules/next/dist/docs/`；此 Next.js 版本与旧训练数据不同。
- docker-compose: postgres:16-alpine + bitnamilegacy/minio (Docker Hub returns 401 for the `minio/*` organization). Containers clc-postgres and clc-minio were healthy at acceptance.<br>docker-compose：postgres:16-alpine + bitnamilegacy/minio（Docker Hub 对 `minio/*` 组织返回 401）。验收时 clc-postgres 与 clc-minio 健康。
- Prisma 7.10.0 with `prisma.config.ts` and `@prisma/adapter-pg`. Migration `20261001085327_init` applied and replayed with `migrate reset --force`.<br>Prisma 7.10.0，使用 `prisma.config.ts` 与 `@prisma/adapter-pg`。迁移 `20261001085327_init` 已应用，并用 `migrate reset --force` 重放通过。
- Tests at acceptance: `npm run test` (1 passed), `npm run test:e2e` (smoke via the request fixture). AC01–AC12 remain unverified; they belong to later tasks.<br>验收时测试：`npm run test`（1 通过）、`npm run test:e2e`（经 request fixture 的冒烟）。AC01–AC12 仍未验证；它们属于后续任务。

## Test Status / 测试状态

T01 unit and smoke tests passed on 2026-10-01. No integration suite for T02+ has been run. AC01–AC12 are not accepted.

T01 的单元测试与冒烟测试于 2026-10-01 通过。T02 及之后的集成套件尚未运行。AC01–AC12 未验收。

## Next Steps / 下一步

1. Implement PLAN.md T02 against SPEC.md v0.7 REQ-AUTH-01. Do not add SmsProvider. Do not redo T01. MVP invitation codes are bound to the entered email. An unbound additional-case code is P1 (REQ-AUTH-12) and is not part of T02. On the HTTP test origin, omit the `Secure` cookie flag.
1. 按 SPEC.md v0.7 REQ-AUTH-01 实现 PLAN.md T02。不要加入 SmsProvider。不要重做 T01。MVP 的邀请码绑定被输入的邮箱。不绑定邮箱的追加案件邀请码属于 P1（REQ-AUTH-12），不属于 T02。HTTP 测试源上的会话 Cookie 不带 `Secure`。
