# ClientLawyerComm — 中越多语言案件沟通系统 / China–Vietnam Multilingual Case Communication System

A web-based, case-isolated communication system: Chinese Client — Vietnamese Lawyer — Case Coordinator, with one-step activation (invited email plus activation code), publish-controlled messaging, conversation translation (zh-Hans/zh-Hant/vi/en), file sharing, urgent alerts, review console, admin MFA, and a full audit trail.

基于网页、按案件隔离的沟通系统：中国客户—越南律师—案件协调员。一步激活（受邀邮箱加上激活码）、发布受控的消息流水线、对话翻译（中简繁/越/英）、文件分享、紧急提醒、审核后台、管理员 MFA 与完整审计。

## Status / 状态（2026-10-03）

All P0 (MVP) coding tasks T01–T08 and T10–T12 are done. The Shanghai test host is serving the app over HTTP. PLAN.md v0.9 follow-ups F01–F05 and F10–F14 are done in the repository and on the Shanghai test host. F09 is later. F13 labels each conversation and upload time with that computer's timezone. F14 shows one language: a Chinese client sees Traditional Chinese, a Vietnamese lawyer sees Vietnamese, and a coordinator sees Simplified Chinese. After F13/F14, `npm run test` is 286/286 and `npm run test:e2e` is 7/7. F07 is the Kimi pair: lawyer Vietnamese becomes the client's Traditional Chinese, and client Traditional Chinese becomes the lawyer's Vietnamese; real calls stay blocked on O05. F06 and F08 stay blocked. T09/T13 are P1. See PROGRESS.md.

全部 P0（MVP）编码任务 T01–T08、T10–T12 已完成。上海测试机已通过 HTTP 提供本应用。PLAN.md v0.9 的跟进项 F01–F05 与 F10–F14 已在仓库和上海测试机完成。F09 稍后。F13 给每条对话和上传时间标出该电脑的时区。F14 屏幕只用一种语言：中国客户看到繁体中文，越南律师看到越南语，协调员看到简体中文。F13/F14 之后 `npm run test` 为 286/286，`npm run test:e2e` 为 7/7。F07 是 Kimi 这一对：律师的越南语变成客户的繁体中文，客户的繁体中文变成律师的越南语；真实调用仍阻塞于 O05。F06 与 F08 仍阻塞。T09/T13 为 P1。见 PROGRESS.md。

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
