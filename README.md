# ClientLawyerComm — 中越多语言案件沟通系统 / China–Vietnam Multilingual Case Communication System

A web-based, case-isolated communication system: Chinese Client — Vietnamese Lawyer — Case Coordinator, with one-step activation (invited email plus activation code), publish-controlled messaging, conversation translation (zh-Hans/zh-Hant/vi/en), file sharing, urgent alerts, review console, admin MFA, and a full audit trail.

基于网页、按案件隔离的沟通系统：中国客户—越南律师—案件协调员。一步激活（受邀邮箱加上激活码）、发布受控的消息流水线、对话翻译（中简繁/越/英）、文件分享、紧急提醒、审核后台、管理员 MFA 与完整审计。

## Status / 状态（2026-10-09）

The shipped MVP through T13 is on the Shanghai test machine. From 2026-10-09, later test deployments go to the US test machine. Application code and design documents stay off that machine, and it has no public entry yet. The case already running on the Shanghai test machine is not moved by this decision. The next code is F18, then T15. F18 sets a client's default screen to Simplified Chinese. T15 is the HTML Attachment Translation Page (REQ-ATT). T16, T18, and T17 follow, and they do not start before T15. The paragraph-numbered DOCX (T09) and the case-creation page (T14) stay later. Domain, HTTPS, and a real file scanner stay deferred. See PLAN.md and PROGRESS.md.

已交付的 MVP 做到 T13，在上海测试机上。2026-10-09 起，后续测试部署改到美国测试机；应用代码和设计文档不放在那台机器上，公网入口还没有。上海测试机上已经在跑的案件不因这次决定搬迁。下一件代码是 F18，然后 T15。F18 把客户的默认屏幕改成简体中文。T15 是 HTML 附件翻译页（REQ-ATT）。T16、T18、T17 排在后面，T15 完成之前不要开始。段落编号的 DOCX（T09）和建案页面（T14）仍在更后。域名、HTTPS 与正式文件扫描仍然推迟。见 PLAN.md 与 PROGRESS.md。

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
