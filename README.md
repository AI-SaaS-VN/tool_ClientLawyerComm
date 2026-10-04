# ClientLawyerComm — 中越多语言案件沟通系统 / China–Vietnam Multilingual Case Communication System

A web-based, case-isolated communication system: Chinese Client — Vietnamese Lawyer — Case Coordinator, with one-step activation (invited email plus activation code), publish-controlled messaging, conversation translation (zh-Hans/zh-Hant/vi/en), file sharing, urgent alerts, review console, admin MFA, and a full audit trail.

基于网页、按案件隔离的沟通系统：中国客户—越南律师—案件协调员。一步激活（受邀邮箱加上激活码）、发布受控的消息流水线、对话翻译（中简繁/越/英）、文件分享、紧急提醒、审核后台、管理员 MFA 与完整审计。

## Status / 状态（2026-10-04）

All P0 coding tasks T01–T08 and T10–T12 are done. The Shanghai test host is serving the app over HTTP. F01–F07 and F10–F14 are done. The next coding task is F16 / T13: a daily email of published messages and files, sent only to the Case Coordinator. The case-creation page (T14) is the next version; an operator creates the one real case and the test case. Domain, HTTPS, and a real file scanner are deferred for this launch. T09 stays later. See PROGRESS.md.

全部 P0 编码任务 T01–T08、T10–T12 已完成。上海测试机已通过 HTTP 提供本应用。F01–F07 与 F10–F14 已完成。下一件编码工作是 F16 / T13：把已发布的消息和文件做成每日邮件，只发给案件协调员。建案页面（T14）是下一版本；操作者建立那一个真实案件和测试案件。域名、HTTPS 与正式文件扫描在这次上线中推迟。T09 仍在更后。见 PROGRESS.md。

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
