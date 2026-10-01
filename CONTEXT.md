# CONTEXT.md — Stable Background and File Navigation / 稳定背景与文件导航

- Last updated: 2026-09-30 (UTC)
- 更新日期：2026-09-30（UTC）
- Purpose: keeps only the product background, confirmed decisions, file navigation, and unresolved environment conditions. Records no credentials, real case details, or personal contact information.
- 用途：仅保留产品背景、已确认决策、文件导航和未解决的环境条件。不记录凭据、真实案情、个人联系方式。

## Product Background (Approved, Not to Be Re-discussed) / 产品背景（已批准，不重新讨论）

- A Chinese–Vietnamese bilingual Case communication system: Chinese Client — Vietnamese Lawyer — Case Coordinator, web-based (mobile/desktop browsers), no WeChat/Zalo required.
- 中越双语案件沟通系统：中国客户—越南律师—案件协调员，网页端（手机/电脑浏览器），无需 WeChat/Zalo。
- Users, chats, files, and permissions are isolated by Case; Invitation-based Registration (MVP: email Verification Code (OTP) only, v1.4; phone registration P1); registration ≠ Case access rights.
- 以案件隔离用户、聊天、文件和权限；邀请式注册（MVP 仅邮箱验证码，v1.4；手机注册 P1）；注册≠案件访问权。
- Content restrictions apply only to Litigation Retainer Fees (MVP: explicit inquiry/negotiation triggers Pending Review only, v1.4) and to either party's direct contact information; Case Amount (claims/compensation/settlement, etc.) is unrestricted.
- 内容限制仅针对诉讼委托费用（MVP 仅显式问询/协商触发待审，v1.4）与双方直接联系方式；案件金额（诉讼请求/赔偿/和解等）不受限。
- Suspected restricted content and files must be Reviewed by the Coordinator before Publish; entering Pending Review automatically sends an Urgent Alert to the Coordinator; nothing is ever auto-released on timeout.
- 疑似受限内容与文件须经协调员审核后发布；进入待审自动向协调员发紧急提醒；超时绝不自动放行。
- MVP includes two-way Urgent Alerts (email channel), file sharing (PDF/DOCX/JPG/PNG, 20MB), Permission Revocation, Archive, administrator MFA (separate admin account), Audit Trail, Backup and Restore; languages are Chinese (Simplified/Traditional)/Vietnamese/English; the Coordinator may participate in chat (v1.4). Moved to P1: phone registration/SMS, DOCX Bilingual Parallel Document, Cross-case Mix-up Prevention UI.
- MVP 含双向紧急提醒（邮件渠道）、文件分享（PDF/DOCX/JPG/PNG，20MB）、权限撤销、归档、管理员 MFA（独立管理员账号）、审计、备份恢复；语言为中（简/繁）/越/英；协调员可参与聊天（v1.4）。移 P1：手机注册/短信、DOCX 双语对照、防串案界面。

## Confirmed Technical Direction (technical defaults; reversible details may be optimized but must be recorded) / 已确认技术方向（技术默认值，可逆细节可优化但须记录）

- TypeScript / Next.js modular monolith + PostgreSQL + private object storage + database-persisted task queue.
- TypeScript / Next.js 模块化单体 + PostgreSQL + 私有对象存储 + 数据库持久任务队列。
- HTTP for sending + SSE for receiving/incremental catch-up after reconnect; no microservices/K8s/cross-region dual-write.
- HTTP 发送 + SSE 接收/断线增量拉取；不引入微服务/K8s/跨区双写。
- External capabilities behind replaceable interfaces: TranslationProvider (Kimi/Moonshot AI designated as candidate by the user on 2026-10-01), SmsProvider, EmailProvider; use mature components for authentication.
- 外部能力经可替换接口：TranslationProvider（Kimi/Moonshot AI 为用户 2026-10-01 指定候选）、SmsProvider、EmailProvider；认证用成熟组件。
- Vietnamlawyers.ai main-site entry + separate subdomain app; production prefers Hong Kong/Singapore VPS, subject to verification by the operations owner and China–Vietnam network testing.
- Vietnamlawyers.ai 主站入口 + 独立子域名应用；生产优先香港/新加坡 VPS，须运维负责人与中越网络验证。

## File Navigation / 文件导航

| File / 文件 | Responsibility / 职责 |
| --- | --- |
| SOW.md | v1.0 Execution Baseline (user-approved 2026-09-30): scope, acceptance AC01–AC12, Open Items O01–O08<br>v1.0 执行基线（2026-09-30 用户批准）：范围、验收 AC01–AC12、待落实 O01–O08 |
| VIBE_CODING_INPUT.md | Launch-instruction entry point<br>启动指令入口 |
| SPEC.md | Requirements/permissions/state machine/data/API/exception specifications (draft, pending Review(approval))<br>需求/权限/状态机/数据/API/异常规格（草案，待评审） |
| PLAN.md | MVP task breakdown T01–T13 (draft, pending Review(approval))<br>MVP 任务拆分 T01–T13（草案，待评审） |
| PROGRESS.md | Current phase, task status, blockers, next steps<br>当前阶段、任务状态、阻塞、下一步 |
| SESSIONS.md | Appended log of each session<br>每次会话追加记录 |
| GLOSSARY.md | Business terminology (synced from SOW §2)<br>业务术语（自 SOW 第2节同步） |
| docs/adr/ | Architecture decision records (create when needed)<br>架构决策记录（需要时建立） |

## Local-only Notes (GitHub Exclusion Rule) / 本地专属笔记（GitHub 排除规则）

- Local development-environment topology and operational details are intentionally NOT committed to GitHub (user instruction 2026-10-01). They live only in `LOCAL_DEV_NOTES.md` in the project folder on the dev VPS, which is excluded via .gitignore. Do not paste those details into any committable file.
- 本地开发环境拓扑与操作细节按用户指示（2026-10-01）**不收录进 GitHub 仓库**，仅记录在研发 VPS 项目目录的 `LOCAL_DEV_NOTES.md`（.gitignore 已排除）。禁止把这些细节写入任何会被提交的文件。

## Unresolved Environment Conditions (see SOW §14 for details) / 未解决的环境条件（详见 SOW 第14节）

- O01: GitHub deploy key connectivity verified (2026-10-01); Cloudflare API Token verified working (zone vietnamlawyers.ai, status active); the main site's tech stack is still unverified. This VPS has no pnpm/PostgreSQL client installed (Docker provides Postgres during development).
- O01：GitHub deploy key 已验证连通（2026-10-01）；Cloudflare API Token 已验证可用（zone vietnamlawyers.ai，status active）；主站技术栈仍未核实。本 VPS 未装 pnpm/PostgreSQL 客户端（开发期 Docker 提供 Postgres）。
- O02: User decision on 2026-10-01: Shanghai Lighthouse (124.223.13.137, ap-shanghai) **serves as the test environment for now**; the original services (PT-MGMT container, proxy scripts, ngrok) were all removed with the user's authorization, and the firewall allows only ports 22/80/443. Test-period entry points: ① redirect link from the main site vietnamlawyers.ai; ② direct IP access; **before ICP filing, only the http://IP:端口 form may be used (a domain pointing to a mainland instance will be blocked), and only fictitious data is allowed**. The production route (mainland ICP filing vs Hong Kong/Singapore) will be decided after filing progress and AC10 verification. Baseline: Ubuntu 22.04 / 2C / 3.3G / 59G / Docker 26.1.3; key-based login verified; rough measurement Shanghai→Vietnam HTTPS 3.9–5.5s.
- O02：用户 2026-10-01 决定：上海 Lighthouse（124.223.13.137，ap-shanghai）**先作测试环境**；原有服务（PT-MGMT 容器、代理脚本、ngrok）已按用户授权全部清除，防火墙仅放行 22/80/443。测试期入口：①主站 vietnamlawyers.ai 跳转链接；②直接 IP 访问；**备案前只能用 http://IP:端口 形式（域名指向境内实例会被拦截），仅限虚构数据**。生产路线（境内备案 vs 香港/新加坡）待备案进展与 AC10 验证后确定。基线：Ubuntu 22.04／2C／3.3G／59G／Docker 26.1.3；密钥登录已验证；粗测上海→越南 HTTPS 3.9–5.5s。
- Credential management: the project-root .env (permissions 600, excluded via .gitignore) holds Lighthouse/Cloudflare/Kimi placeholders; Kimi system integration must use an API key (China and international platform keys are not interchangeable — must match the platform on which the account was created).
- 凭据管理：项目根目录 .env（权限 600，.gitignore 已排除）存放 Lighthouse/Cloudflare/Kimi 占位；Kimi 系统集成必须用 API key（中国与国际平台密钥不通用，需与所建平台一致）。
- O03–O08: Coordinator parameters, retention/preservation, vendors and data processing, SPEC numeric definitions, real-device/language evidence, restore drills, etc. — status in SPEC.md §16.
- O03–O08：协调员参数、留存/保全、供应商与数据处理、SPEC 数值定义、真机/语言证据、恢复演练等，状态见 SPEC.md 第16节。
- Note: SOW.md references archive/2026-09-30-before-sow-v1/SOW.v0.3.md, but that directory does not exist on this VPS; per instructions, archive is not used as input — this discrepancy is recorded only.
- 注意：SOW.md 提及 archive/2026-09-30-before-sow-v1/SOW.v0.3.md，但该目录不在本 VPS；按指令 archive 不作为输入，仅记录此差异。
