# Multilingual Case Communication System: SOW Execution Baseline / 多语言案件沟通系统：SOW 执行基线

- Version: 1.7 | Date: 2026-10-01
- 版本：1.7｜日期：2026-10-01
- Status: product scope approved at v1.0 (2026-09-30). Later approved revisions: v1.1 clarifications (Q1–Q8); v1.2 translation candidate changed to Kimi; v1.3 test environment and access method; v1.4 MVP narrowed per 2026OCT1-REVIEW.md; v1.5 adds the P1 Daily Case Digest email. v1.6 is a documentation-consistency errata. **v1.7 records the user's confirmation of that errata**, including sole-reviewer prompt-and-confirm (Section 5.2). Current companions are SPEC.md v0.5 and PLAN.md v0.5. T01 stays done.
- 状态：产品范围于 v1.0 批准（2026-09-30）。其后已批准修订：v1.1 澄清（Q1–Q8）；v1.2 翻译候选改为 Kimi；v1.3 测试环境与访问方式；v1.4 按 2026OCT1-REVIEW.md 收窄 MVP；v1.5 新增 P1 案件日报邮件。v1.6 为文档一致性勘误。**v1.7 记录用户对该勘误的确认**，包括唯一审核人提示后确认发布（第 5.2 节）。当前配套文件为 SPEC.md v0.5 与 PLAN.md v0.5。T01 保持已完成。
- Approval basis: the user accepted v1.0 on 2026-09-30 and confirmed v1.1 Q1–Q8 on 2026-10-01; v1.4 and v1.5 are later explicit user approvals and take precedence over earlier sentences, including v1.1 Q3. On 2026-10-01 the user also confirmed the v1.6 defaults and replaced sole-reviewer blocking with prompt-and-confirm. Where VIBE_CODING_INPUT.md conflicts with this file, this file prevails.
- 批准依据：用户于 2026-09-30 接受 v1.0，并于 2026-10-01 确认 v1.1 的 Q1–Q8；v1.4 与 v1.5 是其后的明确批准，优先于更早表述（含 v1.1 Q3）。2026-10-01 用户同时确认了 v1.6 的默认值，并把「唯一审核人不能放行」改为提示后确认发布。VIBE_CODING_INPUT.md 与本文件冲突时，以本文件为准。
- Purpose: the basis for product, development, and acceptance; it does not contain individual-case commercial arrangements, internal quotations, or pricing analysis.
- 用途：产品、开发及验收依据；不包含个案商业安排、内部报价或定价分析。
- Currently effective files: SOW.md in the project root; VIBE_CODING_INPUT.md is the startup entry point. Older versions under archive/ are for traceability only, do not participate in interpreting current requirements, and need not be uploaded to the VPS.
- 当前有效文件：项目根目录 SOW.md；VIBE_CODING_INPUT.md 为启动入口。archive/ 中的旧版仅用于追溯，不参与当前需求解释，不必上传 VPS。

## 0. Execution Rules: What to Implement Directly, What Requires Judgment / 执行规则：哪些直接落实，哪些需要判断

| Category / 类别 | Meaning / 含义 | Kimi's Handling / Kimi 的处理方式 |
| --- | --- | --- |
| Approved Requirements<br>已批准要求 | Business scope, MVP features, information protection, role permissions, publish workflow, and acceptance coverage<br>业务范围、MVP 功能、信息保护、角色权限、发布流程与验收覆盖 | Implement directly into SPEC.md without re-asking; changes must state their impact and obtain user approval<br>直接落实到 SPEC.md，不重复提问；变更须说明影响并取得用户批准 |
| Technical Defaults<br>技术默认值 | The implementation starting points in Sections 3 and 10 and the explicitly marked default options<br>第3、10节的实现起点及明确标注的默认选项 | Check the environment first; reversible implementation details may be optimized without changing business behavior, protection level, acceptance criteria, or phase boundaries; record the rationale and test impact, and submit for Review(approval) together with SPEC/PLAN<br>先检查环境；可在不改变业务、保护水平、验收与阶段边界的前提下优化可逆实现细节，记录依据及测试影响，随 SPEC/PLAN 一并评审 |
| Design/Acceptance Targets<br>设计/验收目标 | Targets for capacity, latency, sample size, Backup and Restore, etc.<br>容量、时延、样本规模、备份恢复等目标 | Use as design and test inputs; must not be written as measured results; when not met, fix or submit an evidence-backed adjustment—do not lower the standard on your own<br>作为设计与测试输入，不得写成已测结果；未达到时修复或提交有证据的调整，不得自行降低标准 |
| Open Items<br>待落实项 | Personnel, configuration, environment facts, operating policies, and external conditions explicitly listed in Section 14<br>第14节明确列出的人员、配置、环境事实、运营政策与外部条件 | Verify environment facts yourself; for user business decisions, Kimi presents options and impacts, then asks the user to decide; block only the phases or actions that depend on the item<br>环境事实自行核查；用户业务决定由 Kimi 给出方案及影响后请用户决定；仅阻塞依赖该项的阶段或动作 |
| Reference Material<br>参考依据 | Official materials, alternative options, and past check records<br>官方材料、备选方案及既往检查记录 | Use for justification and for re-checking during implementation; do not treat alternatives as features to be developed simultaneously, nor treat old records as the VPS's current state<br>用于论证和实施时复核，不把备选方案当作要同时开发的功能，也不把旧记录当作 VPS 现状 |

**Kimi may propose better solutions, but a proposal must not be treated as approval.** When MVP additions/removals, fee-restriction boundaries, data access/retention/geography, external vendors, permissions, Review policy, acceptance targets, or irreversible architecture changes are involved, list "current baseline, proposed change, rationale/evidence, impact, and verification method" and wait for the relevant decision; other unaffected document work continues. Routine library versions, module organization, and reversible implementation details may be handled under the technical-defaults rule.

**Kimi 可以提出更好的方案，但不能把提案视为批准。** 涉及 MVP 增减、费用限制边界、数据访问/留存/地域、外部供应商、权限、审核策略、验收目标或不可逆架构变化时，列明“当前基线、拟变更、理由/证据、影响和验证办法”，等待相关决定；其余不受影响的文档工作继续。常规库版本、模块组织和可逆实现细节可按技术默认值规则处理。

When SOW.md exists, this document's detailed scope prevails, and startup instructions must not be used to silently reduce requirements. When a substantive conflict arises, list only the conflicting items rather than re-asking all requirements. Changes explicitly approved by the user later take precedence, and related files must be updated in sync. Missing operating parameters do not block drafting SPEC/PLAN; parameters should have IDs, owners, and a latest resolution stage. Fabricated values must not be written as production configuration.

有 SOW.md 时，以本文件的详细范围为准，启动指令不得被用来静默删减要求。出现实质冲突时，只列出冲突条目，不重新询问全部需求。后续用户明确批准的变更优先，须同步更新相关文件。尚缺运行参数不妨碍编写 SPEC/PLAN 草案；参数应有编号、负责人及最迟解决阶段。不得把虚构值写为生产配置。

## 1. Approved Product and Deployment Direction / 已批准的产品与部署方向

This project builds a **case-isolated, Case Coordinator–managed Chinese–Vietnamese bilingual web communication space**. Chinese Clients and Vietnamese Lawyers log in with a verified email in the MVP (phone-number login is P1, v1.4)—without installing new messaging software—to communicate, share files, and send Urgent Alerts within the same Case.

本项目建设一个**按案件隔离、由协调员管理的中越双语网页沟通空间**。中国客户和越南律师无需安装新的通信软件，在 MVP 以已验证邮箱登录（手机号登录为 P1，v1.4），在同一案件中交流、共享文件并发出紧急提醒。

The approved architecture direction is: **Vietnamlawyers.ai provides the entry point, the application runs on an independent subdomain, a server in Hong Kong or Singapore hosts the backend, private object storage holds attachments, and an external LLM provides translation.** For example, portal.vietnamlawyers.ai is only a candidate address; it has not been configured or verified.

已批准的架构方向是：**Vietnamlawyers.ai 提供入口，独立子域名运行应用，香港或新加坡的服务器承载后端，私有对象存储保存附件，外部 LLM 提供翻译。** 例如 portal.vietnamlawyers.ai 只是候选地址，尚未配置或验证。

"Using a page on the existing website" and "using a VPS" are not mutually exclusive options: the former determines where users enter, the latter determines where the program runs. Initially, the main site's navigation jumps to the independent application; do not stuff a complex chat directly into an unevaluated website plugin, and do not prioritize iframe.

“使用现有网站的一个页面”和“使用 VPS”不是互斥选项：前者决定用户从哪里进入，后者决定程序在哪里运行。初期由主站导航跳转到独立应用；不把复杂聊天直接塞入未经评估的网站插件，也不优先用 iframe。

Development is confirmed to take place in the user's VPS working directory. The technical default route for production deployment is a Hong Kong/Singapore VPS (Lighthouse as candidate), conditional on a clearly designated operations owner and passing network and data-condition verification. If that precondition fails, Kimi should submit a managed-hosting option for selection and must not purchase or switch production services on its own. The development VPS does not automatically equal the production environment; cost-effectiveness must not be judged by the server bill alone.

开发已确定在用户的 VPS 工作目录进行。生产部署以香港/新加坡 VPS（Lighthouse 为候选）为技术默认路线，前提是明确运维负责人并通过网络与数据条件验证。若该前提不成立，Kimi 应提交托管方案供选定，不能自行购买或切换生产服务。开发 VPS 不自动等于生产环境；不能只按服务器账单判断性价比。

**This project does not promise to completely prevent the two parties from establishing contact outside the platform.** The Lawyer's identity, engagement documents, public practice information, and offline procedures may allow the parties to identify each other. What the system can provide is contact-information protection, permission-based publishing, content Review, and Audit Trail—not absolute anonymity or absolute prevention of bypass.

**本项目不承诺完全阻止双方在平台之外建立联系。** 律师身份、委托文件、公开执业资料及线下程序可能使双方相互识别。系统能提供的是联系信息保护、按权限发布、内容审核及审计，而不是绝对匿名或绝对防绕过。

## 2. Scenarios, Terminology, and Key Assumptions / 场景、术语与关键假设

### 2.1 Product Positioning / 产品定位

The first vertical scenario is "Chinese Client — Vietnamese Lawyer — Case Coordinator". It may later expand to other countries, languages, and service providers, but the MVP does not build a general social network, a full law-firm ERP, or a payment system.

首个垂直场景为“中国客户—越南律师—案件协调员”。未来可扩展到其他国家、语言和服务提供者，但 MVP 不建设通用社交网络、完整律所 ERP 或支付系统。

Use the "Case", not a "two-person contact relationship", as the boundary for permissions and conversations. The same Client can have multiple Cases; the same Lawyer can participate in multiple Clients' Cases; each Case's participants, files, messages, language preferences, and permissions are independent.

以“案件”而不是“两个人的联系人关系”为权限与会话边界。同一客户可以有多个案件；同一律师可以参与多个客户的案件；每个案件的参与人、文件、消息、语言偏好和权限独立。

### 2.2 Approved Glossary / 已批准术语表

| Term / 术语 | Meaning in This Project / 本项目中的含义 |
| --- | --- |
| Client Organization<br>客户组织 | The enterprise or individual entity receiving services; not equivalent to a login account<br>接受服务的企业或个人主体，不等同于登录账号 |
| User<br>用户 | A login identity that may be linked to one or more verified Registered Contact Channels (MVP: email only, v1.4; phone P1); may join authorized Cases; two accounts must not be merged merely because the names match<br>登录身份，可关联一个或多个已验证的注册联系方式（MVP 仅邮箱，v1.4；手机号 P1）；可加入被授权的案件；仅凭姓名相同不得合并两个账号 |
| Case Space<br>案件空间 | The boundary of a Case's members, chat, files, Review, and Archive<br>一项案件的成员、聊天、文件、审核与归档边界 |
| Case Coordinator<br>案件协调员 | Personnel granted designated permissions for invitations, member management, publish Review, and Archive; Review is one allocation dimension of a coordinator's duties, and management and Review of the same Case may be assigned to different coordinators; may participate in Case chat and speak (v1.4, to clarify misunderstandings between the two parties), and their messages are likewise subject to content checks and Audit Trail; not equivalent to System Operations Administrator (administrators use dedicated accounts)<br>获指定权限的邀请、成员管理、发布审核与归档人员；审核是协调员职责的一种分配维度，同一案件可由不同协调员分别承担管理与审核；可参与案件聊天并发言（v1.4，用于澄清双方理解偏差），其消息同样接受内容检查与审计；不等同于系统运维管理员（管理员使用专门账号） |
| Registered Contact Channel<br>注册联系方式 | The contact channel used for authentication and system notifications (MVP: email only, v1.4; phone P1); not disclosed to other participants by default<br>用于认证及系统通知的联系方式（MVP 仅邮箱，v1.4；手机号 P1），默认不向其他参与方公开 |
| Case Amount<br>案件金额 | Amounts needed to discuss the merits of the Case—claims, debts, losses, damages, settlements<br>诉讼请求、债权、损失、赔偿、和解等讨论案情所需的金额 |
| Restricted Business Content<br>受限商务内容 | In this phase specifically refers to Litigation Retainer Fees–related content; other information must not be added to this restriction without authorization<br>本期专指诉讼委托费用相关内容；其他信息不得擅自扩入该限制 |
| Source Text / Translated Text<br>源文 / 译文 | The text submitted by a user and its corresponding translation; the Translated Text must be traceable to the Source Text version<br>用户提交的文字与其对应翻译；译文必须可追溯到源文版本 |
| Published Version<br>发布版本 | The specific message or file version that has passed permission and content checks and is allowed to be viewed by recipients<br>经过权限和内容检查、允许接收方查看的具体消息或文件版本 |
| Urgent Alert<br>紧急提醒 | A notification asking the other party to log in and check as soon as possible; it does not mean the other party has read, handled, or committed to respond<br>请求对方尽快登录查看的通知，不等于对方已阅读、已处理或承诺响应 |
| In-app Confirmation<br>站内确认 | The confirmation a recipient makes within the Case after logging in regarding an Urgent Alert; it is the primary evidence that the alert reached its target; the system does not provide message read receipts to the other party<br>收件人登录后在案件内对紧急提醒作出的确认，是提醒触达的主要证据；系统不向另一方提供消息已读回执 |
| System Operations Administrator<br>系统运维管理员 | An operator who logs in with a dedicated account for service health, configuration, and restricted administration; the account is not shared with a Case Coordinator, Client, or Lawyer, and does not join Case chat by default<br>使用专门账号登录、负责服务健康、配置与受限管理操作的人员；账号不与案件协调员、客户或律师共用，默认不加入案件聊天 |
| Litigation Retainer Fees<br>诉讼委托费用 | The only fee topic under content restriction in this phase: explicit inquiries or negotiations about what the firm charges for the case. Case Amounts and court fees are not this term<br>本期唯一受内容限制的费用话题：就律所办理本案收取多少费用所作的显式问询或协商。案件金额与法院诉讼费不属于本术语 |
| Original File / Shared Copy<br>原件 / 共享副本 | The uploaded immutable original and the copy published after Review, stored separately and linked<br>上传后不可变的原始文件，以及审核通过后发布的副本；分开存放并相互关联 |
| Bilingual Parallel Document<br>双语对照文档 | (P1, v1.4) A Chinese–Vietnamese parallel DOCX organized by paragraph number, produced only when the user asks, limited to simple paragraph text of at most 20 pages. MVP document translation is done by the participants themselves<br>（P1，v1.4）仅在用户主动请求时生成的、按段落编号排列的中越对照 DOCX，限于不超过 20 页的简单段落文本。MVP 的文档翻译由参与方自行完成 |
| Daily Case Digest<br>案件日报 | (P1, v1.5) An email generated at 00:00 Asia/Ho_Chi_Minh that summarizes the previous Vietnamese calendar day's **published** messages and **published** attachments. Recipients are the Case's Lawyer members (the Coordinator may turn this off per Lawyer) and the assigned Coordinators. Subject: `{Case name}-{send date}-Record`<br>（P1，v1.5）在 Asia/Ho_Chi_Minh 00:00 生成的邮件，汇总上一越南日历日**已发布**的消息与**已发布**的附件。收件人为本案律师成员（协调员可按律师关闭）与已分配的协调员。标题：`{案件名称}-{发送日}-Record` |

The user has confirmed: **only Litigation Retainer Fees are restricted; Case Amounts such as claims, settlements, and damages are not restricted**. The rules must recognize the business meaning of an amount and must not block merely upon seeing the word "fee"; case-procedure expenses such as court fees must not be misjudged as attorney retainer fees based on keywords alone.

用户已确认：**仅限制诉讼委托费用，不限制诉讼请求、和解、赔偿等案件金额**。规则必须识别金额的业务含义，不能见到“费用”就阻止；法院收取的诉讼费等案件程序支出也不能仅凭关键词误判为律师委托费用。

The user has additionally confirmed: suspected restricted messages and uploaded files may be shown to the other party only after Review by the designated Case Coordinator; **every time content enters the Pending Review flow, the system must send an urgent email to the coordinator (the SMS channel moves to P1 together with phone registration, v1.4), requiring prompt handling**. The above rules are approved; the actual coordinators, response time limits, and channels are to be implemented per Section 14, and whether Review and alerts are needed will not be re-discussed.

用户另已确认：疑似受限消息及上传文件可由指定案件协调员审核后再向对方展示；**每次内容进入待审流程，系统必须向协调员发送紧急邮件（短信渠道随手机注册移至 P1，v1.4），要求尽快处理**。上述规则已批准；实际协调员、响应时限和渠道等按第14节落实，不重新讨论是否需要审核及提醒。

### 2.3 Capacity and Usage Assumptions / 容量与使用方式假设

The accepted first-round design and test load is as follows and does not represent measured capacity: a single operating organization; 10–20 active Cases in the first round; no more than 100 accounts and 20 concurrent users; primarily text and office documents. When the real pilot scale changes, record the impact and confirm adjustments in the SPEC.md Review(approval).

已接受的首轮设计及测试负载如下，不代表已测容量：单一运营机构；首轮 10–20 个活跃案件；不超过 100 个账号、20 人同时在线；以文字和办公文档为主。真实试点规模变化时，记录影响并在 SPEC.md 评审中确认调整。

The first version targets mobile and desktop browsers. The WeChat in-app browser is included in compatibility testing, with a prompt to use the system browser when necessary; the system does not depend on WeChat or Zalo accounts or contact permissions.

首版面向手机和电脑浏览器。微信内置浏览器列入兼容测试，必要时提示使用系统浏览器；不依赖微信、Zalo 账号或联系人权限。

## 3. Technical Default Route, Alternatives, and Selection Verification / 技术默认路线、备选依据与选型验证

The table below preserves the selection rationale. Execute the independent-application direction from Section 1 and the default routes below; do not restart open-ended selection. Submit an alternative only when a default route hits an actual limitation or an evidence-backed improvement is found.

下表保留选型依据。执行第1节的独立应用方向及下列默认路线，不重新启动无边界选型；只有默认路线遇到实际限制或发现有证据的改进时才提交替代方案。

| Option / 方案 | Advantages / 优点 | Main Work and Limitations / 主要工作与限制 | Current Positioning / 当前定位 |
| --- | --- | --- | --- |
| A. Develop pages and backend directly on the existing website<br>A. 在现有网站直接开发页面和后端 | Unified entry and branding; may reuse part of the account capability<br>入口与品牌统一，可能复用部分账户能力 | Depends on the main site's technology, permission system, and deployment rights; a website outage may also affect chat<br>取决于主站技术、权限体系和部署权限；网站故障可能同时影响聊天 | Not the default; the main site only provides the entry point, unless verification proves backend reuse is more suitable and is confirmed<br>非默认；主站仅提供入口，除非核查证明复用后端更合适并获确认 |
| B. Independent application + Hong Kong/Singapore VPS + private object storage<br>B. 独立应用＋香港/新加坡 VPS＋私有对象存储 | Clear deployment logic; flexible background jobs and file processing; easy to migrate<br>部署逻辑清晰，后台任务与文件处理较灵活，便于迁移 | Requires maintaining servers, databases, patches, backups, and alerts; a single machine is a single point of failure<br>需要维护服务器、数据库、补丁、备份和告警；单机存在单点故障 | Technical default route; production resources are selected after operations, network, and data conditions are settled<br>技术默认路线；落实运维、网络及数据条件后选定生产资源 |
| C. Managed application platform + managed PostgreSQL/Auth/Storage<br>C. 托管应用平台＋托管 PostgreSQL/Auth/Storage | Reduces infrastructure maintenance; authentication and data layer can be built relatively quickly<br>减少基础设施维护，可较快搭建认证与数据层 | Must verify mainland-China access, SMS vendor compatibility, data geography, and the long-term migration path<br>必须验证中国大陆访问、短信供应商兼容、数据地域及长期迁移路径 | Alternative to submit when the default route cannot meet operations conditions; vendor not yet selected<br>默认路线无法满足运维条件时提交的备选；供应商未选定 |
| D. Cloudflare Workers + Durable Objects, etc.<br>D. Cloudflare Workers＋Durable Objects 等 | Supports stateful real-time interaction; reduces self-maintained real-time connection infrastructure<br>支持有状态实时交互，减少自行维护实时连接设施 | File conversion may still need an independent job service; runtime, data location, vendor lock-in, and mainland access must be evaluated<br>文件转换可能还要独立任务服务；运行时、数据位置、供应商绑定及大陆访问要评估 | Later alternative; the MVP does not build a second platform in parallel<br>后续备选；MVP 不并行建设第二套平台 |

### 3.1 Verified Selection Basis / 已核实的选型依据

- Tencent Lighthouse officially lists Hong Kong and Singapore regions, and notes that accessing overseas instances from mainland China may show significant latency and packet loss. Therefore neither "Hong Kong is necessarily fastest" nor "Singapore is inherently stable" can be a conclusion. See [Regions and Network Connectivity](https://intl-sg.tencent-cloud.com/document/product/1103/41266).
- Tencent Lighthouse 官方列出香港与新加坡地域，并提示中国大陆访问境外实例可能出现明显延迟和丢包。因此“香港必然最快”或“新加坡天然稳定”都不能作为结论。参见[地域与网络连接](https://intl-sg.tencent-cloud.com/document/product/1103/41266)。
- Supabase offers explicit regions such as Singapore; its official documentation also states that selecting a data location does not by itself satisfy regulatory requirements. See [Available Regions](https://supabase.com/docs/guides/platform/regions).
- Supabase 可选新加坡等明确地域；其官方也说明，选定数据位置本身不代表满足监管要求。参见[可用地域](https://supabase.com/docs/guides/platform/regions)。
- Supabase phone login still requires integrating an SMS vendor; "supports phone-number login" must not be treated as having solved China–Vietnam SMS delivery. See [Phone Login Documentation](https://supabase.com/docs/guides/auth/phone-login).
- Supabase 手机登录仍需接入短信供应商，不能把“支持手机号登录”视为已解决中越短信送达。参见[手机登录文档](https://supabase.com/docs/guides/auth/phone-login)。
- Cloudflare Durable Objects explicitly supports multi-client stateful interaction such as chat; this is the basis for its candidacy, not evidence that it is necessarily faster or cheaper for this project. See [Official Documentation](https://developers.cloudflare.com/durable-objects/).
- Cloudflare Durable Objects 明确支持聊天等多客户端有状态交互；这是候选能力依据，并非其在本项目一定更快或更便宜的证据。参见[官方说明](https://developers.cloudflare.com/durable-objects/)。

### 3.2 Website Status and Items to Verify / 网站现状与待核查项

During proposal preparation, accessing Vietnamlawyers.ai via public web tools failed, so its framework, hosting, DNS management rights, existing authentication system, and whether an application page can be added have **not been confirmed**. The access failure does not mean the website is offline.

方案准备阶段通过公开网页工具访问 Vietnamlawyers.ai 未成功，因此**没有确认**其框架、主机、DNS 管理权、现有认证系统或可否增加应用页面。访问失败不等于网站离线。

Before integration, Kimi verifies the main site's management rights, existing technology, and publishing workflow; facts that cannot be read go into O01 and do not block writing the independent application's specification. Only configuration and architecture descriptions need to be read; the user is not required to provide any keys in chat. The independent subdomain should use independent session cookies and an explicit cross-domain policy to avoid the main site and the communication system unintentionally sharing login state.

Kimi 在集成前核查主站管理权限、现有技术和发布流程；无法读取的事实列入 O01，不阻塞独立应用的规格编写。只需读取配置与架构说明，不需要用户在聊天中提供任何密钥。独立子域名应使用独立会话 Cookie 和明确的跨域策略，避免主站与沟通系统无意共享登录状态。

### 3.3 How to Verify Speed and Cost-Effectiveness / 速度与性价比如何验证

Selection verification uses fictional data, testing candidate regions from real networks in mainland China and Vietnam; it covers mobile and fixed networks, peak and off-peak periods. At minimum, record P50/P95 and failure rates for login, case list, send-to-persistence confirmation, translation completion, download, and SMS/email delivery.

选型验证使用虚构数据，从中国大陆与越南真实网络测试候选地域；覆盖移动和固定网络、高峰和非高峰时段。至少记录登录、案件列表、发送到持久化确认、翻译完成、下载、短信/邮件送达的 P50/P95 和失败率。

Design and acceptance targets: under the test network, ordinary pages reach P95 time-to-interactive of no more than 3 seconds; ordinary short messages reach P95 persistence confirmation of no more than 2 seconds; short messages of no more than 500 characters reach P95 translation completion of no more than 10 seconds. Translation/review waits should be displayed independently; a single "sent successfully" must not mask the delay. The above are targets to be verified, not current performance commitments.

设计与验收目标：普通页面在测试网络下 P95 可交互时间不超过 3 秒；普通短消息 P95 持久化确认不超过 2 秒；不超过 500 字的短消息 P95 翻译完成不超过 10 秒。翻译/审核等待应独立显示，不用一个“发送成功”掩盖延迟。以上为待验证目标，不是当前性能承诺。

When evaluating cost-effectiveness, include application and database, storage and downloads, backups, monitoring, email, Verification Code (OTP) SMS, urgent SMS, LLM, file conversion, and human review workload. Avoiding duplicate translations, throttling abnormal requests, and deduplicating notifications is usually more valuable than pursuing the lowest server configuration from the start. Specific procurement and internal estimates are handled separately; this document contains no commercial quotations.

评价性价比时同时计入应用与数据库、存储与下载、备份、监控、邮件、验证码短信、紧急短信、LLM、文件转换和人工审核工作量。避免重复翻译、限制异常请求、对通知去重，通常比一开始追求最低服务器配置更有价值。具体采购及内部测算另行处理，本文件不列商业报价。

## 4. SOW: Goals, Scope, and Success Criteria / SOW：目标、范围和成功标准

### 4.1 Business Goals / 业务目标

1. The Chinese and Vietnamese sides can directly express case facts within the same Case, each reading in their own language by default.
1. 中越双方可以在同一案件中直接表达案情，默认以自己的语言阅读。
2. The system does not disclose registered emails or phone numbers to other participants, and does not let different Cases cross-connect.
2. 系统不向其他参与方公开注册邮箱、手机号，也不让不同案件相互串线。
3. Files can be shared and downloaded by permission, with verifiable bilingual versions provided progressively.
3. 文件可按权限分享下载，并逐步提供可核对的双语版本。
4. Urgent Alerts can reach registered channels, failures are visible, and recipients can explicitly confirm.
4. 紧急提醒可以触达登记渠道，失败可见，接收人可明确确认。
5. Development, testing, and session handover are based on file records, reducing dependence on long chat context.
5. 开发、测试和会话交接以文件记录为依据，减少依赖长聊天上下文。

### 4.2 Approved MVP Scope / 已批准的 MVP 范围

P0 is the acceptance scope of the complete MVP; P1/P2 are later enhancements. Email registration and bidirectional Urgent Alerts stay in P0. Phone-number registration was moved to P1 only because the user confirmed that move in v1.4; do not move any remaining P0 item out without a new confirmation.

P0 为完整 MVP 的验收范围；P1/P2 为后续增强。邮箱注册与双向紧急提醒留在 P0。手机号注册仅因用户在 v1.4 确认才移到 P1；其余 P0 项未经新的确认不得移出。

| ID / 编号 | P0 Capability / P0 能力 | Boundaries and Acceptance Points / 边界与验收要点 |
| --- | --- | --- |
| R01 | Invitation-based Registration and login<br>邀请式注册与登录 | MVP supports only the email Verification Code (OTP) flow; phone-number verification-code registration (+86/+84) moves to P1 (v1.4, goal: launch the MVP as soon as possible); registration does not automatically grant Case permissions; invitation codes are single-use and expire; unaccepted invitations can be revoked, resending generates a new code and invalidates the old code at the same time, and revocation/resending is recorded in the Audit Trail<br>MVP 仅支持邮箱验证码链路；手机号验证码注册（+86/+84）移至 P1（v1.4，目的：MVP 尽快上线）；注册不自动获得案件权限；邀请码单次使用、到期失效；未接受的邀请可撤销，重发生成新码且旧码同时失效，撤销/重发入审计 |
| R02 | Case and member management<br>案件与成员管理 | Case Coordinators create/approve Cases and assign members; Lawyers may enter authorized Client information or submit case-creation requests, but cannot search Clients platform-wide or enter others' Cases on their own<br>协调员创建/批准案件并分配成员；律师可录入获授权客户资料或提交建案申请，不可搜索全平台客户或自行进入他人案件 |
| R03 | Cross-case Mix-up Prevention UI<br>防串案界面 | The MVP does not yet implement the full Cross-case Mix-up Prevention UI (the pilot currently has only one Case, v1.4); server-side per-Case permission isolation checks must be retained; UI capabilities such as the case list, a persistent case name on the chat page, and draft/attachment isolation on switching move to P1<br>MVP 暂不实现完整防串案界面（试点当前只有一个案件，v1.4）；服务端按案件隔离的权限检查必须保留；案件列表、聊天页常驻案件名、切换草稿/附件隔离等界面能力移至 P1 |
| R04 | Bidirectional text chat<br>双向文字聊天 | Message persistence, send status, reconnection after disconnection, retry deduplication, unread counts; unread counts are visible only to oneself, and no read receipts are provided to the other party; in the MVP, sent messages are not silently edited—corrections are made via linked correction messages<br>消息持久化、发送状态、断线重连、重试去重、未读；未读数仅本人可见，不向另一方提供已读回执；MVP 已发消息不做静默编辑，纠正通过关联更正消息完成 |
| R05 | Language and translation<br>语言与翻译 | Language scope: Chinese (Simplified/Traditional), Vietnamese, English (v1.4); Clients default to Chinese, Lawyers default to Vietnamese; supports automatic translation and original-text/manual translation modes; translation applies only to conversation messages (document translation moves to P1); Translated Text versions and failure states are traceable<br>语言范围：中文（简体/繁体）、越南语、英语（v1.4）；客户默认中文、律师默认越南语；支持自动翻译和原文/手动翻译模式；翻译仅针对对话消息（文档翻译移 P1）；译文版本及失败状态可追踪 |
| R06 | Content Publish control<br>内容发布控制 | Contact-information rules + semantic risk judgment + Review queue; in the MVP, semantic judgment triggers Pending Review only for explicit retainer-fee inquiries/negotiations, and ambiguous content passes by default (v1.4); suspected restricted content is not sent first and withdrawn later; the Source Text, Translated Text, and quotes follow the same publish permissions<br>联系信息规则＋语义风险判断＋审核队列；MVP 语义判断仅对显式委托费用问询/协商触发待审，模糊内容默认放行（v1.4）；疑似受限内容不先发送后撤回；原文、译文及引用遵守同一发布权限 |
| R07 | File sharing and download<br>文件分享下载 | The first version accepts PDF, DOCX, JPG/PNG; per-file limit 20 MB; private upload, scanning, Review, Publish; unparseable or encrypted files are not automatically released<br>首版接受 PDF、DOCX、JPG/PNG；单文件上限 20 MB；私有上传、扫描、审核、发布；不可解析或加密文件不自动放行 |
| R08 | Limited bilingual documents (moved to P1, v1.4)<br>有限双语文档（移至 P1，v1.4） | The MVP does not implement document translation: translation of Word/PDF and other documents is handled by the participants themselves; the simple DOCX Bilingual Parallel Document capability is retained as P1 (see 4.3)<br>MVP 不实现文档翻译：Word/PDF 等文档翻译由参与方自行解决；简单 DOCX 双语对照能力保留为 P1（见 4.3） |
| R09 | Bidirectional Urgent Alerts<br>双向紧急提醒 | The MVP notification channel is the recipient's registered and verified email (phone/SMS channels move to P1 together with phone registration); emails are sent by the platform, hiding both parties' addresses<br>MVP 通知渠道为收件方注册并验证的邮箱（手机/短信渠道随手机注册移至 P1）；邮件由平台发送，隐藏双方地址 |
| R10 | Case Review console and automatic Urgent Alerts<br>案件审核后台与自动紧急提醒 | The designated Case Coordinator (holding the Review duty) views Pending Review content, approves/returns it, and records the reason; entering Pending Review immediately triggers an urgent email (the SMS branch moves to P1); configure service hours, failure retries, timeout escalation, and backup personnel; Case Coordinators may participate and speak in Case chat (v1.4)<br>指定协调员（承担审核职责）查看待审内容、批准/退回并记录原因；进入待审时立即触发紧急邮件（短信分支移 P1）；配置服务时间、失败重试、超时升级与代班人员；协调员可参与案件聊天发言（v1.4） |
| R11 | Security, Audit Trail, and lifecycle<br>安全、审计与生命周期 | Server-side permission checks, administrator MFA (the System Operations Administrator uses a dedicated account, not shared with roles such as Case Coordinator, v1.4), Audit Trail, Backup and Restore, Archive, and Permission Revocation; retention periods and deletion/legal-hold rules are confirmed before the pilot<br>服务端权限检查、管理员 MFA（运维管理员使用专门账号，不与协调员等角色共用，v1.4）、审计、备份恢复、归档与撤销权限；保留期限和删除/法律保全规则在试点前确认 |

R08 was approved by the user in the 2026-10-01 Review(approval) to move to P1 (v1.4): the MVP does not do document translation; translation of Word/PDF and other documents is handled by the participants themselves. Scanned PDFs under R07 can be shared after Review, but that does not mean OCR translation is supported.

R08 经用户 2026-10-01 评审批准移至 P1（v1.4）：MVP 不做文档翻译，Word/PDF 等文档翻译由参与方自行解决。R07 的扫描 PDF 可以审核后共享，但不等于支持 OCR 翻译。

### 4.3 Later Versions / 后续版本

| Phase / 阶段 | Added Capabilities / 增加的能力 | New Verification Focus / 新增验证重点 |
| --- | --- | --- |
| P1 | Phone-number verification-code registration (+86/+84) and SMS notification channel (moved in from R01/R09/R10 in v1.4)<br>手机号验证码注册（+86/+84）与短信通知渠道（v1.4 自 R01/R09/R10 移入） | Real +86/+84 delivery, template review, rate limits, unsubscribe<br>真实 +86/+84 送达、模板审核、频率限制、退订 |
| P1 | Daily Case Digest email (added in v1.5; wording aligned in v1.6): every day at 00:00 Asia/Ho_Chi_Minh (the user's "24:00 Vietnam time"), email the **previous Vietnamese calendar day's published** conversation and **published** attachments to every Lawyer member of the Case (a Case Coordinator can turn this off per Lawyer) and to the assigned Case Coordinators. Pending Review, returned, rejected, and scan-failed content is excluded. The subject is `{Case name}-{send date}-Record` (example: `DG-Juyang-2026OCT8-Record`). The Case name is required when the Case is created<br>案件日报邮件（v1.5 新增，v1.6 统一措辞）：每日 Asia/Ho_Chi_Minh 00:00（即用户所说的越南时间 24:00）将**上一越南日历日已发布**的对话与**已发布**附件，邮件发给本案全部律师成员（协调员可按律师关闭）与已分配协调员。待审、退回、拒绝和扫描失败的内容不纳入。标题为 `{案件名称}-{发送日}-Record`（示例：`DG-Juyang-2026OCT8-Record`）。案件名称在创建案件时必填 | Recipient scope and per-person sending, per-Lawyer opt-out, published-only content, attachment size and splitting, timezone, missed-run retry, no send when that day has no published content or the Case is archived<br>收件人范围与逐人发送、按律师关闭、仅已发布内容、附件大小与拆分、时区、漏跑重试、当日无已发布内容或案件已归档则不发送 |
| P1 | Simple DOCX Bilingual Parallel Document (formerly R08, moved in v1.4): ≤20 pages of parseable paragraph text, paragraph-numbered Chinese–Vietnamese parallel layout<br>简单 DOCX 双语对照（原 R08，v1.4 移入）：≤20 页可解析段落文本、段落编号中越对照 | Missed paragraphs, key fields, page-count determination, publish Review<br>漏段、关键字段、页数判定、发布审核 |
| P1 | Full Cross-case Mix-up Prevention UI (moved in from R03 in v1.4): case list, persistent case name on the chat page, draft/attachment isolation on switching<br>完整防串案界面（v1.4 自 R03 移入）：案件列表、聊天页常驻案件名、切换草稿/附件隔离 | Isolation when switching among multiple Cases, mis-selection warnings<br>多案件切换隔离、误选提示 |
| P1 | PDF text and OCR translation, table/header/footer handling, a more complete glossary, and Translated Text proofreading<br>PDF 文本与 OCR 翻译、表格/页眉页脚处理、更完善术语表与译文校订 | Missed pages, missed paragraphs, table misalignment, OCR digit errors, hidden information, and correspondence to the original<br>漏页、漏段、表格错位、OCR 数字错误、隐藏信息和原文对应关系 |
| P1 | More notification channels, advanced escalation policies, and handling-time statistics (basic failure retry and timeout escalation already belong to P0)<br>更多通知渠道、高级升级策略与处理时限统计（基础失败重试和超时升级已属 P0） | User authorization, channel failure, duplicate alerts, status callbacks, and unsubscribe boundaries<br>用户授权、渠道失效、重复提醒、状态回调和退订边界 |
| P2 | More languages, more service industries, multiple operating organizations<br>更多语言、更多服务行业、多个运营机构 | Inter-organization isolation, language fallback strategy, differing content policies, and regional deployment<br>机构间隔离、语言回退策略、不同内容政策与区域部署 |
| P2 | Voice/video, live captions, WeChat/Zalo integration<br>语音/视频、实时字幕、WeChat/Zalo 集成 | Separately evaluate recording authorization, translation latency, platform interfaces, and new channels that bypass Review<br>单独评估录音授权、翻译延迟、平台接口与绕过审核的新通道 |

The MVP does not include native apps, open stranger search, free exchange of contacts, online payment, e-signing, automatic legal opinions, automatic court filing, a guarantee of preventing off-platform contact, or a guarantee of error-free translation.

MVP 不含原生 App、开放陌生人搜索、自由交换联系人、在线支付、电子签约、自动法律意见、自动法院提交、保证阻止平台外联系或保证翻译准确无误。

## 5. User Flows and Role Permissions / 用户流程与角色权限

### 5.1 Main Flow / 主流程

Case Coordinator creates a Case and invites → user verifies email (phone in P1) → reads the handling and translation notices → chooses a language → enters an authorized Case → sends text or uploads files → checks/necessary Review complete → the other party reads in their own language → an Urgent Alert is sent when needed → the other party logs in and confirms → the Case is closed and archived.

协调员建案并邀请 → 用户验证邮箱（手机 P1）→ 阅读处理与翻译说明 → 选择语言 → 进入已授权案件 → 发送文字或上传文件 → 完成检查/必要审核 → 对方以自己的语言阅读 → 必要时发送紧急提醒 → 对方登录并确认 → 案件结案归档。

Registration and Case joining are separate: knowing a user, knowing an email, or guessing a Case number does not grant Case access. A Lawyer registering a Client on their own must not trigger automatic invitation sending or automatically establish an authorization relationship.

注册与案件加入分离：认识某个用户、知道某个邮箱或猜到案件编号，均不能获得案件访问权。律师自行登记客户不应触发自动邀请发送或自动建立授权关系。

### 5.2 Approved Permission Boundaries / 已批准的权限边界

| Role / 角色 | Can View and Do / 能查看和执行 | Cannot Do by Default / 默认不能做 |
| --- | --- | --- |
| Client member<br>客户成员 | Authorized Cases, published messages/files, their own notification settings<br>已授权案件、已发布消息/文件、自己的通知设置 | Other Clients' Cases, the other party's Registered Contact Channel, files Pending Review<br>其他客户案件、对方注册联系方式、待审文件 |
| Lawyer member<br>律师成员 | Multiple authorized Cases, Client information they are permitted to maintain, published content<br>已授权多个案件、获准维护的客户资料、发布内容 | Platform-wide Client directory, joining Cases at will, the other party's Registered Contact Channel<br>全平台客户名录、任意加入案件、对方注册联系方式 |
| Designated Case Coordinator (management and Review may be assigned separately)<br>指定协调员（管理与审核可分别分配） | Invitations, Pending Review content, Publish and Archive operations for assigned Cases; may speak in a Case to clarify misunderstandings (v1.4)<br>所分配案件的邀请、待审内容、发布与归档操作；可在案件中发言澄清理解偏差（v1.4） | Unassigned Cases, bulk export of all accounts' contact information<br>未分配案件、批量导出全部账号联系方式 |
| System Operations Administrator<br>系统运维管理员 | Service health, configuration, and restricted administrative operations; logs in with a dedicated account, not shared with roles such as Case Coordinator (v1.4)<br>服务健康、配置与受限管理操作；使用专门账号登录，不与协调员等角色共用（v1.4） | Routine browsing of all Cases' content by default, joining Case chat; emergency access requires explicit authorization and Audit Trail<br>默认日常浏览全部案件正文、加入案件聊天；紧急访问须有明确授权和审计 |
| Translation/notification task services<br>翻译/通知任务服务 | The minimum fields needed to complete the current task<br>完成本次任务所需的最少字段 | Unrestricted retrieval across the entire database or choosing new recipients on their own<br>无限制检索全库或自行选择新的接收人 |

This permission model does not claim that operations staff holding the highest database privileges are technically absolutely unable to access plaintext; it must be combined with least privilege, key management, and operation Audit Trail. Case Coordinators access only the content needed to complete Review in their assigned Cases; whether additional full-history access is needed and its authorization basis are to be clarified per O04, and permissions are not expanded by default.

此权限模型不宣称拥有数据库最高权限的运维人员在技术上绝对无法接触明文；需结合最小权限、密钥管理与操作审计。协调员仅访问获分配案件中完成审核所需的内容；是否需要额外的完整历史访问及其授权基础，按 O04 明确，不默认扩大权限。

Account roles are globally unique: one account has only one role at a time (Client/Lawyer/Case Coordinator/System Operations Administrator), and Case membership is granted within that role; cross-role needs are evaluated through the change process before being opened up. Case Coordinators may participate and speak in Case chat (v1.4, to clarify misunderstandings between the two parties), and their messages are subject to the Section 7 content checks and Audit Trail like other members'. When another reviewer or a configured backup Coordinator exists, the author cannot release their own held message or file. When the author is the only reviewer and no backup Coordinator is configured, the system prompts them with the hold reason; if they explicitly confirm, that message or file is published, and the Audit Trail records the self-release. Leaving the prompt does not publish it, and a timeout still never publishes it. Review communication with authors still leaves a trail via return reasons, appeal replies, and system notifications. The System Operations Administrator must log in with a dedicated account and must not share an account with Case Coordinators or other roles (v1.4).

账号角色全局唯一：一个账号在同一时间只具有一种角色（客户/律师/案件协调员/系统运维管理员），案件成员资格在该角色内授予；出现跨角色需求时经变更流程评估后再放开。协调员可参与案件聊天并发言（v1.4，用于澄清双方理解偏差），其消息与其他成员一样接受第7节内容检查与审计。存在其他审核人或已配置的备用协调员时，作者不能放行自己被拦住的消息或文件。作者是唯一审核人且没有配置备用协调员时，系统向其提示拦截原因；若其明确确认，该消息或文件即发布，并在审计中记下这次自行放行。不确认则不发布，超时也仍然不发布。与作者的审核沟通仍通过退回原因、申诉回复和系统通知留痕。系统运维管理员必须使用专门账号登录，不得与协调员或其他角色共用账号（v1.4）。

## 6. Translation and Message Publish Design / 翻译与消息发布设计

### 6.1 Two Reading Modes / 两种阅读模式

Supported languages: Chinese (Simplified/Traditional), Vietnamese, English (v1.4); Clients default to Chinese, Lawyers default to Vietnamese.

支持语言：中文（简体/繁体）、越南语、英语（v1.4）；客户默认中文、律师默认越南语。

- Automatic translation mode: the interface, system notifications, and chat default to the user's chosen language; messages in the same language are not re-translated. Before the Translated Text is ready, a waiting prompt in the local language is shown; on failure, a retry option is shown; another language is not quietly substituted for the translation.
- 自动翻译模式：界面、系统通知及聊天默认使用用户选择的语言；同语种消息不重复翻译。译文完成前显示本地语言的等待提示，失败显示重试选项，不悄悄展示另一种语言替代译文。
- Original-text/manual mode: shows the Source Text approved for Publish; the Translated Text is shown only after the user clicks "translate" on an individual message. Switching reading modes must not bypass content restrictions.
- 原文/手动模式：显示获准发布的原文；用户点击单条“翻译”后再显示译文。切换阅读模式不能绕过内容限制。
- Users can proactively view the approved Source Text, Translated Text, or a parallel view. The system must not hide source content that lacks publish permission in frontend fields, download endpoints, or the browser cache.
- 用户可以主动查看获准公开的原文、译文或对照。系统不能将未获发布许可的源内容藏在前端字段、下载接口或浏览器缓存里。
- Interface language, receiving language, and a message's original language are managed separately; mixed-language content can be flagged and users may correct the detection result. Language preferences are saved per account first; Case-level overrides can be added later.
- 界面语言、接收语言与消息原始语言分开管理；混合语言可标记并允许用户纠正识别结果。语言偏好先按账号保存，案件级覆盖可后续添加。

### 6.2 Publish Order That Must Be Preserved / 必须保持的发布顺序

1. Verify login, Case membership, and Case status; assign a message ID and a client-side deduplication identifier.
1. 校验登录、案件成员身份及案件状态，分配消息 ID 和客户端去重标识。
2. Save to a restricted pending area without broadcasting the content to other participants.
2. 保存到受限待处理区，不向其他参与方广播内容。
3. Run deterministic checks and necessary semantic judgment on the Source Text, identifying suspicious points with limited Case context.
3. 对源文执行确定性检查与必要的语义判断，结合有限案件上下文识别疑点。
4. Messages that pass checks, and messages a Coordinator approves, may be shown to authorized recipients. Suspected restricted messages enter Review and are **not** sent to the translation provider while they remain unapproved. On check or model failure, keep the message in `check_failed` rather than publishing by default, and raise a content-free alert to the assigned Coordinator.
4. 检查通过的消息，以及协调员批准的消息，可以向授权接收方展示。疑似受限消息进入审核，在未获批准前**不得**发给翻译供应商。检查或模型故障时保持 `check_failed`，不默认发布，并向已分配协调员发送不含正文的告警。
5. After the Source Text is approved, enqueue translation. Recheck the Translated Text for structure, numbers, dates, currency units, negations, and contact information. Anomalies enter retry or human verification and the doubtful Translated Text is not shown.
5. 源文获准后再进入翻译队列。对译文做结构、数字、日期、货币单位、否定词及联系信息复核。异常进入重试或人工校核，且不展示存疑译文。
6. Keep the version link between the approved Source Text and its Translated Text. In automatic mode, recipients see a waiting prompt in their own language until that Translated Text passes the recheck; the foreign Source Text is not used as a silent fallback. In original/manual mode, recipients see the approved Source Text, and a Translated Text appears only after they click translate.
6. 保留已批准源文与其译文的版本对应。自动模式下，在译文通过复核前，接收方只看到自己语言的等待提示，不得悄悄用外语源文代替。原文/手动模式下，接收方看到已批准源文，只有点击翻译后才出现译文。

Do not bypass post-translation checks by "showing the translation to the recipient as it is generated". Review may reject or return content to the author for revision; if a redacted copy is generated, the original must be kept and the changes marked—legal facts, amounts, or commitments must not be secretly altered.

不使用“边生成边向接收方展示”的方式绕过译后检查。审核可以拒绝或退回作者修改；若生成脱敏副本，应保留原文并标明改动，不能偷偷修改法律事实、金额或承诺。

### 6.3 LLM Integration Principles / LLM 接入原则

Kimi (Moonshot AI) is the preferred evaluation candidate designated by the user on 2026-10-01 (replacing the original candidate DeepSeek), integrated through a replaceable server-side interface. Its API is compatible with the OpenAI calling convention; the accounts and billing of the China platform (platform.moonshot.cn / platform.kimi.com) and the international platform (platform.moonshot.ai) are independent of each other, and keys are not interchangeable. Interface compatibility does not mean translation quality, data retention, or confidentiality terms have met requirements; official documentation and model versions are to be checked at implementation time (platform.kimi.com/docs).

Kimi（Moonshot AI）为用户于 2026-10-01 指定的首选评测候选（替代原候选 DeepSeek），通过服务端可替换接口接入。其 API 兼容 OpenAI 调用方式；中国平台（platform.moonshot.cn / platform.kimi.com）与国际平台（platform.moonshot.ai）的账号与计费相互独立，密钥不通用。接口兼容不代表翻译质量、数据留存或保密条件已经达标；官方文档与模型版本以实施时查阅为准（platform.kimi.com/docs）。

Model name, version, prompt version, and glossary version should be recorded and configurable; before launch, evaluate with Chinese–Vietnamese legal-scenario samples—do not just try a few lines of everyday chat. Send only the content needed to complete the translation; do not use users' phone numbers, registered emails, or entire Case histories as default context.

模型名称、版本、提示词版本及术语表版本应记录并可配置；上线前用中越法律场景样本评测，不能只试几句日常聊天。仅发送完成翻译所需的内容；不把用户手机号、注册邮箱或整个案件历史作为默认上下文。

Keep the Source Text non-silently-overwritable; revisions to the Translated Text form new versions. Key fields such as amounts, currencies, dates, parties, negations, and claims get independent checks; anomaly prompts are not a guarantee of overall translation quality. Important procedural matters are still verified by the participating Lawyers; AI translation does not automatically become legal advice or a certified translation.

保留不可静默覆盖的源文；译文修订形成新版本。金额、币种、日期、主体、否定和诉讼请求等关键字段做独立检查；异常提示不是对整段翻译质量的保证。重要程序事项仍由参与律师核对，AI 翻译不自动成为法律意见或认证译文。

Do not automatically switch sensitive content to an unapproved backup model vendor. Real case materials may be processed only after the data processing location, retention, training use, subcontractors, and contract terms are confirmed. The server side needs to read content to perform checks and translation, so the first version does not claim end-to-end encryption.

不自动把敏感内容切换给未经批准的备用模型供应商。待确认数据处理地点、留存、训练用途、分包方及合同条件后，才能处理真实案件资料。服务端需要读取内容完成检查和翻译，因此首版不宣称端到端加密。

## 7. Information Protection: Rules, Exceptions, and Practical Boundaries / 信息保护：规则、例外与实际边界

### 7.1 Approved Content Rules / 已批准的内容规则

| Content / 内容 | Enforcement Rule / 执行规则 |
| --- | --- |
| Debts, losses, damages, settlements, claimed amounts<br>债权、损失、赔偿、和解、诉讼请求金额 | Allowed; translation-accuracy checks apply; do not block merely because numbers or currencies appear<br>允许；做翻译准确性检查，不因出现数字或币种就阻止 |
| Litigation Retainer Fees–related content<br>诉讼委托费用相关内容 | Held as Pending Review per the confirmed scope, with a prompt to handle through a separately authorized channel; in the MVP, semantic judgment triggers Pending Review only upon an explicit fee inquiry/negotiation (e.g. "这个案件你们律所收费多少"), and ambiguous or general content passes by default (v1.4); the restriction must not automatically expand to other Case Amounts<br>按已确认范围暂存待审，提示通过另行授权的渠道处理；MVP 语义判断仅在出现显式费用问询/协商（如“这个案件你们律所收费多少”）时触发待审，模糊或一般性内容默认放行（v1.4）；不得自动扩大到其他案件金额 |
| Both parties' personal emails, phones, WeChat/Zalo IDs, personal homepage links, QR codes<br>双方个人邮箱、手机、微信/Zalo ID、个人主页链接、二维码 | A deterministic hit moves the message or file to Pending Review (or `check_failed` if the check itself fails). It is not auto-published and not silently dropped. Display names that match these patterns are rejected at save time. Image files are not OCR'd in the MVP; they still wait for Coordinator Review before anyone else can see them<br>确定性命中后，消息或文件进入待审（检查本身失败则为 `check_failed`）。不自动发布，也不静默丢弃。显示名命中这些模式时在保存时拒绝。MVP 不对图片做 OCR；图片文件仍须经协调员审核后其他人才可见 |
| Case-necessary contact information such as for courts, witnesses, and opposing parties<br>法院、证人、对方当事人等案件必要的联系方式 | Not blanket-deleted; mark the purpose, Review, then Publish per this Case's authorization<br>不一概删除；标记用途、审核后按本案授权发布 |
| Opposing Lawyer's name, practice identity, and necessary engagement materials<br>对方律师姓名、执业身份及必要委托材料 | Retained as actually needed for legal services; isolation by concealing identity cannot be promised<br>按法律服务实际需要保留；不能承诺用隐瞒身份实现隔离 |

Users must know that content processing and Review exist, and must be able to see whether their messages were actually delivered. Restricted messages receive a neutral reason and an appeal entry; blocking must not be masked with a fabricated translation.

用户必须知道存在内容处理与审核，并能看到自己的消息是否真正送达。被限制的消息提供中性的原因和申诉入口，不用伪造译文掩盖拦截。

### 7.2 Not Relying on a Single LLM Filter / 不依赖单一 LLM 过滤

Deterministic checks handle common emails, numbers, links, and formats; semantic judgment handles context; human Review handles difficult cases and exceptions. Consider character splitting, spaces, full-width characters, Vietnamese without tone marks, mixed languages, and splitting content across multiple messages. Thresholds are validated with Chinese–Vietnamese bilingual samples; the model's self-reported confidence is not the sole basis.

确定性检查负责常见邮箱、号码、链接及格式；语义判断负责上下文；人工审核负责疑难和例外。考虑拆字、空格、全角字符、越南语无声调、混合语言、分多条消息传递等情况。阈值通过中越双语样本验证，不以模型自报置信度作为唯一依据。

Checks cover not only body text but also avatars/display names, quotes, file names, document properties, comments, revisions, headers/footers, text in images, QR codes, downloads and exports, notification bodies, and error logs. Channels that the MVP cannot reliably inspect should be closed or manually reviewed rather than assumed safe.

检查不仅覆盖正文，还覆盖头像/显示名、引用、文件名、文档属性、批注、修订、页眉页脚、图片文字、二维码、下载导出、通知正文与错误日志。MVP 无法可靠检测的通道应关闭或人工审阅，而不是默认安全。

Even so, code words, public search, screenshots, and offline contact may still bypass the platform. The product success metric should be reducing identifiable information leakage and mis-sends, not "zero bypass".

即使如此，暗语、公开搜索、截图及线下接触仍可能绕过平台。产品成功指标应是降低可识别的信息泄漏与误发送，不是“零绕过”。

## 8. Files and Bilingual Documents / 文件与双语文档

Uploaded files first enter a private quarantine area; without approval, the other party must not obtain the file via lists, preview thumbnails, object URLs, or the API. Use a type whitelist, real file-type checks, size limits, malicious-content scanning, and quarantined parsing. Scan timeout, scan failure, or an encrypted/unparseable file stays in `check_failed`: it is not published, it is not treated as a successful Pending Review approval, and it raises a content-free alert so a Coordinator can retry the scan or reject the file. File-upload security design refers to the [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html).

上传文件先进入私有隔离区；未经批准，对方不应通过列表、预览缩略图、对象地址或 API 获得文件。使用类型白名单、真实文件类型检查、大小限制、恶意内容扫描和隔离解析。扫描超时、扫描失败或文件加密/不可解析时停在 `check_failed`：不发布，也不当成审核已通过，并发送不含正文的告警，由协调员重试扫描或拒绝该文件。文件上传安全设计参照 [OWASP 文件上传指南](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)。

The **immutable original** and the **shared copy/translation** are stored separately and linked. The original retains its hash, uploader, and time for verification by authorized personnel; only the approved Published Version is shown in chat. PDF redaction cannot be claimed complete by simply painting black boxes over content, and evidentiary originals must not be altered without authorization.

**不可变原件**与**共享副本/译本**分别存储并建立关联。原件保留哈希、上传人和时间，供有权限人员核验；聊天中仅展示获准的发布版本。不能通过简单覆盖涂黑声称完成 PDF 脱敏，也不能擅自改变证据原件。

All first-time externally published files are confirmed by the designated Case Coordinator (holding the Review duty), including file content, names, embedded objects, and metadata; entering Pending Review automatically triggers an Urgent Alert to the coordinator. Downloading an original is not an automatic right: a recipient can download an original only if that original has been explicitly approved for Publish. Downloads go through a server-side authorized proxy, ensuring old links cannot be re-requested after Permission Revocation; copies already downloaded locally cannot be recalled.

所有首次对外发布文件由指定协调员（承担审核职责）确认，包括文件内容、名称、嵌入对象和元数据；进入待审时自动触发协调员紧急提醒。原件下载不是自动权利：只有该原件已获明确发布许可，接收方才能下载。下载经服务端授权代理，确保权限撤销后不能用旧链接重新请求；已经下载到本地的副本无法收回。

(v1.4: simple DOCX bilingual output moves to P1; the following design is retained for P1 use.) Simple DOCX bilingual output shows "Source Text + Translated Text" by paragraph number, preserving the correspondence, the source-file version, the translation version, and a machine-translation mark. Complex tables, footnotes, text boxes, scanned images, etc., if they cannot be covered, must be explicitly rejected for automatic conversion or handed to humans—success must not be marked after silently omitting content. Generated translations still go through publish Review.

（v1.4：简单 DOCX 双语输出移至 P1，以下设计保留供 P1 使用。）简单 DOCX 双语输出按段落编号显示“源文＋译文”，保留对应关系、源文件版本、译文版本和机器翻译标记。复杂表格、脚注、文本框、扫描图等若无法覆盖，应明确拒绝自动转换或转人工，不能静默遗漏后仍标记成功。生成译本后仍走发布审核。

## 9. Registration, Urgent Notifications, and Delivery Status / 注册、紧急通知和送达状态

(v1.4: the MVP uses only the email channel; phone registration and SMS notifications move to P1, and the phone/SMS-related design in this section is retained for P1 use.) Email (including phone numbers from P1) is verified first, then becomes a usable login and notification channel. If the same person later binds another channel, it should be verified and linked within an authenticated session; two accounts must not be automatically merged based on name alone. Device logout, Verification Code (OTP) error counts, send frequency, session expiry, and account recovery all need to be defined in SPEC.md.

（v1.4：MVP 仅邮箱渠道；手机号注册与短信通知移至 P1，本节手机/短信相关设计保留供 P1 使用。）邮箱（P1 起含手机号）先验证，再成为可用登录与通知渠道。若同一人日后绑定另一渠道，应在已认证会话中验证并关联，不能仅凭姓名自动合并两个账号。设备退出、验证码错误次数、发送频率、会话过期及账号恢复都需在 SPEC.md 中定义。

The MVP notification channel is the recipient's verified email (v1.4); from P1: when only the phone is verified, SMS is the default; when both are verified, notifications are sent per the recipient's confirmed preference. The sender selects an authorized recipient member within the Case and cannot enter an arbitrary email or phone number. Team Cases should designate the specific person responsible for notifications, avoiding default mass sends.

MVP 通知渠道为收件方已验证邮箱（v1.4）；P1 起：只验证手机时默认短信，两者都有时按其已确认偏好发送。发送人选择本案内被授权的接收成员，不能输入任意邮箱或手机号。团队案件应明确通知具体负责人，避免默认群发。

The urgent button sends a platform notification: "You have a case item awaiting action; please log in to view it." It uses the recipient's language and does not attach chat content, attachments, the other party's contact information, or sensitive case titles; it does not put both parties in the same email recipient list and does not use the other party's address as Reply-To. Alert links only provide navigation; accessing content still requires login and Case authorization.

紧急按钮发出平台通知：“您有案件待处理，请登录查看。”使用收件人语言，不附聊天正文、附件、对方联系方式或敏感案件标题；不把双方放入同一邮件收件人列表，不用对方地址作为 Reply-To。提醒链接只负责导航，访问内容仍需登录及案件授权。

Distinguish among "queued, accepted by vendor, delivery confirmed (if the channel supports it), delivery unknown, send failed, In-app Confirmation received". Vendor acceptance of a request does not mean the user received it; email open pixels are not proof of reading. Notifications have deduplication, cooldown periods, rate limits, failure retries, and final-failure prompts. When a user-to-user Urgent Alert reaches final failure, the sender sees that failure and the assigned Case Coordinator receives a content-free notice so the failure is not silent. That notice does not publish the chat. MVP escalation uses elapsed clock time around the clock; a business-hours calendar is P1.

区分“已排队、供应商已接受、确认送达（若渠道支持）、送达未知、发送失败、站内已确认”。供应商接受请求不等于用户收到；邮件打开像素不作为已阅读证明。通知具备去重、冷却时间、限额、失败重试和最终失败提示。用户间紧急提醒进入最终失败时，发送人看到失败，已分配协调员收到不含正文的通知，避免失败无声。该通知不发布聊天内容。MVP 的升级按连续时钟计时、全天有效；工作时间日历属于 P1。

(The following SMS-vendor content moves to P1 together with the phone channel and is retained for P1 use; the MVP email vendor must likewise be screened up front and undergo real delivery verification.) **Vendor screening must happen up front.** Twilio's China guidelines do not guarantee SMS delivery to China; its Vietnam guidelines state that Sender IDs and templates require pre-registration and note receipt limitations on some networks. These are implementation-limitation references for that vendor; one must not assume all vendors are the same. See the [China Guidelines](https://www.twilio.com/en-us/guidelines/cn/sms) and the [Vietnam Guidelines](https://www.twilio.com/en-us/guidelines/vn/sms). Before launch, verification codes and transactional alerts must be verified on real +86/+84 numbers, and template review lead times should be included among external dependencies.

（以下短信供应商内容随手机渠道移至 P1，保留供 P1 使用；MVP 邮件供应商同样须前置筛选并做真实送达验证。）**供应商筛选必须前置。** Twilio 的中国指南不保证中国短信送达；其越南指南说明 Sender ID 和模板需要预注册，并指出部分网络的回执限制。这些是该供应商的实施限制参考，不能推定所有供应商相同。参见[中国指南](https://www.twilio.com/en-us/guidelines/cn/sms)及[越南指南](https://www.twilio.com/en-us/guidelines/vn/sms)。上线前须在真实 +86/+84 号码验证验证码和事务提醒，模板审核周期应纳入外部依赖。

### 9.1 Case Coordinator Review Urgent Alert (User-Confirmed for MVP) / 协调员审核紧急提醒（用户已确认纳入 MVP）

This notification is initiated automatically by the system and is a different flow from the chat parties manually clicking the urgent button. After a suspected restricted message or file formally enters the Pending Review state, a Review task and a notification event are registered in the same database transaction, and the backend immediately submits an Urgent Alert to the assigned Case Coordinator's verified email (v1.4; phone/SMS channel in P1). From P1, if both channels are verified, the alert is sent via the coordinator's configured primary channel; a backup channel is used only if it is verified and enabled.

该通知由系统自动发起，与聊天双方手动点击紧急按钮是两条不同流程。疑似受限消息或文件正式进入待审状态后，在同一数据库事务中登记审核任务和通知事件，后台立即向已分配协调员的已验证邮箱提交紧急提醒（v1.4；手机/短信渠道 P1）。P1 起若两者都已验证，按协调员设置的主渠道发送；备用渠道仅在已验证且已启用时使用。

The notification contains only "there is case content pending Review; please log in and handle it as soon as possible", a non-sensitive task identifier, and a login-required link; it does not attach the original message, retainer fees, or attachments. Users can see "pending Review"; it must not be displayed as the other party having received it. The coordinator receiving the notification, opening the task, starting work, and completing the Review are recorded separately; vendor acceptance of an email request must not be treated as Review completion.

通知只包含“有案件内容待审核，请尽快登录处理”、不敏感的任务标识及需登录的链接，不附原消息、委托费用或附件。用户可以看到“待审核”，不得显示为对方已经收到。协调员收到通知、打开任务、开始处理及完成审核分别记录，不能把邮件供应商接受请求当作审核完成。

The design and acceptance target is to complete the first notification submission attempt within 30 seconds after the Pending Review record is submitted; this is an internal processing target, not a promise of actual email/SMS arrival. Interface failures are retried automatically; final failures are persisted and reported to the designated backup Case Coordinator or operations owner. When no one is assigned or the notification channel is unavailable, the backend and the submitter should see the processing exception—there must be no ownerless, unflagged Pending Review tasks.

系统以待审记录提交后 30 秒内完成第一次通知提交尝试为设计与验收目标；这是内部处理目标，不是邮件/短信实际到达承诺。接口失败自动重试，持久化最终失败，并提醒指定备用协调员或运营负责人。无人被分配或通知渠道不可用时，后台和提交人应看到处理异常，不能产生无负责人且无提示的待审任务。

Each Pending Review item keeps an independent task and alert record. Network retries use a deduplication identifier; rapid consecutive uploads may be merged into a notification batch, but the first item triggers immediately and later to-dos must not be lost to rate limiting. Review timeout thresholds and escalation recipients are configurable; specific time limits and after-hours arrangements are proposed by Kimi as a configurable scheme per O03 and confirmed by the business owner; no timeout may automatically release restricted content. After Review completes, redundant alerts not yet sent are cancelled, and the worker re-checks status and coordinator permissions before sending.

每项待审内容保留独立任务与提醒记录。网络重试使用去重标识；短时间连续上传可合并成通知批次，但首项立即触发且不得因限流遗漏后续待办。审核超时阈值和升级接收人可配置，具体时限及非工作时间安排由 Kimi 按 O03 提出可配置方案，经业务负责人确认；任何超时都不能自动放行受限内容。审核完成后取消尚未发送的冗余提醒，worker 发送前重新检查状态与协调员权限。

## 10. Technical Defaults and Operating Responsibilities / 技术默认值与运行责任

The following are accepted technical starting points, not a functional scope to be re-confirmed. Kimi checks compatibility and pins versions at the SPEC.md stage; reversible implementation optimizations are recorded per Section 0, and significant changes are submitted for decision.

以下为已接受的技术起点，不是待重新确认的功能范围。Kimi 在 SPEC.md 阶段核对兼容性并固定版本；可逆实现优化按第0节记录，重大变化提交决策。

| Layer / 层 | Technical Default or Constraint That Must Be Preserved / 技术默认值或必须保持的约束 |
| --- | --- |
| Web and API<br>网页与 API | TypeScript monolith, Next.js by default; Chinese (Simplified/Traditional), Vietnamese, and English UI dictionaries managed independently<br>TypeScript 单体应用，默认 Next.js；中文（简体/繁体）、越南语、英语界面字典独立管理 |
| Data<br>数据 | PostgreSQL; membership relations, messages, translation versions, Review status, and notification tasks are all persisted<br>PostgreSQL；成员关系、消息、翻译版本、审核状态、通知任务均持久化 |
| Real-time communication<br>实时通信 | Start with HTTP send + SSE receive and incremental pull after reconnection; decide whether to use WebSocket after deployment verification<br>先用 HTTP 发送＋SSE 接收及断线后增量拉取；根据部署验证再决定是否用 WebSocket |
| Background jobs<br>后台任务 | Independent workers handle translation, file scanning, and notifications. DOCX conversion is P1 and is not an MVP worker. The MVP prefers a database-persisted task queue, avoiding premature addition of multiple middleware layers<br>独立 worker 处理翻译、文件扫描及通知。DOCX 转换属于 P1，不是 MVP 的 worker。MVP 优先使用数据库持久任务队列，避免过早增加多套中间件 |
| Files<br>文件 | Private object storage in the same region; download authorization enforced at the application layer; temporary files cleaned up promptly<br>同地域私有对象存储；下载授权在应用端执行；临时文件及时清理 |
| Authentication<br>认证 | Choose a maintained authentication component/service; do not invent cryptography or verification-code protocols; business permissions are always enforced server-side<br>选择经维护的认证组件/服务；不自行发明密码学或验证码协议；业务权限始终由服务端执行 |
| External adapters<br>外部适配 | TranslationProvider, SmsProvider, EmailProvider, to facilitate test doubles and vendor replacement<br>TranslationProvider、SmsProvider、EmailProvider，方便测试替身与供应商替换 |
| Deployment<br>部署 | Containerization, TLS reverse proxy, test/production isolation; keys only via the deployment platform's secure configuration<br>容器化、TLS 反向代理、测试与生产隔离；密钥只用部署平台安全配置 |
| Verification<br>验证 | Unit/integration tests, real-database permission tests, Playwright two-user end-to-end tests, human evaluation of Chinese–Vietnamese translation<br>单元/集成测试、真实数据库权限测试、Playwright 双用户端到端测试、中越翻译人工评测 |

The MVP starts as a modular monolith, without introducing microservices, Kubernetes, vector databases, or cross-region dual writes. Main business data and tasks stay in the same region as much as possible; if a managed database is combined with Lighthouse, the actual private-network connectivity must be verified—one cannot assume all same-region products are naturally interconnected over the internal network.

MVP 先做模块化单体，不引入微服务、Kubernetes、向量数据库或跨区域双写。主业务数据与任务尽量同地域；托管数据库若与 Lighthouse 组合，需核查实际私网连接条件，不能假定所有同地域产品天然内网互通。

Logs preferentially record IDs, status, durations, and error categories; body text, verification codes, tokens, and raw documents are not logged by default. Backups are encrypted, access-restricted, and periodically restored for real into an isolated environment. The accepted pilot design targets are RPO ≤24 hours and RTO ≤8 hours; they must be verified through recovery drills and must not be written as already-achieved commitments. Kimi should explain the data-recovery gap and downtime these targets may entail; if real Cases need a higher standard, submit an enhancement plan per O08 and settle it before the pilot.

日志优先记录 ID、状态、耗时及错误类别；不默认记录正文、验证码、令牌或原始文档。备份加密并限制访问，定期实际恢复到隔离环境。已接受的试点设计目标为 RPO ≤24 小时、RTO ≤8 小时；必须通过恢复演练验证，不能写成已实现承诺。Kimi 应说明这一目标可能产生的数据恢复间隔及停机时间；若实际案件需要更高标准，按 O08 提交增强方案，在试点前明确。

## 11. Data, Legal Services, and Pre-Launch Checks / 数据、法律服务与上线前检查

This section identifies the applicability assessments that need to be completed; it does not conclude that "this deployment is compliant".

本节识别需要完成的适用性评估，不作“该部署已合规”的结论。

China's Personal Information Protection Law contains rules on conditions and notification for cross-border provision of personal information; the specific applicable path still needs to be evaluated in light of the operating entity, data sources/types, volume, and current supporting rules—one cannot presume completion by ticking a single consent box. See the [official statute, Articles 38–39, etc.](https://www.cac.gov.cn/2021-08/20/c_1631050028355286.htm).

中国《个人信息保护法》包含个人信息跨境提供的条件及告知等规则；具体适用路径仍需结合运营主体、数据来源/类型、数量及现行配套规则评估，不能只勾选一个同意框就推定完成。参见[官方法条，第38–39条等](https://www.cac.gov.cn/2021-08/20/c_1631050028355286.htm)。

Official Vietnamese records show that Personal Data Protection Law 91/2025/QH15 and implementing decree 356/2025/NĐ-CP both take effect on 2026-01-01. Therefore later assessments cannot rely solely on summaries of the previous old regime. See the [official record of the law](https://vanban.chinhphu.vn/?classid=1&docid=214590&pageid=27160&typegroup=) and the [official record of the implementing decree](https://vanban.chinhphu.vn/?docid=216387&pageid=27160&typegroupid=4). This round only verified the above names and effective dates; no article-level project-applicability opinion has been completed.

越南官方记录显示，个人数据保护法 91/2025/QH15 与实施法令 356/2025/NĐ-CP 均于 2026-01-01 生效。因此后续评估不能仅沿用此前的旧制度摘要。参见[法律官方记录](https://vanban.chinhphu.vn/?classid=1&docid=214590&pageid=27160&typegroup=)与[实施法令官方记录](https://vanban.chinhphu.vn/?docid=216387&pageid=27160&typegroupid=4)。本轮只核实上述名称和生效日期，未完成条文级项目适用性意见。

Before the real-case pilot, the following must be determined: the data-processing roles of the operating entity and each participant, user notice and authorization, Lawyers' confidentiality obligations, entrusted-processing terms, the cross-border path, data-subject requests, incident handling, retention periods, and legal hold. The data-flow diagram must include the main database, backups, logs, model vendors, and email and SMS services—not just server locations.

真实案件试点前需确定：运营主体与各参与者的数据处理角色、用户告知与授权、律师保密义务、受托处理条件、跨境路径、数据主体请求、事故处置、保留期限与法律保全。数据流图必须包含主库、备份、日志、模型供应商、邮件与短信服务，不只画服务器所在地。

The platform's communication policy cannot replace or limit the disclosures, explanations, and independent professional judgment a Lawyer is legally required to provide to Clients. The scope of restricted content is confirmed by an authorized business owner; necessary legal-service communications should have a usable exception process.

平台的沟通政策不能代替或限制律师依法应向客户作出的披露、说明及独立专业判断。受限内容范围由有权限的业务负责人确认；必要的法律服务沟通应有可用例外流程。

## 12. Delivery Phases, Responsibilities, and Acceptance / 交付阶段、责任与验收

### 12.1 Phases and Deliverables / 阶段与交付物

| Phase / 阶段 | Output / 输出 | Conditions for Entering the Next Phase / 进入下一阶段的条件 |
| --- | --- | --- |
| Completed: SOW scope approval<br>已完成：SOW 范围批准 | This SOW.md Execution Baseline<br>本 SOW.md 执行基线 | Approved by the user; only actual gaps are checked—the settled scope is not re-approved<br>已获用户批准；仅核对实际缺口，不重复审批已定范围 |
| Completed: startup instructions<br>已完成：启动指令 | VIBE_CODING_INPUT.md, guiding VPS execution<br>VIBE_CODING_INPUT.md，指导 VPS 执行 | Initialize missing records on the VPS per its real state; old backups are not used as input<br>在 VPS 按真实状态初始化缺失记录；旧版备份不作为输入 |
| Done: specification freeze<br>已完成：规格冻结 | SPEC.md v0.3 and PLAN.md v0.3 frozen on 2026-10-01; v0.4 / SOW v1.6 are consistency errata on that baseline<br>SPEC.md v0.3 与 PLAN.md v0.3 于 2026-10-01 冻结；v0.4 / SOW v1.6 是该基线上的一致性勘误 | Coding of the frozen baseline has started; errata are read before the next task<br>已按冻结基线开始编码；下一任务开始前阅读勘误 |
| Current: MVP development<br>当前：MVP 开发 | Code, migrations, synchronized tests, and run instructions delivered per task. T01 is done; T02 is next<br>按任务交付代码、迁移、同步测试和运行说明。T01 已完成；下一项为 T02 | Each task passes its own acceptance; page screenshots cannot substitute for permission and failure-path tests<br>每项任务自身验收通过；不能用页面截图代替权限与失败路径测试 |
| Pilot preparation<br>试点准备 | Deployment instructions, recovery drills, end-to-end report, real notification-chain report<br>部署说明、恢复演练、端到端报告、真实通知链路报告 | Business, translation, security, and operations acceptance pass; external dependencies are ready<br>业务、翻译、安全与运行验收通过，外部依赖已就绪 |
| Pilot and enhancement<br>试点与增强 | Small-scale real use, issue fixes, then introducing P1 item by item<br>小范围真实使用、问题修复，再逐项引入 P1 | This version's acceptance and feedback are complete; new features first update SPEC.md/PLAN<br>本版验收和反馈完成；新增功能先更新 SPEC.md/PLAN |

The product owner confirms business policy, pilot participants, and acceptance; Lawyer/Chinese–Vietnamese bilingual reviewers confirm professional translation samples; Case Coordinators handle Review and exception response; development handles implementation and evidence; the operations owner handles deployment, recovery, monitoring, and credential management. Do not assume the referrer, Lawyers, or developers automatically take on all responsibilities.

产品负责人确认业务政策、试点参与者和验收；律师/中越双语审阅人确认专业翻译样本；协调员负责审核与异常响应；开发负责实现与证据；运维负责人负责部署、恢复、监控及凭据管理。不能默认由介绍人、律师或开发者自动承担所有职责。

Based on this SOW, the team's actual capacity, and external dependencies, Kimi estimates the schedule in PLAN.md with assumptions noted; the settled scope does not imply channels or personnel are already in place. Network selection, SMS template approval, data-processing terms, and bilingual evaluation are key external dependencies; finishing coding does not mean the system can go live.

Kimi 基于本 SOW、团队实际能力和外部依赖，在 PLAN.md 中估算排期，注明假设；不因既定范围而推定渠道或人员已就绪。网络选型、短信模板审批、数据处理条件和双语评测属于关键外部依赖；编码结束不等于可以上线。

### 12.2 Minimum Acceptance Scenarios / 最低验收场景

| Acceptance ID / 验收编号 | Scenario and Expected Evidence / 场景及预期证据 |
| --- | --- |
| AC01 | Real registration and login completed via email; expired/replayed verification codes and invitation codes are unusable; simulated-vendor tests cannot substitute for real trials. (+86/+84 phone-registration acceptance moves to P1 with v1.4)<br>邮箱完成真实注册登录；失效/重放验证码和邀请码不可用；模拟供应商测试不能替代真实试验。（+86/+84 手机注册验收随 v1.4 移至 P1） |
| AC02 | A Lawyer participating in two Client Cases has direct client-side requests to the other Case's API, real-time stream, attachments, Translated Text, and exports all rejected; after membership revocation, both existing connections and new requests lose permission<br>律师参与两个客户案件，客户端直接请求另一案件 API、实时流、附件、译文与导出均被拒绝；成员撤销后存量连接和新请求权限均失效 |
| AC03 | Two independent browsers read the same conversation in different languages (Chinese and Vietnamese are the required pair; English and Traditional Chinese are covered by automated mock-translation tests); switching to manual mode does not auto-translate new messages; repeated clicks and network retries do not cause duplicate Publish<br>两个独立浏览器以不同语言阅读同一交流（中文与越南语是必测组合；英语与繁体中文由模拟译文的自动化测试覆盖）；切换手动模式不自动翻译新消息；重复点击及网络重试不重复发布 |
| AC04 | LLM timeout/rate-limit/format anomalies produce a clear status; received Source Text must not be lost, falsely shown as delivered, or silently switched to an unauthorized vendor<br>LLM 超时/限流/格式异常时有明确状态；不得丢失已接收源文、误显示已送达或偷偷切换未授权供应商 |
| AC05 | Ordinary Case Amounts pass; explicit retainer-fee inquiries and contact information enter the established rules, and ambiguous fee mentions pass by default (v1.4); covers splitting, mixed-language, and attachment scenarios, with False Block / Missed Block counted separately<br>正常案件金额允许通过；显式委托费用问询与联系方式进入既定规则，模糊费用提及默认放行（v1.4）；覆盖拆分、混合语言和附件场景，并单独统计误拦与漏拦 |
| AC06 | Attachments Pending Review cannot be previewed/downloaded; published copies are distinguishable from originals; scan failures are not released; old download entry points fail after Permission Revocation<br>待审附件无法预览/下载；发布副本与原件可区分；扫描失败不放行；权限撤销后旧下载入口失效 |
| AC07 | (Moved to P1 with v1.4) In-scope DOCX files generate paragraph-by-paragraph Bilingual Parallel Documents; key fields are accurate; unsupported elements have explicit failure/human-handling results, with no silent missed paragraphs<br>（随 v1.4 移至 P1）支持范围内 DOCX 生成逐段对应的双语文件；关键字段准确；不支持的元素有明确失败/人工处理结果，不静默漏段 |
| AC08 | Urgent Alerts are sent to both parties' emails (the SMS branch moves to P1 with v1.4); the other party's address and body content do not leak; repeated clicks are deduplicated; final failure and delivery-unknown states are visible; recipient In-app Confirmation is traceable<br>双方向邮箱发出紧急提醒（短信分支随 v1.4 移至 P1）；对方地址和正文不泄漏；重复点击去重，最终失败与送达未知可见，接收人站内确认可追踪 |
| AC09 | After Archive, access is read-only or revoked per policy, and unfinished notification tasks re-check permissions. (Case-switching draft/attachment isolation and mis-selection indicators move to P1 with the R03 UI)<br>归档后按政策只读或撤销访问，未完成通知任务重新检查权限。（案件切换草稿/附件隔离与误选标识随 R03 界面移至 P1） |
| AC10 | Real Chinese–Vietnamese networks reach the experience thresholds approved by both sides; record test time, network, sample size, P95, and failure rate—not only local development-machine results<br>中越真实网络达到双方批准的体验阈值；记录测试时间、网络、样本数、P95 与失败率，不仅报告本地开发机结果 |
| AC11 | Backup and Restore completed in an isolated environment with message, member, and file associations verified; sensitive content does not appear in routine logs; administrator operations and Reviews are recorded<br>在隔离环境完成备份恢复并核查消息、成员、文件关联；敏感内容不出现在常规日志；管理员操作和审核有记录 |
| AC12 | Suspected restricted messages and uploaded files each enter Pending Review, and the Case Coordinator automatically receives an urgent email (the SMS branch moves to P1 with v1.4); verify the first-send target, retry deduplication, consecutive uploads, no valid channel, timeout escalation, alert cancellation after Review, and that notifications contain no sensitive body content<br>疑似受限消息和上传文件分别进入待审，协调员自动收到紧急邮件（短信分支随 v1.4 移至 P1）；验证首发目标、重试去重、连续上传、无有效渠道、超时升级、已审核取消提醒及通知不含敏感正文 |

Separate Chinese–Vietnamese bilingual evaluation sets are built for translation and filtering, covering ordinary case facts, numbers/dates/negations/parties, obfuscated contact information, and ambiguous contexts. Automated tests use fixed simulated responses to verify the business logic; real-model evaluation measures language quality and misjudgments—the two are not mixed into one unstable test. The first-round evaluation includes at least 100 bidirectional translation samples and 100 allowed/restricted contrast samples, reviewed by bilingual personnel. Key-field errors and serious permission leaks are release blockers; sample passes do not equal zero errors in reality. Acceptable thresholds for semantic False Block / Missed Block are frozen in SPEC.md.

翻译与过滤建立分开的中越双语评测集，含普通案情、数字/日期/否定/主体、联系信息变形与模糊上下文。自动测试使用固定模拟响应验证业务；真实模型评测用于衡量语言质量和误判，不混成不稳定的单一测试。首轮评测至少包含 100 条双向翻译样本及 100 条允许/受限对照样本，由双语人员审阅。关键字段错误与严重权限泄漏为发布阻断项；样本通过不等于现实中零错误。语义误拦/漏拦的可接受阈值在 SPEC.md 中冻结。

## 13. SDD, Task Decomposition, and Session Memory / SDD、任务拆分与会话记忆

### 13.1 Method Usage / 方法使用

Matt Pocock's [grill-with-docs](https://github.com/mattpocock/skills/blob/main/skills/engineering/grill-with-docs/SKILL.md) and its referenced grilling and domain-modeling have been read. Their purpose is to expose decision branches, clarify terminology, and record necessary decisions—not to turn the user's initial description directly into unchangeable requirements. These method descriptions were read during proposal preparation, but **their toolchain has not been installed or run**. When taking over, Kimi first checks availability and versions, and clarifies only the real gaps in Section 14 and those found during implementation—approved business decisions are not reopened.

已读取 Matt Pocock 的 [grill-with-docs](https://github.com/mattpocock/skills/blob/main/skills/engineering/grill-with-docs/SKILL.md) 及其引用的 grilling、domain-modeling。其用途是暴露决策分支、澄清术语并记录必要决策；不是把用户最初的描述直接变成不可更改的需求。方案准备阶段已读取这些方法说明，**尚未安装或运行其工具链**。Kimi 接手时先核查可用性与版本，只对第14节及实施发现的真实缺口开展澄清，不重开已批准业务决定。

Adopt the SDD principle of "requirements → clarification → technical plan → tasks → implementation → verification", referencing [GitHub Spec Kit](https://github.com/github/spec-kit). Its templates and consistency checks may be absorbed; there is no need to stack multiple complete process frameworks at once. External skills selected later should be reviewed first and pinned to a source version, so that different sessions do not change working rules due to automatic updates.

采用 SDD 的“需求 → 澄清 → 技术计划 → 任务 → 实现 → 验证”原则，参考 [GitHub Spec Kit](https://github.com/github/spec-kit)。可吸收其模板与一致性检查，不必同时堆叠多个完整流程框架。后续选用的外部 skill 应先审阅并固定来源版本，避免不同会话因自动更新改变工作规则。

### 13.2 File Responsibilities / 文件职责

| File / 文件 | Single Responsibility / 单一职责 |
| --- | --- |
| SOW.md | Goals, scope, exclusions, phases, responsibilities, deliverables, and approval records<br>目标、范围、排除项、阶段、责任、交付物和批准记录 |
| SPEC.md | Numbered behavioral requirements, role permissions, state transitions, data/API conventions, exceptions, and test basis<br>有编号的行为要求、角色权限、状态转换、数据/API 约定、异常和测试依据 |
| PLAN.md | Priorities, dependencies, and file impact for the MVP. The P0 slice is 11 tasks (T01–T08, T10–T12), inside the 8–12 limit. T09 and T13 are P1 tasks kept in the same file and are not part of that P0 count<br>基于已批准 SPEC.md 的优先级、依赖及文件影响范围。P0 切片为 11 个任务（T01–T08、T10–T12），位于 8–12 的上限之内。T09 与 T13 是记在同一文件中的 P1 任务，不计入该 P0 数量 |
| PROGRESS.md | Current task status, test-evidence locations, blockers, and the current next step; does not repeat the whole SPEC.md<br>任务当前状态、测试证据位置、阻塞与当前下一步；不重复整份 SPEC.md |
| CONTEXT.md | Minimal navigation and stable background; not a summary of all history<br>极简导航和稳定背景；不是全部历史的汇总 |
| SESSIONS.md | Appended each development session: what was done, changed files, test results, unfinished items, the first step next time<br>每次开发会话追加：做了什么、变更文件、测试结果、未完成项、下次第一步 |
| GLOSSARY.md | Syncs settled business terminology from Section 2; avoids mixing in implementation details<br>从第2节同步已确定的业务术语；避免夹入实现细节 |
| docs/adr/ | A small number of hard-to-reverse architecture decisions with real trade-offs and their rationale<br>少量难以逆转、有真实取舍的架构决策及理由 |
| VIBE_CODING_INPUT.md | VPS execution entry point; reads the current SOW baseline and respects phase boundaries<br>VPS 执行入口；读取当前 SOW 基线并遵守阶段边界 |

Use the above unified capitalization; in particular, keep only one PLAN.md and do not create an additional plan.md, to avoid Windows/Linux case-sensitivity differences producing two plans. The VPS needs only the current SOW.md and VIBE_CODING_INPUT.md; SESSIONS.md, PROGRESS.md, and CONTEXT.md have their missing items initialized by Kimi based on the remote's actual state, with existing items maintained incrementally—uploading local history is not required. The next phase checks against the SOW and proceeds into SPEC.md and PLAN.md; coding begins after Review(approval).

使用上述统一大小写，尤其只保留一个 PLAN.md，不另外创建 plan.md；避免 Windows/Linux 大小写差异产生两份计划。VPS 仅需当前 SOW.md 和 VIBE_CODING_INPUT.md；SESSIONS.md、PROGRESS.md、CONTEXT.md 由 Kimi 根据远端实际状态初始化缺失项，已有项增量维护，不要求上传本地历史。下一阶段从 SOW 核对进入 SPEC.md 和 PLAN.md，评审后再编码。

### 13.3 Task Constraints for the Formal PLAN / 正式 PLAN 的任务约束

SPEC.md and PLAN.md may form Review(approval) drafts in the same phase; the PLAN.md draft must reference the current SPEC.md version, requirement IDs, and acceptance IDs, and mark unresolved dependencies. After Review(approval) passes, the corresponding versions are frozen as the Execution Baseline before tasks become executable; unreviewed preconceived technical modules must not be passed off as approved tasks.

SPEC.md 与 PLAN.md 可在同一阶段形成评审草案；PLAN.md 草案必须引用当前 SPEC.md 的版本、需求编号与验收编号，并标记未决依赖。评审通过后冻结对应版本作为执行基线，才将任务转为可执行；不得把未评审的预设技术模块冒充已批准任务。

The MVP plan is decomposed into **8–12 bounded, independently verifiable small tasks**. The current P0 plan has 11 such tasks. P1 tasks may be appended in the same PLAN.md without counting toward that limit and without blocking P0. Independent testing does not mean no dependencies: each task is verified through explicit interfaces and test data, dependencies are expressed as task IDs, and the split is not done as "the whole frontend / the whole backend / tests at the end". If an item cannot deliver a clear result within one short development cycle, shrink the delivery granularity of the individual task or re-split; do not cut the approved MVP scope, and do not call a large module a small task to pad the task count.

MVP 计划拆成 **8–12 个有边界、可单独验证的小任务**。当前 P0 计划为 11 个。P1 任务可以追加在同一份 PLAN.md 中，不计入该上限，也不阻塞 P0。独立测试不等于没有依赖：每项通过明确接口与测试数据验证，依赖用任务 ID 表示，不按“整个前端/整个后端/最后写测试”切分。若某项不能在一个短开发周期中交付清晰结果，应缩小单个任务的交付粒度或重新拆分，不能削减已批准的 MVP 范围，也不能为凑任务数把大模块称作小任务。

Each task contains at least: task ID, goal, P0/P1/P2, corresponding SPEC.md clauses, dependencies, acceptance criteria, expected new/modified file paths, synchronized test files, necessary data migrations, test commands, completion evidence, and status. Later features build their own incremental plans by the same method, without overwriting the history of completed tasks.

每个任务至少包含：任务 ID、目标、P0/P1/P2、对应 SPEC.md 条款、依赖、验收标准、预计新增/修改文件路径、同步测试文件、必要数据迁移、测试命令、完成证据及状态。后续 feature 按同样方法建立自身增量计划，不覆盖已完成任务历史。

Coding uses short loops: first build a meaningful failing test for the current slice → minimal implementation → tests pass → refactor → check SPEC.md consistency. Tests cover real authorization, state transitions, and exceptions, not just assertions about internal implementation details. Update PROGRESS as each item completes; do not postpone testing until all features are finished.

编码采用短循环：先为当前切片建立有意义的失败测试 → 最小实现 → 测试通过 → 重构 → 检查 SPEC.md 一致性。测试覆盖真实授权、状态转换和异常，不只是断言实现内部细节。每项完成即更新 PROGRESS；不把测试推迟到所有功能结束。

### 13.4 Conventions for Entering/Exiting the Development Environment / 每次进入/退出开发环境的约定

Entering a session: read project instructions → latest SESSIONS record → PROGRESS → currently executable PLAN tasks → corresponding SPEC.md clauses and necessary ADRs → check the actual workspace state. When records conflict with the code, verify first; do not treat old CONTEXT as fact.

进入会话：读取项目指令 → SESSIONS 最新记录 → PROGRESS → PLAN 当前可执行任务 → 对应 SPEC.md 条款与必要 ADR → 检查实际工作区状态。发现记录与代码冲突时先核实，不把旧 CONTEXT 当作事实。

Exiting a session: record what was actually completed, changed files, checks passed/failed/not run, uncommitted work, and the first step next time; sync task status. SESSIONS appends history, PROGRESS holds the current state, and CONTEXT holds only stable navigation. Longer history is archived by month to avoid loading everything every time.

退出会话：记录实际完成项、变更文件、通过/失败/未运行的检查、未提交工作和下次第一步；同步任务状态。SESSIONS 追加历史，PROGRESS 保存当前状态，CONTEXT 只保存稳定导航。较长历史按月份归档，避免每次加载全部内容。

Merely opening VS Code does not automatically generate session logs; the agent must execute the above conventions at start/end. If a session is interrupted unexpectedly, the next session recovers from workspace differences and notes that records are incomplete. Writing tokens, real case facts, or personal contact information into project memory is forbidden.

仅打开 VS Code 并不会自动生成会话日志；需由 agent 在开始/结束时执行上述约定。若会话意外中断，下次根据工作区差异恢复并注明记录不完整。禁止把令牌、真实案情或个人联系方式写入项目记忆。

## 14. Open Items Checklist: Kimi Verification, Proposals, and User Decisions / 待落实清单：Kimi 核查、提案与用户决定

D1 fee restriction, D2 Case Coordinator Review and automatic Urgent Alerts, single-organization MVP, and the independent application are already approved and will not be re-consented (the simple DOCX bilingual scope was moved to P1 in the v1.4 Review(approval)). What is listed below are implementation conditions, not a re-selection of product direction.

D1 费用限制、D2 协调员审核及自动紧急提醒、单机构 MVP、独立应用已经批准，不重新征求同意（简单 DOCX 双语范围经 v1.4 评审移至 P1）。下面列的是落实条件，不是重新选择产品方向。

| ID / 编号 | Open Item / 待落实事项 | Work Kimi Must Complete / Kimi 必须完成的工作 | Decision-Maker and Latest Resolution Phase / 决定方与最迟解决阶段 |
| --- | --- | --- | --- |
| O01 | Development environment, main site, and domain<br>开发环境、主站与域名 | Read the actual VPS environment; verify the accessible main-site technology and domain configuration, list missing permissions, and do not ask for keys in chat<br>读取 VPS 实际环境；核查可访问的主站技术与域名配置，列出缺少权限，不要求聊天提供密钥 | Kimi verifies; the domain/resource owner implements; resolve before main-site integration—does not block the independent application's SPEC<br>Kimi 核查；域名/资源所有者落实；主站集成前解决，不阻塞独立应用 SPEC |
| O02 | Production resources, region, and operations<br>生产资源、地域与运维 | Compare the existing VPS's conditions with the Section 1 default route; list owner responsibilities and Chinese–Vietnamese network test evidence; provide an evidence-backed alternative if conditions are insufficient<br>比较现有 VPS 条件与第1节默认路线；列出负责人职责及中越网络测试证据；条件不足时提供一个有依据的替代方案 | Selected by the user/operations owner; before production deployment—do not assume the current VPS is already the production server<br>用户/运维负责人选定；生产部署前，不假定当前 VPS 已是生产服务器 |
| O03 | Case Coordinator and notification operating parameters<br>协调员与通知运行参数 | Design owner/backup assignment, verified email channel (primary/backup/phone channel in P1, v1.4), Review response time limits, after-hours arrangements, cooldown/retry/escalation parameters; propose defaults and impacts<br>设计负责人/代班分配、已验证邮箱渠道（主备/手机渠道 P1，v1.4）、审核响应时限、非工作时间、冷却/重试/升级参数；提出默认值和影响 | Behavior confirmed in SPEC/PLAN Review(approval); real personnel, channels, and service hours are configured by the business owner before the pilot<br>SPEC/PLAN 评审确认行为；真实人员、渠道和服务时段由业务负责人在试点前配置 |
| O04 | Access, retention, Archive, and legal hold<br>访问、留存、归档与法律保全 | Preserve the Section 5 permission boundaries, propose retention/deletion/legal-hold processes and a permission matrix; additional full-history access must be justified, not opened unilaterally<br>保持第5节权限边界，提出留存/删除/保全流程及权限矩阵；额外完整历史访问须说明必要性，不自行开放 | Decided by the user/legal and business owners; related behavior settled in the SPEC Review(approval), implemented before real data is connected<br>用户/法律及业务负责人决定；相关行为在 SPEC 评审中确定，真实数据接入前落实 |
| O05 | External vendors and data processing<br>外部供应商及数据处理 | Verify the processing terms and compatibility of Kimi (Moonshot AI, user-designated), the authentication component, and the email vendor (SMS vendor in P1); design replaceable interfaces and test doubles<br>核查 Kimi（Moonshot AI，用户已指定）及认证组件、邮件供应商的处理条件与兼容性（短信供应商 P1）；设计可替换接口和测试替身 | The user selects vendors and data-processing arrangements; drafts and approved mock development may proceed before selection, with terms and authorization settled before real calls<br>用户选定供应商与数据处理安排；未选定可做草案及经批准的模拟开发，真实调用前落实条件与授权 |
| O06 | SPEC-level numeric values and support-scope definitions<br>SPEC 级数值和支持范围定义 | Keep the 20 MB baseline; the 20-page and DOCX-element definitions move to P1 with R08; define Verification Code (OTP)/session parameters, semantic False Block / Missed Block thresholds, and test determination rules<br>保留 20 MB 基线；20 页与 DOCX 元素定义随 R08 移至 P1；定义验证码/会话参数、语义误拦漏拦阈值及测试判定 | Kimi provides testable definitions, confirmed in the SPEC Review(approval); resolve before the related implementation—baselines must not be silently loosened<br>Kimi 给出可测试定义，随 SPEC 评审确认；相关实现前解决，不能静默放宽基线 |
| O07 | Real-device, network, and language-quality evidence<br>真机、网络与语言质量证据 | Design and execute usable tests; when Chinese–Vietnamese networks or bilingual reviewers are lacking, explicitly list the resources that must be provided (the real +86/+84 number requirement moves to P1 with phone registration)<br>设计并执行可用的测试；缺中越网络或双语审阅人时明确列出需提供的资源（真实 +86/+84 号码需求随手机注册移至 P1） | Kimi compiles the evidence; the user provides the necessary test resources/authorization; complete before real-pilot acceptance—simulated results are no substitute<br>Kimi 汇总证据，用户提供必要测试资源/授权；真实试点验收前完成，模拟结果不替代 |
| O08 | Recovery and availability<br>恢复与可用性 | Design Backup and Restore per the Section 10 targets and run drills; if a higher standard is needed, state the impact and submit an enhancement plan<br>按第10节目标设计备份/恢复并做演练；如需更高标准，说明影响后提交增强方案 | Implemented by the operations owner, with the user confirming necessary adjustments; meet the target before the real-case pilot<br>运维负责人落实，用户确认必要调整；真实案件试点前达标 |

Handling principles: complete verifiable items first, then raise a small number of business questions with recommended answers, rationale, and impact; when environment information is unavailable, state the gap explicitly and do not fabricate. Mark each item's dependencies and resolution status in SPEC.md/PLAN.md. Pause only the actions that depend on unresolved items and continue unaffected work; write no business code before SPEC/PLAN Review(approval), and do not claim launch readiness before real pilot conditions are met.

处理原则：先完成可核查事项，集中提出少量带推荐答案、理由和影响的业务问题；环境信息不可得时明确缺口，不编造。每项在 SPEC.md/PLAN.md 标注依赖及解决状态。只暂停依赖未决项的动作，继续不受影响的工作；SPEC/PLAN 未评审前不写业务代码，真实试点条件未满足前不宣称可以上线。

## Appendix: Sources, Versions, and Verification Records / 附：来源、版本与验证记录

- The official sources herein were consulted on 2026-09-30 during proposal preparation; the original links are kept for re-checking at implementation time. This round is a documentation-status and wording revision; networks were not re-measured, vendor accounts were not verified, and no new legal-applicability opinion was formed.
- 本文官方来源在方案准备阶段于 2026-09-30 查阅；保留原始链接供实施时复核。本次为文档状态与表达修订，未重新测量网络、验证供应商账户或形成新的法律适用意见。
- The v0.3 original draft has been backed up as-is to archive/2026-09-30-before-sow-v1/SOW.v0.3.md; old versions are for traceability only. The current version clarifies the approved scope, technical defaults, design targets, and Open Items, keeping R01–R11 and AC01–AC12.
- v0.3 原稿已原样备份至 archive/2026-09-30-before-sow-v1/SOW.v0.3.md；旧版仅用于追溯。当前版本明确已批准范围、技术默认值、设计目标与待落实事项，保留 R01–R11 及 AC01–AC12。
- Fact note (2026-10-01): the above archive/ backup directory has not been uploaded to the VPS project directory; for now this document alone is authoritative. If traceability is needed, the user will provide it; this does not block work.
- 事实标注（2026-10-01）：上述 archive/ 备份目录未上传至 VPS 项目目录，当前仅以本文件为准；如需追溯再由用户提供，不阻塞工作。
- v1.1 change log (2026-10-01, confirmed by the user via item-by-item questions Q1–Q8; all are clarifying revisions that did not change the substantive scope of R01–R11 and AC01–AC12):
- v1.1 变更记录（2026-10-01，经逐条提问由用户确认 Q1–Q8；均为澄清性修订，未改动 R01–R11 与 AC01–AC12 的实质范围）：
  - Q1 revision method: clarifying v1.1 only; the approved scope is not rewritten.
  - Q1 修订方式：仅作澄清性 v1.1，不重写已批准范围。
  - Q2 terminology unification: "designated coordinator/reviewer" and "designated review personnel" are unified as "Case Coordinator"; Review is one allocation dimension of the coordinator's duties, and management and Review of the same Case may be assigned to different coordinators (2.2, 5.2, R10).
  - Q2 术语统一：「指定协调员/审核员」「指定审核人员」统一为「案件协调员」，审核为其职责的一种分配维度，同一案件管理与审核可分配给不同协调员（2.2、5.2、R10）。
  - Q3 Case Coordinators do not participate in Case chat by default; communication with authors goes through return reasons, appeal replies, and system notifications (2.2, 5.2).
  - Q3 协调员默认不作为案件聊天参与方，与作者沟通经退回原因、申诉回复与系统通知（2.2、5.2）。
  - Q4 no message read receipts are provided to the other party; unread counts are visible only to oneself; Urgent Alert reach uses "In-app Confirmation" as the primary evidence (new term in 2.2, R04).
  - Q4 不向另一方提供消息已读回执；未读数仅本人可见；紧急提醒触达以「站内确认」为主要证据（2.2 新增术语、R04）。
  - Q5 account roles are globally unique (Client/Lawyer/Case Coordinator/System Operations Administrator); Case membership is granted within the role (5.2).
  - Q5 账号角色全局唯一（客户/律师/案件协调员/系统运维管理员），案件成员资格在角色内授予（5.2）。
  - Q6 unaccepted invitations can be revoked; resending generates a new code and invalidates the old code at the same time; revocation/resending is recorded in the Audit Trail (R01).
  - Q6 未接受的邀请可撤销；重发生成新码且旧码同时失效；撤销/重发入审计（R01）。
  - Q7 fact note on the missing archive backup (this appendix).
  - Q7 archive 备份缺失的事实标注（本附录）。
  - Q8 the "User" term is revised to allow linking one or more verified Registered Contact Channels, and merging accounts based on name alone is forbidden (2.2).
  - Q8「用户」术语修订为可关联一个或多个已验证注册联系方式，禁止仅凭姓名合并账号（2.2）。
- v1.2 change log (2026-10-01, user-designated): the preferred translation-LLM evaluation candidate was changed from DeepSeek to Kimi (Moonshot AI) (6.3, O05); this is a vendor selection and does not change scope, acceptance, or privacy requirements.
- v1.2 变更记录（2026-10-01，用户指定）：翻译 LLM 首选评测候选由 DeepSeek 改为 Kimi（Moonshot AI）（6.3、O05）；属供应商选择，不改变范围、验收与隐私要求。
- v1.3 change log (2026-10-01, user decision): the test environment is set to Tencent Cloud Shanghai Lighthouse (124.223.13.137, ap-shanghai); the instance's original services (the PT-MGMT project's Postgres/Redis containers, two proxy scripts, and the ngrok tunnel) were all cleared with the user's authorization, and the firewall was hardened to allow only 22/80/443. During testing, two entry points are provided: ① a jump link on a page of the main site vietnamlawyers.ai; ② direct IP access. **Constraint: before ICP filing is complete, the access address may only use the http://IP:port form**—pointing vietnamlawyers.ai (including subdomains) at a mainland instance's ports 80/443 would be blocked by Tencent Cloud as unfiled, so the main-site jump link may also only point to IP:port; direct IP access has no valid TLS, so testing is limited to fictional data, and HTTPS must be restored before any real data is connected. The production route (mainland filing vs Hong Kong/Singapore) remains to be decided after filing progress and the AC10 network verification (O02; see also SPEC Section 16).
- v1.3 变更记录（2026-10-01，用户决定）：测试环境定为腾讯云上海 Lighthouse（124.223.13.137，ap-shanghai）；实例原有服务（PT-MGMT 项目的 Postgres/Redis 容器、两个代理脚本与 ngrok 隧道）已按用户授权全部清除，防火墙加固为仅放行 22/80/443。测试期提供两种入口：①主站 vietnamlawyers.ai 页面上的跳转链接；②直接 IP 访问。**约束：ICP 备案完成前，访问地址只能用 http://IP:端口 形式**——vietnamlawyers.ai（含子域名）指向境内实例 80/443 会被腾讯云按未备案拦截，故主站跳转链接也只能指向 IP:端口；IP 直连无有效 TLS，测试仅限虚构数据，任何真实数据接入前必须恢复 HTTPS。生产路线（境内备案 vs 香港/新加坡）仍待备案进展与 AC10 网络验证后确定（O02，另见 SPEC 第16节）。
- v1.4 change log (2026-10-01, based on the user's review file 2026OCT1-REVIEW.md; principle: launch the MVP as soon as possible, do not implement non-essential features):
- v1.4 变更记录（2026-10-01，依据用户评审文件 2026OCT1-REVIEW.md；原则：MVP 尽快上线、不实现非必要功能）：
  1. Language scope clarified as Chinese (Simplified/Traditional), Vietnamese, English (R05, 6.1).
  1. 语言范围明确为中文（简体/繁体）、越南语、英语（R05、6.1）。
  2. MVP uses email registration only; phone-number verification-code registration (+86/+84) and SMS notifications move to P1 (R01, R09, R10, Section 9, 9.1, AC01, AC08, AC12, O03, O05, O07).
  2. MVP 仅邮箱注册；手机号验证码注册（+86/+84）与短信通知移 P1（R01、R09、R10、第9节、9.1、AC01、AC08、AC12、O03、O05、O07）。
  3. The Cross-case Mix-up Prevention UI (R03's list/persistent indicator/switching isolation) moves to P1; server-side per-Case permission isolation checks are retained (R03, AC09).
  3. 防串案界面（R03 的列表/常驻标识/切换隔离）移 P1；服务端按案件隔离的权限检查保留（R03、AC09）。
  4. Retainer-fee semantic detection narrowed: only explicit fee inquiries/negotiations trigger Pending Review, and ambiguous content passes by default (R06, 7.1, AC05); deterministic check rules such as contact information remain unchanged.
  4. 委托费用语义检测收窄：仅显式费用问询/协商触发待审，模糊内容默认放行（R06、7.1、AC05）；联系方式等确定性检查规则维持不变。
  5. Document translation (R08 simple DOCX bilingual) moves to P1; in the MVP, document translation is handled by the participants themselves (R08, Section 8, AC07, 4.3, O06).
  5. 文档翻译（R08 简单 DOCX 双语）移 P1；MVP 文档翻译由参与方自行解决（R08、第8节、AC07、4.3、O06）。
  6. Case Coordinators may participate and speak in chat (replacing v1.1 Q3), and their messages are likewise subject to content checks and Audit Trail (2.2, 5.2).
  6. 协调员可参与聊天并发言（取代 v1.1 Q3），其消息同样接受内容检查与审计（2.2、5.2）。
  7. The System Operations Administrator uses a dedicated account, not shared with roles such as Case Coordinator (5.2, R11).
  7. 系统运维管理员使用专门账号，不与协调员等角色共用（5.2、R11）。
- v1.5 change log (2026-10-01, user decision): added the P1 feature "Daily Case Digest email"—every day at 24:00 Vietnam time, the day's conversation records and corresponding uploaded attachments are emailed to all Vietnamese Lawyers of the Case (a Case Coordinator can turn off receipt per Lawyer) and to the Case Coordinators, for their reference; the subject is "Case Name-Send Date-Record" (e.g. DG-Juyang-2026OCT8-Record), and the Case name is mandatory when creating the Case and inviting both parties (4.3; see SPEC Section 10.3 REQ-DIG, PLAN T13 for details). v1.6 tightens "the day's uploads" to published content of the previous Vietnamese calendar day; it does not change the user's recipient or schedule decision.
- v1.5 变更记录（2026-10-01，用户决定）：新增 P1 功能「案件日报邮件」——每日越南时间 24:00 将当日对话记录与对应上传附件以邮件发送给本案全部越南律师（协调员可按律师关闭接收）与协调员，供其参考；标题为「案件名称-发送日-Record」（如 DG-Juyang-2026OCT8-Record），案件名称在创建案件并邀请双方时必填（4.3；详见 SPEC 第10.3节 REQ-DIG、PLAN T13）。v1.6 将「当日上传」收紧为上一越南日历日的已发布内容，不改变用户对收件人与时刻的决定。
- v1.6 change log (2026-10-01, documentation consistency review; no new product scope): see CURSOR_REVIEW.md. Summary: header no longer claims that v1.1-only wording is the whole status; Section 1 login channel matches MVP email; Section 2.2 terms synced with GLOSSARY including digest, bilingual document, administrator, and retainer fees; digest text matches SPEC (published content, previous calendar day); publish order matches the waiting-prompt rule and forbids translation before approval; scan failure is `check_failed` plus a content-free alert; peer-urgent final failure notifies the Coordinator; UI dictionaries include English; MVP workers exclude DOCX conversion; phase table shows T01 done / T02 next; AC03 names the English and Traditional Chinese automated coverage; P0 task count is stated as 11.
- v1.6 变更记录（2026-10-01，文档一致性复核；无新的产品范围）：详见 CURSOR_REVIEW.md。摘要：文首不再把仅适用于 v1.1 的句子写成全部状态；第 1 节登录渠道与 MVP 邮箱一致；第 2.2 节术语与 GLOSSARY 同步，包括日报、双语文档、管理员与委托费用；日报表述与 SPEC 一致（已发布内容、上一日历日）；发布顺序与等待提示规则一致，并禁止未批准就翻译；扫描失败为 `check_failed` 加不含正文的告警；用户间紧急提醒最终失败时通知协调员；界面字典包含英语；MVP worker 不含 DOCX 转换；阶段表标明 T01 已完成、下一项 T02；AC03 写明英语与繁体的自动化覆盖；P0 任务数写明为 11。
- v1.7 change log (2026-10-01, user decision on the CURSOR_REVIEW.md questions): the review defaults are confirmed, except sole-reviewer self-release. Clients default to Simplified Chinese and Lawyers to Vietnamese, with Traditional Chinese and English selectable. Invitation codes stay unbound to an email address. Review timers run 24 hours by elapsed clock; a business-hours calendar stays P1. The HTTP test origin may omit the `Secure` cookie flag and uses fictitious data only. When the author is the only reviewer and no backup Coordinator is configured, the system prompts them; explicit confirmation publishes that held message or file and is audited. If another reviewer or a backup Coordinator exists, the author still cannot release their own held item. Git history was not rewritten.
- v1.7 变更记录（2026-10-01，用户对 CURSOR_REVIEW.md 问题的决定）：复核中的默认值均确认，唯独「唯一审核人自行放行」按用户改写。客户默认简体中文，律师默认越南语，可选繁体与英语。邀请码不绑定邮箱。审核计时按连续时钟全天运行，工作时间日历仍为 P1。HTTP 测试入口可以不带 `Secure` Cookie，且仅使用虚构数据。作者是唯一审核人且未配置备用协调员时，系统向其提示；明确确认后发布被拦住的消息或文件，并记入审计。若还有其他审核人或备用协调员，作者仍不能放行自己被拦住的内容。未改写 Git 历史。
- The user has decided that development takes place on the VPS; local records do not represent the VPS's files, configuration, or execution results. Kimi's progress and session files must reflect actual remote work.
- 用户已确定在 VPS 上进行开发；本地记录不代表 VPS 的文件、配置或执行结果。Kimi 的进度与会话文件必须反映实际远端工作。
- This round installed no dependencies, wrote no code, deployed nothing, and sent no external notifications. A documentation consistency check is not equivalent to product testing or launch acceptance.
- 本次未安装依赖、编码、部署或发送外部通知。文档一致性检查不等同于产品测试或上线验收。
