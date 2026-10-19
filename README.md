# ClientLawyerComm — 中越多语言案件沟通系统 / China–Vietnam Multilingual Case Communication System

A web-based, case-isolated communication system: Chinese Client — Vietnamese Lawyer — Case Coordinator, with one-step activation (invited email plus activation code), publish-controlled messaging, conversation translation (zh-Hans/zh-Hant/vi/en), file sharing, urgent alerts, review console, admin MFA, and a full audit trail.

基于网页、按案件隔离的沟通系统：中国客户—越南律师—案件协调员。一步激活（受邀邮箱加上激活码）、发布受控的消息流水线、对话翻译（中简繁/越/英）、文件分享、紧急提醒、审核后台、管理员 MFA 与完整审计。

## Status / 状态（2026-10-19）

PLAN v0.23 is current. The second phase (T15–T18), the DOCX bilingual document (T09), the administration console (T14), and the message-and-file thread (T19) are implemented. T19 is deployed at `http://<IP>/new/` with a fresh copy of the pilot case, and existing files sit on the nearest same-author message. `/NEW` redirects to `/new`. The daily digest email is off on both the pilot and `/new`. Domain, HTTPS, and a real file scanner stay deferred. See PROGRESS.md.

PLAN v0.23 为当前计划。第二阶段（T15–T18）、DOCX 双语对照（T09）、管理控制台（T14）和消息与附件同一条对话（T19）已经实现。T19 部署在 `http://<IP>/new/`，库是试点案件的新副本，已有附件挂在同一作者最近的消息上。`/NEW` 转到 `/new`。每日总结邮件在试点和 `/new` 上都已停发。域名、HTTPS 与正式文件扫描仍然推迟。见 PROGRESS.md。

## Commands / 命令

```bash
docker compose up -d      # PostgreSQL + MinIO
npm run setup             # install deps + apply migrations (clc_dev)
npm run dev               # dev server
npm run test              # unit + integration (uses disposable clc_test)
npm run test:e2e          # Playwright journeys (disposable clc_e2e, port 3100)
npm run drill:restore     # backup/restore drill into an isolated scratch DB
npm run lint && npx tsc --noEmit && npm run build
```

## Repository Map / 仓库地图

- `src/app/api/**` — REST route handlers; `src/app/(auth)`/`(app)` — pages
- `src/modules/**` — domain logic (auth, invites, cases, members, messages, moderation, translation, review, notifications, urgent, files, admin)
- `src/server/**` — guards, providers (email/llm/storage/scanner), SSE hub, jobs queue/worker, audit, MFA
- `prisma/` — schema + migrations (Prisma 7; connection in `prisma.config.ts`)
- `tests/` — unit / integration / e2e; `scripts/` — bootstrap-admin, backup, restore-drill
- `docs/runbook/mvp-test-case.md` — REQ-OPS-07 admin test-case runbook; `docs/deployment.md` — deployment & operations

## Design Documents / 设计文档

`SOW.md` (execution baseline) → `SPEC.md` (requirements) → `PLAN.md` (tasks) → `PROGRESS.md` (current status & next steps) → `SESSIONS.md` (session log) → `GLOSSARY.md` (terminology) → `CONTEXT.md` (stable background & navigation).

## Rules / 规则

- Never commit secrets: config only via `.env` (git-ignored) / `process.env`; placeholders go to `.env.example`.
- Fictitious test data only. Local topology stays in the git-ignored `LOCAL_DEV_NOTES.md`.
- This repo uses Next.js 16 — consult `node_modules/next/dist/docs/` before writing app code.
