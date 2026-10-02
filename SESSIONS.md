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
