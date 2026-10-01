# SESSIONS.md — Session Log / 会话记录

> Append one entry per session; sessions in progress are marked 「进行中」 (in progress). Recording tokens, real case details, or personal contact information is forbidden.
>
> 每次会话追加一条；正在进行的会话标记「进行中」。禁止记录令牌、真实案情、个人联系方式。

## Session 2026-09-30-01 (Ended; continued by 2026-10-01-01 after interruption) / 会话 2026-09-30-01（已结束，中断后由 2026-10-01-01 接续）

- Date/Timezone: 2026-09-30, UTC (VPS system time, starting 02:32 UTC)<br>日期/时区：2026-09-30，UTC（VPS 系统时间 02:32 UTC 起）
- Environment: Linux VPS (Ubuntu, kernel 7.0.0-28, x86_64, hostname btc-trader); Node v24.19.0 / npm 11.17.0; Docker 29.1.3; git 2.53.0; no pnpm, no local PostgreSQL client; 25G free disk, 3.7Gi memory<br>环境：Linux VPS（Ubuntu，kernel 7.0.0-28，x86_64，hostname btc-trader）；Node v24.19.0 / npm 11.17.0；Docker 29.1.3；git 2.53.0；无 pnpm、无本地 PostgreSQL 客户端；磁盘余量 25G，内存 3.7Gi
- Goal for this session: confirm the VPS project directory; initialize missing record files; review SOW.md; produce review drafts of SPEC.md / PLAN.md; no business code<br>本次目标：确认 VPS 项目目录；初始化缺失记录文件；核对 SOW.md；形成 SPEC.md / PLAN.md 评审草案；不写业务代码

### Actual Actions / 实际动作

1. Confirmed working directory `/home/trader/ClientLawyerComm`: only SOW.md (v1.0) and VIBE_CODING_INPUT.md present; no git repo, no AGENTS.md, no SESSIONS/PROGRESS/CONTEXT, no archive/, no code of any kind.<br>确认工作目录 `/home/trader/ClientLawyerComm`：仅有 SOW.md（v1.0）与 VIBE_CODING_INPUT.md；无 git 仓库、无 AGENTS.md、无 SESSIONS/PROGRESS/CONTEXT、无 archive/、无任何代码。
2. Environment check (part of O01): results above; archive/2026-09-30-before-sow-v1/SOW.v0.3.md is not on the VPS; per instructions, archive is not used as input—differences are recorded only.<br>环境核查（O01 部分）：结果见上；archive/2026-09-30-before-sow-v1/SOW.v0.3.md 不在 VPS，按指令 archive 不作输入，仅记录差异。
3. Created CONTEXT.md, PROGRESS.md, SESSIONS.md, GLOSSARY.md.<br>新建 CONTEXT.md、PROGRESS.md、SESSIONS.md、GLOSSARY.md。
4. Reviewed SOW.md v1.0: scope, roles, MVP (R01–R11), acceptance criteria (AC01–AC12), and Open Items (O01–O08) are complete with no substantive scope gaps; SOW.md was not modified.<br>核对 SOW.md v1.0：范围、角色、MVP（R01–R11）、验收（AC01–AC12）、待落实（O01–O08）完整，无实质范围缺口；未修改 SOW.md。
5. Interrupted by the user while starting to write SPEC.md (the write was never persisted; no residual files); the user then activated the grill-with-docs process.<br>开始写 SPEC.md 时被用户中断（写入未落盘，无残留文件）；用户随后激活 grill-with-docs 流程。

### Changed Files / 变更文件

- Added: CONTEXT.md, PROGRESS.md, SESSIONS.md, GLOSSARY.md<br>新增：CONTEXT.md、PROGRESS.md、SESSIONS.md、GLOSSARY.md
- Modified: none (SOW.md and VIBE_CODING_INPUT.md untouched; the SPEC.md write was interrupted and never persisted)<br>修改：无（SOW.md、VIBE_CODING_INPUT.md 未动；SPEC.md 写入被中断且未落盘）

### Verification Results / 验证结果

- Documentation consistency self-check: SPEC.md requirement IDs map to SOW R01–R11 / AC01–AC12; PLAN.md tasks reference SPEC clauses. This is a documentation check, **not a product test**.<br>文档一致性自查：SPEC.md 需求编号映射 SOW R01–R11 / AC01–AC12；PLAN.md 任务引用 SPEC 条款。此为文档检查，**不是产品测试**。
- No dependencies installed, no code written, nothing deployed, no external notifications sent.<br>未安装依赖、未编码、未部署、未发送任何外部通知。

### Unfinished Items / 未完成项

- SPEC.md / PLAN.md pending user review(approval); O01–O08 undecided (recommended answers in SPEC.md Section 16).<br>SPEC.md / PLAN.md 待用户评审；O01–O08 待决（推荐答案见 SPEC.md 第16节）。
- git not initialized (recommended to do so after the review).<br>git 未初始化（建议评审后进行）。

### First Step Next Time / 下次第一步

User reviews SPEC.md / PLAN.md; after collecting feedback, revising, and freezing the versions, initialize git and start the TDD cycle from PLAN.md T01.<br>用户评审 SPEC.md / PLAN.md；收集意见修订并冻结版本后，初始化 git 并从 PLAN.md T01 开始 TDD 循环。

---

## Session 2026-10-01-01 (In Progress) / 会话 2026-10-01-01（进行中）

- Date/Timezone: 2026-10-01, UTC (VPS system time)<br>日期/时区：2026-10-01，UTC（VPS 系统时间）
- Goal for this session: per the grill-with-docs process, review whether SOW.md meets the VIBE_CODING_INPUT.md requirements, clarify and fill gaps; rewrite the SPEC.md / PLAN.md drafts<br>本次目标：按 grill-with-docs 流程审核 SOW.md 是否符合 VIBE_CODING_INPUT.md 要求，澄清缺口并完善；重写 SPEC.md / PLAN.md 草案

### Actual Actions / 实际动作

1. Confirmed the state after the previous interruption: SPEC.md was never persisted; workspace clean.<br>确认上轮中断状态：SPEC.md 未落盘，工作区干净。
2. SOW review: checked item by item against the 12 requirements in Section 2 of the instructions—all covered, no scope conflicts; identified 8 detail gaps/ambiguities.<br>SOW 审核：对照指令第2节 12 条逐项核查，全部覆盖、无范围冲突；识别 8 个细节缺口/模糊点。
3. First round of grilling questions Q1–Q8 (with recommended answers); the user replied 「全部同意」 (agree to all).<br>grill 第一轮提问 Q1–Q8（附推荐答案）；用户答复「全部同意」。
4. SOW.md upgraded to v1.1: 7 targeted revisions + appendix v1.1 change log + annotation of the missing-archive fact; fixed 2 leftover occurrences of the term 「审核员」 in the body text.<br>SOW.md 升级 v1.1：7 处定点修订＋附录 v1.1 变更记录＋archive 缺失事实标注；修正正文 2 处「审核员」术语残留。
5. GLOSSARY.md synchronized: revised 「用户」 and 「案件协调员」, added 「站内确认」.<br>GLOSSARY.md 同步：修订「用户」「案件协调员」，新增「站内确认」。
6. Created SPEC.md v0.1 (REQ-numbered requirements, message/translation/file/notification state machines, data model, API, recommended answers for O01–O08, AC→task mapping).<br>新建 SPEC.md v0.1（REQ 编号需求、消息/译文/文件/通知状态机、数据模型、API、O01–O08 推荐答案、AC→任务映射）。
7. Created PLAN.md v0.1 (T01–T12, dependency graph, per-task acceptance criteria/files/test commands).<br>新建 PLAN.md v0.1（T01–T12，依赖图、每任务验收标准/文件/测试命令）。
8. Updated PROGRESS.md; appended this session's record.<br>更新 PROGRESS.md；补记本会话。

### Changed Files / 变更文件

- Modified: SOW.md (v1.0→v1.1), GLOSSARY.md, PROGRESS.md, SESSIONS.md<br>修改：SOW.md（v1.0→v1.1）、GLOSSARY.md、PROGRESS.md、SESSIONS.md
- Added: SPEC.md, PLAN.md<br>新增：SPEC.md、PLAN.md

### Verification Results / 验证结果

- Documentation consistency self-check: terminology unified throughout SOW v1.1 (grep verified no leftover 「审核员」); SPEC requirements map to SOW R01–R11/AC01–AC12; PLAN tasks reference SPEC clauses. Documentation check ≠ product test.<br>文档一致性自查：SOW v1.1 各处术语统一（grep 验证无「审核员」残留）；SPEC 需求映射 SOW R01–R11/AC01–AC12；PLAN 任务引用 SPEC 条款。文档检查 ≠ 产品测试。
- No dependencies installed, no code written, nothing deployed, no external notifications sent.<br>未安装依赖、未编码、未部署、未发送外部通知。

### Unfinished Items / 未完成项

- SPEC.md / PLAN.md pending user review(approval); O01–O08 undecided (recommended answers in SPEC.md Section 16).<br>SPEC.md / PLAN.md 待用户评审；O01–O08 待决（推荐答案见 SPEC.md 第16节）。
- git not initialized.<br>git 未初始化。

### First Step Next Time / 下次第一步

User reviews SPEC.md / PLAN.md; after freezing the versions, initialize git and start the TDD cycle from T01.<br>用户评审 SPEC.md / PLAN.md；冻结版本后 git 初始化并从 T01 开始 TDD 循环。

### Additional Actions (2026-10-01, pre-review preparation per user instructions) / 追加动作（2026-10-01，用户指示的评审前准备）

1. Generated GitHub deploy key (~/.ssh/tool_ClientLawyerComm_deploy, ed25519), configured ~/.ssh/config alias github.com-ClientLawyerComm; public key handed to the user to add to AI-SaaS-VN/tool_ClientLawyerComm (requires Allow write access).<br>生成 GitHub deploy key（~/.ssh/tool_ClientLawyerComm_deploy，ed25519），配置 ~/.ssh/config 别名 github.com-ClientLawyerComm；公钥已交用户配置到 AI-SaaS-VN/tool_ClientLawyerComm（需 Allow write access）。
2. git init (main branch) and set origin; .gitignore excludes .env/node_modules etc.; no commit yet—documentation baseline commit pending SPEC/PLAN review.<br>git init（main 分支）并设置 origin；.gitignore 排除 .env/node_modules 等；暂不提交，待 SPEC/PLAN 评审后做文档基线提交。
3. Created .env placeholder file (permissions 600, placeholders only, no secrets): LIGHTHOUSE_HOST=124.223.13.137 plus username/password, CLOUDFLARE_API_TOKEN/ZONE_ID, DEEPSEEK_API_KEY, etc., awaiting user input.<br>创建 .env 占位文件（权限 600，仅占位符无机密）：LIGHTHOUSE_HOST=124.223.13.137 及用户名/密码、CLOUDFLARE_API_TOKEN/ZONE_ID、DEEPSEEK_API_KEY 等待用户填写。
4. Explained to the user: programmatic Cloudflare operations require an API Token (Google OAuth cannot be automated); the DeepSeek web version is unsuitable for system integration—an API key is required.<br>已向用户说明：Cloudflare 程序操作须用 API Token（Google OAuth 无法自动化）；DeepSeek 网页版不适合系统集成，须用 API key。
5. Updated CONTEXT.md / PROGRESS.md: O01/O02 status advanced (repository and deployment target specified, credentials pending, publish authorization not granted).<br>更新 CONTEXT.md / PROGRESS.md：O01/O02 状态推进（仓库与部署目标已指定，凭据待填，发布授权未给）。

### Additional Actions 2 (2026-10-01, after user completed credential configuration) / 追加动作 2（2026-10-01，用户完成凭据配置后）

1. GitHub deploy key: configured by the user; `ssh -T` verification passed (Hi AI-SaaS-VN/tool_ClientLawyerComm).<br>GitHub deploy key：用户已配置，`ssh -T` 验证通过（Hi AI-SaaS-VN/tool_ClientLawyerComm）。
2. Cloudflare re-check: values in .env were changing between reads (user still editing); Token/Zone ID were read as empty at one point, and their lengths did not match Cloudflare formats (Token should be 40 characters, Zone ID should be 32 hex digits); a format checklist was provided—re-test pending after the user finishes editing.<br>Cloudflare 复核：.env 多次读取间值在变化（用户编辑中）；曾读到 Token/Zone ID 为空，且长度不符 Cloudflare 格式（Token 应 40 字符、Zone ID 应 32 位 hex）；已给出格式检查清单，待用户完成编辑后复测。
3. Lighthouse: sudo requires a password and sshpass is unavailable, so non-interactive password login is impossible; generated key pair ~/.ssh/lighthouse_deploy and handed the public key to the user to add to the server's authorized_keys; also found LIGHTHOUSE_SSH_USER suspected of containing a space—pending user confirmation. Deployment actions await code output and O02 confirmation; only baseline checks are planned for now.<br>Lighthouse：sudo 需密码、无 sshpass，无法非交互密码登录；已生成密钥对 ~/.ssh/lighthouse_deploy，公钥交用户加入服务器 authorized_keys；另发现 LIGHTHOUSE_SSH_USER 疑含空格，待用户确认。部署动作待代码产出与 O02 确认，当前仅计划基线核查。
4. Translation LLM: per user instruction, DeepSeek → Kimi (Moonshot AI). .env placeholders replaced with KIMI_API_KEY/BASE_URL/MODEL; SOW upgraded to v1.2 (6.3, O05, appendix change log); SPEC (REQ-TR-03, O05), PLAN (T06 kimi-adapter.ts), CONTEXT, PROGRESS synchronized.<br>翻译 LLM：按用户指示 DeepSeek → Kimi（Moonshot AI）。.env 已替换为 KIMI_API_KEY/BASE_URL/MODEL 占位；SOW 升 v1.2（6.3、O05、附录变更记录）；SPEC（REQ-TR-03、O05）、PLAN（T06 kimi-adapter.ts）、CONTEXT、PROGRESS 同步。

### Additional Actions 3 (2026-10-01, credential re-check) / 追加动作 3（2026-10-01，凭据复核）

1. GitHub: re-test passed.<br>GitHub：复测通过。
2. Cloudflare: API re-check passed—zone vietnamlawyers.ai, status active (Token/Zone ID valid).<br>Cloudflare：API 复核通过——zone vietnamlawyers.ai，status active（Token/Zone ID 有效）。
3. Kimi: re-check failed—KIMI_BASE_URL was mistakenly filled as `kimi.com/code` (not an API endpoint), and KIMI_MODEL contains whitespace; correction guidance provided, re-test pending after fixes.<br>Kimi：复核未通过——KIMI_BASE_URL 误填为 `kimi.com/code`（非 API 端点），KIMI_MODEL 含空白字符；已给出修正指引，待改后复测。
4. Lighthouse region: IP attribution lookup shows Tencent Cloud Shanghai (CN, AS45090). A mainland instance differs substantively from the SOW's default Hong Kong/Singapore route (ICP filing, network quality toward Vietnam, cross-border data analysis); submitted for user decision and recorded in CONTEXT/PROGRESS.<br>Lighthouse 地域：IP 归属查询为腾讯云上海（CN，AS45090）。境内实例与 SOW 香港/新加坡默认路线存在实质差异（ICP 备案、越南方向网络质量、数据跨境分析），已提交用户决策并记入 CONTEXT/PROGRESS。
5. LIGHTHOUSE_SSH_USER fixed (len=6, no whitespace).<br>LIGHTHOUSE_SSH_USER 已修正（len=6，无空白）。

### Additional Actions 4 (2026-10-01, Kimi re-check and deployment plan) / 追加动作 4（2026-10-01，Kimi 复核与部署方案）

1. Kimi re-check passed: base URL valid, key valid (GET /models returned 4 models: kimi-k3, kimi-k2.7-code, kimi-k2.7-code-highspeed, kimi-k2.6), KIMI_MODEL is in the list, and a minimal real chat call succeeded (billing usable).<br>Kimi 复核通过：base URL 合法、key 有效（GET /models 返回 4 个模型：kimi-k3、kimi-k2.7-code、kimi-k2.7-code-highspeed、kimi-k2.6）、KIMI_MODEL 在列表中、极小真实对话调用成功（计费可用）。
2. User selected the Lighthouse key-based login plan: key pair already generated locally (~/.ssh/lighthouse_deploy); public key installation instructions handed to the user.<br>用户选定 Lighthouse 密钥登录方案：密钥对本机已生成（~/.ssh/lighthouse_deploy），公钥安装指引已交用户。
3. User raised that the ICP filing timeline is too long and asked about alternatives (Cloudflare hosting, Grok VM, etc.). Replied: Grok has no VM product for hosting applications (a misunderstanding); Cloudflare hosting avoids filing but involves heavy engineering and unstable mainland access (SOW plan D); recommended Hong Kong/Singapore Lighthouse (minute-level provisioning, no filing required, matches the SOW default route)—the Shanghai instance can be kept as a staging environment or refunded. Pending user decision.<br>用户提出 ICP 周期太长，询问替代方案（Cloudflare 托管、Grok VM 等）。已回复：Grok 无可托管应用的 VM 产品（误解）；Cloudflare 托管免备案但工程量大且大陆访问不稳定（SOW 方案 D）；推荐香港/新加坡 Lighthouse（分钟级开通、免备案、符合 SOW 默认路线），上海实例可留作预发或退费。待用户决策。

### Additional Actions 5 (2026-10-01, Lighthouse key verification and baseline check) / 追加动作 5（2026-10-01，Lighthouse 密钥验证与基线核查）

1. Key-based login verification passed (BatchMode, no password needed).<br>密钥登录验证通过（BatchMode，无需密码）。
2. Baseline: Ubuntu 22.04 x86_64, 2 vCPU, 3.3Gi memory, 59G disk (47G free), Docker 26.1.3, git/curl/python3/node all present, no nginx, ufw present; metadata region=ap-shanghai.<br>基线：Ubuntu 22.04 x86_64、2 vCPU、3.3Gi 内存、59G 磁盘（余 47G）、Docker 26.1.3、git/curl/python3/node 齐、无 nginx、有 ufw；元数据 region=ap-shanghai。
3. Security findings: Redis 6379 and PostgreSQL 5432 listening on 0.0.0.0, plus a service on 8080 and one on 4040 (local)—the instance hosts other workloads; user prompted to confirm whether this exposure is intentional; firewall (ufw) hardening plan to be executed after user confirmation.<br>安全发现：Redis 6379 与 PostgreSQL 5432 监听 0.0.0.0，另有 8080 服务与 4040（本机）——实例承载其他工作负载；已提示用户确认是否有意公开，防火墙（ufw）加固方案待用户确认后执行。
4. Single-point rough test toward Vietnam: vnexpress.net 5.5s, zalo.me 3.9s, cloudflare.com 9.5s, Kimi CN API 0.26s; ping to Vietnam VNPT 100% packet loss (ICMP may be blocked). Conclusion: Shanghai→Vietnam direction is slow, suitable as a test environment; production still requires AC10 real-world verification (formal testing needs real devices on the Vietnam side, which is O07).<br>越南方向单点粗测：vnexpress.net 5.5s、zalo.me 3.9s、cloudflare.com 9.5s、Kimi CN API 0.26s；ping 越南 VNPT 100% 丢包（ICMP 可能被拦）。结论：上海→越南方向慢，适合作测试环境，生产仍须 AC10 真实验证（正式测试需越南端真实设备，属 O07）。
5. User decision recorded: Shanghai instance = test environment, ICP filing to be applied for later, production route TBD (SPEC O02, CONTEXT, PROGRESS updated).<br>用户决策已记录：上海实例=测试环境，ICP 备案后续申请，生产路线待定（SPEC O02、CONTEXT、PROGRESS 已更新）。

### Additional Actions 6 (2026-10-01, instance cleanup and test access methods) / 追加动作 6（2026-10-01，实例清理与测试访问方式）

1. User authorized deletion of all existing services on the instance. Actually removed: the PT-MGMT project's postgres:16-alpine and redis:7-alpine containers along with their volumes and images, mcp_proxy.py (8080), qcc_proxy.py residual files, and the ngrok tunnel; the pg dump attempt came back empty (backup file deleted). Note: inside the remote script, pkill -f twice killed the SSH session itself (the pattern matched the script text); switched to pkill -x to finish.<br>用户授权删除实例全部现有服务。实际清除：PT-MGMT 项目的 postgres:16-alpine 与 redis:7-alpine 容器及卷与镜像、mcp_proxy.py（8080）、qcc_proxy.py 残留文件、ngrok 隧道；pg 转储尝试为空（备份文件已删）。注意：远程脚本内 pkill -f 曾两次误杀 SSH 会话自身（模式匹配到脚本文本），改用 pkill -x 完成。
2. Firewall: ufw enabled, allowing only 22/80/443; re-check showed only sshd and systemd-resolve listening; docker pruned; 47G disk free.<br>防火墙：ufw 启用，仅放行 22/80/443；复核仅剩 sshd 与 systemd-resolve 监听；docker 已 prune；磁盘余 47G。
3. User specified two entry methods for the test period: ① a redirect link from the main site vietnamlawyers.ai page; ② direct IP access. Constraints recorded: before the ICP filing completes, only the http://IP:port form can be used (pointing the domain to a mainland instance on 80/443 will be blocked by Tencent Cloud), and direct IP access has no TLS and is limited to fictitious data.<br>用户指定测试期两种入口：①主站 vietnamlawyers.ai 页面跳转链接；②直接 IP 访问。已记录约束：备案完成前只能用 http://IP:端口 形式（域名指向境内实例 80/443 会被腾讯云拦截）、IP 直连无 TLS 仅限虚构数据。
4. SOW upgraded to v1.3 (appendix change log); SPEC O02, CONTEXT, PROGRESS synchronized. User indicated they would begin reviewing SPEC/PLAN next.<br>SOW 升 v1.3（附录变更记录）；SPEC O02、CONTEXT、PROGRESS 同步。用户表示随后开始评审 SPEC/PLAN。

### Additional Actions 7 (2026-10-01, revising SPEC/PLAN per review feedback) / 追加动作 7（2026-10-01，按评审意见修订 SPEC/PLAN）

1. User review feedback is in 2026OCT1-REVIEW.md (7 items). Several items change the approved scope; implemented per the principle 「changes explicitly approved by the user take precedence」: MVP has email-only registration (phone/SMS moved to P1); languages Chinese (Simplified/Traditional)/Vietnamese/English; Cross-case Mix-up Prevention UI moved to P1 (server-side case isolation retained); retainer fee detection narrowed to explicit-inquiry triggering (deterministic blocking of contact information retained—this interpretation was noted to the user in the reply); DOCX bilingual output moved to P1; the Case Coordinator may participate in chat (superseding v1.1 Q3); the System Operations Administrator has an independent account.<br>用户评审意见见 2026OCT1-REVIEW.md（7 条）。其中多项改变已批准范围，按「用户明确批准的变更优先」落实：MVP 仅邮箱注册（手机/短信移 P1）；语言中（简/繁）/越/英；防串案界面移 P1（服务端案件隔离保留）；委托费用检测收窄为显式问询触发（联系方式确定性拦截保留，已在回复中向用户注明此解释）；DOCX 双语移 P1；协调员可参与聊天（取代 v1.1 Q3）；运维管理员独立账号。
2. SOW upgraded to v1.4 (R table, 4.3, 5.1, 5.2, 6.1, 7.1, Sections 8/9/9.1, AC table, O table, appendix v1.4 record); SPEC upgraded to v0.2 (scope, REQ-PM/AUTH/CASE/TR/MOD/DOC/NTF/REV, data model, O table, AC mapping); PLAN upgraded to v0.2 (T02/T03/T05/T06/T07/T09 moved to P1/T10/T12, overview, dependency graph); GLOSSARY, CONTEXT, PROGRESS synchronized.<br>SOW 升 v1.4（R 表、4.3、5.1、5.2、6.1、7.1、第8/9/9.1节、AC 表、O 表、附录 v1.4 记录）；SPEC 升 v0.2（范围、REQ-PM/AUTH/CASE/TR/MOD/DOC/NTF/REV、数据模型、O 表、AC 映射）；PLAN 升 v0.2（T02/T03/T05/T06/T07/T09 移 P1/T10/T12、总览、依赖图）；GLOSSARY、CONTEXT、PROGRESS 同步。
3. Pending user confirmation to freeze the versions, then git commit the documentation baseline and start work from T01.<br>待用户确认后冻结版本，随后 git 提交文档基线并从 T01 开工。

### Additional Actions 8 (2026-10-01, new P1 Daily Case Digest email) / 追加动作 8（2026-10-01，新增 P1 案件日报邮件）

1. User proposed a new post-MVP feature: every day at 24:00 Vietnam time, email the day's conversation records and corresponding uploaded attachments to all Vietnamese Lawyers on the case (the Coordinator can set to stop sending to a specific Lawyer) and to the Coordinator; subject 「Case Name-Send Date-Record」 (e.g., DG-Juyang-2026OCT8-Record); the case name is required when creating a case and registering both parties' email addresses.<br>用户提出 MVP 之后版本新增功能：每日越南时间 24:00 将当日对话记录与对应上传附件邮件发送给本案全部越南律师（协调员可设置终止对某律师的发送）与协调员；标题「案件名称-发送日-Record」（如 DG-Juyang-2026OCT8-Record），案件名称在创建案件注册双方邮箱时必填。
2. Implemented: SOW upgraded to v1.5 (4.3 P1 row + appendix change log); SPEC upgraded to v0.3 (new Section 10.3 REQ-DIG-01~06, REQ-CASE-01 case name required, data model cases.title/case_members.digest_opt_out/digest_runs); PLAN upgraded to v0.3 (new T13, depends on T07/T08/T12); GLOSSARY added 「案件日报」 (Daily Case Digest). Key points clarified: daily aggregation at 00:00 Asia/Ho_Chi_Minh for the previous Vietnam calendar day, published content only, sent individually per person, no send when no content or archived, attachments ≤20MB with splitting when exceeded, reuses the notification task queue.<br>已落实：SOW 升 v1.5（4.3 P1 行＋附录变更记录）；SPEC 升 v0.3（新增 10.3 节 REQ-DIG-01~06、REQ-CASE-01 案件名称必填、数据模型 cases.title/case_members.digest_opt_out/digest_runs）；PLAN 升 v0.3（新增 T13，依赖 T07/T08/T12）；GLOSSARY 新增「案件日报」。明确要点：每日 00:00 Asia/Ho_Chi_Minh 汇总上一越南日历日、仅含已发布内容、逐人单独发送、无内容/归档不发、附件 ≤20MB 超限拆分、复用通知任务队列。
3. Pending user confirmation to freeze.<br>待用户确认冻结。
