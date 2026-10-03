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

### Additional Actions 9 (2026-10-01, freeze and T01 start) / 追加动作 9（2026-10-01，冻结与 T01 开工）

1. Docs frozen: all design docs (SOW/SPEC/PLAN/GLOSSARY/CONTEXT/PROGRESS/SESSIONS) converted to EN+CN bilingual via 7 parallel subagents (PLAN.md agent crashed once on token refresh, resumed OK); excluded 2026OCT1-REVIEW.md and VIBE_CODING_INPUT.md per user instruction. Root commit fa4d85d pushed to origin/main.<br>文档冻结：7 个设计文档经并行子代理双语化（PLAN.md 代理曾因 token 刷新中断，已恢复完成）；按用户指示排除 2026OCT1-REVIEW.md 与 VIBE_CODING_INPUT.md。首次提交 fa4d85d 已推送 origin/main。
2. T01 started via coder subagent (crashed twice on token refresh; parent took over). Done: create-next-app scaffold (Next 16.3.8 / React 19.2.8 / Tailwind 4 / TS5); docker-compose with postgres:16-alpine + bitnamilegacy/minio:2025.5.24-debian-12-r5 (Docker Hub returns 401 for minio/* org — bitnamilegacy drop-in); both containers healthy; package.json fixed (name=clientlawyercomm, @types/node ^24 resolving ERESOLVE with vitest@5.0.3, scripts setup/test/test:int/test:e2e); deps installed (@prisma/client 7.10.0, prisma 7.10.0, vitest, @playwright/test); test files written (vitest.config.ts, tests/unit/health.test.ts, playwright.config.ts, tests/e2e/smoke.spec.ts using request fixture — no browser needed); .env appended with dev vars via shell (no secret read).<br>T01 经子代理开工（两次 token 中断后由主代理接手）。已完成：create-next-app 骨架（Next 16.3.8 / React 19.2.8 / Tailwind 4 / TS5）；docker-compose 用 postgres:16-alpine＋bitnamilegacy/minio（Docker Hub 对 minio/* 返回 401）；两容器健康；package.json 修复（name、@types/node ^24 解决与 vitest@5.0.3 的 ERESOLVE、scripts）；依赖安装（@prisma/client 7.10.0、prisma 7.10.0、vitest、@playwright/test）；测试文件已写（e2e 用 request fixture，不需浏览器）；.env 经 shell 追加开发变量（未读取机密）。
3. Current blocker: `npx prisma migrate dev --name init` fails — Prisma 7 removed datasource `url`; connection must move to `prisma.config.ts` with an `adapter` (https://pris.ly/d/config-datasource). Was inspecting node_modules/@prisma/config/dist/index.d.ts (exports defineConfig, env; Datasource ~line 150) when paused. Likely needs `pg` + `@prisma/adapter-pg`; src/lib/db.ts must construct PrismaClient with the adapter. Also npm allow-scripts blocked postinstall for prisma / @prisma/engines / unrs-resolver — if engines are missing, run `npm approve-scripts`.<br>当前卡点：`npx prisma migrate dev --name init` 失败——Prisma 7 移除了 datasource `url`，连接须迁到 `prisma.config.ts` 的 `adapter`。暂停时正在查 node_modules/@prisma/config/dist/index.d.ts（导出 defineConfig、env；Datasource 约 150 行）。预计需要 `pg` + `@prisma/adapter-pg`，且 src/lib/db.ts 须用 adapter 构造 PrismaClient。另外 npm allow-scripts 拦截了 prisma/@prisma/engines/unrs-resolver 的 postinstall——若缺引擎需 `npm approve-scripts`。
4. Note: `next dev` auto-created AGENTS.md + CLAUDE.md (Next 16 agent rules: read node_modules/next/dist/docs/ before writing code).<br>注意：`next dev` 自动创建 AGENTS.md＋CLAUDE.md（Next 16 规则：编码前先读 node_modules/next/dist/docs/）。

### Additional Actions 10 (2026-10-01, T01 completed) / 追加动作 10（2026-10-01，T01 完成）

1. Browser-facing URL rule recorded (user instruction): URLs opened in the user's browser must use the test-server IP, never localhost; localhost only for same-host internal links. Topology details kept in the git-ignored LOCAL_DEV_NOTES.md (see Additional Actions 11).<br>浏览器访问规则已记录（用户指示）：浏览器地址一律用测试服务器 IP，禁止 localhost；localhost 仅限同机内部连接。拓扑细节存于 git 忽略的 LOCAL_DEV_NOTES.md（见追加动作 11）。
2. Prisma 7 blocker solved: wrote prisma.config.ts (dotenv/config + defineConfig + datasource.url), removed `url` from schema datasource, installed pg + @prisma/adapter-pg@7.10.0, rewrote src/lib/db.ts with PrismaPg adapter. `migrate dev --name init` applied (20261001085327_init); `migrate reset --force` replay verified.<br>Prisma 7 卡点解决：编写 prisma.config.ts（dotenv/config＋defineConfig＋datasource.url）、schema 移除 `url`、安装 pg＋@prisma/adapter-pg@7.10.0、src/lib/db.ts 改用 PrismaPg adapter。`migrate dev --name init` 已应用；`migrate reset --force` 重放验证通过。
3. Acceptance all green: docker compose up -d (healthy), npm run setup, npm run test (1 passed), npm run test:e2e (smoke passed via request fixture, no browser needed); vitest.config renamed .mts (ESM warning). Chromium headless shell installed for future UI e2e. .gitignore confirmed to exclude .env.<br>验收全绿：docker compose（健康）、npm run setup、npm run test（1 通过）、npm run test:e2e（冒烟通过）；vitest.config 改 .mts 消除 ESM 警告；Chromium headless shell 已装（供后续 UI e2e）；.gitignore 确认排除 .env。
4. T01 committed and pushed: cea7e37. Note: npm allow-scripts blocked prisma engines postinstall — no impact observed (engines resolved via adapter/query compiler); revisit if engine errors appear.<br>T01 已提交推送：cea7e37。注：npm allow-scripts 曾拦截 prisma 引擎 postinstall，未观察到影响（adapter/query compiler 路径无需引擎）；若后续报引擎错误再处理。
5. Next: T02 邀请注册与登录（MVP 仅邮箱 OTP）per PLAN.md v0.3.<br>下一步：按 PLAN.md v0.3 执行 T02 邀请注册与登录（MVP 仅邮箱 OTP）。

### Additional Actions 11 (2026-10-01, GitHub exclusion of local topology) / 追加动作 11（2026-10-01，本地拓扑不入 GitHub）

1. User instruction: local development-environment topology must NOT be uploaded to GitHub; record it only in the dev VPS project folder. Actions: created LOCAL_DEV_NOTES.md (topology + local ops notes) and added it to .gitignore (git check-ignore verified); removed the topology section from CONTEXT.md and replaced it with the "GitHub exclusion rule" note; scrubbed the topology narrative from Additional Actions 10 item 1.<br>用户指示：本地开发环境拓扑不得上传 GitHub，仅记录在研发 VPS 项目目录。已执行：创建 LOCAL_DEV_NOTES.md（拓扑＋本地操作要点）并加入 .gitignore（check-ignore 验证）；CONTEXT.md 移除拓扑段、改为「GitHub 排除规则」说明；SESSIONS 追加动作 10 第 1 条的拓扑叙述已改写为引用。
2. Note: git history (commit cea7e37) still contains the earlier topology paragraph in CONTEXT.md; scrubbing history would require a force-push rewrite — not done, pending user decision.<br>注意：git 历史（提交 cea7e37）中仍含 CONTEXT.md 旧的拓扑段落；彻底清除需改写历史并 force push——未执行，待用户决定。

### Additional Actions 12 (2026-10-01, outbound email provider decided) / 追加动作 12（2026-10-01，邮件发信渠道确定）

1. User decided MVP outbound email (invitations/OTP) uses the operator's QQ/foxmail mailbox via SMTP. Placeholders appended to .env (SMTP_HOST=smtp.qq.com, SMTP_PORT=465, SMTP_SECURE=true, SMTP_USER, SMTP_AUTH_CODE=, EMAIL_FROM); user to generate the 16-char authorization code in QQ Mail settings and fill SMTP_AUTH_CODE. Per project rules, the literal mailbox address is kept out of committable docs (SPEC O05 updated accordingly).<br>用户决定 MVP 邮件发信（邀请/OTP）用运营方 QQ/foxmail 邮箱 SMTP。已向 .env 追加占位（SMTP_HOST=smtp.qq.com、465、SSL、SMTP_USER、SMTP_AUTH_CODE=、EMAIL_FROM）；用户在 QQ 邮箱设置生成 16 位授权码后填入。按项目规则，邮箱地址不写入可提交文档（SPEC O05 已同步）。
2. Follow-up: after the user fills SMTP_AUTH_CODE, run a real SMTP smoke send (fictional content) to verify credentials; deliverability to Vietnam recipients is part of AC01/AC08/AC12 real-channel acceptance.<br>后续：用户填好授权码后做一次真实 SMTP 冒烟发送（虚构内容）验证凭据；对越南收件方的送达属 AC01/AC08/AC12 真实渠道验收。

### Additional Actions 13 (2026-10-01, SMTP verified; preparation phase complete) / 追加动作 13（2026-10-01，SMTP 验证通过；准备阶段完成）

1. SMTP smoke send: 465/SSL timed out — outbound 465 is blocked on this dev VPS; 587 reachable. Switched .env to SMTP_PORT=587 + STARTTLS and re-ran: **send succeeded**. .env.example gained the SMTP template (placeholders only); the 465-blocked note went into LOCAL_DEV_NOTES.md.<br>SMTP 冒烟发送：465/SSL 超时——本研发 VPS 出站 465 被封，587 可达。.env 改用 587＋STARTTLS 后复测**发送成功**。.env.example 增加 SMTP 模板（仅占位）；465 被封一事记入 LOCAL_DEV_NOTES.md。
2. User confirmed email capability. Preparation phase now fully complete: GitHub ✓, Cloudflare ✓, Kimi ✓, Lighthouse ✓ (cleaned + hardened), SMTP ✓, docs frozen ✓, T01 ✓. Next: T02 (invitation registration + email OTP).<br>用户确认邮件能力。准备阶段全部完成：GitHub ✓、Cloudflare ✓、Kimi ✓、Lighthouse ✓（已清理加固）、SMTP ✓、文档冻结 ✓、T01 ✓。下一步：T02（邀请注册＋邮箱 OTP）。

---

## Session close / 会话结束（2026-10-01，UTC）

User exited. All work recorded and pushed (f490866). State: preparation phase complete, T01 done, next = T02 (invitation registration + email OTP). Resume by reading: 项目指令 → SESSIONS.md 最新记录 → PROGRESS.md → PLAN.md T02 → SPEC.md REQ-AUTH.<br>用户退出。全部工作已记录并推送（f490866）。状态：准备阶段完成、T01 完成、下一项 T02（邀请注册＋邮箱 OTP）。恢复时阅读：项目指令 → SESSIONS.md 最新记录 → PROGRESS.md → PLAN.md T02 → SPEC.md REQ-AUTH。

---

## Session 2026-10-01-02 (Ended) / 会话 2026-10-01-02（已结束）

- Date/Timezone: 2026-10-01, UTC+8 (review started about 20:39 local)<br>日期/时区：2026-10-01，UTC+8（复核约于本地 20:39 开始）
- Environment: Cursor on the project VPS. No business code was written or run.<br>环境：项目 VPS 上的 Cursor。未编写、未运行业务代码。
- Goal: read SESSIONS / PROGRESS / CONTEXT, then review VIBE_CODING_INPUT, PLAN, SOW, SPEC, and GLOSSARY for consistency, omissions, and contradictions. Markdown design documents only.<br>本次目标：阅读 SESSIONS / PROGRESS / CONTEXT，再复核 VIBE_CODING_INPUT、PLAN、SOW、SPEC、GLOSSARY 的一致性、遗漏与矛盾。只改 Markdown 设计文档。

### Actual Actions / 实际动作

1. Read the progress files and the design set, plus 2026OCT1-REVIEW.md.<br>阅读进度文件与设计文档全集，以及 2026OCT1-REVIEW.md。
2. Found cross-document contradictions (stale PROGRESS versus completed T01, SPEC still citing v1.1 Q3, PLAN T02 still listing SmsProvider, PLAN T03 still building the P1 draft-isolation UI, digest wording, publish-versus-translate order, file `check_failed` versus "pending review").<br>发现跨文档矛盾（PROGRESS 仍写 T01 未完成，而会话记录已完成 T01；SPEC 仍引用 v1.1 Q3；PLAN T02 仍列出 SmsProvider；PLAN T03 仍包含 P1 草稿隔离界面；日报措辞；发布与翻译的顺序；文件 `check_failed` 与「待审」混用）。
3. Applied a consistency errata: SOW v1.6, SPEC v0.4, PLAN v0.4, GLOSSARY resync, VIBE precedence banner, CONTEXT navigation, PROGRESS rewrite. Full findings and open questions are in CURSOR_REVIEW.md.<br>写入一致性勘误：SOW v1.6、SPEC v0.4、PLAN v0.4、GLOSSARY 重新同步、VIBE 效力说明、CONTEXT 导航、PROGRESS 重写。完整发现与未决问题见 CURSOR_REVIEW.md。

### Changed Files / 变更文件

- Modified: VIBE_CODING_INPUT.md, SOW.md, SPEC.md, PLAN.md, GLOSSARY.md, CONTEXT.md, PROGRESS.md, SESSIONS.md<br>修改：VIBE_CODING_INPUT.md、SOW.md、SPEC.md、PLAN.md、GLOSSARY.md、CONTEXT.md、PROGRESS.md、SESSIONS.md
- Added: CURSOR_REVIEW.md<br>新增：CURSOR_REVIEW.md
- Not modified: any `.ts` / `.tsx` / other source<br>未修改：任何 `.ts` / `.tsx` 或其他源代码

### Verification Results / 验证结果

- Documentation review only. No tests were run. This is not product acceptance.<br>仅文档复核。未运行测试。这不是产品验收。

### Unfinished Items / 未完成项

- Open questions listed at the end of CURSOR_REVIEW.md. Working defaults are already written into SPEC v0.4 so T02 can proceed if those defaults are accepted.<br>未决问题列在 CURSOR_REVIEW.md 末尾。工作默认值已写入 SPEC v0.4；若接受这些默认值，即可进入 T02。
- git commit of this errata was not requested.<br>本次勘误未要求 git 提交。

### First Step Next Time / 下次第一步

Read CURSOR_REVIEW.md, then PLAN.md T02 and SPEC.md REQ-AUTH. Do not redo T01.<br>先读 CURSOR_REVIEW.md，再读 PLAN.md T02 与 SPEC.md REQ-AUTH。不要重做 T01。

---

## Session 2026-10-01-03 (Ended) / 会话 2026-10-01-03（已结束）

- Date/Timezone: 2026-10-01, UTC+8<br>日期/时区：2026-10-01，UTC+8
- Goal: record the user's decisions on the CURSOR_REVIEW.md questions. Markdown only.<br>本次目标：记录用户对 CURSOR_REVIEW.md 问题的决定。只改 Markdown。

### Actual Actions / 实际动作

1. User accepted the review defaults, and replaced sole-reviewer blocking with prompt-and-confirm: when the author is the only reviewer and no backup Coordinator is configured, the system prompts them; if they still confirm, the held message is published.<br>用户接受复核中的默认值，并把「唯一审核人不能放行」改为提示后确认：作者是唯一审核人且未配置备用协调员时，系统向其提示；若其仍然确认，被拦住的消息即发布。
2. Wrote that rule into SOW v1.7, SPEC v0.5 (REQ-REV-06, REQ-NTF-07, REQ-AUTH-01, REQ-TR-01, REQ-AUTH-06, O03), PLAN v0.5 T07, and GLOSSARY. CURSOR_REVIEW.md Section 4 now records the decisions. Git history was not rewritten and no commit was made.<br>该规则已写入 SOW v1.7、SPEC v0.5（REQ-REV-06、REQ-NTF-07、REQ-AUTH-01、REQ-TR-01、REQ-AUTH-06、O03）、PLAN v0.5 T07 与 GLOSSARY。CURSOR_REVIEW.md 第 4 节改为决定记录。未改写 Git 历史，也未提交。

### Changed Files / 变更文件

- Modified: SOW.md, SPEC.md, PLAN.md, GLOSSARY.md, VIBE_CODING_INPUT.md, CONTEXT.md, PROGRESS.md, CURSOR_REVIEW.md, SESSIONS.md<br>修改：SOW.md、SPEC.md、PLAN.md、GLOSSARY.md、VIBE_CODING_INPUT.md、CONTEXT.md、PROGRESS.md、CURSOR_REVIEW.md、SESSIONS.md
- Source code: unchanged<br>源代码：未改

### First Step Next Time / 下次第一步

Implement PLAN.md T02 against SPEC.md v0.5 REQ-AUTH. Do not redo T01.<br>按 SPEC.md v0.5 REQ-AUTH 实现 PLAN.md T02。不要重做 T01。

---

## Session 2026-10-01-04 (Ended) / 会话 2026-10-01-04（已结束）

- Date/Timezone: 2026-10-01, UTC+8 (about 22:14 local)<br>日期/时区：2026-10-01，UTC+8（约本地 22:14）
- Goal: re-check T01, re-check VIBE versus SOW, and record the activation-email rule plus the MVP test-case guide. Markdown only, plus re-running existing T01 tests.<br>本次目标：复核 T01，复核 VIBE 与 SOW，并记录激活邮件规则与 MVP 测试案件指引。只改 Markdown，并重跑已有的 T01 测试。

### Actual Actions / 实际动作

1. T01 re-check: skeleton files and migration `20261001085327_init` are present. `docker compose ps` showed postgres and minio healthy. `npm run test` passed 1 test. `npm run test:e2e` passed `GET /api/health` 200. Did not rerun `migrate reset`.<br>T01 复核：骨架文件与迁移 `20261001085327_init` 都在。`docker compose ps` 显示 postgres 与 minio 健康。`npm run test` 通过 1 项。`npm run test:e2e` 通过 `GET /api/health` 200。未再跑 `migrate reset`。
2. VIBE_CODING_INPUT.md historical body still conflicts with SOW (phone OTP, mix-up UI, DOCX bilingual, DeepSeek, SMS alerts, "do not code yet"). The banner now says SOW v1.8 wins. The body was not rewritten.<br>VIBE_CODING_INPUT.md 历史正文仍与 SOW 冲突（手机验证码、防串案界面、DOCX 双语、DeepSeek、短信提醒、「先不要编码」）。文首已写明以 SOW v1.8 为准。正文未改写。
3. User rule recorded as SOW v1.8 / SPEC v0.6 / PLAN v0.6: administrator is local bootstrap only; Coordinator, Chinese Client, and Vietnamese Lawyer get case participation from an activation email sent to the entered address; MVP completion guides the administrator through one fictitious test case with those three emails (REQ-OPS-07, T12).<br>用户规则已写入 SOW v1.8 / SPEC v0.6 / PLAN v0.6：管理员只本地引导；协调员、中国客户、越南律师通过发到被输入邮箱的激活邮件获得案件参与资格；MVP 完成时引导管理员做一个含这三个邮箱的虚构测试案件（REQ-OPS-07、T12）。

### Changed Files / 变更文件

- Modified: VIBE_CODING_INPUT.md, SOW.md, SPEC.md, PLAN.md, GLOSSARY.md, CONTEXT.md, PROGRESS.md, CURSOR_REVIEW.md, SESSIONS.md<br>修改：VIBE_CODING_INPUT.md、SOW.md、SPEC.md、PLAN.md、GLOSSARY.md、CONTEXT.md、PROGRESS.md、CURSOR_REVIEW.md、SESSIONS.md
- Source code: unchanged<br>源代码：未改

### First Step Next Time / 下次第一步

Implement PLAN.md T02 against SPEC.md v0.6 REQ-AUTH-01. Activation emails are bound to the entered address. Do not redo T01.<br>按 SPEC.md v0.6 REQ-AUTH-01 实现 PLAN.md T02。激活邮件绑定到被输入的邮箱。不要重做 T01。

---

## Session 2026-10-01-05 (Ended) / 会话 2026-10-01-05（已结束）

- Date/Timezone: 2026-10-01, UTC+8<br>日期/时区：2026-10-01，UTC+8
- Goal: split invitation binding. MVP (one Case) binds the invitation to the entered email. Later, when one Vietnamese Lawyer joins many Cases, the additional-case invitation code is not bound to an email. Markdown only.<br>本次目标：拆分邀请绑定。MVP（一个案件）把邀请绑定到被输入的邮箱。以后一名越南律师参加多个案件时，追加案件的邀请码不绑定邮箱。只改 Markdown。

### Actual Actions / 实际动作

1. Wrote SOW v1.9, SPEC v0.7 REQ-AUTH-12 (P1), and PLAN v0.7. T02 still implements only the email-bound MVP path.<br>写入 SOW v1.9、SPEC v0.7 REQ-AUTH-12（P1）与 PLAN v0.7。T02 仍只实现绑定邮箱的 MVP 路径。
2. Synced GLOSSARY, CONTEXT, PROGRESS, CURSOR_REVIEW section 6, and the VIBE banner. Source code was not changed. No commit.<br>同步了 GLOSSARY、CONTEXT、PROGRESS、CURSOR_REVIEW 第 6 节和 VIBE 文首。未改源代码。未提交。

### Changed Files / 变更文件

- Modified: SOW.md, SPEC.md, PLAN.md, GLOSSARY.md, CONTEXT.md, PROGRESS.md, CURSOR_REVIEW.md, VIBE_CODING_INPUT.md, SESSIONS.md<br>修改：SOW.md、SPEC.md、PLAN.md、GLOSSARY.md、CONTEXT.md、PROGRESS.md、CURSOR_REVIEW.md、VIBE_CODING_INPUT.md、SESSIONS.md
- Source code: unchanged<br>源代码：未改

### First Step Next Time / 下次第一步

Implement PLAN.md T02 against SPEC.md v0.7 REQ-AUTH-01. The MVP invitation is bound to the entered email. Do not implement REQ-AUTH-12. Do not redo T01.<br>按 SPEC.md v0.7 REQ-AUTH-01 实现 PLAN.md T02。MVP 的邀请绑定被输入的邮箱。不要实现 REQ-AUTH-12。不要重做 T01。

---

## Session 2026-10-02-01 (Ended) / 会话 2026-10-02-01（已结束）

- Date/Timezone: 2026-10-02, UTC+8<br>日期/时区：2026-10-02，UTC+8
- Goal: move "invitation code is not bound to an email" into the MVP, so a later multi-case change does not need a second rule. Markdown only.<br>本次目标：把「邀请码不绑定邮箱」放进 MVP，以免以后多个案件时再换一套规则。只改 Markdown。

### Actual Actions / 实际动作

1. Wrote SOW v1.10, SPEC v0.8, and PLAN v0.8. REQ-AUTH-12 is now MVP and is part of T02. The activation email is still sent only to the entered address, and that address is not an acceptance check.<br>写入 SOW v1.10、SPEC v0.8 与 PLAN v0.8。REQ-AUTH-12 现为 MVP，并属于 T02。激活邮件仍只发给被输入的地址，该地址不作为接受条件。
2. Synced GLOSSARY, CONTEXT, PROGRESS, CURSOR_REVIEW section 7, and the VIBE banner. Source code was not changed. These docs are then committed and pushed as the GitHub baseline.<br>同步了 GLOSSARY、CONTEXT、PROGRESS、CURSOR_REVIEW 第 7 节和 VIBE 文首。未改源代码。这些文档随后作为 GitHub 基线提交并推送。

### Changed Files / 变更文件

- Modified: SOW.md, SPEC.md, PLAN.md, GLOSSARY.md, CONTEXT.md, PROGRESS.md, CURSOR_REVIEW.md, VIBE_CODING_INPUT.md, SESSIONS.md<br>修改：SOW.md、SPEC.md、PLAN.md、GLOSSARY.md、CONTEXT.md、PROGRESS.md、CURSOR_REVIEW.md、VIBE_CODING_INPUT.md、SESSIONS.md
- Source code: unchanged<br>源代码：未改

### First Step Next Time / 下次第一步

Implement PLAN.md T02 against SPEC.md v0.8 REQ-AUTH-01 and REQ-AUTH-12. The invitation code is not bound to an email. Do not redo T01.<br>按 SPEC.md v0.8 REQ-AUTH-01 与 REQ-AUTH-12 实现 PLAN.md T02。邀请码不绑定邮箱。不要重做 T01。

---

## Session 2026-10-02-02 (Ended) / 会话 2026-10-02-02（已结束）

- Date/Timezone: 2026-10-02, UTC (Kimi Code on the dev VPS)<br>日期/时区：2026-10-02，UTC（研发 VPS 上的 Kimi Code）
- Goal: user said the design docs were edited outside this session; re-read the modified baseline and continue development (T02).<br>本次目标：用户在设计文档做了修改，要求按修改后的基线继续研发（T02）。

### Actual Actions / 实际动作

1. Re-read the baseline as modified by the user's own commits (228a748 → 7e61952 → 6555886, via Cursor sessions 2026-10-01-02 … 2026-10-02-01): SOW v1.10 / SPEC v0.8 / PLAN v0.8. Key deltas for coding: the invitation code is NOT bound to an email (REQ-AUTH-12 is now MVP and part of T02); the activation email still goes only to the entered address; CURSOR_REVIEW.md and README.md added; `cases.title` required already in T03 for the P1 digest subject.<br>重读用户自行提交的新基线（228a748 → 7e61952 → 6555886，经 Cursor 会话 2026-10-01-02 … 2026-10-02-01）：SOW v1.10 / SPEC v0.8 / PLAN v0.8。对编码的关键变化：邀请码不绑定邮箱（REQ-AUTH-12 升为 MVP 并属 T02）；激活邮件仍只发被输入地址；新增 CURSOR_REVIEW.md 与 README.md；`cases.title` 在 T03 即为必填（供 P1 日报标题）。
2. Implemented T02 via a coder subagent (TDD), then reviewed and hardened it: atomic single-use claim of the invite code (conditional `updateMany` + concurrency test), zh/vi bilingual activation email (Vietnamese diacritics byte-verified).<br>经 coder 子代理按 TDD 实现 T02，随后复核并加固：邀请码单次使用原子认领（条件 `updateMany`＋并发测试）、激活邮件中越双语（越南语声调按码点核验）。
3. Verified personally: `npm run test` 31/31 green (15 unit + 16 integration, incl. cross-purpose OTP rejection, revoke/resend/expiry/replay, atomic concurrent accept, cookie Secure both modes, no-plaintext-OTP assertions); `npm run lint` and `npx tsc --noEmit` clean; `npm run build` succeeded (12 routes); `scripts/bootstrap-admin.ts` run against clc_test by the subagent. .env untouched (mtime 2026-10-01); no secrets in code/logs.<br>本人复核：`npm run test` 31/31 通过（15 单元＋16 集成，含跨用途 OTP 拒绝、撤销/重发/过期/重放、原子并发接受、Cookie Secure 两种配置、OTP 无明文断言）；`npm run lint` 与 `npx tsc --noEmit` 无错误；`npm run build` 成功（12 条路由）；子代理已对 clc_test 实测 `scripts/bootstrap-admin.ts`。.env 未动（mtime 2026-10-01）；代码与日志无密钥。

### Changed Files / 变更文件

- Code commit 8dcfd6a (36 files, +2175): migration `20261001171658_t02_auth_invites`; `src/modules/{auth,invites}/**`; `src/server/providers/email/{interface,fake,index}.ts`; API routes under `src/app/api/{auth,cases,invites}/**`; pages `src/app/(auth)/{login,invite}/`; `scripts/bootstrap-admin.ts`; `src/lib/{api-error,http}.ts`; tests `tests/unit/auth/`, `tests/integration/{auth,global-setup.ts,helpers.ts}`; config `.env.example`, `vitest.config.mts`, `package.json`, `prisma/schema.prisma`.<br>代码提交 8dcfd6a（36 个文件，+2175）：迁移 `20261001171658_t02_auth_invites`；`src/modules/{auth,invites}/**`；`src/server/providers/email/{interface,fake,index}.ts`；`src/app/api/{auth,cases,invites}/**` 路由；`src/app/(auth)/{login,invite}/` 页面；`scripts/bootstrap-admin.ts`；`src/lib/{api-error,http}.ts`；测试 `tests/unit/auth/`、`tests/integration/{auth,global-setup.ts,helpers.ts}`；配置 `.env.example`、`vitest.config.mts`、`package.json`、`prisma/schema.prisma`。
- Docs (this commit): PROGRESS.md rewritten (T02 done), PLAN.md T02 status → Done, SESSIONS.md this entry.<br>文档（本次提交）：PROGRESS.md 重写（T02 完成）、PLAN.md T02 状态改为完成、SESSIONS.md 本条记录。

### Deviations from the T02 task text (recorded, all accepted) / 与 T02 任务文本的偏离（已记录，均已接受）

1. T02 migration also created minimal `cases`/`case_members` (the acceptance criteria need them); T03 extends the remaining columns.<br>T02 迁移同时创建最小版 `cases`/`case_members`（验收标准需要）；其余列由 T03 扩展。
2. `otp_challenges` gained `purpose` ('login'|'bind') to enforce REQ-AUTH-05 cross-use rejection.<br>`otp_challenges` 增加 `purpose`（'login'|'bind'）以落实 REQ-AUTH-05 跨用途拒绝。
3. Session token is the `sessions` primary key itself (not hash-stored); re-evaluate at T11.<br>会话令牌直接作 `sessions` 主键（未哈希存储）；T11 再评估。
4. Unaccepted invite OTP requests leave `status='pending'` user rows; cleanup policy is a later task.<br>未完成的邀请 OTP 请求留下 `status='pending'` 用户行；清理策略属后续任务。
5. Invite-code validation failures are rejected already at the OTP-request step (400/410); the code itself is a credential, so this is not registration enumeration.<br>邀请码校验失败在 OTP 请求阶段即拒绝（400/410）；邀请码本身是凭据，不构成注册状态枚举。

### Verification Results / 验证结果

- `npm run test`: 4 files, 31/31 passed. `npm run lint`: clean. `npx tsc --noEmit`: clean. `npm run build`: success.<br>`npm run test`：4 个文件 31/31 通过。`npm run lint`：无错误。`npx tsc --noEmit`：无错误。`npm run build`：成功。
- AC01 mock-chain part covered; real email delivery stays with T12. AC02–AC12 otherwise unaccepted.<br>AC01 模拟链路部分已覆盖；真实邮件送达仍属 T12。其余 AC02–AC12 未验收。

### Unfinished Items / 未完成项

- Audit trail remains T11 (`TODO(T11)` markers in code).<br>审计仍属 T11（代码中有 `TODO(T11)` 标记）。
- Historical commit cea7e37 still contains the old topology paragraph in CONTEXT.md; history rewrite remains pending the user's decision.<br>历史提交 cea7e37 中 CONTEXT.md 仍含旧拓扑段落；是否改写历史仍待用户决定。

### First Step Next Time / 下次第一步

Implement PLAN.md T03 against SPEC.md v0.8 REQ-PM-01~10 / REQ-CASE-01~06 (see PROGRESS.md "Next Steps"). Do not redo T01/T02.<br>按 SPEC.md v0.8 REQ-PM-01~10／REQ-CASE-01~06 实现 PLAN.md T03（见 PROGRESS.md「下一步」）。不要重做 T01/T02。

---

## Session 2026-10-02-03 (Ended) / 会话 2026-10-02-03（已结束）

- Date/Timezone: 2026-10-02, UTC (Kimi Code coder subagent on the dev VPS)<br>日期/时区：2026-10-02，UTC（研发 VPS 上的 Kimi Code coder 子代理）
- Goal: implement PLAN.md T03 (case and member management + permission middleware) against SPEC.md v0.8 REQ-PM-01~10 / REQ-CASE-01~06, TDD, without redoing T01/T02.<br>本次目标：按 SPEC.md v0.8 REQ-PM-01~10／REQ-CASE-01~06 以 TDD 实现 PLAN.md T03（案件与成员管理＋权限中间件），不重做 T01/T02。

### Actual Actions / 实际动作

1. Re-read the baseline: schema (T02 minimal `cases`/`case_members`), SPEC sections 2/4/13/14, PLAN T03, T02 code and tests; checked Next 16 docs (`dist/docs/01-app/03-api-reference/03-file-conventions/route.md`, `page.md`) before writing app code. Dev DB `clc_dev` verified empty before adding required columns.<br>重读基线：schema（T02 最小版 `cases`/`case_members`）、SPEC 第 2/4/13/14 节、PLAN T03、T02 代码与测试；写应用代码前查了 Next 16 文档（route.md、page.md）。加必填列前确认开发库 `clc_dev` 为空。
2. Wrote schema extension + migration `20261002062836_t03_cases_members_profiles_applications` (added CHECK constraints by hand: title 1–80 no line breaks, status/role enums); `migrate reset --force` replayed all three migrations on the empty dev DB.<br>编写 schema 扩展与迁移 `20261002062836_t03_cases_members_profiles_applications`（手工加入 CHECK：title 1–80 不含换行、状态/角色枚举）；空开发库上 `migrate reset --force` 干净重放全部三个迁移。
3. TDD: wrote 5 failing integration files + 1 unit file first (title boundaries, cross-case/admin/non-member denial, invite email required, revoke immediacy, duty flags, archive read-only, client profiles, case applications), then implemented to green.<br>TDD：先写 5 个集成测试文件＋1 个单元文件（title 边界、跨案件/admin/非成员拒绝、邀请必须带邮箱、撤销即时生效、职责标记、归档只读、客户档案、建案申请），随后实现至全绿。
4. Implemented: `src/server/guards/case-guards.ts` (per-request DB re-validation; admin always 403; role consistency; writable-case check); modules `cases` (create/list/detail/archive + pure `title.ts`), `members` (revoke, duty-flag PATCH), `clients` (profiles scoped to owning lawyer), `applications` (submit/list/decide; approval creates the case in one transaction); routes for all of the above; T02 invites service switched to the shared guards + archived-case rejection (create and accept); simple pages `src/app/(app)/cases/**` (list + detail, non-member 404, unauthenticated → /login).<br>实现：`src/server/guards/case-guards.ts`（每次请求查库；admin 一律 403；角色一致性；可写案件检查）；模块 `cases`（建案/列表/详情/归档＋纯函数 `title.ts`）、`members`（撤销、职责标记 PATCH）、`clients`（档案限所属律师）、`applications`（提交/列表/审批；批准单事务建案）；对应全部路由；T02 邀请服务改用共享守卫＋归档案拒绝（发出与接受）；简易页面 `src/app/(app)/cases/**`（列表＋详情，非成员 404，未登录跳 /login）。
5. Verified personally: `npm run test` 51/51 green (10 files; 17 unit + 34 integration); `npm run lint` clean; `npx tsc --noEmit` clean; `npm run build` succeeded (23 routes incl. `/cases` pages). `.env` untouched; no new env vars needed; only fictitious test data.<br>本人复核：`npm run test` 51/51 通过（10 个文件；17 单元＋34 集成）；`npm run lint` 无错误；`npx tsc --noEmit` 无错误；`npm run build` 成功（23 条路由，含 `/cases` 页面）。`.env` 未动；无需新增环境变量；仅用虚构测试数据。

### Changed Files / 变更文件

- Code commit 12f0329 (29 files): migration `20261002062836_t03_cases_members_profiles_applications`; `prisma/schema.prisma`; `src/server/guards/case-guards.ts`; `src/modules/{cases/{service,title},members/service,clients/service,applications/service}.ts`; `src/modules/invites/service.ts` (shared guards + archived-case checks); API routes `src/app/api/cases/{route,[id]/route,[id]/archive/route,[id]/members/[uid]/route}.ts`, `src/app/api/client-profiles/{route,[id]/route}.ts`, `src/app/api/case-applications/{route,[id]/route}.ts`; pages `src/app/(app)/cases/{page,[id]/page}.tsx`; tests `tests/integration/cases/{title-required,cross-case-denied,revoke,archive,case-applications}.test.ts`, `tests/unit/cases/title-rules.test.ts`, `tests/integration/{helpers.ts,auth/invite-flow.test.ts}` (clientOrgName on seed cases); `.gitignore` +`tsconfig.tsbuildinfo`.<br>代码提交 12f0329（29 个文件）：迁移 `20261002062836_t03_cases_members_profiles_applications`；`prisma/schema.prisma`；`src/server/guards/case-guards.ts`；`src/modules/{cases/{service,title},members/service,clients/service,applications/service}.ts`；`src/modules/invites/service.ts`（共享守卫＋归档案检查）；API 路由 `src/app/api/cases/**`、`src/app/api/client-profiles/**`、`src/app/api/case-applications/**`；页面 `src/app/(app)/cases/**`；测试 `tests/integration/cases/*`、`tests/unit/cases/title-rules.test.ts`、`tests/integration/{helpers.ts,auth/invite-flow.test.ts}`（种子案件补 clientOrgName）；`.gitignore` 增加 `tsconfig.tsbuildinfo`。
- Docs (this commit): PROGRESS.md rewritten (T03 done), PLAN.md T03 status → Done, SESSIONS.md this entry.<br>文档（本次提交）：PROGRESS.md 重写（T03 完成）、PLAN.md T03 状态改为完成、SESSIONS.md 本条记录。

### Deviations from the T03 task text (recorded) / 与 T03 任务文本的偏离（已记录）

1. `POST /api/cases` admits any active coordinator account rather than checking per-case `can_manage` — a first-time coordinator has no membership to check against; the can_manage guard applies to all subsequent management operations. Recorded in PROGRESS.md.<br>`POST /api/cases` 对任何协调员账号开放，而非校验按案件 `can_manage`——首次建案的协调员没有成员关系可查；can_manage 守卫适用于此后所有管理操作。已记入 PROGRESS.md。
2. Missing/invalid invite email now returns code `email_required` (was `invalid_email`); status stays 400 as required.<br>邀请缺邮箱的错误码改为 `email_required`（原 `invalid_email`）；状态码仍为 400。
3. Member-flag changes use `PATCH /api/cases/:id/members/:uid` (SPEC Section 14 lists only DELETE; PATCH added to satisfy "flags may be turned off individually", REQ-CASE-02).<br>成员职责标记调整使用 `PATCH /api/cases/:id/members/:uid`（SPEC 第 14 节仅列 DELETE；PATCH 为满足 REQ-CASE-02「标记可单独关闭」而加）。
4. `case_applications.decided_at` was not added (SPEC key fields list only `decided_by`).<br>`case_applications` 未加 `decided_at`（SPEC 关键字段仅列 `decided_by`）。

### Verification Results / 验证结果

- `npm run test`: 10 files, 51/51 passed. `npm run lint`: clean. `npx tsc --noEmit`: clean. `npm run build`: success (23 routes).<br>`npm run test`：10 个文件 51/51 通过。`npm run lint`：无错误。`npx tsc --noEmit`：无错误。`npm run build`：成功（23 条路由）。
- All seven PLAN T03 acceptance criteria have direct tests: title 1–80 rejection; invite email required + membership inactive before acceptance; lawyer-in-two-cases denied on a third; non-member denied; revoke effective immediately; no platform-wide client listing for lawyers; admin denied everywhere + case creation limited to coordinators / the application-approval path.<br>PLAN T03 七条验收标准均有直接测试：title 1–80 拒绝；邀请必须带邮箱＋接受前成员不激活；律师参与两案时第三案被拒；非成员被拒；撤销立即生效；律师无全平台客户列表；admin 处处被拒＋建案仅限协调员或申请审批流程。

### Unfinished Items / 未完成项

- Audit trail remains T11 (`TODO(T11)` markers); closing live SSE connections on revoke is T04/T11; messages/files/alerts entities are T04+, so archive read-only is currently enforced on the T03-scope write endpoints only.<br>审计仍属 T11（代码中有 `TODO(T11)` 标记）；撤权断存量 SSE 属 T04/T11；消息/文件/提醒实体属 T04+，故归档只读当前仅在 T03 范围内的写端点上强制。

### First Step Next Time / 下次第一步

Implement PLAN.md T04 against SPEC.md v0.8 REQ-MSG-01~08 (see PROGRESS.md "Next Steps"). Do not redo T01–T03.<br>按 SPEC.md v0.8 REQ-MSG-01~08 实现 PLAN.md T04（见 PROGRESS.md「下一步」）。不要重做 T01–T03。

---

## Session 2026-10-02-04 (Ended) / 会话 2026-10-02-04（已结束）

- Date/Timezone: 2026-10-02, UTC (Kimi Code coder subagent on the dev VPS)<br>日期/时区：2026-10-02，UTC（研发 VPS 上的 Kimi Code coder 子代理）
- Goal: implement PLAN.md T04 (message pipeline and SSE reconnect backfill) against SPEC.md v0.8 REQ-MSG-01~08, TDD, without redoing T01–T03.<br>本次目标：按 SPEC.md v0.8 REQ-MSG-01~08 以 TDD 实现 PLAN.md T04（消息流水线与 SSE 断线补拉），不重做 T01–T03。

### Actual Actions / 实际动作

1. Re-read the baseline: PLAN T04, SPEC sections 5/13 (message state machine, messages table), T03 guards/services/test helpers, Next 16 docs (`dist/docs/01-app/03-api-reference/03-file-conventions/route.md` — streaming responses via `ReadableStream`, `params` as Promise). Confirmed no prior idempotency-key convention in the codebase (grep).<br>重读基线：PLAN T04、SPEC 第 5/13 节（消息状态机、messages 表）、T03 守卫/服务/测试辅助、Next 16 文档（route.md——`ReadableStream` 流式响应、params 为 Promise）。grep 确认项目无幂等键既有约定。
2. Schema + migration `20261002095350_t04_messages_unread`: `messages` (unique `(case_id, author_id, idempotency_key)`, `seq` SERIAL, `published_at`, `corrected_by_id`; hand-added status CHECK with the full SPEC 5.1 enum) and `case_members.last_read_message_id`. Applied to clc_dev; clc_test replayed the edited migration via vitest globalSetup.<br>Schema 与迁移 `20261002095350_t04_messages_unread`：`messages`（唯一约束 `(case_id, author_id, idempotency_key)`、`seq` SERIAL、`published_at`、`corrected_by_id`；手工加入 SPEC 5.1 完整枚举状态 CHECK）与 `case_members.last_read_message_id`。已应用到 clc_dev；clc_test 经 vitest globalSetup 重放了修订后的迁移。
3. TDD: wrote 5 integration files + 1 unit file first (all red on imports), then implemented to green: `src/modules/messages/{service,check,lang,unread}.ts`, `src/server/sse/hub.ts`, routes `src/app/api/cases/[id]/{messages,stream}/route.ts`, unread counts in `src/modules/cases/service.ts` (list + detail), `tests/integration/helpers.ts` (+message cleanup, +postMessage helper).<br>TDD：先写 5 个集成测试文件＋1 个单元文件（导入即红），随后实现至全绿：`src/modules/messages/{service,check,lang,unread}.ts`、`src/server/sse/hub.ts`、路由 `src/app/api/cases/[id]/{messages,stream}/route.ts`、`src/modules/cases/service.ts` 加未读数（列表＋详情）、`tests/integration/helpers.ts`（消息清理与 postMessage 辅助）。
4. Verified personally: `npm run test` 80/80 green (16 files; 18 unit + 62 integration); `npm run lint` clean; `npx tsc --noEmit` clean; `npm run build` succeeded (25 routes incl. `/api/cases/[id]/messages` and `/api/cases/[id]/stream`). `.env` untouched; no new env vars; fictitious test data only.<br>本人复核：`npm run test` 80/80 通过（16 个文件；18 单元＋62 集成）；`npm run lint` 无错误；`npx tsc --noEmit` 无错误；`npm run build` 成功（25 条路由，含 `/api/cases/[id]/messages` 与 `/api/cases/[id]/stream`）。`.env` 未动；无新增环境变量；仅用虚构测试数据。

### Changed Files / 变更文件

- Code commit 52143e0 (16 files): migration `20261002095350_t04_messages_unread`; `prisma/schema.prisma`; `src/modules/messages/{service,check,lang,unread}.ts`; `src/server/sse/hub.ts`; API routes `src/app/api/cases/[id]/messages/route.ts`, `src/app/api/cases/[id]/stream/route.ts`; `src/modules/cases/service.ts` (unreadCount); tests `tests/integration/messages/{idempotency,visibility,sse-reconnect,send-rules,unread}.test.ts`, `tests/unit/messages/lang.test.ts`, `tests/integration/helpers.ts`.<br>代码提交 52143e0（16 个文件）：迁移 `20261002095350_t04_messages_unread`；`prisma/schema.prisma`；`src/modules/messages/{service,check,lang,unread}.ts`；`src/server/sse/hub.ts`；API 路由 `src/app/api/cases/[id]/messages/route.ts`、`src/app/api/cases/[id]/stream/route.ts`；`src/modules/cases/service.ts`（unreadCount）；测试 `tests/integration/messages/*`、`tests/unit/messages/lang.test.ts`、`tests/integration/helpers.ts`。
- Docs (this commit): PROGRESS.md rewritten (T04 done), PLAN.md T04 status → Done, SESSIONS.md this entry.<br>文档（本次提交）：PROGRESS.md 重写（T04 完成）、PLAN.md T04 状态改为完成、SESSIONS.md 本条记录。

### Deviations from the T04 task text (recorded) / 与 T04 任务文本的偏离（已记录）

1. Backfill cursor is `(published_at, id)`, not insert order — so a message published late after review (T05/T07) still surfaces after older cursors; this satisfies "no loss, no duplication" beyond the stub path. `seq` is kept as the display order for the full list.<br>补拉游标用 `(published_at, id)` 而非插入顺序——审核后延迟发布的消息（T05/T07）也能在旧游标之后浮出；这比桩路径更稳地满足「无丢失无重复」。`seq` 保留为完整列表的展示顺序。
2. `Idempotency-Key` header is mandatory (400 when missing); a replayed submission returns 200 with the original row (first create 201), making replays observable.<br>`Idempotency-Key` 请求头为必填（缺失 400）；重放返回 200 与原行（首次创建 201），便于观测重放。
3. Unknown `after=` cursor returns 400 `invalid_cursor` (not an empty/all list) — a client with a lost cursor must do a full refetch.<br>未知 `after=` 游标返回 400 `invalid_cursor`（而非空列表或全量）——游标丢失的客户端须全量重拉。
4. Send-status display wording (REQ-MSG-06 labels) stays frontend-side; the API returns the raw status enum, which is complete in the DB CHECK.<br>发送状态展示措辞（REQ-MSG-06 标签）留给前端；API 返回原始状态枚举，数据库 CHECK 已含完整枚举。

### Verification Results / 验证结果

- `npm run test`: 16 files, 80/80 passed. `npm run lint`: clean. `npx tsc --noEmit`: clean. `npm run build`: success (25 routes).<br>`npm run test`：16 个文件 80/80 通过。`npm run lint`：无错误。`npx tsc --noEmit`：无错误。`npm run build`：成功（25 条路由）。
- All six PLAN T04 acceptance criteria have direct tests: sequential + concurrent (5-way) idempotent replay; pending invisible to receiver on list/backfill/SSE and author sees own status; backfill after-disconnect boundaries (middle cursor, newest cursor → empty, unknown → 400); non-member/revoked SSE denial; coordinator member posting through the same pipeline; archived-case 409 and >4000-char 400.<br>PLAN T04 六条验收标准均有直接测试：顺序＋并发（5 路）幂等重放；pending 对接收方在列表/补拉/SSE 不可见且作者可见本人状态；断线补拉边界（中间游标、最新游标→空、未知→400）；非成员/被撤销成员 SSE 拒绝；协调员成员走同一流水线发言；归档案 409 与超 4000 字符 400。

### Unfinished Items / 未完成项

- Audit trail remains T11 (`TODO(T11)` markers on send/subscribe); closing live SSE connections on revoke is T11; the real content check (T05) replaces the pass-through stub in `src/modules/messages/check.ts` and registers `review_tasks`; check_failed Coordinator alerts are T07; send-status display labels are frontend work.<br>审计仍属 T11（发送/订阅处有 `TODO(T11)` 标记）；撤权断开存量 SSE 属 T11；真实内容检查（T05）将替换 `src/modules/messages/check.ts` 的直通桩并登记 `review_tasks`；check_failed 协调员告警属 T07；发送状态展示标签属前端工作。

### First Step Next Time / 下次第一步

Implement PLAN.md T05 against SPEC.md v0.8 REQ-MOD-01~08 (see PROGRESS.md "Next Steps"); wire the real checker into `src/modules/messages/check.ts`. Do not redo T01–T04.<br>按 SPEC.md v0.8 REQ-MOD-01~08 实现 PLAN.md T05（见 PROGRESS.md「下一步」）；把真实检查接入 `src/modules/messages/check.ts`。不要重做 T01–T04。

---

## Session 2026-10-02-05 (Ended) / 会话 2026-10-02-05（已结束）

- Date/Timezone: 2026-10-02, UTC (Kimi Code coder subagent on the dev VPS)<br>日期/时区：2026-10-02，UTC（研发 VPS 上的 Kimi Code coder 子代理）
- Goal: implement PLAN.md T05 (content check rules and review entry, explicit fee-inquiry trigger) against SPEC.md v0.8 REQ-MOD-01~08 / REQ-MSG-01/03 / REQ-NTF-07 (registration part), TDD, without redoing T01–T04.<br>本次目标：按 SPEC.md v0.8 REQ-MOD-01~08／REQ-MSG-01/03／REQ-NTF-07（登记部分）以 TDD 实现 PLAN.md T05（内容检查规则与审核入口，显式费用问询触发），不重做 T01–T04。

### Actual Actions / 实际动作

1. Re-read the baseline: PLAN T05, SPEC sections 7/13 (REQ-MOD, review_tasks columns), REQ-NTF-07/REQ-REV for task shape, T04 check stub + service pipeline + test helpers, email-provider pattern for the LLM provider seam.<br>重读基线：PLAN T05、SPEC 第 7/13 节（REQ-MOD、review_tasks 列）、REQ-NTF-07/REQ-REV 确定任务表形状、T04 检查桩＋服务流水线＋测试辅助、邮件 provider 模式以套用 LLM provider 接缝。
2. TDD: wrote fixtures `tests/fixtures/moderation/{pass,review}.json` (14 pass + 19 review, zh/vi/en, fictitious) and 3 test files first (all red on imports), then implemented to green.<br>TDD：先写语料 `tests/fixtures/moderation/{pass,review}.json`（14 放行＋19 待审，中越英，虚构）与 3 个测试文件（导入即红），随后实现至全绿。
3. Migration `20261002102258_t05_review_tasks`: `review_tasks` per SPEC 13 + hand-added CHECKs (target_type, status, reason 1–200). Repaired the pre-existing T04 checksum mismatch in clc_dev by aligning recorded checksums with on-disk migration files (reset was forbidden); applied the T05 CHECKs to clc_dev and aligned its checksum the same way.<br>迁移 `20261002102258_t05_review_tasks`：按 SPEC 13 建 `review_tasks`＋手工 CHECK（target_type、status、reason 1–200）。通过把记录校验和与磁盘迁移文件对齐修复了 clc_dev 既有的 T04 校验和不一致（禁止 reset）；T05 的 CHECK 同步应用到 clc_dev 并同样对齐校验和。
4. Implemented `src/modules/moderation/rules.ts` (pure detectors: email/phone/WeChat/Zalo/URL/QR with full-width, split, tone-less variants), `src/server/providers/llm/{interface,fake,index}.ts` (fake = deterministic explicit-fee heuristic + injectable fixed verdict/failure), `src/modules/moderation/{semantic,pipeline}.ts`, rewired `src/modules/messages/check.ts` (default checker = real pipeline; plain-string injections still work), and `holdForReview` in `service.ts` (pending_review + review_tasks in one transaction; failure → check_failed, never published).<br>实现 `src/modules/moderation/rules.ts`（纯检测器：邮箱/手机号/WeChat/Zalo/URL/二维码，含全角、拆字、无声调变形）、`src/server/providers/llm/{interface,fake,index}.ts`（fake＝确定性显式费用启发式＋可注入固定结论/故障）、`src/modules/moderation/{semantic,pipeline}.ts`，改接 `src/modules/messages/check.ts`（默认检查器＝真实管线；纯字符串注入仍可用），并在 `service.ts` 增加 `holdForReview`（pending_review＋review_tasks 一个事务；失败→check_failed，绝不发布）。
5. Verified personally: `npm run test` 140/140 green (19 files; 71 unit + 69 integration); `npm run lint` clean; `npx tsc --noEmit` clean; `npm run build` succeeded. `.env` untouched; no new env vars required (LLM_PROVIDER optional, defaults to fake); fictitious test data only.<br>本人复核：`npm run test` 140/140 通过（19 个文件；71 单元＋69 集成）；`npm run lint` 无错误；`npx tsc --noEmit` 无错误；`npm run build` 成功。`.env` 未动；无必需新增环境变量（LLM_PROVIDER 可选，默认 fake）；仅用虚构测试数据。

### Changed Files / 变更文件

- Migration `prisma/migrations/20261002102258_t05_review_tasks/migration.sql`; `prisma/schema.prisma` (+ReviewTask, relations).<br>迁移 `prisma/migrations/20261002102258_t05_review_tasks/migration.sql`；`prisma/schema.prisma`（＋ReviewTask 与关联）。
- Code: `src/modules/moderation/{rules,semantic,pipeline}.ts`; `src/server/providers/llm/{interface,fake,index}.ts`; `src/modules/messages/check.ts` (real default checker); `src/modules/messages/service.ts` (`holdForReview` transaction, `normalizeCheckResult`).<br>代码：`src/modules/moderation/{rules,semantic,pipeline}.ts`；`src/server/providers/llm/{interface,fake,index}.ts`；`src/modules/messages/check.ts`（真实默认检查器）；`src/modules/messages/service.ts`（`holdForReview` 事务、`normalizeCheckResult`）。
- Tests: `tests/unit/moderation/{rules,fee-vs-amount}.test.ts`, `tests/integration/moderation/pipeline.test.ts`, `tests/fixtures/moderation/{pass,review}.json`, `tests/integration/helpers.ts` (+reviewTask cleanup).<br>测试：`tests/unit/moderation/{rules,fee-vs-amount}.test.ts`、`tests/integration/moderation/pipeline.test.ts`、`tests/fixtures/moderation/{pass,review}.json`、`tests/integration/helpers.ts`（＋reviewTask 清理）。
- Docs (this commit): PROGRESS.md (T05 done), PLAN.md T05 status → Done, SESSIONS.md this entry.<br>文档（本次提交）：PROGRESS.md（T05 完成）、PLAN.md T05 状态改为完成、SESSIONS.md 本条记录。

### Deviations from the T05 task text (recorded) / 与 T05 任务文本的偏离（已记录）

1. `MessageChecker.check` return widened to `CheckOutcome | CheckResult` (CheckResult carries the hold reason); `normalizeCheckResult` keeps all T04 plain-string injections working unchanged — no T04 test edits were needed.<br>`MessageChecker.check` 返回放宽为 `CheckOutcome | CheckResult`（CheckResult 带拦截原因）；`normalizeCheckResult` 让 T04 全部纯字符串注入原样可用——未改动任何 T04 测试。
2. Registration-failure path maps to check_failed (fail-safe) instead of surfacing a 500: the rollback test proves no half state (no pending_review without task, no orphan task), and the message ends check_failed.<br>登记失败路径归一为 check_failed（fail-safe）而非抛出 500：回滚测试证明无半态（不存在无任务的 pending_review，也无孤儿任务），消息最终停 check_failed。
3. The rollback trigger uses the migration's reason-length CHECK (injected 500-char reason) — a real DB constraint failure inside the transaction, not a mocked Prisma.<br>回滚触发用迁移里的 reason 长度 CHECK（注入 500 字符原因）——事务内真实的数据库约束失败，而非 mock Prisma。
4. review_tasks.status CHECK includes 'cancelled' (T07 escalation/cancel flows) and target_type includes 'file' (T08) so later tasks do not need to alter constraints.<br>review_tasks.status CHECK 含 'cancelled'（T07 升级/取消流程）、target_type 含 'file'（T08），后续任务无需再改约束。

### Verification Results / 验证结果

- `npm run test`: 19 files, 140/140 passed. `npm run lint`: clean. `npx tsc --noEmit`: clean. `npm run build`: success.<br>`npm run test`：19 个文件 140/140 通过。`npm run lint`：无错误。`npx tsc --noEmit`：无错误。`npm run build`：成功。
- All six PLAN T05 acceptance criteria have direct tests: case amounts (claims/damages/settlement/court fees) published; explicit fee inquiries + obfuscated contacts held with same-transaction review_tasks rows; ambiguous fee mentions published; checker failure → check_failed not published; mid-transaction registration failure → full rollback; pending_review invisible to the receiver (T04 invariant re-asserted). REQ-MOD-08: corpus evaluation counts False Block and Missed Block separately; both zero on the fixture set.<br>PLAN T05 六条验收标准均有直接测试：案件金额（请求/赔偿/和解/诉讼费）放行；显式费用问询＋变形联系方式待审且同事务生成 review_tasks 行；模糊费用提及放行；检查故障→check_failed 不发布；事务中途登记失败→完整回滚；pending_review 对接收方不可见（重断言 T04 不变式）。REQ-MOD-08：语料评估分别统计误拦与漏拦，fixture 集上两者皆为零。

### Unfinished Items / 未完成项

- Notification-event registration per reviewer (REQ-NTF-07 event part) is T07 (`TODO(T07)` inside `holdForReview`); review decision APIs and the review console are T07; the real Kimi LLM adapter is T06; REQ-MOD-06 split-across-messages detection and display_name rejection (REQ-MOD-02 display-name part) are not in this task; audit trail stays T11; threshold freeze judging (REQ-MOD-08) waits for the evaluation-set freeze.<br>按审核人登记通知事件（REQ-NTF-07 事件部分）属 T07（`holdForReview` 内 `TODO(T07)`）；审核决策 API 与审核后台属 T07；真实 Kimi LLM 适配属 T06；REQ-MOD-06 跨消息拆分检测与 display_name 拦截（REQ-MOD-02 显示名部分）不在本任务；审计仍属 T11；阈值冻结判定（REQ-MOD-08）待评测集冻结。

### First Step Next Time / 下次第一步

Implement PLAN.md T07 against SPEC.md v0.8 REQ-REV-01~06 / REQ-NTF-07~13 (see PROGRESS.md "Next Steps"); register notification events at the `TODO(T07)` marker in `holdForReview`. T06 (translation) can alternatively go first. Do not redo T01–T05.<br>按 SPEC.md v0.8 REQ-REV-01~06／REQ-NTF-07~13 实现 PLAN.md T07（见 PROGRESS.md「下一步」）；在 `holdForReview` 的 `TODO(T07)` 标记处登记通知事件。也可先做 T06（翻译）。不要重做 T01–T05。

---

## Session 2026-10-02-06 (Ended) / 会话 2026-10-02-06（已结束）

- Date/Timezone: 2026-10-02, UTC (Kimi Code coder subagent on the dev VPS)<br>日期/时区：2026-10-02，UTC（研发 VPS 上的 Kimi Code coder 子代理）
- Goal: implement PLAN.md T06 (translation service and dual reading modes, zh-Hans/zh-Hant/vi/en) against SPEC.md v0.8 REQ-TR-01~09 / REQ-MSG-09/10, TDD, without redoing T01–T05.<br>本次目标：按 SPEC.md v0.8 REQ-TR-01~09／REQ-MSG-09/10 以 TDD 实现 PLAN.md T06（翻译服务与双阅读模式，中简繁/越/英），不重做 T01–T05。

### Actual Actions / 实际动作

1. Re-read the baseline: PLAN T06, SPEC sections 5.2/6/13 (translation state machine, REQ-TR, translation_versions columns), the T05 LLM provider seam (judged moderation-specific but cleanly extensible — added a parallel translation surface to the same files), T04 message service/visibility invariants, test helpers, and `node_modules/next/dist/docs/` route-handler conventions (params-as-Promise, already the project pattern).<br>重读基线：PLAN T06、SPEC 第 5.2/6/13 节（译文状态机、REQ-TR、translation_versions 列）、T05 的 LLM provider 接缝（判定为审核专用但可干净扩展——在同一组文件中加平行翻译面）、T04 消息服务/可见性不变式、测试辅助，以及 `node_modules/next/dist/docs/` 的 route handler 约定（params 为 Promise，已是项目模式）。
2. TDD: wrote `tests/unit/translation/{key-field-check,zh-convert}.test.ts` first (red on imports), implemented to green; then wrote `tests/integration/translation/{modes,failure-states}.test.ts` against the planned API surface, implemented service/providers/routes to green.<br>TDD：先写 `tests/unit/translation/{key-field-check,zh-convert}.test.ts`（导入即红），实现至全绿；随后按设计好的 API 面写 `tests/integration/translation/{modes,failure-states}.test.ts`，实现服务/provider/路由至全绿。
3. Migration `20261002104346_t06_translation_versions` via `migrate dev --create-only` → hand-added CHECKs (status per SPEC 5.2, target_lang per REQ-TR-01) → `migrate dev` applied cleanly to clc_dev (no checksum repair needed this time).<br>迁移 `20261002104346_t06_translation_versions`：先 `migrate dev --create-only` → 手工加入 CHECK（status 按 SPEC 5.2、target_lang 按 REQ-TR-01）→ `migrate dev` 干净应用到 clc_dev（本次无需校验和修复）。
4. Implemented `src/modules/translation/{langs,key-field-check,zh-convert,service}.ts`, extended `src/server/providers/llm/{interface,fake,index}.ts` with the translation surface, added the `kimi-adapter.ts` skeleton (real HTTP path present, never default, loud without key), routes `POST /api/messages/[id]/translate` + `PATCH /api/auth/me`, `mode=auto|manual` on the messages list/backfill, and the minimal case-page `messages-panel.tsx` (mode toggle, waiting/failed+retry/needs_review states).<br>实现 `src/modules/translation/{langs,key-field-check,zh-convert,service}.ts`，扩展 `src/server/providers/llm/{interface,fake,index}.ts` 增加翻译面，新增 `kimi-adapter.ts` 骨架（真实 HTTP 路径存在、绝不做默认、无 key 明确报错），路由 `POST /api/messages/[id]/translate`＋`PATCH /api/auth/me`、消息列表/补拉支持 `mode=auto|manual`，以及最小案件页 `messages-panel.tsx`（模式切换、等待/失败＋重试/needs_review 状态）。
5. Verified personally: `npm run test` 165/165 green (23 files; 84 unit + 81 integration); `npm run lint` clean; `npx tsc --noEmit` clean; `npm run build` succeeded (new route listed). `.env` untouched; placeholders appended to `.env.example` only (`TRANSLATION_PROVIDER`, `KIMI_API_KEY`); fictitious test data only.<br>本人复核：`npm run test` 165/165 通过（23 个文件；84 单元＋81 集成）；`npm run lint` 无错误；`npx tsc --noEmit` 无错误；`npm run build` 成功（新路由已在列表）。`.env` 未动；占位只追加到 `.env.example`（`TRANSLATION_PROVIDER`、`KIMI_API_KEY`）；仅用虚构测试数据。

### Changed Files / 变更文件

- Migration `prisma/migrations/20261002104346_t06_translation_versions/migration.sql`; `prisma/schema.prisma` (+TranslationVersion, Message.translations).<br>迁移 `prisma/migrations/20261002104346_t06_translation_versions/migration.sql`；`prisma/schema.prisma`（＋TranslationVersion、Message.translations）。
- Code: `src/modules/translation/{langs,key-field-check,zh-convert,service}.ts` (new); `src/server/providers/llm/{interface,fake,index}.ts` (extended) + `kimi-adapter.ts` (new skeleton); `src/app/api/messages/[id]/translate/route.ts` (new); `src/app/api/auth/me/route.ts` (+PATCH); `src/app/api/cases/[id]/messages/route.ts` (+mode); `src/modules/messages/service.ts` (attachTranslations in list/backfill); `src/app/(app)/cases/[id]/{page.tsx,messages-panel.tsx}` (minimal UI); `.env.example` (+2 placeholders).<br>代码：`src/modules/translation/{langs,key-field-check,zh-convert,service}.ts`（新增）；`src/server/providers/llm/{interface,fake,index}.ts`（扩展）＋`kimi-adapter.ts`（新骨架）；`src/app/api/messages/[id]/translate/route.ts`（新增）；`src/app/api/auth/me/route.ts`（＋PATCH）；`src/app/api/cases/[id]/messages/route.ts`（＋mode）；`src/modules/messages/service.ts`（列表/补拉接入 attachTranslations）；`src/app/(app)/cases/[id]/{page.tsx,messages-panel.tsx}`（最小前端）；`.env.example`（＋2 占位）。
- Tests: `tests/unit/translation/{key-field-check,zh-convert}.test.ts`, `tests/integration/translation/{modes,failure-states}.test.ts`, `tests/integration/helpers.ts` (+translationVersion cleanup).<br>测试：`tests/unit/translation/{key-field-check,zh-convert}.test.ts`、`tests/integration/translation/{modes,failure-states}.test.ts`、`tests/integration/helpers.ts`（＋translationVersion 清理）。
- Docs (this commit): PROGRESS.md (T06 done), PLAN.md T06 status → Done, SESSIONS.md this entry.<br>文档（本次提交）：PROGRESS.md（T06 完成）、PLAN.md T06 状态改为完成、SESSIONS.md 本条记录。

### Deviations from the T06 task text (recorded) / 与 T06 任务文本的偏离（已记录）

1. Auto mode creates missing translations synchronously inside the GET request (no worker exists until T07). The SPEC 5.2 queued → translating states are traversed within the request; the waiting state is still reachable (seeded-row test) and the state machine/checks are queue-ready for T07.<br>自动模式在 GET 请求内同步补建缺失译文（T07 之前没有 worker）。SPEC 5.2 的 queued → translating 在请求内走完；waiting 态仍可达（种子行测试），状态机与 CHECK 已为 T07 的队列化做好准备。
2. `glossary_version` (REQ-TR-03) is returned by providers but not persisted in its own column — SPEC 13 fixes the translation_versions shape without it; it currently rides on prompt_version (`clc-translate-v1` pairs with `clc-glossary-v1` in the Kimi skeleton).<br>`glossary_version`（REQ-TR-03）由 provider 返回但未独立建列——SPEC 13 已定 translation_versions 表形不含此列；目前随 prompt_version 记录（Kimi 骨架中 `clc-translate-v1` 与 `clc-glossary-v1` 配对）。
3. Language correction (REQ-TR-07) is restricted to the message author (others 403) — the receiver-side flag UI is out of the minimal-API scope.<br>语言纠正（REQ-TR-07）仅限消息作者（其他人 403）——接收方标记 UI 超出最小 API 范围。
4. Needs_review retry policy: a repeated manual translate on a needs_review/failed latest version creates a new version (same path as retry); done versions are always reused. Auto mode never creates over an existing failed/needs_review row (no silent provider spam on every list fetch).<br>needs_review 的重试策略：对 needs_review/failed 最新版本再次手动翻译会产生新版本（与重试同路径）；done 版本一律复用。自动模式绝不在已有 failed/needs_review 行上重建（避免每次拉列表都悄悄打 provider）。
5. The zh converter is a small static map (~90 common legal/communication characters) with documented one-to-many simplifications （复→復， 后→後） — sufficient as a mock-grade reading aid; the key-field check still runs on its output.<br>简繁转换器为小型静态映射表（约 90 个常用法律/沟通字符），一对多字的取舍已在文件内注明（复→復、后→後）——作为模拟级阅读辅助足够；其输出仍走关键字段复核。

### Verification Results / 验证结果

- `npm run test`: 23 files, 165/165 passed. `npm run lint`: clean. `npx tsc --noEmit`: clean. `npm run build`: success (27 routes, incl. `/api/messages/[id]/translate`).<br>`npm run test`：23 个文件 165/165 通过。`npm run lint`：无错误。`npx tsc --noEmit`：无错误。`npm run build`：成功（27 条路由，含 `/api/messages/[id]/translate`）。
- All six PLAN T06 acceptance criteria have direct tests: (1) pending_review/check_failed never reach the provider (author 409, other member 404, zero calls, zero rows); (2) auto mode waits without substituting the foreign source, supports all four languages, and zh-Hans↔zh-Hant converts deterministically with version rows; (3) timeout/rate_limited/format → failed, source intact, retryable, no fake success; (4) key-field mismatch → needs_review, withheld from the translate response and both reading modes; (5) manual click-only translation, same-language no-op, retry/correction → version+1; (6) provider payload deep-equals {text, sourceLang, targetLang} with no "@".<br>PLAN T06 六条验收标准均有直接测试：（1）pending_review/check_failed 绝不发给 provider（作者 409、其他成员 404、零调用、零行）；（2）自动模式等待且不以源文替代、四种语言全覆盖、简繁走确定性转换且生成版本行；（3）timeout/rate_limited/format→failed、源文不动、可重试、不伪造成功；（4）关键字段不一致→needs_review，翻译响应与两种阅读模式均不展示；（5）手动点击才翻译、同语种不翻译、重试/纠正→版本+1；（6）provider 载荷精确等于 {text, sourceLang, targetLang} 且无 "@"。

### Unfinished Items / 未完成项

- Asynchronous translation via the persistent task queue (T07-era); real Kimi enablement waits for the O05 data-processing check (skeleton only); glossary_version has no dedicated column (rides on prompt_version); mixed-language flag UI and language-preference editing UI not built (APIs exist); receiver-side language correction is author-only for now; document/file translation stays P1 (T09); audit trail stays T11 (`TODO(T11)` markers on translate/correct/preference-update).<br>经持久任务队列的异步翻译（T07 时期）；真实 Kimi 启用待 O05 数据处理核查（仅骨架）；glossary_version 无独立列（随 prompt_version）；混合语言标记 UI 与语言偏好编辑 UI 未做（API 已有）；语言纠正暂限作者；文档/文件翻译仍属 P1（T09）；审计仍属 T11（翻译/纠正/偏好更新处有 `TODO(T11)` 标记）。

### First Step Next Time / 下次第一步

Implement PLAN.md T07 against SPEC.md v0.8 REQ-REV-01~06 / REQ-NTF-07~13 (see PROGRESS.md "Next Steps"); register notification events at the `TODO(T07)` marker in `holdForReview`, and reuse `publishMessage` for reviewer releases (which then become translatable per the T06 REQ-TR-09 gate). Do not redo T01–T06.<br>按 SPEC.md v0.8 REQ-REV-01~06／REQ-NTF-07~13 实现 PLAN.md T07（见 PROGRESS.md「下一步」）；在 `holdForReview` 的 `TODO(T07)` 标记处登记通知事件，审核放行复用 `publishMessage`（放行后按 T06 的 REQ-TR-09 门槛即可翻译）。不要重做 T01–T06。

## Session 2026-10-02-07 (Ended) / 会话 2026-10-02-07（已结束）

- Date/Timezone: 2026-10-02, UTC (Kimi Code coder subagent on the dev VPS)<br>日期/时区：2026-10-02，UTC（研发 VPS 上的 Kimi Code coder 子代理）
- Goal: implement PLAN.md T07 (review console + coordinator automatic reminders, including the notification core) against SPEC.md v0.8 REQ-REV-01~06 / REQ-NTF-07~13 / notification state machine 10.1, TDD, without redoing T01–T06.<br>本次目标：按 SPEC.md v0.8 REQ-REV-01~06／REQ-NTF-07~13／通知状态机 10.1 以 TDD 实现 PLAN.md T07（审核后台＋协调员自动提醒，含通知核心），不重做 T01–T06。

### Actual Actions / 实际动作

1. Re-read the baseline: PLAN T07, SPEC sections 10/11/16 (REQ-NTF, REQ-REV, API surface) and O03 parameters (≤30s first send, 1/5/15-minute retries ×5, 30-minute/2-hour escalation, elapsed-clock timers), T05 `holdForReview` (`TODO(T07)` marker), T02 email provider seam, T03 guards/member flags, test helpers, and `node_modules/next/dist/docs/` route-handler conventions (unchanged from the project pattern).<br>重读基线：PLAN T07、SPEC 第 10/11/16 节（REQ-NTF、REQ-REV、API 面）与 O03 参数（首发 ≤30s、1/5/15 分钟重试 ×5、30 分钟/2 小时升级、按已流逝时钟计时）、T05 `holdForReview`（`TODO(T07)` 标记）、T02 邮件 provider 接缝、T03 守卫/职责标记、测试辅助，以及 `node_modules/next/dist/docs/` 的 route handler 约定（与项目既有模式一致）。
2. TDD: wrote `tests/unit/notifications/dedupe.test.ts` first (red on imports), implemented `src/modules/notifications/dedupe.ts` to green; then wrote `tests/integration/review/{alert-lifecycle,decisions}.test.ts` against the planned API surface and implemented queue/worker/review module/routes to green (two design fixes surfaced by failing tests — see Deviations).<br>TDD：先写 `tests/unit/notifications/dedupe.test.ts`（导入即红），实现 `src/modules/notifications/dedupe.ts` 至全绿；随后按设计好的 API 面写 `tests/integration/review/{alert-lifecycle,decisions}.test.ts`，实现队列/worker/审核模块/路由至全绿（失败测试暴露两处设计修正——见「偏离」）。
3. Migration `20261002112314_t07_notification_tasks_review_console` via `migrate dev --create-only` → hand-added CHECKs (notification kind/status per SPEC 10.1, is_backup coordinator-only, decision_reason/appeal_note lengths) → `migrate dev` applied cleanly to clc_dev.<br>迁移 `20261002112314_t07_notification_tasks_review_console`：先 `migrate dev --create-only` → 手工加入 CHECK（通知 kind/status 按 SPEC 10.1、is_backup 仅协调员、decision_reason/appeal_note 长度）→ `migrate dev` 干净应用到 clc_dev。
4. Implemented `src/server/jobs/{clock,queue,worker}.ts` (injectable clock; same-transaction `registerHoldAlerts`; escalation registration; idempotent worker pass with cancel-stale → escalate → send-due, batch merge, 1/5/15 backoff ×5, pre-send re-validation), `src/modules/notifications/{dedupe,templates}.ts`, `src/modules/review/service.ts`, routes `GET /api/review/tasks` + `POST /api/review/tasks/[id]/{approve,return,reject,appeal}` (shared `decision-route.ts` factory), the minimal page `src/app/(app)/review/{page.tsx,review-queue.tsx}`, the `holdForReview` registration at the former `TODO(T07)` marker, and REQ-NTF-12 `reviewAlertIssue` annotation on the author's message views.<br>实现 `src/server/jobs/{clock,queue,worker}.ts`（可注入时钟；同事务 `registerHoldAlerts`；升级登记；幂等 worker 单趟：取消过期→升级→发送到期、批次合并、1/5/15 退避 ×5、发送前重检）、`src/modules/notifications/{dedupe,templates}.ts`、`src/modules/review/service.ts`、路由 `GET /api/review/tasks`＋`POST /api/review/tasks/[id]/{approve,return,reject,appeal}`（共用 `decision-route.ts` 工厂）、简易页面 `src/app/(app)/review/{page.tsx,review-queue.tsx}`、在原 `TODO(T07)` 标记处接入 `holdForReview` 登记，以及作者消息视图上的 REQ-NTF-12 `reviewAlertIssue` 标注。
5. Verified personally: `npm run test` 198/198 green (26 files); `npm run lint` clean; `npx tsc --noEmit` clean; `npm run build` succeeded (all review routes listed). `.env` untouched; `APP_BASE_URL` placeholder appended to `.env.example` only; fictitious test data only.<br>本人复核：`npm run test` 198/198 通过（26 个文件）；`npm run lint` 无错误；`npx tsc --noEmit` 无错误；`npm run build` 成功（全部审核路由已在列表）。`.env` 未动；`APP_BASE_URL` 占位只追加到 `.env.example`；仅用虚构测试数据。

### Changed Files / 变更文件

- Migration `prisma/migrations/20261002112314_t07_notification_tasks_review_console/migration.sql`; `prisma/schema.prisma` (+NotificationTask, ReviewTask lifecycle/decision/appeal columns, CaseMember.is_backup, back-relations).<br>迁移 `prisma/migrations/20261002112314_t07_notification_tasks_review_console/migration.sql`；`prisma/schema.prisma`（＋NotificationTask、ReviewTask 生命周期/决策/申诉列、CaseMember.is_backup、反向关系）。
- Code: `src/server/jobs/{clock,queue,worker}.ts`, `src/modules/notifications/{dedupe,templates}.ts`, `src/modules/review/service.ts` (new); `src/modules/messages/service.ts` (hold-time alert registration, reviewAlertIssue annotation, stale TODO(T07)→TODO(T08) for the check_failed alert); `src/app/api/review/tasks/route.ts` + `src/app/api/review/tasks/[id]/{decision-route,approve/route,return/route,reject/route,appeal/route}.ts` (new); `src/app/(app)/review/{page.tsx,review-queue.tsx}` (new); `.env.example` (+APP_BASE_URL).<br>代码：`src/server/jobs/{clock,queue,worker}.ts`、`src/modules/notifications/{dedupe,templates}.ts`、`src/modules/review/service.ts`（新增）；`src/modules/messages/service.ts`（挂起时登记提醒、reviewAlertIssue 标注、check_failed 告警的过期 TODO(T07)→TODO(T08)）；`src/app/api/review/tasks/route.ts`＋`src/app/api/review/tasks/[id]/{decision-route,approve/route,return/route,reject/route,appeal/route}.ts`（新增）；`src/app/(app)/review/{page.tsx,review-queue.tsx}`（新增）；`.env.example`（＋APP_BASE_URL）。
- Tests: `tests/unit/notifications/dedupe.test.ts`, `tests/integration/review/{alert-lifecycle,decisions}.test.ts` (new); `tests/integration/helpers.ts` (+notificationTask cleanup, isBackup flag).<br>测试：`tests/unit/notifications/dedupe.test.ts`、`tests/integration/review/{alert-lifecycle,decisions}.test.ts`（新增）；`tests/integration/helpers.ts`（＋notificationTask 清理、isBackup 标记）。
- Docs (this commit): PROGRESS.md (T07 done + test status + pointer), PLAN.md T07 status → Done, SESSIONS.md this entry.<br>文档（本次提交）：PROGRESS.md（T07 完成＋测试状态＋指针）、PLAN.md T07 状态改为完成、SESSIONS.md 本条记录。

### Deviations from the T07 task text (recorded) / 与 T07 任务文本的偏离（已记录）

1. Backup coordinator is modeled as `case_members.is_backup` (coordinator-only CHECK) and the operations lead as global role `ops_lead` — the schema had neither concept; both are minimal extensions consistent with T03's flag pattern, and backup members gain queue/decision rights so an escalated task never becomes ownerless.<br>备用协调员建模为 `case_members.is_backup`（仅协调员 CHECK），运营负责人建模为全局角色 `ops_lead`——schema 原本没有这两个概念；两者均为与 T03 标记模式一致的最小扩展，且备用成员获得队列/决策权，升级后的任务不会无主。
2. Level-0 recipients are can_review reviewers only; the backup is alerted at registration ONLY when no reviewer remains (author skipped or no reviewers at all) — a failing escalation test caught that alerting backups immediately would double-notify them before the 30-minute escalation SPEC intends.<br>初始接收人仅为 can_review 审核人；仅当无审核人剩余（作者被跳过或本无审核人）时备用才在登记时收到提醒——一个失败的升级测试发现：若登记即通知备用，会在 SPEC 设定的 30 分钟升级之前对其重复通知。
3. Dedupe conflicts are avoided by filter-then-createMany instead of catching P2002, because a unique violation inside the interactive hold transaction would abort it (and with it the review hold itself).<br>去重冲突以「先过滤后 createMany」规避而非捕获 P2002，因为交互式挂起事务内的唯一冲突会中止整个事务（连同审核挂起本身）。
4. REQ-NTF-09 lifecycle recording is the sanctioned lightweight variant: `opened_at` on first queue view, `started_at`/`decided_at` on the decision path, provider acceptance on `notification_tasks.submitted_at` — separate columns/queries, no per-recipient open tracking.<br>REQ-NTF-09 生命周期记录采用任务书认可的轻量变体：首次拉队列记 `opened_at`、决策路径记 `started_at`/`decided_at`、供应商接受记在 `notification_tasks.submitted_at`——分列分步，不做按接收人的打开追踪。
5. The approve path updates the message inside the decision transaction and fires the SSE push after commit (instead of calling `publishMessage` inside the transaction); T04's `(published_at, id)` backfill cursor guarantees no loss even if the push is missed.<br>批准路径在决策事务内更新消息、提交后再发 SSE（而非在事务内调用 `publishMessage`）；即使推送丢失，T04 的 `(published_at, id)` 补拉游标保证不丢消息。
6. `delivered`/`unknown`/`in_app_confirmed` states exist in the schema CHECK but are unreachable until a real provider (T12) and the T10 confirm endpoint; the worker runs single-process without claim locking (noted as later hardening).<br>`delivered`/`unknown`/`in_app_confirmed` 态已在 schema CHECK 中，但需真实 provider（T12）与 T10 确认端点才可达；worker 单进程运行、无认领锁（已记为后续加固）。

### Verification Results / 验证结果

- `npm run test`: 26 files, 198/198 passed (was 165; +33: 10 unit dedupe, 12 alert-lifecycle, 11 decisions). `npm run lint`: clean. `npx tsc --noEmit`: clean. `npm run build`: success (all `/api/review/**` routes and `/review` page listed).<br>`npm run test`：26 个文件 198/198 通过（原 165；新增 33：10 单元去重、12 提醒生命周期、11 审核决策）。`npm run lint`：无错误。`npx tsc --noEmit`：无错误。`npm run build`：成功（全部 `/api/review/**` 路由与 `/review` 页面已在列表）。
- All eight PLAN T07 acceptance criteria have direct tests: (1) hold + alert registration in one transaction with rollback proof; (2) author excluded with other reviewers/backup, sole-reviewer self_release=true publishes with trace, dismissal/timeout never confirms; (3) simulated-clock ≤30s first send, exact 1/5/15-minute retries, visible final failure; (4) consecutive holds merged into one batch email, first item immediate, no loss; (5) elapsed-clock escalation backup → ops lead; (6) decide cancels queued alerts, worker re-checks status/permission before sending (revoked ⇒ cancelled, not sent); (7) no-channel anomaly visible to submitter (send response + list) and in the queue; (8) body free of original message/fees/attachments/addresses.<br>PLAN T07 八条验收标准均有直接测试：（1）挂起＋提醒登记同事务并有回滚证明；（2）有其他审核人/备用时作者被排除、唯一审核人 self_release=true 才发布且留痕、关闭提示/超时绝不代确认；（3）模拟时钟首发 ≤30s、精确 1/5/15 分钟重试、最终失败可见；（4）连续待审合并为一封批次邮件、首项立即、无遗漏；（5）按已流逝时钟升级备用→运营负责人；（6）审核完成取消 queued 提醒、worker 发送前重检状态与权限（撤权 ⇒ 取消不发）；（7）无渠道异常对提交人（发送响应＋列表）与队列可见；（8）正文不含原消息/费用/附件/地址。

### Unfinished Items / 未完成项

- Audit trail rows for review decisions/self-release/appeals stay T11 (`TODO(T11)` markers); `peer_urgent` (T10) and `check_failed_alert` (T08, marked `TODO(T08)` in the pipeline) kinds are schema-ready but not yet registered; file targets in the review console (`loadTargetAuthor`) arrive with T08; real-channel states (delivered/unknown/in_app_confirmed) and real email acceptance are T10/T12; the dev worker driver (`startNotificationWorker`) is exported but not yet wired into server startup; worker claim locking for multi-process is later hardening.<br>审核决策/自放行/申诉的审计行仍属 T11（`TODO(T11)` 标记）；`peer_urgent`（T10）与 `check_failed_alert`（T08，流水线中已标 `TODO(T08)`）种类已备好 schema 但尚未登记；审核后台的文件目标（`loadTargetAuthor`）随 T08 到来；真实渠道状态（delivered/unknown/in_app_confirmed）与真实邮件验收属 T10/T12；开发用 worker 驱动（`startNotificationWorker`）已导出但尚未接入服务启动；多进程认领锁属后续加固。

### First Step Next Time / 下次第一步

Implement PLAN.md T08 (file upload/isolation/scanning/publish/authorized download) against SPEC.md REQ-FILE-01~08, reusing the T07 seams: `review_tasks` target_type 'file' + `loadTargetAuthor` extension, `registerHoldAlerts` for scan-failure/peer alerts, and the notification worker for `check_failed_alert`. T10 (urgent alerts on the notification core) is also unblocked. Do not redo T01–T07.<br>按 SPEC.md REQ-FILE-01~08 实现 PLAN.md T08（文件上传/隔离/扫描/发布/授权下载），复用 T07 接缝：`review_tasks` target_type 'file'＋`loadTargetAuthor` 扩展、扫描失败/对端提醒用 `registerHoldAlerts`、`check_failed_alert` 走通知 worker。T10（基于通知核心的紧急提醒）同样已解锁。不要重做 T01–T07。

## Session 2026-10-02-08 (Ended) / 会话 2026-10-02-08（已结束）

- Date/Timezone: 2026-10-02, UTC (Kimi Code coder subagent on the dev VPS)<br>日期/时区：2026-10-02，UTC（研发 VPS 上的 Kimi Code coder 子代理）
- Goal: implement PLAN.md T08 (file upload / isolation / scanning / publish / authorized download) against SPEC.md v0.8 REQ-FILE-01~08 and AC06, TDD, without redoing T01–T07.<br>本次目标：按 SPEC.md v0.8 REQ-FILE-01~08 与 AC06 以 TDD 实现 PLAN.md T08（文件上传/隔离/扫描/发布/授权下载），不重做 T01–T07。

### Actual Actions / 实际动作

1. Re-read the baseline: PLAN T08, SPEC section 8 (file state machine 8.1, REQ-FILE-01~08), T03 guards, T05 moderation rules, T07 review service / notification queue / worker seams (incl. the `TODO(T08)` marker in the message pipeline and the pending `loadTargetAuthor` file branch), test helpers, and `node_modules/next/dist/docs/` route-handler conventions (`request.formData()` for multipart bodies in Next 16).<br>重读基线：PLAN T08、SPEC 第 8 节（文件状态机 8.1、REQ-FILE-01~08）、T03 守卫、T05 审核规则、T07 审核服务/通知队列/worker 接缝（含消息流水线的 `TODO(T08)` 标记与挂起的 `loadTargetAuthor` 文件分支）、测试辅助，以及 `node_modules/next/dist/docs/` 的 route handler 约定（Next 16 用 `request.formData()` 处理 multipart）。
2. TDD: wrote fixtures `tests/fixtures/files/samples.ts` (fictitious minimal PDF/PNG/JPG/DOCX-ZIP samples with real magic bytes + a >20MB sample), unit test `tests/unit/files/file-type.test.ts`, and integration tests `tests/integration/files/{quarantine,scan-failure,download-auth}.test.ts` first (red on missing modules), then implemented to green. One test bug surfaced (a 409 assertion used a non-reviewer cookie and correctly got 403 first) — fixed the test to use the reviewer cookie for the 409 path.<br>TDD：先写 fixture `tests/fixtures/files/samples.ts`（带真实 magic bytes 的虚构最小 PDF/PNG/JPG/DOCX-ZIP 样本＋>20MB 样本）、单元测试 `tests/unit/files/file-type.test.ts` 与集成测试 `tests/integration/files/{quarantine,scan-failure,download-auth}.test.ts`（缺模块即红），再实现至全绿。一处测试自身问题暴露（409 断言误用非审核人 cookie，先正确地得到 403）——修正该测试的 409 路径改用审核人 cookie。
3. Migration `20261002122818_t08_files_file_variants`: `migrate dev` applied the generated SQL, then hand-appended CHECKs (files.status per SPEC 8.1 eight states; file_variants.kind original/shared_copy), applied the CHECKs to clc_dev manually, and aligned the recorded checksum (same procedure as T05/T07).<br>迁移 `20261002122818_t08_files_file_variants`：`migrate dev` 应用生成的 SQL 后手工追加 CHECK（files.status 按 SPEC 8.1 八态；file_variants.kind original/shared_copy），再手工把 CHECK 应用到 clc_dev 并对齐记录的校验和（同 T05/T07 流程）。
4. Implemented: storage seam `src/server/providers/storage/{interface,minio,index}.ts` (new dependency `minio@8.0.7` pinned exact; private bucket; quarantine/ and shared/ key prefixes; unknown STORAGE_PROVIDER fails loudly), scanner seam `src/server/providers/scanner/{interface,stub,index}.ts` (clean vs malicious/timeout/encrypted/unparseable; stub refused in production), magic-byte detection `src/modules/files/file-type.ts`, files module `src/modules/files/service.ts` (upload → quarantine → scan pipeline → pending_review/check_failed with same-transaction task+alert registration; visibility-scoped list; authorized proxy download; scan-retry; reject; copySharedVersion for the review decision), routes `POST|GET /api/cases/[id]/files`, `GET /api/files/[id]/download`, `POST /api/files/[id]/scan-retry`, `POST /api/files/[id]/reject`.<br>实现：存储接缝 `src/server/providers/storage/{interface,minio,index}.ts`（新依赖 `minio@8.0.7` 精确固定；私有 bucket；quarantine/ 与 shared/ 前缀；未知 STORAGE_PROVIDER 明确报错）、扫描接缝 `src/server/providers/scanner/{interface,stub,index}.ts`（clean 对 malicious/timeout/encrypted/unparseable；stub 生产禁用）、magic bytes 检测 `src/modules/files/file-type.ts`、文件模块 `src/modules/files/service.ts`（上传 → 隔离 → 扫描流水线 → pending_review/check_failed 同事务登记任务＋告警；按可见性过滤的列表；授权代理下载；scan-retry；reject；供审核决策用的 copySharedVersion）、路由 `POST|GET /api/cases/[id]/files`、`GET /api/files/[id]/download`、`POST /api/files/[id]/scan-retry`、`POST /api/files/[id]/reject`。
5. Wired the T07 seams: `loadTargetAuthor` file branch (reviewer sees the file name); `decideReviewTask` file handling (shared copy stored BEFORE the decision transaction; file published + shared_copy variant row + alert cancellation inside it); `registerCheckFailedAlerts` in `src/server/jobs/queue.ts` (per-reviewer, content-free, per-failure dedupe sequence) now called from both the file pipeline and the message pipeline's former `TODO(T08)` marker; the worker sends kind `check_failed_alert` via the new content-free template `buildCheckFailedAlertEmail`, batched per (kind, case, recipient).<br>接通 T07 接缝：`loadTargetAuthor` 文件分支（审核人看到文件名）；`decideReviewTask` 文件处理（共享副本在决策事务之前存储；文件发布＋shared_copy 变体行＋提醒取消在事务内）；`src/server/jobs/queue.ts` 的 `registerCheckFailedAlerts`（按审核人、不含正文、按失败次数去重）现在同时由文件流水线与消息流水线原 `TODO(T08)` 标记处调用；worker 经新的不含正文模板 `buildCheckFailedAlertEmail` 发送 kind `check_failed_alert`，按（kind, 案件, 接收人）合并批次。
6. Verified personally: `npm run test` 221/221 green (30 files); `npm run lint` clean; `npx tsc --noEmit` clean; `npm run build` succeeded (all file routes listed). `.env` untouched; `STORAGE_PROVIDER`/`FILE_SCANNER` placeholders appended to `.env.example` only; tests pin a disposable MinIO bucket `clc-test-uploads` via `tests/setup-env.ts`; fictitious test data only.<br>本人复核：`npm run test` 221/221 通过（30 个文件）；`npm run lint` 无错误；`npx tsc --noEmit` 无错误；`npm run build` 成功（全部文件路由已在列表）。`.env` 未动；`STORAGE_PROVIDER`/`FILE_SCANNER` 占位只追加到 `.env.example`；测试经 `tests/setup-env.ts` 固定使用一次性 MinIO bucket `clc-test-uploads`；仅用虚构测试数据。

### Changed Files / 变更文件

- Migration `prisma/migrations/20261002122818_t08_files_file_variants/migration.sql`; `prisma/schema.prisma` (+File, +FileVariant, back-relations on Case/User).<br>迁移 `prisma/migrations/20261002122818_t08_files_file_variants/migration.sql`；`prisma/schema.prisma`（＋File、＋FileVariant、Case/User 反向关系）。
- Code (new): `src/server/providers/storage/{interface,minio,index}.ts`, `src/server/providers/scanner/{interface,stub,index}.ts`, `src/modules/files/{file-type,service}.ts`, `src/app/api/cases/[id]/files/route.ts`, `src/app/api/files/[id]/{download,scan-retry,reject}/route.ts`.<br>代码（新增）：`src/server/providers/storage/{interface,minio,index}.ts`、`src/server/providers/scanner/{interface,stub,index}.ts`、`src/modules/files/{file-type,service}.ts`、`src/app/api/cases/[id]/files/route.ts`、`src/app/api/files/[id]/{download,scan-retry,reject}/route.ts`。
- Code (modified): `src/modules/review/service.ts` (file target branch + approve shared-copy flow), `src/modules/messages/service.ts` (check_failed alert registration at the former TODO(T08) marker), `src/server/jobs/queue.ts` (+registerCheckFailedAlerts), `src/server/jobs/worker.ts` (check_failed_alert kind, per-kind batching/templates), `src/modules/notifications/templates.ts` (+buildCheckFailedAlertEmail), `package.json`/`package-lock.json` (+minio@8.0.7), `.env.example` (+STORAGE_PROVIDER, FILE_SCANNER).<br>代码（修改）：`src/modules/review/service.ts`（文件目标分支＋批准共享副本流程）、`src/modules/messages/service.ts`（原 TODO(T08) 标记处登记 check_failed 告警）、`src/server/jobs/queue.ts`（＋registerCheckFailedAlerts）、`src/server/jobs/worker.ts`（check_failed_alert 种类、按 kind 分批/模板）、`src/modules/notifications/templates.ts`（＋buildCheckFailedAlertEmail）、`package.json`/`package-lock.json`（＋minio@8.0.7）、`.env.example`（＋STORAGE_PROVIDER、FILE_SCANNER）。
- Tests: `tests/fixtures/files/samples.ts`, `tests/unit/files/file-type.test.ts`, `tests/integration/files/{quarantine,scan-failure,download-auth}.test.ts` (new); `tests/integration/helpers.ts` (+file/fileVariant cleanup, uploadFileRequest, getRequest); `tests/setup-env.ts` (+MinIO test bucket, FILE_SCANNER).<br>测试：`tests/fixtures/files/samples.ts`、`tests/unit/files/file-type.test.ts`、`tests/integration/files/{quarantine,scan-failure,download-auth}.test.ts`（新增）；`tests/integration/helpers.ts`（＋file/fileVariant 清理、uploadFileRequest、getRequest）；`tests/setup-env.ts`（＋MinIO 测试 bucket、FILE_SCANNER）。
- Docs (this commit): PROGRESS.md (T08 done + test status + pointer), PLAN.md T08 status → Done, SESSIONS.md this entry.<br>文档（本次提交）：PROGRESS.md（T08 完成＋测试状态＋指针）、PLAN.md T08 状态改为完成、SESSIONS.md 本条记录。

### Deviations from the T08 task text (recorded) / 与 T08 任务文本的偏离（已记录）

1. The check_failed reject path is a dedicated `POST /api/files/:id/reject` endpoint (can_review, check_failed only) rather than the T07 decision API — check_failed files have no review task, so the decision API cannot address them; pending_review files still go through the T07 decision API unchanged.<br>check_failed 的拒绝走独立端点 `POST /api/files/:id/reject`（限 can_review、仅 check_failed）而非 T07 决策 API——check_failed 文件没有审核任务，决策 API 无法寻址；pending_review 文件仍原样走 T07 决策 API。
2. The uploader may download their own (pre-publish) original and can_review coordinators may download quarantined content for review; REQ-FILE-02 restricts the receiver (counterparty), and REQ-FILE-05 requires the coordinator to inspect content — receivers still get 404 on anything unpublished.<br>上传者可下载本人（发布前）原件、can_review 协调员可下载隔离内容用于审核；REQ-FILE-02 约束的是接收方（对方），REQ-FILE-05 要求协调员能检查内容——接收方对任何未发布内容仍是 404。
3. DOCX detection accepts any ZIP container (magic bytes PK\x03\x04) — deep container parsing ([Content_Types].xml, embedded objects) and document properties/comments/revisions inspection (REQ-FILE-07 depth) are documented MVP limitations; file names ARE run through the T05 rules.<br>DOCX 检测接受任何 ZIP 容器（magic bytes PK\x03\x04）——容器深解析（[Content_Types].xml、嵌入对象）与文档属性/批注/修订检查（REQ-FILE-07 深度部分）为已记录的 MVP 限制；文件名已纳入 T05 规则检查。
4. check_failed alerts carry a per-failure sequence in the dedupe key (`check_failed_alert:<target>:<user>:<seq>`) so a failed scan-retry alerts again exactly once; they are not auto-cancelled when the file later leaves check_failed (notification_tasks has no file link column — the pre-send permission/case re-validation still guards).<br>check_failed 告警的去重键带按失败次数的序号（`check_failed_alert:<target>:<user>:<seq>`），重试再失败会且只会再告警一次；文件之后离开 check_failed 时不自动取消这些告警（notification_tasks 无文件关联列——发送前的权限/案件重检仍在把关）。
5. The message pipeline's `TODO(T08)` marker is also wired: a message checker exception now registers the same content-free check_failed_alert in the same transaction as the state change.<br>消息流水线的 `TODO(T08)` 标记也已接通：消息检查异常现在与状态变更同一事务登记同样的不含正文 check_failed_alert。

### Verification Results / 验证结果

- `npm run test`: 30 files, 221/221 passed (was 198; +23: 6 unit file-type, 6 quarantine, 8 scan-failure, 3 download-auth). `npm run lint`: clean. `npx tsc --noEmit`: clean. `npm run build`: success (all `/api/cases/[id]/files` and `/api/files/**` routes listed).<br>`npm run test`：30 个文件 221/221 通过（原 198；新增 23：6 单元类型检测、6 隔离、8 扫描失败、3 下载鉴权）。`npm run lint`：无错误。`npx tsc --noEmit`：无错误。`npm run build`：成功（全部 `/api/cases/[id]/files` 与 `/api/files/**` 路由已在列表）。
- All six PLAN T08 acceptance criteria have direct tests: (1) pending files invisible to receiver list/download with no object addresses in views; (2) scan failure stops at check_failed with same-transaction content-free coordinator alert, no auto-release, scan-retry available; (3) forged types and >20MB rejected (magic bytes prevail, 413 before storage); (4) every published download re-authorized, post-revocation 403; (5) file-name rule hit enters pending_review with rule:file_name reason; (6) entering pending_review registers the coordinator review alert (T07 link). AC06 covered on the mock chain.<br>PLAN T08 六条验收标准均有直接测试：（1）待审文件对接收方列表/下载不可见且视图无对象地址；（2）扫描失败停 check_failed、同事务登记不含正文的协调员告警、不自动放行、可 scan-retry；（3）伪造类型与 >20MB 拒绝（以 magic bytes 为准、413 先于存储）；（4）发布后下载每次重新鉴权、撤权后 403；（5）文件名规则命中进待审且记 rule:file_name 原因；（6）进入待审登记协调员提醒（与 T07 联动）。AC06 已在模拟链路上覆盖。

### Unfinished Items / 未完成项

- Audit trail rows stay T11 (`TODO(T11)` markers on upload/download/scan-retry/reject/review decisions); real malware scanning waits for a real provider (stub only, refused in production); DOCX container deep parsing and document-property inspection are documented MVP limitations; check_failed alerts are not auto-cancelled when the file leaves check_failed; the 'bilingual' variant kind stays P1 (T09); no preview-thumbnail endpoint exists (previews were never exposed — AC06 satisfied by absence); the dev worker driver is still not wired into server startup (T07 leftover).<br>审计行仍属 T11（上传/下载/重试/拒绝/审核决策处有 `TODO(T11)` 标记）；真实恶意内容扫描待真实 provider（仅 stub，生产禁用）；DOCX 容器深解析与文档属性检查为已记录的 MVP 限制；文件离开 check_failed 后不自动取消其告警；'bilingual' 变体种类仍属 P1（T09）；不存在预览缩略图端点（预览从未暴露——AC06 以不存在满足）；开发用 worker 驱动仍未接入服务启动（T07 遗留）。

### First Step Next Time / 下次第一步

Implement PLAN.md T10 (two-way urgent alerts on the T07 notification core, kind `peer_urgent`, 10-minute cooldown, six-state visibility, In-app Confirmation) or PLAN.md T11 (revocation/archive/admin MFA/audit — all dependencies T03/T04/T07/T08 are now accepted; the T08 download-guard pattern and check_failed_alert flow are the file-side seams to reuse). Do not redo T01–T08.<br>实现 PLAN.md T10（基于 T07 通知核心的双向紧急提醒，kind `peer_urgent`、10 分钟冷却、六态可见、站内确认）或 PLAN.md T11（撤权/归档/管理员 MFA/审计——依赖 T03/T04/T07/T08 均已验收；T08 的下载守卫模式与 check_failed_alert 流程是文件侧可复用接缝）。不要重做 T01–T08。

---
## Session 2026-10-02-09 (Ended) / 会话 2026-10-02-09（已结束）

- Date/Timezone: 2026-10-02, UTC (Kimi Code coder subagent on the dev VPS)<br>日期/时区：2026-10-02，UTC（研发 VPS 上的 Kimi Code coder 子代理）
- Goal: implement PLAN.md T10 (two-way urgent alerts between users, email channel) against SPEC.md v0.8 section 10.1 REQ-NTF-01~06 and AC08 (mock channel), TDD, without redoing T01–T08.<br>本次目标：按 SPEC.md v0.8 第 10.1 节 REQ-NTF-01~06 与 AC08（模拟渠道）以 TDD 实现 PLAN.md T10（双向紧急提醒，用户间，邮件渠道），不重做 T01–T08。

### Actual Actions / 实际动作

1. Re-read the baseline: PLAN T10, SPEC section 10.1 (state machine, REQ-NTF-01~06), the T07 notification core (`src/server/jobs/{clock,queue,worker}.ts`, `src/modules/notifications/{dedupe,templates}.ts`), T03 guards, the members/cases services (revoke/archive paths), the email provider seam, contact_channels crypto helpers, and the T07 integration-test patterns (injectable clock + fake outbox).<br>重读基线：PLAN T10、SPEC 第 10.1 节（状态机、REQ-NTF-01~06）、T07 通知核心（`src/server/jobs/{clock,queue,worker}.ts`、`src/modules/notifications/{dedupe,templates}.ts`）、T03 守卫、members/cases 服务（撤权/归档路径）、邮件 provider 接缝、contact_channels 加解密工具，以及 T07 集成测试模式（可注入时钟＋fake outbox）。
2. Schema + migrations: `notification_tasks` gained `sender_user_id` (nullable, FK users ON DELETE SET NULL, index) via `20261002125310_t10_peer_urgent`; the kind CHECK gained 'urgent_failed_alert' via a separate `20261002130200_t10_urgent_failed_alert_kind` because the first migration had already been applied to clc_dev — history stayed linear and no reset was needed.<br>Schema＋迁移：`notification_tasks` 经 `20261002125310_t10_peer_urgent` 增加 `sender_user_id`（可空、外键 users ON DELETE SET NULL、索引）；kind CHECK 经独立的 `20261002130200_t10_urgent_failed_alert_kind` 增加 'urgent_failed_alert'——因第一个迁移已应用到 clc_dev，保持历史线性且无需 reset。
3. TDD: wrote `tests/integration/urgent/{dedupe-cooldown,status-visibility,confirm}.test.ts` and two unit cases in `tests/unit/notifications/dedupe.test.ts` first (red on missing modules/routes), then implemented to green in one pass.<br>TDD：先写 `tests/integration/urgent/{dedupe-cooldown,status-visibility,confirm}.test.ts` 与 `tests/unit/notifications/dedupe.test.ts` 两个单元用例（缺模块/路由即红），再一次实现至全绿。
4. Implemented: urgent module `src/modules/urgent/service.ts` (send with per-recipient task creation + 10-minute cooldown reuse, sender status view, recipient inbox, in-app confirmation); routes `POST|GET /api/cases/[id]/urgent`, `GET /api/notifications`, `POST /api/notifications/[id]/confirm`; pure rules in `src/modules/notifications/dedupe.ts` (URGENT_COOLDOWN_MS, URGENT_OPEN_STATUSES, peerUrgentDedupeKey, isUrgentInCooldown); templates `buildPeerUrgentEmail` (recipient language zh-Hans/zh-Hant/vi/en) and `buildUrgentFailedAlertEmail` (zh/vi, content-free); queue helpers `registerUrgentFailedNotices`, `cancelQueuedAlertsForRecipient`, `cancelQueuedAlertsForCase`, exported `pickEmailChannel`; worker wiring (peer_urgent/urgent_failed_alert kinds, per-kind authorization recheck, per-kind templates, coordinator notice on final failure); same-transaction cancellation in `revokeMember` and `archiveCase`.<br>实现：紧急模块 `src/modules/urgent/service.ts`（按接收人建任务＋10 分钟冷却复用的发送、发送人状态视图、接收人收件箱、站内确认）；路由 `POST|GET /api/cases/[id]/urgent`、`GET /api/notifications`、`POST /api/notifications/[id]/confirm`；纯规则 `src/modules/notifications/dedupe.ts`（URGENT_COOLDOWN_MS、URGENT_OPEN_STATUSES、peerUrgentDedupeKey、isUrgentInCooldown）；模板 `buildPeerUrgentEmail`（按接收人语言 zh-Hans/zh-Hant/vi/en）与 `buildUrgentFailedAlertEmail`（中越、不含正文）；队列助手 `registerUrgentFailedNotices`、`cancelQueuedAlertsForRecipient`、`cancelQueuedAlertsForCase`、导出 `pickEmailChannel`；worker 接线（peer_urgent/urgent_failed_alert 种类、按种类授权重检、按种类模板、最终失败通知协调员）；`revokeMember` 与 `archiveCase` 的同事务取消。
5. Verified personally: `npm run test` 243/243 green (33 files); `npm run lint` clean; `npx tsc --noEmit` clean; `npm run build` succeeded (the three new routes listed). `.env` untouched; no new env placeholders needed; fictitious test data only.<br>本人复核：`npm run test` 243/243 通过（33 个文件）；`npm run lint` 无错误；`npx tsc --noEmit` 无错误；`npm run build` 成功（三个新路由已在列表）。`.env` 未动；无新增环境占位需求；仅用虚构测试数据。

### Changed Files / 变更文件

- Migrations `prisma/migrations/20261002125310_t10_peer_urgent/migration.sql`, `prisma/migrations/20261002130200_t10_urgent_failed_alert_kind/migration.sql`; `prisma/schema.prisma` (NotificationTask +sender relation/index, User back-relation, comment update).<br>迁移 `prisma/migrations/20261002125310_t10_peer_urgent/migration.sql`、`prisma/migrations/20261002130200_t10_urgent_failed_alert_kind/migration.sql`；`prisma/schema.prisma`（NotificationTask 增加 sender 关系/索引、User 反向关系、注释更新）。
- Code (new): `src/modules/urgent/service.ts`, `src/app/api/cases/[id]/urgent/route.ts`, `src/app/api/notifications/route.ts`, `src/app/api/notifications/[id]/confirm/route.ts`.<br>代码（新增）：`src/modules/urgent/service.ts`、`src/app/api/cases/[id]/urgent/route.ts`、`src/app/api/notifications/route.ts`、`src/app/api/notifications/[id]/confirm/route.ts`。
- Code (modified): `src/modules/notifications/dedupe.ts` (+urgent cooldown rules), `src/modules/notifications/templates.ts` (+buildPeerUrgentEmail/buildUrgentFailedAlertEmail), `src/server/jobs/queue.ts` (+urgent-failure notices, cancel helpers, exported pickEmailChannel), `src/server/jobs/worker.ts` (new kinds, per-kind recheck/templates, final-failure notice), `src/modules/members/service.ts` (same-transaction cancel on revoke), `src/modules/cases/service.ts` (same-transaction cancel on archive).<br>代码（修改）：`src/modules/notifications/dedupe.ts`（＋紧急冷却规则）、`src/modules/notifications/templates.ts`（＋buildPeerUrgentEmail/buildUrgentFailedAlertEmail）、`src/server/jobs/queue.ts`（＋紧急失败通知、取消助手、导出 pickEmailChannel）、`src/server/jobs/worker.ts`（新种类、按种类重检/模板、最终失败通知）、`src/modules/members/service.ts`（撤权同事务取消）、`src/modules/cases/service.ts`（归档同事务取消）。
- Tests: `tests/integration/urgent/{dedupe-cooldown,status-visibility,confirm}.test.ts` (new), `tests/unit/notifications/dedupe.test.ts` (+2 cases).<br>测试：`tests/integration/urgent/{dedupe-cooldown,status-visibility,confirm}.test.ts`（新增）、`tests/unit/notifications/dedupe.test.ts`（＋2 用例）。
- Docs (this commit): PROGRESS.md (T10 done + test status + pointer), PLAN.md T10 status → Done, SESSIONS.md this entry.<br>文档（本次提交）：PROGRESS.md（T10 完成＋测试状态＋指针）、PLAN.md T10 状态改为完成、SESSIONS.md 本条记录。

### Deviations from the T10 task text (recorded) / 与 T10 任务文本的偏离（已记录）

1. Invalid recipients (non-member, revoked member, arbitrary text/email, empty list) are rejected with 400 `invalid_recipient` rather than 403 — the sender is a case member who can already see the member list, so a validation error is more precise and leaks nothing; the 403s are reserved for the sender-side guard (non-member sender) as specified.<br>非法接收人（非成员、被撤成员、任意文本/邮箱、空列表）以 400 `invalid_recipient` 拒绝而非 403——发送人本就是能看到成员列表的案件成员，校验错误更精确且不泄露信息；403 按任务说明保留给发送人侧守卫（非成员发送人）。
2. Both sender-status views were built (the task allowed either): `GET /api/cases/:id/urgent` (sender's own tasks in the case) AND `GET /api/notifications` (the recipient's cross-case inbox, which the confirmation flow needs to discover tasks).<br>发送人状态两个视图都实现了（任务说明允许二选一）：`GET /api/cases/:id/urgent`（发送人在本案的任务）与 `GET /api/notifications`（接收人跨案件收件箱——站内确认流程需要它发现任务）。
3. The cooldown dedupe key is per-sequence (`peer_urgent:{case}:{recipient}:{seq}`) rather than time-bucketed: a bucketed key cannot express "a terminal task inside the window must not block a new alert" and collides on same-bucket re-creation; the application-level live-task check (queued/submitted/unknown within 10 minutes) performs the cooldown, and the unique key plus P2002-catch-refetch covers concurrent clicks.<br>冷却去重键采用按序号形式（`peer_urgent:{case}:{recipient}:{seq}`）而非时间桶：时间桶键无法表达「窗口内终态任务不阻挡新提醒」且同桶重建会冲突；冷却由应用层未终态任务检查（10 分钟内的 queued/submitted/unknown）完成，唯一键加 P2002 捕获回查覆盖并发点击。
4. The REQ-NTF-05 coordinator notice uses a new kind `urgent_failed_alert` (kind CHECK extended) with its own content-free zh/vi template instead of reusing `check_failed_alert` — reusing would have mislabeled the email as a security-check failure; the notice fires only on provider-exhausted final failure in the worker, not on the immediate `no_channel` failure (which the sender already sees in the POST response).<br>REQ-NTF-05 协调员通知使用新种类 `urgent_failed_alert`（扩展 kind CHECK）与独立的不含正文中越模板，而非复用 `check_failed_alert`——复用会把邮件误标为安全检查失败；该通知仅在 worker 内 provider 重试耗尽的最终失败时触发，即时 `no_channel` 失败不触发（发送人在 POST 响应中已可见）。
5. The kind-CHECK change landed as a second migration (`20261002130200_t10_urgent_failed_alert_kind`) instead of editing the first one in place, because `migrate dev` had already applied the first to clc_dev and the standing rule forbids resetting the database.<br>kind CHECK 变更落在第二个迁移（`20261002130200_t10_urgent_failed_alert_kind`）而非就地修改第一个——因为 `migrate dev` 已将第一个应用到 clc_dev，而长期规则禁止 reset 数据库。

### Verification Results / 验证结果

- `npm run test`: 33 files, 243/243 passed (was 221; +22: 2 unit dedupe, 7 dedupe-cooldown, 8 status-visibility, 5 confirm). `npm run lint`: clean. `npx tsc --noEmit`: clean. `npm run build`: success (`/api/cases/[id]/urgent`, `/api/notifications`, `/api/notifications/[id]/confirm` listed).<br>`npm run test`：33 个文件 243/243 通过（原 221；新增 22：2 单元去重、7 去重冷却、8 状态可见、5 站内确认）。`npm run lint`：无错误。`npx tsc --noEmit`：无错误。`npm run build`：成功（`/api/cases/[id]/urgent`、`/api/notifications`、`/api/notifications/[id]/confirm` 已在列表）。
- All six PLAN T10 acceptance criteria have direct tests: (1) repeated clicks dedupe inside the window, new task outside it; (2) notification bodies contain no counterparty contact/message content/attachments (body/subject "@"-free, no display name, no case title); (3) status visible to the sender including final failure; (4) final failure sends content-free urgent_failed_alert to each can_review coordinator exactly once; (5) recipient in-app confirmation is trackable (confirmed_at + task link, sender-visible) and others cannot confirm (403); (6) revoke/archive cancel unfinished alerts in the same transaction, with the worker pre-send recheck as backstop. AC08 covered on the mock channel.<br>PLAN T10 六条验收标准均有直接测试：（1）窗口内重复点击去重、窗口外可再发；（2）通知正文不含对方联系方式/正文/附件（正文与标题无 "@"、无显示名、无案件标题）；（3）状态对发送人可见含最终失败；（4）最终失败向每位 can_review 协调员发送不含正文的 urgent_failed_alert 且仅一次；（5）接收人站内确认可追踪（confirmed_at＋任务关联、发送人可见）且他人不能代确认（403）；（6）撤权/归档同事务取消未完成提醒，worker 发送前重检兜底。AC08 已在模拟渠道覆盖。

### Unfinished Items / 未完成项

- Audit trail rows stay T11 (`TODO(T11)` markers on urgent send/confirm); `delivered`/`unknown` states need a real provider (T12); phone/SMS and backup channels stay P1; the immediate `no_channel` failure does not raise the coordinator notice (sender-visible only); the dev worker driver is still not wired into server startup (T07 leftover).<br>审计行仍属 T11（紧急发送/确认处有 `TODO(T11)` 标记）；`delivered`/`unknown` 态需真实 provider（T12）；手机/短信与备用渠道仍属 P1；即时 `no_channel` 失败不触发协调员通知（仅发送人可见）；开发用 worker 驱动仍未接入服务启动（T07 遗留）。

### First Step Next Time / 下次第一步

Implement PLAN.md T11 (Permission Revocation / Archive / admin MFA / Audit Trail — all dependencies T03/T04/T07/T08 accepted). The same-transaction queued-task cancellation on revoke/archive and the `TODO(T11)` audit markers in urgent/members/cases services are the seams T10 leaves; PLAN's T11 note about peer-urgent cancellation assertions is satisfied by `tests/integration/urgent/status-visibility.test.ts`. Do not redo T01–T08 or T10.<br>实现 PLAN.md T11（撤权/归档/管理员 MFA/审计——依赖 T03/T04/T07/T08 均已验收）。撤权/归档的同事务 queued 任务取消与 urgent/members/cases 服务中的 `TODO(T11)` 审计埋点是 T10 留下的接缝；PLAN 中 T11 备注的 peer_urgent 取消断言已由 `tests/integration/urgent/status-visibility.test.ts` 满足。不要重做 T01–T08 与 T10。

---

## Session 2026-10-02-10 (Ended) / 会话 2026-10-02-10（已结束）

- Date/Timezone: 2026-10-02, UTC (Kimi Code on the dev VPS)<br>日期/时区：2026-10-02，UTC（研发 VPS 上的 Kimi Code）
- Goal: continue the MVP task sequence — T03 → T04 → T05 → T06 → T07 → T08 → T10 → T11 in this one working session, per the user's standing instruction to proceed without per-step confirmation.<br>本次目标：按用户「少确认、按建议推进」的指示，在一个工作会话内连续推进 T03 → T04 → T05 → T06 → T07 → T08 → T10 → T11。

### Actual Actions / 实际动作

1. Read PROGRESS/PLAN/SESSIONS per the resume protocol; verified containers healthy and the 31/31 baseline before starting T03.<br>按恢复指引读 PROGRESS/PLAN/SESSIONS；开工 T03 前核实容器健康、基线 31/31 全绿。
2. Ran each task through a coder subagent in TDD rhythm (failing tests → minimal implementation → green → refactor), then personally re-verified after every task: full `npm run test`, `npm run lint`, `npx tsc --noEmit`, plus `npm run build` at each task boundary; each task committed and pushed to origin main by its subagent.<br>每个任务经 coder 子代理按 TDD 节奏完成（失败测试→最小实现→全绿→重构），每任务结束后本人复核：全量 `npm run test`、`npm run lint`、`npx tsc --noEmit`，任务边界跑 `npm run build`；各任务由子代理提交并推送 origin main。
3. Per-task results (all verified personally before the next task started): T03 `12f0329` 51/51; T04 `52143e0` 80/80; T05 `0efca10` 140/140; T06 `42633c1` 165/165; T07 `92dd032` 198/198; T08 `836cba8` 221/221; T10 `964f09a` 243/243. Details are in PLAN.md/PROGRESS.md per-task sections.<br>逐任务结果（均在下一任务开工前本人复核）：T03 `12f0329` 51/51；T04 `52143e0` 80/80；T05 `0efca10` 140/140；T06 `42633c1` 165/165；T07 `92dd032` 198/198；T08 `836cba8` 221/221；T10 `964f09a` 243/243。细节见 PLAN.md/PROGRESS.md 各任务节。
4. Interruptions handled: the T03 subagent hit the 2-hour wall-clock timeout twice (resumed, completed); a mid-run permission rejection was a user mis-click (resumed, completed); the T07 subagent hit the provider 5-hour quota window (resumed after reset, completed).<br>中断处理：T03 子代理两次触 2 小时墙钟超时（恢复后完成）；一次权限拒绝为用户误点（恢复后完成）；T07 子代理触供应商 5 小时配额窗口（窗口重置后恢复完成）。
5. T11: the subagent finished essentially all code, tests, migrations, and the PROGRESS/PLAN updates, but the agent call was interrupted before its result was recorded (no commit, no SESSIONS entry). Parent verified the working tree directly: 274/274 tests green (39 files), lint/tsc/build clean, zero remaining `TODO(T11)` markers, then wrote this entry and committed.<br>T11：子代理基本完成全部代码、测试、迁移与 PROGRESS/PLAN 更新，但代理调用在记录结果前被中断（未提交、未写 SESSIONS）。主代理直接复核工作区：274/274 测试通过（39 个文件）、lint/tsc/build 无错误、`TODO(T11)` 标记清零，随后补写本条并提交。

### T11 Summary / T11 摘要

- Migration `20261002132754_t11_audit_mfa`: append-only `audit_logs`; `users` +`mfa_secret_ref` (AES-256-GCM) / `mfa_enrolled_at`.<br>迁移 `20261002132754_t11_audit_mfa`：append-only `audit_logs`；`users` 增加 `mfa_secret_ref`（AES-256-GCM）与 `mfa_enrolled_at`。
- Revocation immediacy: SSE hub `disconnectCaseUser` force-closes a revoked member's live streams post-commit; per-resource-family 403 asserted (messages/files/downloads/SSE/translate/urgent).<br>撤权即时生效：SSE hub `disconnectCaseUser` 在撤权提交后强制关闭存量连接；逐资源族 403 断言（消息/文件/下载/SSE/翻译/紧急提醒）。
- Archive read-only: 409 `case_archived` across all write families; reads stay open; archive audited in-transaction.<br>归档只读：全部写族 409 `case_archived`；读路径开放；归档同事务入审计。
- Zero-dependency RFC 6238 TOTP (RFC Appendix B vectors unit-tested); `requireAdminMfa` gates all admin APIs via per-request `x-totp-code`; `GET /api/admin/audit-logs` MFA-guarded with filters.<br>零依赖 RFC 6238 TOTP（按 RFC 附录 B 向量单测）；`requireAdminMfa` 以逐请求 `x-totp-code` 拦截全部管理 API；`GET /api/admin/audit-logs` 受 MFA 守卫并支持过滤。
- All 31 `TODO(T11)` markers are real audit rows via `src/server/audit/log.ts` (same-transaction where atomicity matters; meta_json forbidden-key guard); REQ-OPS-01 checklist and whole-trail no-sensitive-content scan asserted end-to-end; console-capture test covers REQ-OPS-02.<br>31 个 `TODO(T11)` 标记全部经 `src/server/audit/log.ts` 落为真实审计行（须原子处同事务；meta_json 禁用键守卫）；REQ-OPS-01 清单与整轨无敏感内容扫描端到端断言；console 捕获测试覆盖 REQ-OPS-02。

### Changed Files / 变更文件

- T03–T11 code/docs: see each task's commit (`12f0329`, `52143e0`, `0efca10`, `42633c1`, `92dd032`, `836cba8`, `964f09a`) and PLAN/PROGRESS per-task sections.<br>T03–T11 代码与文档：见各任务提交（`12f0329`、`52143e0`、`0efca10`、`42633c1`、`92dd032`、`836cba8`、`964f09a`）及 PLAN/PROGRESS 各任务节。
- This commit: T11 code + tests + migration + PLAN/PROGRESS updates + this SESSIONS entry.<br>本次提交：T11 代码＋测试＋迁移＋PLAN/PROGRESS 更新＋本 SESSIONS 记录。

### Verification Results / 验证结果

- `npm run test`: 39 files, 274/274 passed. `npm run lint`: clean. `npx tsc --noEmit`: clean. `npm run build`: success.<br>`npm run test`：39 个文件 274/274 通过。`npm run lint`：无错误。`npx tsc --noEmit`：无错误。`npm run build`：成功。
- AC coverage after this session: AC02 (privilege-escalation + revocation parts), AC03 (dedup/reconnect/multilingual-display parts), AC04, AC05, AC06, AC08 (mock), AC09 (archive part), AC11 (audit/logging part), AC12 (mock). Real-channel acceptance (AC01/AC08/AC12 real email), AC10 network test, and the backup/restore drill remain with T12.<br>本会话后的 AC 覆盖：AC02（越权＋撤权）、AC03（去重/重连/多语显示）、AC04、AC05、AC06、AC08（模拟）、AC09（归档）、AC11（审计/日志）、AC12（模拟）。真实渠道验收（AC01/AC08/AC12 真实邮件）、AC10 网络测试与备份恢复演练仍属 T12。

### Unfinished Items / 未完成项

- T11 known items recorded in PROGRESS.md (per-request TOTP without replay cache; no MFA reset flow; id-cursor pagination only).<br>T11 已知项已记入 PROGRESS.md（逐请求 TOTP 无重放缓存；无 MFA 重置流程；仅 id 游标分页）。
- Historical commit cea7e37 still contains the old topology paragraph in CONTEXT.md; history rewrite remains pending the user's decision.<br>历史提交 cea7e37 中 CONTEXT.md 仍含旧拓扑段落；是否改写历史仍待用户决定。

### First Step Next Time / 下次第一步

Implement PLAN.md T12 (E2E dual-user + backup/restore drill + real-channel acceptance): Playwright dual-browser journeys, the REQ-OPS-07 admin test-case runbook (`POST /api/admin/test-cases`), backup/restore drill scripts, deployment docs. External resources O02/O05/O07/O08 gate the real-delivery and network items — mark them Blocked, not passed, if resources are not in place. Do not redo T01–T08/T10/T11.<br>实现 PLAN.md T12（端到端双用户＋备份恢复演练＋真实链路验收）：Playwright 双浏览器旅程、REQ-OPS-07 管理员测试案件指引（`POST /api/admin/test-cases`）、备份恢复演练脚本、部署文档。外部资源 O02/O05/O07/O08 会卡住真实送达与网络项——资源未到位时标「阻塞」而非通过。不要重做 T01–T08/T10/T11。

---

## Session 2026-10-02-11 (Ended) / 会话 2026-10-02-11（已结束）

- Date/Timezone: 2026-10-02, UTC (Kimi Code on the dev VPS)<br>日期/时区：2026-10-02，UTC（研发 VPS 上的 Kimi Code）
- Goal: implement the coding-side deliverables of PLAN.md T12 — admin test-case endpoint (REQ-OPS-07), Playwright dual-browser E2E, backup/restore drill, deployment/runbook docs; external-resource items marked Blocked, not simulated.<br>本次目标：实现 PLAN.md T12 编码侧交付——管理员测试案件端点（REQ-OPS-07）、Playwright 双浏览器 E2E、备份/恢复演练、部署/运行文档；外部资源项如实标阻塞，不以模拟冒充。

### Actual Actions / 实际动作

1. Read PROGRESS/PLAN/SESSIONS per the resume protocol; verified containers healthy and the 274/274 baseline.<br>按恢复指引读 PROGRESS/PLAN/SESSIONS；核实容器健康与 274/274 基线。
2. Built `POST /api/admin/test-cases` (`src/modules/admin/test-cases.ts` + route): `requireAdminMfa`, title/three-distinct-emails/optional display names validation, pending-recipient pre-creation, guard-free `issueInvite` extracted from `src/modules/invites/service.ts` (createInvite keeps its guards), admin never a member, `case.create` + 3× `invite.create` audit rows. 6 integration tests.<br>实现 `POST /api/admin/test-cases`：`requireAdminMfa`、标题/三个互异邮箱/可选显示名校验、预建 pending 接收人、从邀请服务抽出无守卫 `issueInvite`（createInvite 守卫不变）、管理员不成为成员、`case.create`＋3 条 `invite.create` 审计。6 个集成测试。
3. E2E infrastructure: dedicated dev server :3100 + disposable `clc_e2e` (globalSetup rebuild + migrate deploy); test hooks `GET/DELETE /api/test/outbox` and `POST /api/test/worker` (non-production + fake provider only); worker driven in-process via `src/instrumentation.ts` (`NOTIFICATION_WORKER=off` opt-out) — resolving the T07/T10 leftover with the least-change option.<br>E2E 基建：3100 端口专用 dev server＋一次性 `clc_e2e`（globalSetup 重建＋重放迁移）；测试钩子 `GET/DELETE /api/test/outbox` 与 `POST /api/test/worker`（仅非生产＋fake provider）；worker 经 `src/instrumentation.ts` 进程内驱动（`NOTIFICATION_WORKER=off` 关闭）——以最少改动解决 T07/T10 遗留。
4. Minimal UI additions: compose box + SSE live refresh + 10s backstop refetch + hydration gates (`useSyncExternalStore` mounted; pre-hydration clicks were a real flake source) + data-testids. No page rewrites.<br>最小 UI 补齐：输入框＋SSE 实时刷新＋10 秒兜底重拉＋水合门（`useSyncExternalStore`；水合前点击是真实不稳定源）＋data-testid。未重写页面。
5. Three journey specs: dual-user (AC03), review-alert (AC05/AC12), admin-test-case (REQ-OPS-07) — paths detailed in PROGRESS.md T12 section.<br>三个旅程 spec：dual-user（AC03）、review-alert（AC05/AC12）、admin-test-case（REQ-OPS-07）——路径详见 PROGRESS.md T12 节。
6. Fixed the dev host for browsers without root: `apt-get download` + `dpkg -x` of the missing Chromium libraries (libnspr4/libnss3/libatk/libX11 stack) and fonts (DejaVu + Noto CJK — missing fontconfig config was crashing the renderer with a Skia FATAL) into `~/.cache/clc-e2e-libs`; `npm run test:e2e` exports LD_LIBRARY_PATH/FONTCONFIG_FILE pointing there.<br>免 root 修复本机浏览器运行环境：用 `apt-get download`＋`dpkg -x` 把缺失的 Chromium 库（libnspr4/libnss3/libatk/libX11 系列）与字体（DejaVu＋Noto CJK——缺 fontconfig 配置曾使渲染器 Skia FATAL 崩溃）装入 `~/.cache/clc-e2e-libs`；`npm run test:e2e` 导出指向该处的 LD_LIBRARY_PATH/FONTCONFIG_FILE。
7. `scripts/backup.sh` (pg_dump + openssl AES-256-CBC/PBKDF2, key via env only), `scripts/restore-drill.sh` (isolated `clc_restore_check`, row-count comparison, 11 integrity checks, timing report, cleanup), `npm run drill:restore`; drill executed for real: PASS.<br>`scripts/backup.sh`（pg_dump＋openssl AES-256-CBC/PBKDF2，密钥仅经环境传入）、`scripts/restore-drill.sh`（隔离 `clc_restore_check`、行数对照、11 项完整性核查、计时报告、清理）、`npm run drill:restore`；演练实际执行：PASS。
8. Docs: `docs/runbook/mvp-test-case.md`, `docs/deployment.md` (no secrets/addresses/topology). Updated PROGRESS.md/PLAN.md with the honest split: coding side done vs Blocked external-resource items (real email delivery AC01/AC08/AC12, AC10, production-scale drill).<br>文档：`docs/runbook/mvp-test-case.md`、`docs/deployment.md`（无密钥/地址/拓扑）。PROGRESS.md/PLAN.md 如实拆分：编码侧完成 vs 外部资源阻塞项（真实邮件送达 AC01/AC08/AC12、AC10、生产规模演练）。

### Changed Files / 变更文件

- Added: `src/modules/admin/test-cases.ts`, `src/app/api/admin/test-cases/route.ts`, `src/app/api/test/outbox/route.ts`, `src/app/api/test/worker/route.ts`, `src/instrumentation.ts`, `tests/integration/admin/test-cases.test.ts`, `tests/e2e/{config,global-setup,helpers,dual-user.spec,review-alert.spec,admin-test-case.spec}.ts`, `scripts/backup.sh`, `scripts/restore-drill.sh`, `docs/runbook/mvp-test-case.md`, `docs/deployment.md`.<br>新增：上述文件。
- Modified: `src/modules/invites/service.ts` (issueInvite extraction), `src/app/(app)/cases/[id]/messages-panel.tsx` (compose/SSE/backstop/hydration/testids), `src/app/(app)/cases/[id]/page.tsx`, `src/app/(app)/cases/page.tsx`, `src/app/(app)/review/review-queue.tsx`, `src/app/(auth)/login/page.tsx`, `src/app/(auth)/invite/page.tsx` (testids/hydration gates), `playwright.config.ts`, `package.json` (test:e2e env, drill:restore), `.env.example` (NOTIFICATION_WORKER), `.gitignore` (backups/), PLAN.md, PROGRESS.md, SESSIONS.md.<br>修改：上述文件。

### Verification Results / 验证结果

- `npm run test`: 40 files, 280/280 passed (was 274; +6 admin/test-cases integration). `npm run test:e2e`: 4/4 passed (3 new specs + smoke), repeated green across consecutive runs. `npm run lint`: clean. `npx tsc --noEmit`: clean. `npm run build`: success. `npm run drill:restore`: RESULT PASS (integrity checks zero; decrypt+restore ~1s at trivial data volume; RPO/RTO targets measured, not asserted).<br>`npm run test`：40 个文件 280/280 通过（原 274；新增 6 个 admin/test-cases 集成测试）。`npm run test:e2e`：4/4 通过（3 个新 spec＋冒烟），连续多次运行均绿。`npm run lint`：无错误。`npx tsc --noEmit`：无错误。`npm run build`：成功。`npm run drill:restore`：RESULT PASS（完整性核查全零；极小数据量下解密＋恢复约 1 秒；RPO/RTO 为实测记录而非达标断言）。

### Unfinished Items / 未完成项

- Blocked on external resources (see PROGRESS.md T12): real email delivery acceptance (AC01/AC08/AC12 real-channel parts — needs real EmailProvider + real addresses, O05/O07), AC10 China–Vietnam network test (O07), production-scale restore drill (O08). Real Kimi calls still gated on O05.<br>外部资源阻塞（见 PROGRESS.md T12）：真实邮件送达验收（AC01/AC08/AC12 真实渠道部分——需真实 EmailProvider＋真实地址，O05/O07）、AC10 中越网络测试（O07）、生产规模恢复演练（O08）。真实 Kimi 调用仍待 O05。
- The pre-existing next-env.d.ts dev/build path flip-flop persists (Next rewrites it per last command); committed in the build form.<br>既有的 next-env.d.ts dev/build 路径来回改写仍在（Next 按最后命令重写）；以 build 形态提交。

### First Step Next Time / 下次第一步

All P0 coding is done. Next actions need the user/operations lead: real SMTP EmailProvider + real-address acceptance (AC01/AC08/AC12 real parts), the AC10 network window, the production-scale drill; P1 tasks T09/T13 wait for a user decision. Do not redo T01–T08/T10/T11/T12.<br>全部 P0 编码已完成。下一步需用户/运维负责人：真实 SMTP EmailProvider＋真实地址验收（AC01/AC08/AC12 真实部分）、AC10 网络测试窗口、生产规模演练；P1 任务 T09/T13 待用户决定。不要重做 T01–T08/T10/T11/T12。

---

## Session 2026-10-03-01 (Ended) / 会话 2026-10-03-01（已结束）

- Date/Timezone: 2026-10-03, UTC+8<br>日期/时区：2026-10-03，UTC+8
- Goal: deploy the current tree to the designated Shanghai test host after the user confirmed, and record that the HTTP entry is live.<br>本次目标：用户确认后把当前代码部署到指定的上海测试机，并记下 HTTP 入口已经可用。

### Actual Actions / 实际动作

1. Confirmed key login and passwordless sudo on the test host. Synced the tree, started Postgres and MinIO bound to localhost, applied migrations, built Next.js, and published HTTP port 80 through nginx. Database, object storage, and the app process are not exposed beyond the host.<br>确认测试机密钥登录与免密 sudo。同步代码，在本机回环上启动 Postgres 与 MinIO，执行迁移，构建 Next.js，经 nginx 开放 HTTP 80。数据库、对象存储和应用进程不对外。
2. Production builds refuse the fake email, translation, moderation, and stub scanner. Real SMTP and Kimi remain blocked (O05), so the test host sets `CLC_FICTITIOUS_TEST_HOST=1`. Public `/api/test/*` returns 404.<br>生产构建会拒绝假邮件、假翻译、假审核和桩扫描器。真实 SMTP 与 Kimi 仍被 O05 挡住，因此测试机设置 `CLC_FICTITIOUS_TEST_HOST=1`。对外 `/api/test/*` 返回 404。

### Changed Files / 变更文件

- Modified: provider selection, `docs/deployment.md`, `CONTEXT.md`, `SPEC.md`, `PROGRESS.md`, `.env.example`, `tests/e2e/config.ts`, `LOCAL_DEV_NOTES.md` (gitignored).<br>修改：提供者选择、部署文档、CONTEXT、SPEC、PROGRESS、`.env.example`、端到端配置、本地笔记（不入库）。
- Not committed.<br>未提交。

### Verification Results / 验证结果

- Unit test for the stand-in flag passed. Public `GET /api/health` and `/login` and `/invite` returned 200. `/api/test/outbox` returned 404. Browser: login form accepted a fictitious address and advanced to the code step; invite page rendered.<br>替身开关的单元测试通过。公网 `GET /api/health`、`/login`、`/invite` 返回 200。`/api/test/outbox` 返回 404。浏览器：登录表单接受虚构地址并进入验证码步骤；邀请页正常显示。

### Unfinished Items / 未完成项

- This deploy is uncommitted. Mail and OTP stay in the on-host fake outbox until O05 allows a real provider. AC10 and a production-scale restore drill are still open.<br>本次部署尚未提交。在 O05 允许真实提供者之前，邮件和验证码只留在测试机上的假发件箱。AC10 与生产规模恢复演练仍未做。

### First Step Next Time / 下次第一步

Commit the deploy record if the user asks. Do not point Playwright at the test host.<br>若用户要求，再提交这次部署记录。不要把 Playwright 指到测试机。

---

## Session 2026-10-03-02 (Ended) / 会话 2026-10-03-02（已结束）

- Date/Timezone: 2026-10-03, UTC+8<br>日期/时区：2026-10-03，UTC+8
- Goal: record the one-step activation decision and refresh the repository's development-status markdown. No application code.<br>本次目标：记下一步激活的决定，并更新仓库里反映开发状态的 Markdown。不改应用代码。

### Actual Actions / 实际动作

1. The user replaced follow-up item 2. Activation is one step: the invited email plus the activation code. The code selects the case and is bound to that email, the case, and the role. Only that email can accept it. Any browser can join while the pair is still valid. The same email can later join another case with a new code. The 36-hour OTP option is withdrawn. After the code is used, a new browser still signs in with the existing email OTP.<br>用户改了跟进项第 2 条。激活是一步：受邀邮箱加上激活码。激活码用来区分案件，并绑定该邮箱、案件与角色。只有该邮箱可以接受。邮箱和激活码仍有效时，换一个浏览器也可以进入。同一邮箱以后可以用新的激活码加入另一个案件。36 小时验证码方案取消。激活码用过之后，新浏览器仍用现有邮箱验证码登录。
2. Wrote that rule into SOW v1.11, SPEC v0.9, and PLAN v0.9 (F02). Updated CONTEXT, GLOSSARY, PROGRESS, README, VIBE banner, the test-case runbook, and CURSOR_REVIEW section 8. Historical changelogs stay. Each status file says the running code and the Shanghai host still use the v1.10 two-step flow until F02.<br>写入 SOW v1.11、SPEC v0.9 与 PLAN v0.9（F02）。更新了 CONTEXT、GLOSSARY、PROGRESS、README、VIBE 效力说明、测试案件指引，以及 CURSOR_REVIEW 第 8 节。历史变更记录保留。每份状态文件都写明：正在运行的代码和上海测试机在 F02 之前仍是 v1.10 的两步流程。

### Changed Files / 变更文件

- Modified: SOW.md, SPEC.md, PLAN.md, CONTEXT.md, GLOSSARY.md, PROGRESS.md, README.md, VIBE_CODING_INPUT.md, CURSOR_REVIEW.md, SESSIONS.md, docs/runbook/mvp-test-case.md, docs/deployment.md.<br>修改：上述文件。
- Not committed. Application code unchanged.<br>未提交。应用代码未改。

### Verification Results / 验证结果

- Documentation consistency only. No tests were run. The test host was not rebuilt.<br>仅文档一致性。未跑测试。测试机未重新构建。

### Unfinished Items / 未完成项

- F01 (case-page attachment control) is next, then F02 (implement the one-step flow). F05 (commit the deployed fixes) waits for the user to ask.<br>下一步是 F01（案件页附件控件），然后是 F02（实现一步激活）。F05（提交已部署的修复）等用户要求。

### First Step Next Time / 下次第一步

Implement F01 if the user asks. Do not treat the live `/invite` page as already one-step.<br>若用户要求，再实现 F01。不要把正在运行的 `/invite` 页当成已经是一步。

---

## Session 2026-10-03-03 (Ended) / 会话 2026-10-03-03（已结束）

- Date/Timezone: 2026-10-03, UTC+8<br>日期/时区：2026-10-03，UTC+8
- Goal: implement one-step activation in the repository and on the Shanghai test host.<br>本次目标：在仓库和上海测试机上实现一步激活。

### Actual Actions / 实际动作

1. Activation is now the invited email plus the activation code. Only that email can accept it. A different email does not consume the code. The same email joins a later case on the same account. Success opens a session and `/cases`. Return visits after the code is used still use the email OTP.<br>激活改为受邀邮箱加上激活码。只有该邮箱可以接受。其他邮箱不消耗激活码。同一邮箱以后加入另一个案件时仍用同一账号。成功后建立会话并打开 `/cases`。激活码用过之后，再次登录仍用邮箱验证码。
2. Rebuilt and restarted the test host. Health returned ok. The invite page shows "Activate and join".<br>重新构建并重启了测试机。健康检查返回 ok。邀请页显示 "Activate and join"。

### Changed Files / 变更文件

- Application: invite page, `POST /api/invites/activate`, invite acceptance checks the invited email, activation email text, tests.<br>应用：邀请页、`POST /api/invites/activate`、接受时核对受邀邮箱、激活邮件正文、测试。
- Status docs updated to match. Not committed.<br>状态文档已对齐。未提交。

### Verification Results / 验证结果

- `npm run test` 281/281. Playwright admin triangle, review journey, and health passed. Dual-user message visibility timed out once.<br>`npm run test` 281/281。Playwright 管理员三角、审核旅程和健康检查通过。双用户消息可见性超时一次。

### First Step Next Time / 下次第一步

F01, the case-page attachment control, if the user asks.<br>若用户要求，做 F01：案件页的附件控件。

---

## Session 2026-10-03-04 (Ended) / 会话 2026-10-03-04（已结束）

- Date/Timezone: 2026-10-03, UTC+8<br>日期/时区：2026-10-03，UTC+8
- Goal: implement PLAN.md v0.9 follow-ups F01 (case-page attachment control), F04 (one click sends one message), the F03 leftovers (where a login lands), and F10 (re-run and stabilize the E2E suite); record F05 as already done.<br>本次目标：实现 PLAN.md v0.9 跟进项 F01（案件页附件控件）、F04（一次点击只发一条消息）、F03 剩余项（登录去向收尾）与 F10（重跑并稳定 E2E）；并把 F05 记为已完成。

### Actual Actions / 实际动作

1. F04 first (same file as F01): the send button in `messages-panel.tsx` now disables and shows 发送中 / Đang gửi… while the POST is in flight, with a `sendingRef` re-entry guard; the per-send Idempotency-Key is unchanged, and the list still refetches from the POST response.<br>先做 F04（与 F01 同一文件）：`messages-panel.tsx` 的发送按钮在 POST 在途时禁用并显示「发送中」，加 `sendingRef` 重入守卫；逐次 Idempotency-Key 不变，响应返回即重拉列表。
2. F01: new `files-panel.tsx` on the case page — file picker + upload button (multipart to `POST /api/cases/:id/files`, disabled with an in-flight label while uploading, upload failure shown), the `GET /api/cases/:id/files` list (name, bilingual status label, uploader display name, upload time; refetch after upload + 10s backstop since file publishes have no SSE event), and a download link on published files. Visibility follows the API exactly; review actions stay on /review.<br>F01：案件页新增 `files-panel.tsx`——文件选择＋上传按钮（multipart 提交上传接口，在途禁用并显示文案，失败可见）、文件列表（文件名、中越双语状态、上传者显示名、上传时间；上传后重拉＋10 秒兜底，因文件发布无 SSE 事件）、已发布文件的下载链接。可见性完全遵循 API；审核动作仍在 /review。
3. F03: `/` is now a server component that redirects by session state (signed in → `/cases`, otherwise → `/login`); the starter page is gone. The /invite page reads `caseId` from the activate/accept responses and opens the joined case page directly. The session cookie `maxAge` needed no change.<br>F03：`/` 改为按会话状态跳转的服务端组件（已登录 → `/cases`，未登录 → `/login`），起始页移除。/invite 页从 activate/accept 响应读取 `caseId`，成功后直接打开所加入案件。会话 Cookie 的 `maxAge` 无需改动。
4. F10: global setup now compiles the journey routes up front (the leading suspect behind the dual-user visibility timeout was cold dev-server compiles consuming the expect window), and Playwright keeps a trace on failure. No sleeps added; no assertion weakened.<br>F10：global setup 现在预先编译旅程路由（双用户可见性超时的首要嫌疑是 dev server 冷编译占满 expect 窗口），Playwright 失败时保留 trace。未加 sleep，未削弱断言。
5. F05 bookkeeping: verified all four test-host fixes are inside commit 3182639 with a clean tree; PLAN/PROGRESS marked Done.<br>F05 记账：核实四项测试机修复均在 commit 3182639 且工作区干净；PLAN/PROGRESS 标记完成。

### Changed Files / 变更文件

- Added: `src/app/(app)/cases/[id]/files-panel.tsx`, `tests/e2e/files.spec.ts`.<br>新增：上述文件。
- Modified: `src/app/(app)/cases/[id]/messages-panel.tsx` (F04), `src/app/(app)/cases/[id]/page.tsx` (mount FilesPanel), `src/app/page.tsx` (F03 redirect), `src/app/(auth)/invite/page.tsx` (open the joined case), `tests/e2e/{dual-user.spec,smoke.spec,helpers,global-setup}.ts`, `playwright.config.ts` (trace retain-on-failure), PLAN.md, PROGRESS.md, SESSIONS.md.<br>修改：上述文件。

### Verification Results / 验证结果

- `npm run test`: 41 files, 281/281 passed. `npm run test:e2e`: three consecutive full runs green, 7/7 each (smoke health + `/` redirect, dual-user journey + rapid-click send-once, review-alert, admin-test-case, files upload→approve→download with byte-identical content). One earlier run failed on a new-spec bug (waiting for an empty `message-list`), fixed in the spec, not in app code. `npm run lint`: clean (one pre-existing warning in login/page.tsx). `npx tsc --noEmit`: clean. `npm run build`: success.<br>`npm run test`：41 个文件 281/281 通过。`npm run test:e2e`：连续三轮完整运行全绿，每轮 7/7（smoke 健康检查＋`/` 跳转、双用户旅程＋快速连点只发一条、审核提醒、管理员建案、文件上传→批准→下载且字节一致）。此前一轮因新 spec 自身错误（等待空的 `message-list`）失败，只改 spec 未改应用代码。`npm run lint`：无错误（login/page.tsx 有一处既有警告）。`npx tsc --noEmit`：无错误。`npm run build`：成功。

### Unfinished Items / 未完成项

- The F01/F04/F03 build is not yet deployed to the Shanghai test host. F06 (real activation email) and F07 (real translation) stay Blocked on O05; F08 (AC10, production-scale drill) on O07/O08; F09 (P0 review gaps) is Later. The dual-user flake did not recur in three rounds; if it returns, the retained trace is the evidence to diagnose from.<br>F01/F04/F03 的构建尚未部署到上海测试机。F06（真实激活邮件）与 F07（真实翻译）仍阻塞于 O05；F08（AC10、生产规模演练）阻塞于 O07/O08；F09（P0 复核缺口）稍后。双用户不稳定在三轮中未复发；若复发，以保留的 trace 为诊断依据。

### First Step Next Time / 下次第一步

Deploy this build to the Shanghai test host if the user asks, then continue the pilot. Do not redo T01–T12 or F01–F05.<br>若用户要求，把本次构建部署到上海测试机，然后继续试点。不要重做 T01–T12 或 F01–F05。

---

## Session 2026-10-03-05 (Ended) / 会话 2026-10-03-05（已结束）

- Date/Timezone: 2026-10-03, UTC (Kimi Code on the dev VPS)<br>日期/时区：2026-10-03，UTC（研发 VPS 上的 Kimi Code）
- Goal: align with the other agent's sessions (deploy + one-step activation F02, commit 3182639), then continue the follow-up table in PLAN v0.9 — F01/F04/F03/F10 — and deploy the resulting build to the Shanghai test host.<br>本次目标：对齐另一代理的会话（部署＋一步激活 F02，commit 3182639），然后继续 PLAN v0.9 跟进表——F01/F04/F03/F10——并把成果部署到上海测试机。

### Actual Actions / 实际动作

1. Read SESSIONS/PROGRESS/PLAN and found commit 3182639 (one-step activation + test-host fixes + provider stand-in flag, co-authored by Cursor) on top of this agent's last docs commit; verified the working tree clean and the 281/281 baseline before new work.<br>读 SESSIONS/PROGRESS/PLAN，发现本代理上次文档提交之上有 commit 3182639（一步激活＋测试机修复＋替身提供者开关，与 Cursor 合著）；开工前核实工作区干净、基线 281/281 全绿。
2. Ran F01+F04+F03+F10 through a coder subagent, then personally re-verified: `npm run test` 281/281 (41 files), `npm run test:e2e` 7/7, `npx tsc --noEmit` clean, `npm run lint` 0 errors (1 pre-existing warning), commit `35f9d46` pushed. Delivered: case-page attachment control (upload/list/download with API-driven visibility), single-click send (in-flight disable + re-entry guard + immediate refetch), `/` session-aware redirect and invite-accept opens the joined case, E2E stability (route warm-up in global setup + trace retain-on-failure; 3 consecutive green runs by the subagent, one more by this agent). F05 verified done in 3182639 and marked accordingly in PLAN/PROGRESS.<br>F01+F04+F03+F10 经 coder 子代理完成，随后本人复核：`npm run test` 281/281（41 个文件）、`npm run test:e2e` 7/7、`npx tsc --noEmit` 无错误、`npm run lint` 0 错误（1 处既有 warning），提交 `35f9d46` 已推送。交付：案件页附件控件（上传/列表/下载，可见性由 API 决定）、一次点击只发一条（在途禁用＋重入守卫＋即时重拉）、`/` 按会话跳转与接受邀请直达所加入案件、E2E 稳定性（global setup 路由预热＋trace retain-on-failure；子代理连续三轮全绿，本人再跑一轮全绿）。F05 核实已在 3182639 完成并在 PLAN/PROGRESS 标记。
3. Deployed 35f9d46 to the Shanghai test host: rsync from the dev VPS with excludes (`.git`, `node_modules`, `.next`, `.env`, `docker-compose.lighthouse.yml`, `LOCAL_DEV_NOTES.md`, `backups`, `test-results`) — the host tree is a plain copy, not a git checkout; host `.env` (with `CLC_FICTITIOUS_TEST_HOST=1`) untouched. No dependency or migration changes in this commit, so no npm install / migrate needed. `npm run build` on the host, `sudo systemctl restart clc-web`, then verified: service active, local+public `/api/health` 200, `/login`/`/invite` 200, public `/api/test/outbox` 404, built case page references `files-panel`.<br>把 35f9d46 部署到上海测试机：从研发 VPS rsync 并排除（`.git`、`node_modules`、`.next`、`.env`、`docker-compose.lighthouse.yml`、`LOCAL_DEV_NOTES.md`、`backups`、`test-results`）——机上树是普通副本而非 git 检出；机上 `.env`（含 `CLC_FICTITIOUS_TEST_HOST=1`）未动。本次提交无依赖/迁移变化，故无需 npm install / migrate。机上 `npm run build`、`sudo systemctl restart clc-web`，随后验证：服务 active、本机＋公网 `/api/health` 200、`/login`/`/invite` 200、公网 `/api/test/outbox` 404、构建产物案件页引用 `files-panel`。

### Changed Files / 变更文件

- Code/tests (subagent, commit `35f9d46`): `files-panel.tsx` (new), messages-panel, case page, invite page, `/` page, `tests/e2e/{files.spec,dual-user.spec,smoke.spec,global-setup,helpers}.ts`, playwright.config.ts, PLAN/PROGRESS/SESSIONS updates.<br>代码/测试（子代理，提交 `35f9d46`）：上述文件。
- Docs (this commit): PROGRESS.md (deployment record + Next Steps), SESSIONS.md (this entry), `LOCAL_DEV_NOTES.md` (deploy procedure; git-ignored, not committed).<br>文档（本次提交）：PROGRESS.md（部署记录＋下一步）、SESSIONS.md（本条）、`LOCAL_DEV_NOTES.md`（部署过程；git 忽略，未提交）。

### Verification Results / 验证结果

- `npm run test` 281/281; `npm run test:e2e` 7/7 (agent-verified after the subagent's three consecutive green runs); tsc clean; lint 0 errors; host build + restart + public smoke checks all pass.<br>`npm run test` 281/281；`npm run test:e2e` 7/7（子代理三轮全绿后本人再验证一轮）；tsc 无错误；lint 0 错误；机上构建＋重启＋公网冒烟全部通过。

### Unfinished Items / 未完成项

- F06 (real activation email) and F07 (real Vietnamese translation) blocked on O05; F08 (AC10 network test, production-scale drill) blocked on O07/O08; F09 (P0 review gaps: display-name check, account-recovery API, later-admin API, session-token hashing) queued after the pilot pages; the lawyer's phone session-cookie recheck (F03 note) needs the physical device.<br>F06（真实激活邮件）与 F07（真实越语翻译）阻塞于 O05；F08（AC10 网络测试、生产规模演练）阻塞于 O07/O08；F09（P0 复核缺口：显示名检查、账号找回 API、后续管理员 API、会话令牌哈希）排在试点页面之后；F03 备注的律师手机会话 Cookie 复查需要实体手机。

### First Step Next Time / 下次第一步

Pilot usage on the deployed build; F09 when the user asks; F06/F07 need the O05 decision (real EmailProvider / real Kimi). Do not redo F01–F05 or T01–T12.<br>在已部署的构建上继续试点使用；用户提出后做 F09；F06/F07 需要 O05 决定（真实 EmailProvider／真实 Kimi）。不要重做 F01–F05 或 T01–T12。

---

## Session 2026-10-03-06 (Ended) / 会话 2026-10-03-06（已结束）

- Date/Timezone: 2026-10-03, UTC+8<br>日期/时区：2026-10-03，UTC+8
- Goal: record two pilot decisions in the design and planning documents. No application code.<br>本次目标：把试运行中的两项决定写入设计和计划文档。不改应用代码。

### Actual Actions / 实际动作

1. Conversation records and upload records must show a timestamp: calendar date and clock time in the viewer's local timezone (REQ-MSG-11, REQ-FILE-04). The message list does not show a time yet. The file list already prints the upload time.<br>对话记录和上传记录必须显示时间戳：观看者本地时区的日期和钟点（REQ-MSG-11、REQ-FILE-04）。消息列表目前没有时间。文件列表已经印出上传时间。
2. Restated the default screen. A Chinese client sees Simplified Chinese. A Vietnamese lawyer sees Vietnamese. A coordinator sees Simplified Chinese. Labels and automatic-mode messages from other people use that one language. The lawyer's phone still shows both languages on the same control. Real Vietnamese wording of Chinese messages stays F07.<br>再次写明默认屏幕。中国客户看到简体中文。越南律师看到越南语。协调员看到简体中文。按钮和自动模式下别人发来的消息都用这一种语言。律师手机上同一控件仍并列两种语言。中文消息的真实越南语译文仍是 F07。
3. PLAN.md records F13 and F14 as specified, not built.<br>PLAN.md 把 F13 和 F14 记为已写入规格、尚未改界面。

### Changed Files / 变更文件

- SOW.md, SPEC.md, CONTEXT.md, GLOSSARY.md, PLAN.md, PROGRESS.md, README.md, VIBE_CODING_INPUT.md, CURSOR_REVIEW.md, SESSIONS.md.<br>上述文件。
- Application code unchanged. The test host was not rebuilt.<br>应用代码未改。测试机未重新构建。

### Verification Results / 验证结果

- Documentation only. No tests were run.<br>仅文档。未跑测试。

### First Step Next Time / 下次第一步

If the user asks, build F14 (one language on screen) and F13 (message timestamps). Do not treat F07 as already delivering Vietnamese sentences.<br>若用户要求，再做 F14（屏幕上一种语言）和 F13（消息时间戳）。不要把 F07 当成已经给出越南语句子。

---

## Session 2026-10-03-07 (Ended) / 会话 2026-10-03-07（已结束）

- Date/Timezone: 2026-10-03, UTC+8<br>日期/时区：2026-10-03，UTC+8
- Goal: record that each computer's timezone setting labels the timestamp. No application code.<br>本次目标：记下时间戳按每台电脑的时区设置标注。不改应用代码。

### Actual Actions / 实际动作

1. The user set the timestamp rule: a Vietnamese lawyer's computer uses UTC+7, a Chinese client's computer uses UTC+8. Each record shows the time in that computer's timezone and prints the offset beside it. The role does not choose the offset.<br>用户确定时间戳规则：越南律师的电脑用 UTC+7，中国客户的电脑用 UTC+8。每条记录按那台电脑的时区显示时间，并在旁边标出时区。时区不按角色写死。
2. REQ-MSG-11, REQ-FILE-04, and the F13 row now say this. The screen is still unchanged.<br>REQ-MSG-11、REQ-FILE-04 和 F13 已改成这条。界面仍未改。

### Changed Files / 变更文件

- SPEC.md, SOW.md, CONTEXT.md, GLOSSARY.md, PLAN.md, PROGRESS.md, README.md, VIBE_CODING_INPUT.md, CURSOR_REVIEW.md, SESSIONS.md.<br>上述文件。

### First Step Next Time / 下次第一步

If the user asks, show the timestamp and its UTC offset on conversation and upload records from the computer's timezone setting.<br>若用户要求，再在对话记录和上传记录上按电脑时区显示时间并标出 UTC 偏移。

---

## Session 2026-10-03-08 (Ended) / 会话 2026-10-03-08（已结束）

- Date/Timezone: 2026-10-03, UTC+8<br>日期/时区：2026-10-03，UTC+8
- Goal: correct the client's default screen to Traditional Chinese, and record how Simplified input is shown. No application code.<br>本次目标：把客户的默认屏幕改成繁体中文，并记下简体输入如何显示。不改应用代码。

### Actual Actions / 实际动作

1. The user corrected the client default. A Chinese client sees Traditional Chinese. The lawyer still sees Vietnamese. The coordinator still sees Simplified Chinese.<br>用户更正客户默认。中国客户看到繁体中文。律师仍看到越南语。协调员仍看到简体中文。
2. Simplified input is Unicode. Showing it as Traditional is a character conversion in `zh-convert.ts`. Unmapped characters stay as typed. One simplified character with several traditional forms is shown as one chosen form. The bytes are not re-encoded, so this does not produce mojibake.<br>简体输入是 Unicode。显示成繁体是 `zh-convert.ts` 里的逐字转换。对照表外的字保持原样。一个简体字有多个繁体字形时，显示选定的那一个。字节不重新编码，因此不会变成乱码。

### Changed Files / 变更文件

- SPEC.md, SOW.md, CONTEXT.md, GLOSSARY.md, PLAN.md, PROGRESS.md, README.md, VIBE_CODING_INPUT.md, CURSOR_REVIEW.md, SESSIONS.md.<br>上述文件。

### First Step Next Time / 下次第一步

The running app still opens a client on Simplified Chinese until F14 is built.<br>在做成 F14 之前，正在运行的应用仍让客户以简体中文进入。

---

## Session 2026-10-03-09 (Ended) / 会话 2026-10-03-09（已结束）

- Date/Timezone: 2026-10-03, UTC+8<br>日期/时区：2026-10-03，UTC+8
- Goal: add the Kimi automatic-translation pair to the plan. No application code.<br>本次目标：把 Kimi 自动翻译的这一对方向写入计划。不改应用代码。

### Actual Actions / 实际动作

1. Automatic mode calls Kimi. Vietnamese written by the lawyer is shown to the client as Traditional Chinese. Traditional Chinese written by the client is shown to the lawyer as Vietnamese. Recorded as F07, still blocked on O05. The test host keeps the fake translator.<br>自动模式调用 Kimi。律师写的越南语，客户看到繁体中文。客户写的繁体中文，律师看到越南语。记为 F07，仍阻塞于 O05。测试机继续用替身翻译。

### Changed Files / 变更文件

- PLAN.md, SPEC.md, SOW.md, CONTEXT.md, PROGRESS.md, README.md, SESSIONS.md.<br>上述文件。

### First Step Next Time / 下次第一步

Real Kimi calls wait for O05. Do not point the Shanghai test host at Kimi while it still holds fictitious stand-in providers.<br>真实 Kimi 调用等 O05。上海测试机仍使用虚构替身时，不要把它接到 Kimi。

---
