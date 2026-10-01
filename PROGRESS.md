# PROGRESS.md — Current Progress / 当前进度

- Updated: 2026-10-01 (UTC) | Maintenance: update upon completion of each task or phase
- 更新日期：2026-10-01（UTC）｜维护方式：每完成一个任务或阶段即更新

## Current Phase / 当前阶段

**Docs frozen; T01 in progress (blocked on Prisma 7 config migration).** Bilingual design docs (SOW v1.5 / SPEC v0.3 / PLAN v0.3) committed and pushed to GitHub (root commit fa4d85d). T01 skeleton largely done; remaining: Prisma 7 config + migration, run test suites, commit.

**文档已冻结；T01 进行中（卡在 Prisma 7 配置迁移）。** 双语设计文档（SOW v1.5 / SPEC v0.3 / PLAN v0.3）已提交并推送 GitHub（首次提交 fa4d85d）。T01 骨架大部分完成；剩余：Prisma 7 配置与迁移、跑测试、提交。

## T01 Status / T01 状态

Done / 已完成：

- Next.js scaffold: Next 16.3.8, React 19.2.8, Tailwind 4, TS5 (create-next-app via subagent; AGENTS.md/CLAUDE.md auto-created by `next dev` — Next 16 has breaking changes, read `node_modules/next/dist/docs/` before coding)<br>Next.js 骨架：Next 16.3.8、React 19.2.8、Tailwind 4、TS5（子代理搭建；`next dev` 自动创建 AGENTS.md/CLAUDE.md——Next 16 有破坏性变更，编码前先读 `node_modules/next/dist/docs/`）
- docker-compose.yml: postgres:16-alpine + bitnamilegacy/minio:2025.5.24-debian-12-r5 (Docker Hub returns 401 for minio/* org → bitnamilegacy drop-in). Both containers healthy (clc-postgres, clc-minio)<br>docker-compose.yml：postgres:16-alpine + bitnamilegacy/minio（Docker Hub 对 minio/* 返回 401，改用 bitnamilegacy）。两容器均健康
- package.json: name=clientlawyercomm; @types/node ^24 (fixed ERESOLVE with vitest@5.0.3); scripts: dev/build/start/lint/setup/test/test:int/test:e2e<br>package.json：name=clientlawyercomm；@types/node ^24（修复与 vitest@5.0.3 的 ERESOLVE 冲突）；scripts 已加 setup/test/test:int/test:e2e
- Installed: @prisma/client 7.10.0, prisma 7.10.0, vitest, @playwright/test. NOTE: npm allow-scripts blocked postinstall for prisma / @prisma/engines / unrs-resolver — may need `npm approve-scripts` if engines missing<br>已装：@prisma/client 7.10.0、prisma 7.10.0、vitest、@playwright/test。注意：npm allow-scripts 拦截了 prisma/@prisma/engines/unrs-resolver 的 postinstall——若缺引擎需 `npm approve-scripts`
- Written: prisma/schema.prisma (User/Session), src/app/api/health/route.ts, src/lib/db.ts, vitest.config.ts, tests/unit/health.test.ts, playwright.config.ts (webServer=next dev; smoke test uses request fixture, no browser needed), tests/e2e/smoke.spec.ts, .env.example<br>已写：schema（User/Session）、health 路由、db.ts、vitest/playwright 配置、unit+e2e 冒烟测试（e2e 用 request fixture，不需浏览器）、.env.example
- .env appended with dev vars (DATABASE_URL=postgresql://postgres:postgres@localhost:5432/clc_dev, MINIO_*) via shell append without reading secrets<br>.env 已追加开发变量（DATABASE_URL、MINIO_*；shell 追加，未读取原机密内容）

Blocked / 卡点（下次第一件事）：

- `npx prisma migrate dev --name init` fails: **Prisma 7 removed `url` from datasource** — must move connection to `prisma.config.ts` with an `adapter` (see https://pris.ly/d/config-datasource). Was inspecting `node_modules/@prisma/config/dist/index.d.ts` (exports `defineConfig`, `env`; Datasource type at line ~150) when paused. Likely needs `pg` + `@prisma/adapter-pg`, and `src/lib/db.ts` must construct PrismaClient with the adapter.<br>`npx prisma migrate dev --name init` 失败：**Prisma 7 移除了 datasource 的 `url`**——连接须迁到 `prisma.config.ts` 的 `adapter`。暂停时正在查 `node_modules/@prisma/config/dist/index.d.ts`（导出 `defineConfig`、`env`；Datasource 类型在 ~150 行）。预计需要 `pg` + `@prisma/adapter-pg`，且 `src/lib/db.ts` 须用 adapter 构造 PrismaClient。

Not yet done / 未完成：prisma.config.ts + adapter install、`migrate dev --name init`、migrate reset 验证、`npm run test`、`npx playwright install chromium`、`npm run test:e2e`、T01 提交。

## Test Status / 测试状态

No test suites run yet (T01 incomplete). AC01–AC12 all unverified.<br>尚未运行测试套件（T01 未完成）。AC01–AC12 全部未验证。

## Next Steps (First Step of Next Session) / 下一步（下次会话第一步）

1. Write prisma.config.ts with pg adapter; install `pg @prisma/adapter-pg`; update src/lib/db.ts; run `npx prisma migrate dev --name init`. If engine errors, run `npm approve-scripts`.<br>编写 prisma.config.ts（pg adapter）；安装 `pg @prisma/adapter-pg`；更新 src/lib/db.ts；跑 `npx prisma migrate dev --name init`。若报引擎错误则 `npm approve-scripts`。
2. Run `npm run test` and `npm run test:e2e`; then commit T01 and proceed to T02.<br>运行 `npm run test` 与 `npm run test:e2e`；提交 T01 后进入 T02。
