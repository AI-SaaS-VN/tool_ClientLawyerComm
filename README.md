# ClientLawyerComm — 中越多语言案件沟通系统 / China–Vietnam Multilingual Case Communication System

A web-based, case-isolated communication system: Chinese Client — Vietnamese Lawyer — Case Coordinator, with invitation-based registration (email OTP), publish-controlled messaging, conversation translation (zh-Hans/zh-Hant/vi/en), file sharing, urgent alerts, review console, admin MFA, and a full audit trail.

基于网页、按案件隔离的沟通系统：中国客户—越南律师—案件协调员。邀请注册（邮箱验证码）、发布受控的消息流水线、对话翻译（中简繁/越/英）、文件分享、紧急提醒、审核后台、管理员 MFA 与完整审计。

## Status / 状态（2026-10-03）

All P0 (MVP) coding tasks T01–T08 and T10–T12 are done and verified: 280/280 unit+integration tests, 4/4 Playwright E2E journeys, lint/tsc/build clean, backup/restore drill PASS. T09/T13 are P1. Remaining items are external-resource acceptance only — see PROGRESS.md (Blocked list).

全部 P0（MVP）编码任务 T01–T08、T10–T12 已完成并验证：280/280 单元＋集成测试、4/4 Playwright E2E 旅程、lint/tsc/build 无错误、备份恢复演练 PASS。T09/T13 为 P1。剩余项仅为外部资源验收——见 PROGRESS.md 阻塞清单。

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
