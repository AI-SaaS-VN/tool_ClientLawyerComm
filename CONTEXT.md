# CONTEXT.md — Stable Background and File Navigation / 稳定背景与文件导航

- Last updated: 2026-10-09 (UTC+8)
- 更新日期：2026-10-09（UTC+8）
- Purpose: keeps only the product background, confirmed decisions, file navigation, and unresolved environment conditions. Records no credentials, real case details, or personal contact information.
- 用途：仅保留产品背景、已确认决策、文件导航和未解决的环境条件。不记录凭据、真实案情、个人联系方式。

## Product Background (Approved, Not to Be Re-discussed) / 产品背景（已批准，不重新讨论）

- A Chinese–Vietnamese bilingual Case communication system: Chinese Client — Vietnamese Lawyer — Case Coordinator, web-based (mobile/desktop browsers), no WeChat/Zalo required.
- 中越双语案件沟通系统：中国客户—越南律师—案件协调员，网页端（手机/电脑浏览器），无需 WeChat/Zalo。
- Users, chats, files, and permissions are isolated by Case. The administrator is created by local bootstrap. A Coordinator, Chinese Client, or Vietnamese Lawyer receives one activation email at the address that was entered. The activation code is bound to that email, the Case, and the role (v1.11, MVP). Only that email can accept it. The same email and the same code open that case again afterwards. The same email accepts a later code for another Case on the same account. Phone registration is P1. The repository implements this one-step path.
- 以案件隔离用户、聊天、文件和权限。管理员由本地引导创建。协调员、中国客户或越南律师在被输入的地址收到一封激活邮件。激活码绑定该邮箱、案件与角色（v1.11，MVP）。只有该邮箱可以接受。之后仍用同一邮箱和同一个邀请码进入该案件。同一邮箱以后接受另一个案件的激活码时，加入同一账号。手机注册为 P1。本仓库已实现这一步激活。
- The only publish hold is an explicit inquiry or negotiation about the firm's litigation retainer fee, in a message or a file name (decided 2026-10-03). Ordinary messages, contact details, case amounts, and clean files publish immediately. A display name that contains a contact channel is still rejected on save. Entering pending review alerts the coordinator; timeout never publishes.
- 唯一的发布拦截是消息或文件名里显式询问或协商律所诉讼委托费用（2026-10-03 决定）。普通消息、联系方式、案件金额和扫描通过的文件立即发布。显示名含联系渠道时仍拒绝保存。进入待审会提醒协调员；超时绝不发布。
- Confirmed 2026-10-09: automatic mode calls Kimi. A lawyer's Vietnamese message is shown in the client's current screen language. That language is Simplified Chinese unless the client has switched to Traditional Chinese. A client's Chinese message is shown to the lawyer as Vietnamese.
- 2026-10-09 确认：自动模式调用 Kimi。律师的越南语，客户看到自己当前的屏幕语言。默认是简体中文，客户自己切换后才是繁体中文。客户的中文，律师看到越南语。
- Confirmed 2026-10-09: a Chinese Client's default screen is Simplified Chinese. A Vietnamese Lawyer's default screen is Vietnamese. A Coordinator's default screen is Simplified Chinese. Traditional Chinese appears only after the client switches it. Each person sees that one language on labels, buttons, and automatic-mode messages from other people. The application still defaults a client to Traditional Chinese until PLAN F18.
- 2026-10-09 确认：中国客户默认看到简体中文。越南律师默认看到越南语。协调员默认看到简体中文。繁体中文只在客户自己切换后出现。按钮、提示，以及自动模式下别人发来的消息，都用这一种语言。应用代码仍把客户默认成繁体中文，直到 PLAN F18。
- Every conversation record and every upload record the viewer can see shows a timestamp formatted with that computer's timezone setting, and the offset is printed beside the time. A UTC+8 computer shows UTC+8. A UTC+7 computer shows UTC+7. The role does not choose the offset (confirmed 2026-10-03).
- 观看者能看到的每条对话记录和每条上传记录都按那台电脑的时区设置显示时间，并在时间旁边标出时区。设为 UTC+8 的电脑标 UTC+8。设为 UTC+7 的电脑标 UTC+7。时区不按角色写死（2026-10-03 确认）。
- MVP includes two-way Urgent Alerts (email channel), file sharing (PDF/DOCX/JPG/PNG, 20MB), Permission Revocation, Archive, administrator MFA (separate admin account), Audit Trail, Backup and Restore, one-step activation bound to the invited email (v1.11), and a Daily Case Digest sent only to the Coordinator (2026-10-04; not built yet). Languages are Chinese (Simplified/Traditional)/Vietnamese/English. The Coordinator may participate in chat (v1.4). Later: phone registration/SMS, DOCX bilingual documents, the cross-case UI, sending the digest to Lawyers, and the case-creation page.
- MVP 含双向紧急提醒（邮件渠道）、文件分享（PDF/DOCX/JPG/PNG，20MB）、权限撤销、归档、管理员 MFA（独立管理员账号）、审计、备份恢复、绑定受邀邮箱的一步激活（v1.11），以及只发给协调员的案件日报（2026-10-04；尚未实现）。语言为中（简/繁）/越/英。协调员可参与聊天（v1.4）。后续：手机注册/短信、DOCX 双语对照、防串案界面、把日报也发给律师、建案页面。

## Confirmed Technical Direction (technical defaults; reversible details may be optimized but must be recorded) / 已确认技术方向（技术默认值，可逆细节可优化但须记录）

- TypeScript / Next.js modular monolith + PostgreSQL + private object storage + database-persisted task queue.
- TypeScript / Next.js 模块化单体 + PostgreSQL + 私有对象存储 + 数据库持久任务队列。
- HTTP for sending + SSE for receiving/incremental catch-up after reconnect; no microservices/K8s/cross-region dual-write.
- HTTP 发送 + SSE 接收/断线增量拉取；不引入微服务/K8s/跨区双写。
- External capabilities behind replaceable interfaces: TranslationProvider (Kimi/Moonshot AI designated as candidate by the user on 2026-10-01), SmsProvider, EmailProvider; use mature components for authentication.
- 外部能力经可替换接口：TranslationProvider（Kimi/Moonshot AI 为用户 2026-10-01 指定候选）、SmsProvider、EmailProvider；认证用成熟组件。
- Vietnamlawyers.ai main-site entry + separate subdomain app; production prefers Hong Kong/Singapore VPS, subject to verification by the operations owner and China–Vietnam network testing.
- Vietnamlawyers.ai 主站入口 + 独立子域名应用；生产优先香港/新加坡 VPS，须运维负责人与中越网络验证。

## Lookup Tools / 查询工具

- Vietnam Company Registry (2026-10-09): the public site for a Vietnamese company's business-registration record. Each Case calls it automatically for the Target Company, usually the defendant. Only the Case Coordinator sees what was found. https://dangkyquamang.dkkd.gov.vn/auth/Public/LogOn.aspx?ReturnUrl=%2fonline%2fdefault.aspx
- 越南公司工商登记查询（2026-10-09）：查询一家越南公司工商登记资料的公开网站。每个案件自动用它查询目标公司，目标公司通常是被告。只有案件协调员能看到查到的资料。https://dangkyquamang.dkkd.gov.vn/auth/Public/LogOn.aspx?ReturnUrl=%2fonline%2fdefault.aspx

## File Navigation / 文件导航

| File / 文件 | Responsibility / 职责 |
| --- | --- |
| SOW.md | v1.13 execution baseline. Companions are SPEC v0.23 and PLAN v0.23. Section 4.4 and REQ-THREAD are implemented<br>v1.13 执行基线。配套是 SPEC v0.23 与 PLAN v0.23。第 4.4 节与 REQ-THREAD 已实现 |
| VIBE_CODING_INPUT.md | Historical launch-instruction entry point. Where it conflicts with SOW v1.11, SOW prevails. The historical body is kept and still contains superseded sentences<br>历史启动指令入口。与 SOW v1.11 冲突时以 SOW 为准。历史正文保留，其中仍有已被取代的句子 |
| SPEC.md | v0.23 requirements. Second phase, DOCX bilingual document, administration console, and the message-and-file thread are implemented.<br>v0.23 需求。第二阶段、DOCX 双语对照、管理控制台和消息与附件同一条对话已实现。 |
| PLAN.md | v0.23 task breakdown. T19 is on `/new/` with the pilot case copied in. The daily digest email is off on both processes.<br>v0.23 任务拆分。T19 在 `/new/`，并带入试点案件。每日总结邮件在两个进程上都已停发。 |
| README.md | Project overview, commands, and repo map (replaced the create-next-app boilerplate 2026-10-03)<br>项目概览、命令与仓库地图（2026-10-03 替换 create-next-app 模板） |
| docs/runbook/mvp-test-case.md | REQ-OPS-07 runbook: one-step activation with the invited email and the activation code<br>REQ-OPS-07 运行指引：用受邀邮箱和激活码一步激活 |
| docs/deployment.md | Service composition, env-var list, migrations, backup/restore, test-period entry caveats<br>服务组成、环境变量清单、迁移、备份/恢复、测试期入口注意事项 |
| CURSOR_REVIEW.md | 2026-10-01 design-consistency review, plus later decisions through Section 8 (one-step activation)<br>2026-10-01 设计一致性复核，以及直到第 8 节的后续决定（一步激活） |
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
- O02: User decision on 2026-10-01: Shanghai Lighthouse (124.223.13.137, ap-shanghai) **is the designated test environment**. As of 2026-10-03 the application is deployed there and the public entry is HTTP port 80 (fictitious data only; CLC_FICTITIOUS_TEST_HOST=1 because O05 still blocks real SMTP and Kimi). Automated tests stay on localhost of the development host. On that host, the original services (PT-MGMT container, proxy scripts, ngrok) were all removed with the user's authorization, and the firewall allows only ports 22/80/443. Test-period entry points: ① redirect link from the main site vietnamlawyers.ai; ② direct IP access; **before ICP filing, only the http://IP:端口 form may be used (a domain pointing to a mainland instance will be blocked), and only fictitious data is allowed**. The production route (mainland ICP filing vs Hong Kong/Singapore) will be decided after filing progress and AC10 verification. Baseline: Ubuntu 22.04 / 2C / 3.3G / 59G / Docker 26.1.3; key-based login verified; rough measurement Shanghai→Vietnam HTTPS 3.9–5.5s. On 2026-10-09 the user moved later test deployments to the US test machine. That machine has no public entry and the application is not deployed there yet. The pilot already running on the Shanghai test machine stays there. Its place and operating notes go only in `LOCAL_DEV_NOTES.md`.
- O02：用户 2026-10-01 决定：上海 Lighthouse（124.223.13.137，ap-shanghai）**为指定测试环境**。截至 2026-10-03 应用已部署到该机，对外入口为 HTTP 80 端口（仅虚构数据；因 O05 仍挡住真实 SMTP 与 Kimi，故设 `CLC_FICTITIOUS_TEST_HOST=1`）。自动化测试仍使用研发主机的 localhost。该机上原有服务（PT-MGMT 容器、代理脚本、ngrok）已按用户授权全部清除，防火墙仅放行 22/80/443。测试期入口：①主站 vietnamlawyers.ai 跳转链接；②直接 IP 访问；**备案前只能用 http://IP:端口 形式（域名指向境内实例会被拦截），仅限虚构数据**。生产路线（境内备案 vs 香港/新加坡）待备案进展与 AC10 验证后确定。基线：Ubuntu 22.04／2C／3.3G／59G／Docker 26.1.3；密钥登录已验证；粗测上海→越南 HTTPS 3.9–5.5s。2026-10-09 用户决定：后续测试部署改到美国测试机；该机尚无公网入口，应用尚未部署，上海测试机上已在运行的试点不搬迁。美国测试机的所在地与操作细节只写入 `LOCAL_DEV_NOTES.md`。
- Credential management: as of 2026-10-09 the project-root `.env` (permissions 600, gitignored) is the US test machine's env file. The previous file, including Lighthouse and Cloudflare entries, is `.env.lighthouse-test` (also gitignored). Kimi system integration must use an API key (China and international platform keys are not interchangeable — must match the platform on which the account was created). Values stay out of committable files.
- 凭据管理：2026-10-09 起，项目根目录 `.env`（权限 600，不入库）是美国测试机的环境文件。原先含 Lighthouse 与 Cloudflare 条目的文件改名为 `.env.lighthouse-test`（同样不入库）。Kimi 系统集成必须用 API key（中国与国际平台密钥不通用，需与所建平台一致）。具体值不写入可提交文件。
- O03–O08: Coordinator parameters, retention/preservation, vendors and data processing, SPEC numeric definitions, real-device/language evidence, restore drills, etc. — status in SPEC.md §16.
- O03–O08：协调员参数、留存/保全、供应商与数据处理、SPEC 数值定义、真机/语言证据、恢复演练等，状态见 SPEC.md 第16节。
- Note: SOW.md references archive/2026-09-30-before-sow-v1/SOW.v0.3.md, but that directory does not exist on this VPS; per instructions, archive is not used as input — this discrepancy is recorded only.
- 注意：SOW.md 提及 archive/2026-09-30-before-sow-v1/SOW.v0.3.md，但该目录不在本 VPS；按指令 archive 不作为输入，仅记录此差异。
