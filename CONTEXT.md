# CONTEXT.md — Stable Background and File Navigation / 稳定背景与文件导航

- Last updated: 2026-10-01 (UTC)
- 更新日期：2026-10-01（UTC）
- Purpose: keeps only the product background, confirmed decisions, file navigation, and unresolved environment conditions. Records no credentials, real case details, or personal contact information.
- 用途：仅保留产品背景、已确认决策、文件导航和未解决的环境条件。不记录凭据、真实案情、个人联系方式。

## Product Background (Approved, Not to Be Re-discussed) / 产品背景（已批准，不重新讨论）

- A Chinese–Vietnamese bilingual Case communication system: Chinese Client — Vietnamese Lawyer — Case Coordinator, web-based (mobile/desktop browsers), no WeChat/Zalo required.
- 中越双语案件沟通系统：中国客户—越南律师—案件协调员，网页端（手机/电脑浏览器），无需 WeChat/Zalo。
- Users, chats, files, and permissions are isolated by Case. The administrator is created by local bootstrap. MVP has one Case, so a Coordinator, Chinese Client, or Vietnamese Lawyer joins it only by completing the activation email sent to the address that was entered, and that invitation is bound to the email (v1.9). Later, one Vietnamese Lawyer may join many Cases; an additional-case invitation code is then not bound to an email (P1, REQ-AUTH-12). Phone registration is P1.
- 以案件隔离用户、聊天、文件和权限。管理员由本地引导创建。MVP 只有一个案件，协调员、中国客户或越南律师只有完成发到为其输入的那个邮箱的激活邮件才加入，且该邀请绑定邮箱（v1.9）。以后一名越南律师可以参加多个案件，那时追加案件的邀请码不绑定邮箱（P1，REQ-AUTH-12）。手机注册为 P1。
- Content restrictions apply only to Litigation Retainer Fees (MVP: explicit inquiry/negotiation triggers Pending Review only, v1.4) and to either party's direct contact information; Case Amount (claims/compensation/settlement, etc.) is unrestricted.
- 内容限制仅针对诉讼委托费用（MVP 仅显式问询/协商触发待审，v1.4）与双方直接联系方式；案件金额（诉讼请求/赔偿/和解等）不受限。
- Suspected restricted content and files must be Reviewed by the Coordinator before Publish; entering Pending Review automatically sends an Urgent Alert to the Coordinator; nothing is ever auto-released on timeout.
- 疑似受限内容与文件须经协调员审核后发布；进入待审自动向协调员发紧急提醒；超时绝不自动放行。
- MVP includes two-way Urgent Alerts (email channel), file sharing (PDF/DOCX/JPG/PNG, 20MB), Permission Revocation, Archive, administrator MFA (separate admin account), Audit Trail, Backup and Restore; languages are Chinese (Simplified/Traditional)/Vietnamese/English; the Coordinator may participate in chat (v1.4). Moved to P1: phone registration/SMS, DOCX Bilingual Parallel Document, Cross-case Mix-up Prevention UI, Daily Case Digest email (v1.5), and additional-case invitation codes that are not bound to an email (v1.9).
- MVP 含双向紧急提醒（邮件渠道）、文件分享（PDF/DOCX/JPG/PNG，20MB）、权限撤销、归档、管理员 MFA（独立管理员账号）、审计、备份恢复；语言为中（简/繁）/越/英；协调员可参与聊天（v1.4）。移至或新增于 P1：手机注册/短信、DOCX 双语对照、防串案界面、案件日报邮件（v1.5），以及不绑定邮箱的追加案件邀请码（v1.9）。

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
| SOW.md | v1.9 execution baseline. MVP invitation is bound to the entered email; later additional-case codes are not<br>v1.9 执行基线。MVP 邀请绑定被输入的邮箱；以后追加案件的邀请码不绑定 |
| VIBE_CODING_INPUT.md | Historical launch-instruction entry point. Where it conflicts with SOW v1.9, SOW prevails. The historical body is kept and still contains superseded sentences<br>历史启动指令入口。与 SOW v1.9 冲突时以 SOW 为准。历史正文保留，其中仍有已被取代的句子 |
| SPEC.md | v0.7 requirements, permissions, state machines, data, API, and exceptions<br>v0.7 需求、权限、状态机、数据、API 与异常 |
| PLAN.md | v0.7 task breakdown. P0 is T01–T08 and T10–T12. T01 is done. T02 binds the activation to the entered email. REQ-AUTH-12, T09, and T13 are P1<br>v0.7 任务拆分。P0 为 T01–T08 与 T10–T12。T01 已完成。T02 把激活绑定到被输入的邮箱。REQ-AUTH-12、T09 与 T13 属于 P1 |
| CURSOR_REVIEW.md | 2026-10-01 design-consistency review, plus the user's later decisions in Section 4<br>2026-10-01 设计一致性复核，以及第 4 节中用户随后作出的决定 |
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
