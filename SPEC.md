# SPEC.md — Requirements Specification: China–Vietnam Multilingual Case Communication System / 中越多语言案件沟通系统 需求规格

- Version: 0.9 | Date: 2026-10-03
- 版本：0.9｜日期：2026-10-03
- Basis: SOW.md v1.11. Activation is one step: the invited email plus the activation code. The code is bound to that email, the Case, and the role (REQ-AUTH-01, REQ-AUTH-12). The repository implements this path. A later sign-in from a new browser still uses the email OTP.
- 依据：SOW.md v1.11。激活是一步：受邀邮箱加上激活码。激活码绑定该邮箱、案件与角色（REQ-AUTH-01、REQ-AUTH-12）。本仓库已按此实现。激活码用过之后，新浏览器再次登录仍用邮箱验证码。
- Status conventions: "MVP" = P0 acceptance scope; "P1/P2" = later versions, recorded only, not implemented.
- 状态约定：「MVP」= P0 验收范围；「P1/P2」= 后续版本，仅记录不实现。
- Numbering conventions: REQ-<domain>-NN denotes behavioral requirements; see Section 13 for the data model, Section 14 for the API, and Section 16 for pending parameters.
- 编号约定：REQ-<域>-NN 为行为需求；数据模型见第13节；API 见第14节；待决参数见第16节。
- Parameter tags: [O0x] = Open Items in SOW Section 14. Values marked as recommended defaults are the working values for implementation. Real personnel, legal retention, and vendor data-processing terms stay open until the phase named in Section 16.
- 参数标记：[O0x] = SOW 第14节待落实项。标为推荐默认值的参数就是实现时使用的工作值。真实人员、法律留存和供应商数据处理条件，仍按第16节所列阶段保持未决。

## 1. Scope / 范围

### 1.1 MVP (P0) / MVP（P0）

Invitation-based Registration and login (**MVP: email Verification Code (OTP) only**, v1.4), Case and member management (server-side per-Case permission isolation; the full Cross-case Mix-up Prevention UI moves to P1), two-way text chat (HTTP send + SSE receive), conversation translation (languages: Simplified/Traditional Chinese, Vietnamese, English; automatic/manual modes; **document translation not included**), content publish control (deterministic rules + semantic judgment of explicit Litigation Retainer Fees inquiries + manual Review), file sharing and download (PDF/DOCX/JPG/PNG, ≤20MB), two-way Urgent Alerts (**email channel**), Review console and Case Coordinator automatic Urgent Alerts (**email**), Permission Revocation/Archive/administrator MFA (**dedicated administrator accounts**)/Audit Trail/Backup and Restore.

邀请式注册登录（**MVP 仅邮箱验证码**，v1.4）、案件与成员管理（服务端按案件隔离权限；完整防串案界面移 P1）、双向文字聊天（HTTP 发送 + SSE 接收）、对话翻译（语言：中文简/繁、越南语、英语；自动/手动模式；**不含文档翻译**）、内容发布控制（确定性规则＋显式委托费用问询语义判断＋人工审核）、文件分享下载（PDF/DOCX/JPG/PNG，≤20MB）、双向紧急提醒（**邮件渠道**）、审核后台与协调员自动紧急提醒（**邮件**）、权限撤销/归档/管理员 MFA（**独立管理员账号**）/审计/备份恢复。

### 1.2 Later Versions (not implemented in MVP) / 后续版本（不进入 MVP 实现）

- P1: phone-number Verification Code (OTP) registration (+86/+84) and SMS notification channel, simple DOCX Bilingual Parallel Document (original R08), full Cross-case Mix-up Prevention UI, **Daily Case Digest email (REQ-DIG, added in v1.5)**, PDF text/OCR translation, table and header/footer handling, glossary and translation proofreading, more notification channels and advanced escalation policies.
- P1：手机号验证码注册（+86/+84）与短信通知渠道、简单 DOCX 双语对照（原 R08）、完整防串案界面、**案件日报邮件（REQ-DIG，v1.5 新增）**、PDF 文本/OCR 翻译、表格与页眉页脚处理、术语表与译文校订、更多通知渠道与高级升级策略。
- P2: more languages/countries/service industries, multiple operating organizations, voice and video, WeChat/Zalo integration.
- P2：更多语言/国家/服务行业、多运营机构、语音视频、WeChat/Zalo 集成。

### 1.3 Explicitly Excluded (not in MVP) / 明确排除（MVP 不做）

Native apps, stranger search, free exchange of contact details, online payment, e-signing, automated legal opinions, automated court filing, end-to-end encryption commitments, absolute anti-circumvention commitments, message read receipts (v1.1 Q4).

原生 App、陌生人搜索、自由交换联系人、在线支付、电子签约、自动法律意见、自动法院提交、端到端加密承诺、绝对防绕过承诺、消息已读回执（v1.1 Q4）。

## 2. Roles and Permission Matrix (REQ-PM) / 角色与权限矩阵（REQ-PM）

Corresponds to SOW 5.2, R02; acceptance AC02. v1.1 Q2 unified the reviewer into the Case Coordinator, and Q5 makes the account role globally unique. v1.4 supersedes v1.1 Q3: a Case Coordinator may speak in an assigned Case. The sentences below are the current rules.

对应 SOW 5.2、R02；验收 AC02。v1.1 Q2 将审核人员并入案件协调员，Q5 规定账号角色全局唯一。v1.4 取代 v1.1 Q3：案件协调员可以在所分配案件中发言。以下各条为当前规则。

| ID / 编号 | Requirement / 需求 |
| --- | --- |
| REQ-PM-01 | All business APIs enforce permission checks on the server side; hiding elements on the frontend does not constitute a security measure.<br>全部业务 API 在服务端执行权限检查；前端隐藏不构成安全措施。 |
| REQ-PM-02 | Account roles are globally unique: Client / Lawyer / Case Coordinator / System Operations Administrator; an account holds only one role at any time; Case membership is granted within that role.<br>账号角色全局唯一：客户 / 律师 / 案件协调员 / 系统运维管理员，同一时间只具一种角色；案件成员资格在该角色内授予。 |
| REQ-PM-03 | Client members: may only access published messages/files of authorized and non-revoked Cases and their own notification settings; cannot see other Cases, the counterparty's Registered Contact Channel, or Pending Review content.<br>客户成员：仅可访问已授权且未撤销案件的已发布消息/文件与自己的通知设置；不可见其他案件、对方注册联系方式、待审内容。 |
| REQ-PM-04 | Lawyer members: may access multiple authorized Cases, maintain approved Client profiles, and submit case-creation applications; cannot search Clients platform-wide and cannot join Cases on their own.<br>律师成员：可访问已授权多个案件、维护获准客户资料、提交建案申请；不可搜索全平台客户、不可自行加入案件。 |
| REQ-PM-05 | Case Coordinator: may only access invitations, member management, Pending Review content, and Publish/Archive operations for assigned Cases. Management and Review are separate duty flags on the membership (`can_manage`, `can_review`); one person may hold both. A membership with `can_review` or `can_manage` may participate in that Case's chat and speak (v1.4). Those messages go through the same content checks and Audit Trail as any other member's messages. Coordinators cannot bulk-export account contact details. MVP has no cross-case export API; AC02's export check means any such route must return denial for a non-member, and shipping no export satisfies that check.<br>案件协调员：仅可访问所分配案件的邀请、成员管理、待审内容、发布与归档操作。管理与审核是成员关系上的两个职责标记（`can_manage`、`can_review`）；同一人可以同时持有。持有 `can_review` 或 `can_manage` 的成员可以参与该案件聊天并发言（v1.4）。这些消息与其他成员的消息一样接受内容检查与审计。协调员不可批量导出账号联系方式。MVP 不提供跨案件导出 API；AC02 的导出检查是指任何此类路由对非成员必须拒绝，不提供导出即满足该检查。 |
| REQ-PM-06 | System Operations Administrator: service health, configuration, and restricted administrative operations, requiring MFA; cannot browse Case content by default; emergency access must be authorized and audited.<br>系统运维管理员：服务健康、配置与受限管理操作，须 MFA；默认不能浏览案件正文；紧急访问须授权并审计。 |
| REQ-PM-07 | Background task services (translation/notification/file processing): read only the minimum fields needed to complete the task; cannot choose new notification recipients on their own.<br>后台任务服务（翻译/通知/文件处理）：仅读取完成任务所需的最少字段，不可自行选择新的通知接收人。 |
| REQ-PM-08 | Permission Revocation takes effect immediately: after revocation, new requests are denied, existing SSE connections are disconnected, and pending notification tasks and download authorizations re-check permissions (AC02/AC09).<br>权限撤销即时生效：撤销后新请求被拒绝、存量 SSE 连接断开、未完成通知任务与下载授权重新检查权限（AC02/AC09）。 |
| REQ-PM-09 | The Registered Contact Channel (email for MVP; phone number in P1) must not appear in any API response, page, notification body, or routine log visible to other participants.<br>注册联系方式（MVP 为邮箱；手机号 P1）不出现在任何对其他参与方可见的 API 响应、页面、通知正文或常规日志中。 |
| REQ-PM-10 | The System Operations Administrator logs in with a dedicated account (v1.4): it must not be shared with coordinator/Client/Lawyer accounts and must not join Case chats; administrative operations require MFA and are audited.<br>系统运维管理员使用专门账号登录（v1.4）：不得与协调员/客户/律师账号共用，不得加入案件聊天；管理员操作须 MFA 并审计。 |

## 3. Registration and Authentication (REQ-AUTH) / 注册与认证（REQ-AUTH）

Corresponds to R01; acceptance AC01. External channels are integrated via a replaceable EmailProvider interface (SmsProvider moves to P1 together with phone registration, v1.4); MVP development uses a mock Provider, and acceptance on real channels falls under O05/O07.

对应 R01；验收 AC01。外部渠道经 EmailProvider 可替换接口接入（SmsProvider 随手机注册移 P1，v1.4）；MVP 开发用模拟 Provider，真实渠道验收属 O05/O07。

| ID / 编号 | Requirement / 需求 |
| --- | --- |
| REQ-AUTH-01 | Participation for a Case Coordinator, Chinese Client, or Vietnamese Lawyer starts when an authorized person enters that person's email together with a Case and a role. The system sends one activation email only to that address. The activation code is single-use, expires in 7 days [O06], and is bound to that email, the Case, and the role (v1.11, MVP). Only that email can accept it. Acceptance is one step: the person enters that email and the code. There is no second 6-digit code for activation. Any browser can do this while the code is unused and unexpired. A different email is rejected. Unaccepted codes can be revoked immediately; resending generates a new code, invalidates the old one, and sends only to the same address; revocation and resending are audited (v1.1 Q6). Implemented in the repository.<br>案件协调员、中国客户或越南律师的参与资格，从被授权的人输入该人邮箱、案件与角色时开始办理。系统只向该地址发送一封激活邮件。激活码单次使用、7 天到期 [O06]，并绑定该邮箱、案件与角色（v1.11，MVP）。只有该邮箱可以接受。接受只做一步：本人输入该邮箱和激活码。激活不再另要 6 位验证码。激活码未使用且未过期时，任意浏览器都可以接受。其他邮箱被拒绝。未接受的激活码可立即撤销；重发生成新码、使旧码失效，并只发给同一地址；撤销与重发入审计（v1.1 Q6）。本仓库已实现。 |
| REQ-AUTH-02 | Activation itself does not use a 6-digit Verification Code (v1.11). After the activation code has been used, a later visit from a new browser signs in with a 6-digit email OTP on the already-activated email (REQ-AUTH-03). Phone OTP is P1 and is not an MVP path.<br>激活本身不使用 6 位验证码（v1.11）。激活码用过之后，新浏览器再次访问时，用已激活邮箱上的 6 位邮箱验证码登录（REQ-AUTH-03）。手机验证码属于 P1，不是 MVP 路径。 |
| REQ-AUTH-03 | Verification Code (OTP) parameters (MVP: email only; phone channel in P1): 6 digits, valid for 10 minutes, locked for 15 minutes after 5 wrong attempts, send rate 1 message per 60 seconds per channel, daily cap of 10 messages per channel [O06 recommended values].<br>验证码参数（MVP 仅邮箱；手机渠道 P1）：6 位数字、10 分钟有效、错误 5 次锁定 15 分钟、发送频率 1 条/60 秒/渠道、每日每渠道 10 条上限 [O06 推荐值]。 |
| REQ-AUTH-04 | (P1) Phone numbers are stored in E.164 format; only the +86 and +84 country-code whitelist is accepted.<br>（P1）手机号为 E.164 存储，仅接受 +86、+84 国家码白名单。 |
| REQ-AUTH-05 | Verification Codes (OTP) are stored as hashes; plaintext is never stored in the database or logs; a code is invalidated upon successful verification; replay, expiry, and cross-session use are all rejected.<br>验证码以哈希存储，明文不入库不入日志；验证成功即作废；重放、过期、跨会话使用均拒绝。 |
| REQ-AUTH-06 | Sessions: HttpOnly + SameSite=Lax Cookie; rolling validity of 7 days, expiring after 30 days of inactivity; logout invalidates the session server-side [O06 recommended values]. `Secure` is required whenever the site is served over HTTPS. The pre-ICP test entry is HTTP on an IP (SOW O02) and cannot set `Secure`; that exception is configuration-only, limited to fictitious data, and must be turned off before any real case data is connected (confirmed 2026-10-01).<br>会话：HttpOnly + SameSite=Lax Cookie；滚动有效期 7 天、30 天不活动失效；退出登录使会话服务端失效 [O06 推荐值]。站点经由 HTTPS 提供时必须带 `Secure`。备案前的测试入口是 IP 上的 HTTP（SOW O02），无法设置 `Secure`；该例外只存在于配置中，仅限虚构数据，接入任何真实案情前必须关闭（2026-10-01 确认）。 |
| REQ-AUTH-07 | Accepting an invitation code grants membership only in the Case and role named on that code. It does not grant any other Case. A user who has not accepted a code sees only an empty explanation.<br>接受邀请码只授予该码写明的案件与角色。不授予任何其他案件。尚未接受邀请码的用户只看到空状态说明。 |
| REQ-AUTH-08 | A user may link multiple verified channels (v1.1 Q8): binding a second channel requires completing Verification Code (OTP) verification for the new channel within an authenticated session; merging accounts based on name alone is prohibited. (MVP: email only; phone binding in P1)<br>用户可关联多个已验证渠道（v1.1 Q8）：绑定第二渠道须在已认证会话中对新渠道完成验证码验证；禁止仅凭姓名合并账号。（MVP 仅邮箱可用；手机绑定 P1） |
| REQ-AUTH-09 | Administrator accounts require TOTP MFA; administrative operations must not be performed without MFA configured; administrator accounts are independent of other roles and must not be shared (REQ-PM-10).<br>管理员账号强制 TOTP MFA；未配置 MFA 不得执行管理操作；管理员账号独立于其他角色，不得共用（REQ-PM-10）。 |
| REQ-AUTH-10 | Account recovery (rebinding email): offline confirmation by the coordinator + execution by the administrator, with the full process audited.<br>账号恢复（换绑邮箱）：协调员线下确认 + 管理员执行，全程审计。 |
| REQ-AUTH-11 | The System Operations Administrator is created only by a documented local bootstrap (seed or CLI), never by an activation email. The first administrator cannot call admin APIs until TOTP MFA is enrolled (REQ-AUTH-09). Later administrators are created only by an existing administrator. An activation email cannot grant `global_role=admin`.<br>系统运维管理员只由有记录的本地引导程序（种子数据或 CLI）创建，绝不由激活邮件创建。首个管理员在登记 TOTP MFA 之前不能调用管理 API（REQ-AUTH-09）。此后的管理员只能由已有管理员创建。激活邮件不能授予 `global_role=admin`。 |
| REQ-AUTH-12 | (MVP, v1.11) The same email joins another Case by accepting another activation code sent to that same email. The new code is also bound to that email, the new Case, and the role. Acceptance is one step on any browser while the code is unused and unexpired. It does not create a second account when the role matches. A different email cannot use the code. A different role cannot accept it. The repository implements this rule.<br>（MVP，v1.11）同一邮箱通过接受发给该邮箱的另一个激活码加入另一个案件。新码同样绑定该邮箱、新案件与角色。激活码未使用且未过期时，任意浏览器一步接受。角色相符时不创建第二个账号。其他邮箱不能使用该码。角色不符不能接受。本仓库已实现本条。 |

## 4. Case and Member Management (REQ-CASE) / 案件与成员管理（REQ-CASE）

Corresponds to R02/R03; acceptance AC02/AC09.

对应 R02/R03；验收 AC02/AC09。

| ID / 编号 | Requirement / 需求 |
| --- | --- |
| REQ-CASE-01 | The coordinator creates a Case, or approves a Lawyer's case-creation application. Required fields at creation: Case name (`title`, 1–80 characters, no line breaks), Client organization, and initial members. Reference number and alias are optional. A Lawyer registering Client profiles does not trigger automatic invitation or authorization. `title` is required in MVP (T03) because the user required a Case name when a Case is created; the P1 digest uses that same title as its subject prefix (REQ-DIG-04) and does not add a second naming step.<br>协调员创建案件，或审批律师的建案申请。创建时必填：案件名称（`title`，1–80 个字符，不含换行）、客户组织、初始成员。案号与别名可选。律师登记客户资料不触发自动邀请或授权。`title` 在 MVP（T03）即为必填，因为用户要求创建案件时填写案件名称；P1 日报使用同一标题作为邮件主题前缀（REQ-DIG-04），不再另设一次命名。 |
| REQ-CASE-02 | Membership is granted per Case (the role must match the account's global role, REQ-PM-02). A Coordinator with `can_manage` enters the participant email and role; the system sends the activation email in REQ-AUTH-01. Membership begins when that email accepts the code in one step (REQ-AUTH-12). The code is bound to that email. Coordinator invitations set `can_manage` and `can_review` (both default true; either may be turned off).<br>成员以案件为单位授予（角色须与账号全局角色一致，REQ-PM-02）。持有 `can_manage` 的协调员输入参与人邮箱与角色；系统按 REQ-AUTH-01 发送激活邮件。成员资格从该邮箱一步接受激活码时开始（REQ-AUTH-12）。激活码绑定该邮箱。协调员邀请同时设置 `can_manage` 与 `can_review`（默认均为真，可单独关闭）。 |
| REQ-CASE-03 | (P1, v1.4) Case list display: Client organization, reference number/alias, status, my unread count; sorted by most recent activity. MVP only needs a simple Case entry page (the pilot currently has only one Case).<br>（P1，v1.4）案件列表显示：客户组织、案号/别名、状态、本人未读数；按最近活动排序。MVP 提供简易案件进入页即可（试点当前只有一个案件）。 |
| REQ-CASE-04 | (P1, v1.4) The chat page permanently displays the current Case name and Client; drafts and pending attachments are stored on the client isolated by Case ID and are not carried over when switching Cases (AC09).<br>（P1，v1.4）聊天页常驻显示当前案件名称与客户；草稿与待传附件按案件 ID 隔离存于客户端，切换案件不带入（AC09）。 |
| REQ-CASE-05 | Archive: the coordinator sets a Case to archived; after archiving it is read-only, and new messages/files/alerts/translation requests are forbidden; the Archive operation is recorded in the Audit Trail.<br>归档：协调员将案件置为 archived；归档后只读，禁止新消息/文件/提醒/翻译请求；归档操作入审计。 |
| REQ-CASE-06 | Access to any Case resource (messages, files, translations, SSE streams, downloads, exports) is preconditioned on "the user being a valid member of that Case", re-validated on every request.<br>任何案件资源（消息、文件、译文、SSE 流、下载、导出）的访问都以「用户是该案件有效成员」为前置条件，每次请求重新校验。 |

## 5. Message and Publish Pipeline (REQ-MSG) / 消息与发布流水线（REQ-MSG）

Corresponds to R04/R06; acceptance AC02/AC03/AC05. Core principle: **content that has not been approved is never broadcast, never published in a revoke-later fashion, and never leaked through any interface**.

对应 R04/R06；验收 AC02/AC03/AC05。核心原则：**未经批准的内容不广播、不撤回式发布、不经任何接口泄漏**。

### 5.1 Message State Machine / 消息状态机

```
draft(客户端) → pending_check → checking
  ├─ 自动放行 → approved → published（接收方可见消息壳；译文按 5.2 异步，仅在源文已批准后入队）
  ├─ 疑似受限 → pending_review ─→ approved → published
  │                           ─→ returned（退回作者；修改后作为新消息重新进入流水线）
  │                           ─→ rejected（终态；作者见中性原因＋申诉入口）
  └─ 检查/模型故障 → check_failed（不发布；不含正文的告警给协调员；绝不默认发布）
```

Display rule after `published`: automatic mode shows a waiting prompt in the recipient's language until the Translated Text is `done`; it does not substitute the foreign Source Text. Original/manual mode shows the approved Source Text. `pending_review` and `check_failed` are never sent to the TranslationProvider.

`published` 之后的展示规则：自动模式在译文变为 `done` 之前只显示接收方语言的等待提示，不用外语源文代替。原文/手动模式显示已批准源文。`pending_review` 与 `check_failed` 绝不发给 TranslationProvider。

| ID / 编号 | Requirement / 需求 |
| --- | --- |
| REQ-MSG-01 | Fixed send order: authentication and membership validation → assign message ID → store in the restricted pending area → deterministic checks + semantic judgment → release or route to Review (SOW 6.2). Any step failure keeps the message pending; it is never published by default.<br>发送顺序固定：鉴权与成员校验 → 分配消息 ID → 存受限待处理区 → 确定性检查＋语义判断 → 放行或转审核（SOW 6.2）。任何一步故障都保持待处理，不默认发布。 |
| REQ-MSG-02 | Client submissions carry an Idempotency-Key. Uniqueness is `(case_id, author_id, idempotency_key)`. Repeated clicks and network retries do not produce duplicate messages (AC03).<br>客户端提交携带 Idempotency-Key。唯一约束为 `(case_id, author_id, idempotency_key)`。重复点击、网络重试不产生重复消息（AC03）。 |
| REQ-MSG-03 | Messages in pending_check / pending_review / check_failed states: invisible to the recipient in list, detail, SSE, and any future export or search interface. MVP does not ship full-text search or bulk export; the invariant still applies if either is added. The author sees "processing" or "pending review", never "received by the other party". `check_failed` is a distinct state from `pending_review`: it alerts the Coordinator (content-free) and stays unpublished until a later successful check or an explicit reject.<br>pending_check / pending_review / check_failed 消息：对接收方的列表、详情、SSE，以及将来的导出或搜索接口均不可见。MVP 不提供全文搜索或批量导出；若以后增加，本不变式仍然适用。作者看到「处理中」或「待审核」，不会看到「对方已收到」。`check_failed` 与 `pending_review` 是不同状态：它向协调员发送不含正文的告警，并保持不发布，直到随后检查成功或被明确拒绝。 |
| REQ-MSG-04 | No silent editing after published; corrections are made via a linked correction message, which also goes through the full pipeline.<br>published 后不静默编辑；更正通过关联的更正消息完成，更正消息同样走完整流水线。 |
| REQ-MSG-05 | Real-time push uses SSE; after a disconnection, the client backfills via HTTP incremental pull using the last received message ID, without relying on SSE for history.<br>实时推送用 SSE；断线后客户端凭最后收到的消息 ID 走 HTTP 增量拉取补齐，不依赖 SSE 补历史。 |
| REQ-MSG-06 | The author can see send status: received & processing / pending review / published / returned / rejected; "pending review" must never be displayed as "received by the other party".<br>作者可见发送状态：已接收处理中 / 待审核 / 已发布 / 被退回 / 被拒绝；不得把「待审核」显示为「对方已收到」。 |
| REQ-MSG-07 | Unread counts are maintained per Case and per recipient, visible only to the owner; no read receipts are provided to the other party (v1.1 Q4).<br>未读数按案件、按接收人维护，仅本人可见；不向另一方提供已读回执（v1.1 Q4）。 |
| REQ-MSG-08 | Message length limit: 4000 characters [O06 recommended value]; over-limit is rejected on both frontend and server side.<br>消息长度上限 4000 字符 [O06 推荐值]；超限前端与服务端双重拒绝。 |

### 5.2 Translation State Machine (message × target language) / 译文状态机（消息 × 目标语言）

```
queued → translating → done（译文版本发布）
  ├─ 超时/限流/格式异常 → failed（可重试；状态可见，不伪造成功）
  └─ 关键字段复核异常 → needs_review（人工校核；不展示存疑译文）
```

REQ-MSG-09: Translation status and Source Text publish status are persisted separately; in automatic mode, a waiting prompt in the local language is shown before the translation completes, without silently substituting another language (SOW 6.1).

REQ-MSG-09：译文状态与源文发布状态分离持久化；自动模式下译文完成前显示本地语言等待提示，不悄悄以另一种语言替代（SOW 6.1）。

REQ-MSG-10: On LLM timeout/rate-limit/format errors, keep the Source Text, mark as failed, and allow retry; the message must not be falsely shown as delivered, and unauthorized providers must not be switched to (AC04).

REQ-MSG-10：LLM 超时/限流/格式异常时保留源文、标记失败、可重试；不得误显示已送达或切换未授权供应商（AC04）。

## 6. Translation and Language (REQ-TR) / 翻译与语言（REQ-TR）

Corresponds to R05; acceptance AC03/AC04.

对应 R05；验收 AC03/AC04。

| ID / 编号 | Requirement / 需求 |
| --- | --- |
| REQ-TR-01 | Language scope: Chinese Simplified (`zh-Hans`), Chinese Traditional (`zh-Hant`), Vietnamese (`vi`), English (`en`) (v1.4). Clients default to `zh-Hans`; Lawyers default to `vi`; both can switch, including to `zh-Hant` or `en` (confirmed 2026-10-01; first login does not force a choice before these defaults). UI language, receiving language, and message original language are stored separately. Preferences are saved per account (Case-level override is P1). `zh-Hans` ↔ `zh-Hant` may use a deterministic converter and still creates a translation version; other pairs use TranslationProvider. The human evaluation set in REQ-TR-08 stays Chinese–Vietnamese; English and Traditional Chinese are covered by mock-provider automated tests, not by that 100-sample gate.<br>语言范围：简体中文（`zh-Hans`）、繁体中文（`zh-Hant`）、越南语（`vi`）、英语（`en`）（v1.4）。客户默认 `zh-Hans`，律师默认 `vi`；双方都可以切换，包括切换到 `zh-Hant` 或 `en`（2026-10-01 确认，首次登录沿用该默认值）。界面语言、接收语言、消息原始语言分开存储。偏好按账号保存（案件级覆盖属 P1）。`zh-Hans` ↔ `zh-Hant` 可以使用确定性转换，并仍然生成译文版本；其他语言对使用 TranslationProvider。REQ-TR-08 的人工评测集保持中越方向；英语与繁体中文由模拟供应商的自动化测试覆盖，不纳入那 100 条样本的门槛。 |
| REQ-TR-02 | Automatic translation mode: the Translated Text in the receiving language is shown by default; messages in the same language are not re-translated. Original/manual mode: the published Source Text is shown; clicking "Translate" on an individual message shows its Translated Text. Switching modes does not change any publish permissions.<br>自动翻译模式：默认显示接收语言译文，同语种消息不重复翻译。原文/手动模式：显示已发布原文，点击单条「翻译」后显示译文。切换模式不改变任何发布权限。 |
| REQ-TR-03 | The TranslationProvider interface is replaceable (Kimi/Moonshot AI is the preferred evaluation candidate designated by the user on 2026-10-01); every call records model name, model version, prompt version, and glossary version.<br>TranslationProvider 接口可替换（Kimi/Moonshot AI 为用户 2026-10-01 指定的首选评测候选）；每次调用记录模型名、模型版本、提示词版本、术语表版本。 |
| REQ-TR-04 | The Source Text must not be silently overwritten; translation revisions generate new versions, preserving the correspondence with the Source Text version.<br>源文不可静默覆盖；译文修订生成新版本，保留与源文版本的对应关系。 |
| REQ-TR-05 | Post-translation review: independently check key fields such as numbers, currencies, dates, parties, negations, and litigation claims; anomalies enter needs_review; an anomaly alert does not imply the whole passage is of acceptable quality.<br>译后复核：对数字、币种、日期、主体、否定词、诉讼请求等关键字段独立检查；异常进入 needs_review；异常提示不代表整段质量合格。 |
| REQ-TR-06 | Content sent to the LLM is minimized: no registered email/phone number, and the entire Case history is not attached by default.<br>发送给 LLM 的内容最小化：不含注册邮箱/手机号，不默认附带整个案件历史。 |
| REQ-TR-07 | Mixed-language messages can be flagged; users can correct the language detection result and trigger re-translation (generating a new translation version).<br>混合语言消息可标记；用户可纠正语言识别结果并触发重译（生成新译文版本）。 |
| REQ-TR-08 | Evaluation is separated: fixed mock responses verify business logic; the real model is evaluated on a dedicated Chinese–Vietnamese evaluation set (first round: ≥100 bidirectional translation samples + ≥100 allowed/restricted contrast samples, reviewed by bilingual personnel) [O07].<br>评测分离：固定模拟响应验证业务逻辑；真实模型用独立中越评测集（首轮 ≥100 条双向翻译样本＋≥100 条允许/受限对照样本，双语人员审阅）[O07]。 |
| REQ-TR-09 | TranslationProvider is called only after the Source Text is approved (automatic pass or Coordinator approval). `pending_review`, `returned`, `rejected`, and `check_failed` messages are not sent to the provider. A Coordinator's own messages follow this same rule.<br>只有源文已获批准（自动放行或协调员批准）之后才调用 TranslationProvider。`pending_review`、`returned`、`rejected`、`check_failed` 的消息不发给供应商。协调员自己的消息遵守同一规则。 |

## 7. Content Rules (REQ-MOD) / 内容规则（REQ-MOD）

Corresponds to R06, SOW Section 7; acceptance AC05.

对应 R06、SOW 第7节；验收 AC05。

| ID / 编号 | Requirement / 需求 |
| --- | --- |
| REQ-MOD-01 | Amount restrictions apply only to Litigation Retainer Fees: Case Amounts such as litigation claims, debts, losses, damages, settlements, and court fees are released, and are not blocked merely because numbers/currencies/the word "fees" appear.<br>金额限制仅针对诉讼委托费用：诉讼请求、债权、损失、赔偿、和解、法院诉讼费等案件金额放行，不因出现数字/币种/「费用」字样拦截。 |
| REQ-MOD-02 | Deterministic checks cover: emails, phone numbers (+86/+84 and local formats), WeChat/Zalo IDs, URLs, and QR-code payloads; accounting for character splitting, spaces, full-width characters, tone-less Vietnamese, and mixed-language variants. A hit on message body, quote, or file name/metadata moves that object to `pending_review` (not a silent drop, and not auto-publish). A hit on `display_name` rejects the save. Case-necessary third-party contacts are not auto-deleted; they sit in `pending_review` until a Coordinator publishes them under REQ-MOD-05.<br>确定性检查覆盖：邮箱、手机号（+86/+84 及本地写法）、WeChat/Zalo ID、URL、二维码载荷；考虑拆字、空格、全角、越南语无声调、混合语言变形。正文、引用或文件名/元数据命中时，该对象进入 `pending_review`（不静默丢弃，也不自动发布）。`display_name` 命中则拒绝保存。案件必需的第三方联系方式不自动删除；它们停在 `pending_review`，直到协调员按 REQ-MOD-05 发布。 |
| REQ-MOD-03 | Semantic judgment (LLM-assisted): **MVP triggers Pending Review only for explicit Litigation Retainer Fees inquiries/negotiations (e.g. "how much does your firm charge for this case"); vague or general content is released by default (v1.4)**; thresholds are calibrated on bilingual samples, and the model's self-reported confidence is not the sole basis.<br>语义判断（LLM 辅助）：**MVP 仅对显式委托费用问询/协商（如"这个案件你们律所收费多少"）触发待审，模糊或一般性内容默认放行（v1.4）**；阈值经双语样本标定，不以模型自报置信度为唯一依据。 |
| REQ-MOD-04 | Check coverage: body text, Translated Text, display names, quotes, file names, document properties/comments/revisions, headers and footers, notification bodies. MVP does not OCR text inside images. Image files still become visible to other participants only after Coordinator Review (REQ-FILE-05), so embedded text and QR images are covered by that human review rather than by an OCR claim. Channels that MVP cannot reliably inspect are closed or routed to manual review, not assumed safe by default.<br>检查范围覆盖：正文、译文、显示名、引用、文件名、文档属性/批注/修订、页眉页脚、通知正文。MVP 不对图片内文字做 OCR。图片文件仍只有在协调员审核之后才对其他参与方可见（REQ-FILE-05），因此内嵌文字和二维码图片由该人工审核覆盖，而不是由 OCR 承诺覆盖。MVP 无法可靠检测的通道关闭或转人工，不默认安全。 |
| REQ-MOD-05 | Third-party contact details necessary for the Case (courts, witnesses, opposing parties): not blanket-deleted; marked with their purpose and published under this Case's authorization after Review.<br>案件必需的第三方联系方式（法院、证人、对方当事人）：不一概删除，标记用途，经审核按本案授权发布。 |
| REQ-MOD-06 | Detection of restricted content split across multiple messages: identify suspicious patterns using limited Case context; MVP acknowledges this capability is limited and does not claim complete blocking.<br>分多条消息传递受限内容的检测：结合有限案件上下文识别疑点；MVP 承认该能力有限，不宣称完全阻断。 |
| REQ-MOD-07 | Restricted messages show the author a neutral reason and an appeal entry; interception must not be masked by fabricated translations.<br>被限制消息向作者显示中性原因与申诉入口；不用伪造译文掩盖拦截。 |
| REQ-MOD-08 | False Block / Missed Block rate thresholds are frozen on the evaluation set. After v1.4 narrowed the semantic trigger, MVP prioritizes a low False Block rate (recommended: False Block ≤3%, Missed Block for explicit fee inquiries ≤2%; Missed Block tolerance for vague scenarios to be recalibrated in P1); key-field errors are publish-blocking [O06 recommended values, frozen upon Review(approval)].<br>误拦率/漏拦率阈值在评测集上冻结。v1.4 收窄语义触发后 MVP 以低误拦为先（推荐：误拦 ≤3%、显式费用问询漏拦 ≤2%；模糊场景的漏拦容忍度在 P1 重新标定）；关键字段错误为发布阻断项 [O06 推荐值，随评审冻结]。 |

## 8. Files (REQ-FILE) / 文件（REQ-FILE）

Corresponds to R07, SOW Section 8; acceptance AC06.

对应 R07、SOW 第8节；验收 AC06。

### 8.1 File State Machine / 文件状态机

```
uploaded(私有隔离区) → scanning
  ├─ 扫描通过 → pending_review ─→ approved → published（共享副本可见/可下载）
  │                          ─→ rejected（终态，作者见中性原因）
  ├─ 扫描失败/超时/不可解析/加密 → check_failed（不发布；不含正文的告警；协调员可重试或拒绝）
  └─ 类型/大小不合规 → 上传即拒绝
```

| ID / 编号 | Requirement / 需求 |
| --- | --- |
| REQ-FILE-01 | Type whitelist: PDF, DOCX, JPG, PNG; real file-type detection (magic bytes) prevails, extensions are not trusted; single file ≤20MB.<br>类型白名单：PDF、DOCX、JPG、PNG；以真实文件类型检测（magic bytes）为准，不信扩展名；单文件 ≤20MB。 |
| REQ-FILE-02 | Uploads go directly into a private quarantine area; before Publish, the recipient must not obtain any part of the file via lists, preview thumbnails, object URLs, or APIs.<br>上传即入私有隔离区；发布前接收方不得通过列表、预览缩略图、对象地址或 API 获得文件任何部分。 |
| REQ-FILE-03 | Malicious content scanning and isolated parsing. Scan timeout, scan failure, or an encrypted/unparseable file moves to `check_failed`, not to `published` and not to an approved Pending Review result (AC06).<br>恶意内容扫描与隔离解析。扫描超时、扫描失败或加密/不可解析的文件进入 `check_failed`，不进入 `published`，也不变成已批准的待审结果（AC06）。 |
| REQ-FILE-04 | Originals are immutable: hash, uploader, and time are retained; shared copies/translated versions are stored separately and linked to the original; only the approved Published Version is displayed in chat.<br>原件不可变：保留哈希、上传人、时间；共享副本/译本单独存储并与原件关联；聊天中仅展示获准的发布版本。 |
| REQ-FILE-05 | All first-time externally published files are confirmed by the designated coordinator, including content, file name, embedded objects, and metadata; entering Pending Review triggers the coordinator automatic alert (REQ-NTF-07).<br>所有首次对外发布文件由指定协调员确认，含内容、文件名、嵌入对象、元数据；进入待审即触发协调员自动提醒（REQ-NTF-07）。 |
| REQ-FILE-06 | Downloads go through a server-authorized proxy, re-validating membership and publish status on every request; after Permission Revocation, old links/old authorizations are immediately invalidated (AC02/AC06); copies already downloaded locally cannot be retracted (stated explicitly in the product documentation).<br>下载经服务端授权代理、每次请求重新校验成员与发布状态；权限撤销后旧链接/旧授权立即失效（AC02/AC06）；已下载到本地的副本无法收回（在产品说明中明示）。 |
| REQ-FILE-07 | File names, document properties, comments, revisions, headers and footers are included in content checks (REQ-MOD-04).<br>文件名、文档属性、批注、修订、页眉页脚纳入内容检查（REQ-MOD-04）。 |
| REQ-FILE-08 | A file in `check_failed` is visible to the uploader and to Coordinators with `can_review` on that Case, and invisible to every other member. Entering `check_failed` registers a content-free alert (same transaction as the state change). The Coordinator may retry the scan or reject the file. There is no path from `check_failed` to `published` that skips a later successful scan plus REQ-FILE-05 Review.<br>`check_failed` 的文件对上传者以及该案持有 `can_review` 的协调员可见，对其他成员不可见。进入 `check_failed` 时在同一事务中登记不含正文的告警。协调员可以重试扫描或拒绝该文件。不存在从 `check_failed` 跳过后续成功扫描和 REQ-FILE-05 审核而到达 `published` 的路径。 |

## 9. Bilingual Documents (REQ-DOC) — All P1 (v1.4) / 双语文档（REQ-DOC）— 全部 P1（v1.4）

Corresponds to R08; acceptance AC07. **v1.4: the requirements in this section are moved to P1 as a whole; MVP does not implement document translation (Word/PDF etc. are handled by the participants themselves); the design below is retained for direct use when P1 starts.**

对应 R08；验收 AC07。**v1.4：本节需求整体移至 P1，MVP 不实现文档翻译（Word/PDF 等由参与方自行解决）；以下设计保留供 P1 启动时直接使用。**

| ID / 编号 | Requirement / 需求 |
| --- | --- |
| REQ-DOC-01 | Triggered by explicit user request; limited to DOCX files that are published or accessible with permission.<br>用户主动请求触发；仅限已发布或有权限访问的 DOCX 文件。 |
| REQ-DOC-02 | Supported scope: parseable simple DOCX paragraph text, ≤20 pages. Page count is based on the actual page count rendered by office components at conversion time; if rendering is impossible, a conservative judgment by paragraph/character count is used, and over-limit is explicitly rejected [O06].<br>支持范围：可解析的简单 DOCX 段落文本，≤20 页。页数按转换时用办公组件渲染的实际页数计算；无法渲染时按段落数/字符数保守判定，超限明确拒绝 [O06]。 |
| REQ-DOC-03 | Output: a Chinese–Vietnamese parallel DOCX of "Source Text + Translated Text" numbered by paragraph, preserving paragraph correspondence, source file version, translation version, and machine-translation marking.<br>输出：按段落编号的「源文＋译文」中越对照 DOCX，保留段落对应关系、源文件版本、译文版本与机器翻译标记。 |
| REQ-DOC-04 | Unsupported elements such as complex tables, footnotes, text boxes, and scanned images: explicitly reject automatic conversion or route to manual processing; must not silently omit them and then mark success (AC07). Per-paragraph count validation: source paragraph count = output paragraph-pair count; any mismatch is a failure.<br>复杂表格、脚注、文本框、扫描图等不支持元素：明确拒绝自动转换或转人工，不得静默遗漏后标记成功（AC07）。逐段计数校验：源段落数 = 输出段落对数，不一致即失败。 |
| REQ-DOC-05 | The generated parallel document is still a new file version and becomes visible to the other party only after the REQ-FILE-05 publish Review.<br>生成的对照文档仍是新文件版本，须走 REQ-FILE-05 发布审核后才向对方可见。 |
| REQ-DOC-06 | No commitment to replicating the original layout or legal certification (stated explicitly in the UI).<br>不承诺原版式复刻或法律认证（界面明示）。 |

## 10. Notifications (REQ-NTF) / 通知（REQ-NTF）

Corresponds to R09/R10, SOW Section 9; acceptance AC08/AC12. Two independent flows: user-to-user Urgent Alerts (A) and coordinator Review automatic alerts (B).

对应 R09/R10、SOW 第9节；验收 AC08/AC12。两条独立流程：用户间紧急提醒（A）、协调员审核自动提醒（B）。

### 10.1 Notification State Machine / 通知状态机

```
queued → submitted(供应商已接受) ─→ delivered（渠道支持回执时）
                               ─→ unknown（无回执/回执缺失）
                               ─→ failed（终态，可见，触发升级/备用渠道）
任意未终态 → cancelled（审核完成/权限撤销/案件归档时取消冗余提醒）
收件人登录确认 → in_app_confirmed（站内确认，独立于渠道状态记录）
```

| ID / 编号 | Requirement / 需求 |
| --- | --- |
| REQ-NTF-01 | Notifications are sent in the platform's name: they do not expose either party's email/phone number, do not attach chat content, attachments, or sensitive Case titles; the two parties are never placed in the same recipient list; the counterparty's address is never used as Reply-To; alert links only navigate, and accessing content still requires login and authorization.<br>通知由平台名义发送：不暴露双方邮箱/手机号，不附聊天正文、附件、敏感案件标题；不把双方放入同一收件人列表；不以对方地址作 Reply-To；提醒链接仅导航，访问内容仍需登录与授权。 |
| REQ-NTF-02 | User-to-user Urgent Alerts (A): the sender can only select authorized recipient members within the Case, and cannot enter arbitrary emails/phone numbers; MVP default channel = recipient's verified email (v1.4; phone/SMS channels and backup-channel mechanism in P1).<br>用户间紧急提醒（A）：发送人只能选择本案内被授权的接收成员，不能输入任意邮箱/手机号；MVP 默认渠道 = 收件人已验证邮箱（v1.4；手机/短信渠道及备用渠道机制 P1）。 |
| REQ-NTF-03 | Notification copy uses the recipient's language: neutral content of the kind "You have a Case pending; please log in to view it".<br>通知文案用收件人语言：「您有案件待处理，请登录查看」类中性内容。 |
| REQ-NTF-04 | Status distinction: queued / accepted by provider / confirmed delivered / delivery unknown / send failed / In-app Confirmed; provider acceptance ≠ user receipt; email open pixels are not used as proof of reading.<br>状态区分：已排队 / 供应商已接受 / 确认送达 / 送达未知 / 发送失败 / 站内已确认；供应商接受 ≠ 用户收到；不用邮件打开像素作为已读证明。 |
| REQ-NTF-05 | Deduplication and cooldown: repeated clicks for the same Case and same recipient within the cooldown window (recommended 10 minutes [O03]) keep only one valid notification task; failures are retried automatically (recommended 1/5/15-minute exponential backoff, at most 5 attempts [O03]); final failure is visible to the sender. On that final failure the system also sends a content-free notice to each Coordinator of the Case who has `can_review`, so delivery failure is not silent (SOW Section 9). The notice contains no message body and no contact address. MVP escalation uses elapsed time and does not wait for a business-hours calendar (that calendar is P1).<br>去重与冷却：同一案件同一接收人在冷却窗口内（推荐 10 分钟 [O03]）重复点击只保留一条有效通知任务；失败自动重试（推荐 1/5/15 分钟指数退避、最多 5 次 [O03]）；最终失败对发送人可见。进入最终失败时，系统还向本案每位持有 `can_review` 的协调员发送不含正文的通知，避免送达失败无声（SOW 第9节）。该通知不含消息正文，也不含联系地址。MVP 的升级按已流逝时间计算，不等待工作时间日历（该日历属于 P1）。 |
| REQ-NTF-06 | In-app Confirmation: after logging in, the recipient can confirm receipt of the alert within the Case; the time is recorded and linked to the notification task (AC08).<br>站内确认：收件人登录后可在案件内确认收到提醒，记录时间与通知任务关联（AC08）。 |

### 10.2 Coordinator Review Automatic Alerts (B) / 协调员审核自动提醒（B）

| ID / 编号 | Requirement / 需求 |
| --- | --- |
| REQ-NTF-07 | When content formally enters `pending_review`, the review task and one notification event per recipient are registered in the same database transaction. Recipients are the Case's Coordinators with `can_review`, each at their verified email (v1.4; SMS channel in P1). If the author is a reviewer and another reviewer or a configured backup Coordinator exists, skip the author and notify the others. If the author is the only reviewer and no backup Coordinator is configured, notify that author and show the in-app prompt in REQ-REV-06; do not treat this as an ownerless task. Design and acceptance target: the first notification submission attempt is completed within 30 seconds of Pending Review submission (an internal processing target, not a delivery promise).<br>内容正式进入 `pending_review` 时，在同一数据库事务中登记审核任务，并按接收人各登记一条通知事件。接收人是本案持有 `can_review` 的协调员，各自发到已验证邮箱（v1.4；短信渠道 P1）。若作者是审核人，且另有审核人或已配置备用协调员，则跳过作者并通知其他人。若作者是唯一审核人且未配置备用协调员，则通知该作者并显示 REQ-REV-06 的站内提示；这种情况不是无主任务。设计与验收目标：待审提交后 30 秒内完成第一次通知提交尝试（内部处理目标，非送达承诺）。 |
| REQ-NTF-08 | The notification content contains only "There is Case content pending review; please log in to handle it as soon as possible", a non-sensitive task identifier, and a link requiring login; no original message, fee content, or attachments are included.<br>通知内容仅含「有案件内容待审核，请尽快登录处理」、不敏感任务标识与需登录的链接；不附原消息、费用内容或附件。 |
| REQ-NTF-09 | The coordinator receiving the notification, opening the task, starting processing, and completing the Review are recorded separately; provider acceptance of the request is not considered Review completion.<br>协调员收到通知、打开任务、开始处理、完成审核分别记录；供应商接受请求不视为审核完成。 |
| REQ-NTF-10 | Each Pending Review item has an independent task and alert record; network retries use a deduplication key; consecutive uploads within a short time may be merged into notification batches, but the first item triggers immediately and subsequent to-dos must not be lost due to rate limiting.<br>每项待审内容独立任务与提醒记录；网络重试用去重标识；短时间连续上传可合并通知批次，但首项立即触发且不得因限流遗漏后续待办。 |
| REQ-NTF-11 | Failure retries (same parameters as REQ-NTF-05); timeout escalation: the review timeout threshold is configurable (recommended: escalate to a backup coordinator if not picked up in 30 minutes, escalate to the operations lead if unhandled for 2 hours [O03]); no timeout ever results in automatic release.<br>失败重试（同 REQ-NTF-05 参数）；超时升级：审核超时阈值可配置（推荐 30 分钟未接手升级备用协调员、2 小时未处理升级运营负责人 [O03]）；任何超时都不自动放行。 |
| REQ-NTF-12 | When no one is assigned or the notification channel is unavailable, the processing anomaly is visible to the backend and the submitter; a Pending Review task with no owner and no alert must never occur.<br>无人被分配或通知渠道不可用时，后台与提交人可见处理异常；不允许出现无负责人且无提示的待审任务。 |
| REQ-NTF-13 | Once the Review is completed, redundant alerts not yet sent are cancelled; the worker re-checks task status and coordinator permissions before sending.<br>审核完成即取消尚未发送的冗余提醒；worker 发送前重新检查任务状态与协调员权限。 |

### 10.3 Daily Case Digest Email (REQ-DIG, P1, added in v1.5) / 案件日报邮件（REQ-DIG，P1，v1.5 新增）

Corresponds to SOW 4.3 Daily Case Digest email; for the reference of Lawyers and coordinators.

对应 SOW 4.3 案件日报邮件；供律师与协调员参考。

| ID / 编号 | Requirement / 需求 |
| --- | --- |
| REQ-DIG-01 | Every day at 00:00 (Asia/Ho_Chi_Minh, UTC+7, i.e. what the user calls "24:00 Vietnam time"), a digest is generated per active Case: it aggregates **published** messages from the just-ended Vietnamese calendar day (sorted by time, including Source Text and published Translated Text) and the day's **published** attachments; pending-review/returned/rejected content is excluded; archived Cases are not sent.<br>每日 00:00（Asia/Ho_Chi_Minh，UTC+7，即用户所称「越南时间 24 点」）按活跃案件生成日报：汇总刚结束越南日历日内**已发布**的消息（按时间排序，含源文与已发布译文）与当日**已发布**的附件；待审/退回/拒绝内容不纳入；归档案件不发送。 |
| REQ-DIG-02 | Recipients: every active Lawyer member of the Case, plus every assigned Coordinator, each at their own verified email. Clients do not receive the digest. Mail is sent as one message per recipient so addresses are not visible to each other (REQ-PM-09). A recipient with no verified email is skipped and recorded on the digest run.<br>收件人：本案每位有效律师成员，加上每位已分配协调员，各自发到本人已验证邮箱。客户不接收日报。按收件人单独发送，地址互相不可见（REQ-PM-09）。没有已验证邮箱的收件人被跳过，并记入该次日报运行记录。 |
| REQ-DIG-03 | A Coordinator with `can_manage` can disable or restore digest receiving per Lawyer (`case_members.digest_opt_out`). The operation is audited. Coordinators themselves are not opted out by that flag. If the covered day has no newly published message and no newly published file, nothing is sent and the run is recorded as skipped. If every Lawyer is opted out and there is no Coordinator recipient, the run is skipped.<br>持有 `can_manage` 的协调员可按律师关闭或恢复日报接收（`case_members.digest_opt_out`）。该操作入审计。协调员本人不受该标记关闭。若所覆盖的那一日没有新发布的消息、也没有新发布的文件，则不发送，并把该次运行记为跳过。若每位律师都已关闭且没有协调员收件人，该次运行跳过。 |
| REQ-DIG-04 | Subject format: `{Case name}-{send date}-Record` (e.g. DG-Juyang-2026OCT8-Record). The Case name is mandatory when creating a Case and inviting both parties (REQ-CASE-01) and serves as the subject prefix; the send date follows Asia/Ho_Chi_Minh, formatted as: year + uppercase English month abbreviation + day (no leading zero, e.g. 2026OCT8).<br>标题格式：`{案件名称}-{发送日}-Record`（如 DG-Juyang-2026OCT8-Record）。案件名称在创建案件并邀请双方时必填（REQ-CASE-01），即标题前缀；发送日按 Asia/Ho_Chi_Minh，格式为：年＋英文月份缩写大写＋日（无前导零，如 2026OCT8）。 |
| REQ-DIG-05 | Published attachments are sent with the email. Recommended total size per email is ≤20MB [O06]. Overflow is split into part messages whose subjects append ` (n/m)`. Sending reuses the notification task queue with `kind=case_digest` and dedupe key `digest:{case_id}:{digest_date}:{user_id}:{part}`. Failure retries follow REQ-NTF-05; final failure is visible and alerts Coordinators. Each generation writes one `digest_runs` row (date, recipient ids, status, part count).<br>已发布附件随邮件发送。单封总大小推荐 ≤20MB [O06]。超出部分拆成多封，标题追加 ` (n/m)`。发送复用通知任务队列，`kind=case_digest`，去重键为 `digest:{case_id}:{digest_date}:{user_id}:{part}`。失败重试遵循 REQ-NTF-05；最终失败可见并告警协调员。每次生成写入一行 `digest_runs`（日期、收件人 id、状态、分卷数）。 |
| REQ-DIG-06 | The digest contains Case content and is sent only to the verified emails of authorized members of the Case; sending and disabling are recorded in the Audit Trail.<br>日报含案件内容，仅发本案授权成员的已验证邮箱；发送与关闭记录入审计。 |

## 11. Review Console (REQ-REV) / 审核后台（REQ-REV）

Corresponds to R10; acceptance AC12.

对应 R10；验收 AC12。

| ID / 编号 | Requirement / 需求 |
| --- | --- |
| REQ-REV-01 | Coordinators see only the Pending Review queue of their assigned Cases (messages and files in a unified queue, marked with type, Case, submitter display name, and entry time).<br>协调员仅见所分配案件的待审队列（消息与文件统一队列，标明类型、案件、提交人显示名、进入时间）。 |
| REQ-REV-02 | Operations: approve / return (with reason; the author may revise and resubmit as new content) / reject (with a neutral reason); all operations record the operator, time, and reason, and are entered into the Audit Trail.<br>操作：批准 / 退回（附原因，作者可修改后作为新内容重提）/ 拒绝（附中性原因）；全部记录操作人、时间、原因，入审计。 |
| REQ-REV-03 | After approval, content continues through the REQ-MSG / REQ-FILE pipelines to Publish; returned and rejected content shows nothing to the other party.<br>批准后内容按 REQ-MSG / REQ-FILE 流水线继续发布；退回与拒绝不向对方展示任何内容。 |
| REQ-REV-04 | Coordinators may participate in Case chat and speak (v1.4, superseding v1.1 Q3), to clarify misunderstandings between the parties; their messages are equally subject to content checks and Audit Trail. Review decisions must still be documented via return reasons/appeal replies, and appeals are handled as follow-up records of the original task.<br>协调员可参与案件聊天并发言（v1.4，取代 v1.1 Q3），用于澄清双方理解偏差；其消息同样接受内容检查与审计。审核决定仍须通过退回原因/申诉回复留痕，申诉作为原任务的后续记录处理。 |
| REQ-REV-05 | Content display within the review interface itself follows minimum necessity: the source text/files needed for review are visible, and other Case content is not expanded by default (full-history access is decided separately per O04).<br>审核界面本身的内容展示遵守最小必要：审核所需的原文/文件可见，其余案件内容不默认展开（完整历史访问按 O04 另行决定）。 |
| REQ-REV-06 | A Coordinator cannot approve, return, or reject their own message or file when another member with `can_review`, or a configured backup Coordinator, exists. That task is offered only to those other reviewers. When the author is the only reviewer and no backup Coordinator is configured (user decision 2026-10-01): the system prompts the author with the neutral hold reason; the item stays unpublished until the author explicitly confirms. Confirmation uses `POST /api/review/tasks/:id/approve` with `self_release=true`, then the item publishes, and the Audit Trail records that there was no backup reviewer. Dismissing the prompt leaves the item in `pending_review`. A timeout never confirms on their behalf. The same prompt applies to a file the sole Coordinator uploaded. Appeal remains a note on the original task (`POST /api/review/tasks/:id/appeal`) and does not publish the content.<br>存在其他持有 `can_review` 的成员或已配置的备用协调员时，协调员不能批准、退回或拒绝自己的消息或文件。该任务只提供给那些其他审核人。作者是唯一审核人且未配置备用协调员时（用户 2026-10-01 决定）：系统向作者提示中性的拦截原因；在作者明确确认之前，内容保持不发布。确认调用 `POST /api/review/tasks/:id/approve` 且 `self_release=true`，随后发布，并在审计中记下当时没有备用审核人。关闭提示则内容留在 `pending_review`。超时绝不能代为确认。唯一协调员自己上传的文件走同一提示。申诉仍是原任务上的一条记录（`POST /api/review/tasks/:id/appeal`），且不会发布该内容。 |

## 12. Security, Audit Trail, and Lifecycle (REQ-OPS) / 安全、审计与生命周期（REQ-OPS）

Corresponds to R11, SOW Section 10; acceptance AC09/AC11.

对应 R11、SOW 第10节；验收 AC09/AC11。

| ID / 编号 | Requirement / 需求 |
| --- | --- |
| REQ-OPS-01 | Audit Trail coverage: login/verification attempts, invitation creation/revocation/acceptance, membership changes, Permission Revocation, message Review decisions, sole-reviewer self-release (REQ-REV-06), appeals, file Publish/downloads, Urgent Alert sending and confirmation, Archive, administrative operations, and (P1) digest send and per-Lawyer opt-out. Records include operator, target, Case, time, and result — never message content, attachment bytes, or Verification Codes (OTP).<br>审计日志覆盖：登录/验证尝试、邀请创建/撤销/接受、成员变更、权限撤销、消息审核决定、唯一审核人自行放行（REQ-REV-06）、申诉、文件发布/下载、紧急提醒发送与确认、归档、管理员操作，以及（P1）日报发送与按律师关闭。记录包含操作者、目标、案件、时间、结果——不记正文、附件字节或验证码。 |
| REQ-OPS-02 | Routine logs record only IDs, statuses, durations, and error categories; never message content, Verification Codes (OTP), tokens, original documents, or Registered Contact Channels.<br>常规日志只记 ID、状态、耗时、错误类别；不记消息正文、验证码、令牌、原始文档、注册联系方式。 |
| REQ-OPS-03 | Archived Cases are read-only; unfinished notification tasks are re-checked and cancelled after archiving; Archive operations are auditable.<br>归档案件只读；归档后未完成的通知任务重新检查并取消；归档操作可审计。 |
| REQ-OPS-04 | Backup: encrypted, access-restricted, with periodic real restores to an isolated environment as drills; pilot design targets RPO ≤24h and RTO ≤8h, which must be validated by drills and must not be written as already-achieved commitments [O08].<br>备份：加密、访问受限、定期实际恢复到隔离环境演练；试点设计目标 RPO ≤24h、RTO ≤8h，须经演练验证，不写成已实现承诺 [O08]。 |
| REQ-OPS-05 | Keys are managed only via the deployment platform's secure configuration; they never enter the code repository, logs, or documents.<br>密钥只用部署平台安全配置，不进代码库、日志、文档。 |
| REQ-OPS-06 | Data retention periods, deletion, and legal hold rules are determined by the user/legal lead before the pilot [O04]; the SPEC does not assume them on its own.<br>数据保留期限、删除与法律保全规则在试点前由用户/法律负责人确定 [O04]；SPEC 不自行假定。 |
| REQ-OPS-07 | MVP completion includes a guide for the bootstrapped administrator (MFA already enrolled): create one fictitious test Case and enter three emails — Case Coordinator, Chinese Client, and Vietnamese Lawyer. The system sends an activation email to each address and to no one else. Each activation code is bound to that email, the Case, and the role. Acceptance is one step and shows that each recipient joins only that Case in the assigned role, and that the administrator is not added to the Case chat. Real personal addresses and real case facts are not used. A second Case for the same Lawyer email is proved in T02 (REQ-AUTH-12), not by this one-Case guide. The runbook describes this one-step acceptance.<br>MVP 完成包含给已引导创建、且已登记 MFA 的管理员的一份指引：创建一个虚构测试案件，并输入三个邮箱——案件协调员、中国客户、越南律师。系统向这三个地址各发一封激活邮件，不发给其他人。每个激活码都绑定该邮箱、案件与角色。接受只做一步，并表明每位收件人只以指定角色加入该案件，且管理员不被加入案件聊天。不使用真实个人地址和真实案情。同一律师邮箱加入第二个案件由 T02 证明（REQ-AUTH-12），不由这份单案件指引证明。现场操作指引描述这一步接受。 |

## 13. Data Model (Draft) / 数据模型（草案）

PostgreSQL; all business tables include created_at/updated_at; foreign keys and status enums are constrained in migrations. Only core tables and key fields are listed:

PostgreSQL；全部业务表含 created_at/updated_at；外键与状态枚举在迁移中约束。仅列核心表与关键字段：

| Table / 表 | Key Fields / 关键字段 | Notes / 说明 |
| --- | --- | --- |
| users | id, display_name, global_role, status, mfa_secret_ref, preferred_lang, ui_lang | Globally unique role (REQ-PM-02). `preferred_lang` is the receiving language; `ui_lang` is the interface language. `display_name` is rejected when it matches REQ-MOD-02<br>角色全局唯一（REQ-PM-02）。`preferred_lang` 是接收语言；`ui_lang` 是界面语言。`display_name` 命中 REQ-MOD-02 时拒绝保存 |
| contact_channels | id, user_id, type(email/phone), value_enc, value_hash, verified_at, is_primary, notify_enabled | Registered Contact Channels stored encrypted; invisible externally; MVP: email type only (v1.4)<br>注册联系方式加密存储；对外不可见；MVP 仅 email 类型（v1.4） |
| invites | id, code_hash, sent_to_enc, case_id, role, expires_at, used_at, revoked_at, created_by | Single-use. Bound to `sent_to_enc`, the Case, and the role. Acceptance compares the entered email to `sent_to_enc` (REQ-AUTH-01, REQ-AUTH-12).<br>单次使用。绑定 `sent_to_enc`、案件与角色。接受时把输入的邮箱与 `sent_to_enc` 比较（REQ-AUTH-01、REQ-AUTH-12）。 |
| otp_challenges | id, channel_id, code_hash, expires_at, attempts, locked_until | Verification Code (OTP) stored as hash<br>验证码哈希存储 |
| sessions | id, user_id, expires_at, last_active_at, revoked_at | Server-side invalidation supported<br>服务端可失效 |
| cases | id, title, ref_no, alias, client_org_name, status(active/archived), created_by | title = Case name, mandatory when creating and inviting both parties, digest email subject prefix (REQ-DIG-04)<br>title=案件名称，创建并邀请双方时必填，日报邮件标题前缀（REQ-DIG-04） |
| case_members | id, case_id, user_id, member_role, can_manage, can_review, status(active/revoked), revoked_at, digest_opt_out | Unique constraint (case_id, user_id). Coordinator rows use the two duty flags (REQ-PM-05); other roles keep both flags false. `digest_opt_out` is the per-Lawyer digest switch (REQ-DIG-03, P1)<br>唯一约束 (case_id, user_id)。协调员行使用两个职责标记（REQ-PM-05）；其他角色两个标记均为 false。`digest_opt_out` 是按律师关闭日报的开关（REQ-DIG-03，P1） |
| client_profiles | id, lawyer_id, name, note, status | Registered by Lawyers, not authorized<br>律师登记，未授权 |
| case_applications | id, lawyer_id, client_profile_id, summary, status, decided_by | Case-creation applications<br>建案申请 |
| messages | id, case_id, author_id, idempotency_key, source_lang, source_text, status, corrected_by_id | Unique (case_id, author_id, idempotency_key). State machine see 5.1<br>唯一约束 (case_id, author_id, idempotency_key)。状态机见 5.1 |
| translation_versions | id, message_id, target_lang, version, text, status, provider, model, prompt_version, key_field_check | State machine see 5.2<br>状态机见 5.2 |
| review_tasks | id, case_id, target_type(message/file), target_id, assignee_id, status, reason, escalation_level, decided_at | Pending Review tasks<br>待审任务 |
| files | id, case_id, uploader_id, status, orig_hash, storage_key, mime, size_bytes | Originals are immutable<br>原件不可变 |
| file_variants | id, file_id, kind(original/shared_copy/bilingual), version, storage_key, source_version | MVP migrations include `original` and `shared_copy` only. `bilingual` is added in P1 (T09)<br>MVP 迁移只包含 `original` 与 `shared_copy`。`bilingual` 在 P1（T09）加入 |
| docx_jobs | id, file_id, status, page_count, paragraph_count, error_code, output_variant_id | P1 only (T09). Not created by MVP migrations<br>仅 P1（T09）。MVP 迁移不建此表 |
| notification_tasks | id, kind(peer_urgent/review_alert/check_failed_alert/case_digest), case_id, recipient_channel_id, status, dedupe_key, attempts, next_retry_at, provider_ref, confirmed_at, cancelled_at | State machine see 10.1. `case_digest` is P1. `check_failed_alert` carries no body<br>状态机见 10.1。`case_digest` 属于 P1。`check_failed_alert` 不含正文 |
| audit_logs | id, actor_id, action, target_type, target_id, case_id, result, created_at, meta_json | No content/keys<br>不含正文/密钥 |
| digest_runs | id, case_id, digest_date, status, recipients_json, parts, error | Daily Case Digest sending records (REQ-DIG-05, P1)<br>案件日报发送记录（REQ-DIG-05，P1） |

## 14. API Overview (Draft) / API 概览（草案）

REST style; all endpoints enforce server-side authentication + Case membership validation; write operations support Idempotency-Key. Only endpoints are listed:

REST 风格，均在服务端鉴权＋案件成员校验；写操作支持 Idempotency-Key。仅列端点：

- Health (no auth, no case data): `GET /api/health`
- 健康检查（无需认证，不含案件数据）：`GET /api/health`
- Authentication: `POST /api/auth/otp/request`, `POST /api/auth/otp/verify`, `POST /api/auth/logout`, `POST /api/auth/channels` (bind a second email in MVP; phone binding is P1), `POST /api/auth/mfa/*`
- 认证：`POST /api/auth/otp/request`、`POST /api/auth/otp/verify`、`POST /api/auth/logout`、`POST /api/auth/channels`（MVP 绑定第二个邮箱；手机绑定为 P1）、`POST /api/auth/mfa/*`
- Invitations: `POST /api/cases/:id/invites` (body includes the participant email; sends the activation email; the code is bound to that email), `POST /api/invites/accept` (that email plus the code, one step, matching role; same account if the email already has one), `DELETE /api/invites/:id` (revoke), `POST /api/invites/:id/resend` (sends again only to the original address)
- 邀请：`POST /api/cases/:id/invites`（请求体包含参与人邮箱；发送激活邮件；激活码绑定该邮箱）、`POST /api/invites/accept`（该邮箱加上激活码，一步，角色相符；该邮箱已有账号则用同一账号）、`DELETE /api/invites/:id`（撤销）、`POST /api/invites/:id/resend`（只再次发给原地址）
- Cases: `GET /api/cases`, `POST /api/cases`, `GET /api/cases/:id`, `DELETE /api/cases/:id/members/:uid`, `POST /api/cases/:id/archive`, `POST /api/case-applications`. Adding a participant is `POST /api/cases/:id/invites` (email required).
- 案件：`GET /api/cases`、`POST /api/cases`、`GET /api/cases/:id`、`DELETE /api/cases/:id/members/:uid`、`POST /api/cases/:id/archive`、`POST /api/case-applications`。增加参与人使用 `POST /api/cases/:id/invites`（必须带邮箱）。
- Messages: `GET /api/cases/:id/messages?after=`, `POST /api/cases/:id/messages`, `GET /api/cases/:id/stream` (SSE), `POST /api/messages/:id/translate` (manual mode)
- 消息：`GET /api/cases/:id/messages?after=`、`POST /api/cases/:id/messages`、`GET /api/cases/:id/stream`（SSE）、`POST /api/messages/:id/translate`（手动模式）
- Files: `POST /api/cases/:id/files`, `GET /api/files/:id/download` (authorized proxy), `POST /api/files/:id/scan-retry` (reviewer, `check_failed` only). `POST /api/files/:id/bilingual` is P1 and is not implemented in MVP
- 文件：`POST /api/cases/:id/files`、`GET /api/files/:id/download`（授权代理）、`POST /api/files/:id/scan-retry`（审核人，仅 `check_failed`）。`POST /api/files/:id/bilingual` 属于 P1，MVP 不实现
- Notifications: `POST /api/cases/:id/urgent`, `GET /api/notifications`, `POST /api/notifications/:id/confirm`
- 通知：`POST /api/cases/:id/urgent`、`GET /api/notifications`、`POST /api/notifications/:id/confirm`
- Review: `GET /api/review/tasks`, `POST /api/review/tasks/:id/approve|return|reject` (`approve` accepts `self_release=true` only for REQ-REV-06), `POST /api/review/tasks/:id/appeal` (author note; does not publish)
- 审核：`GET /api/review/tasks`、`POST /api/review/tasks/:id/approve|return|reject`（仅 REQ-REV-06 的批准可以带 `self_release=true`）、`POST /api/review/tasks/:id/appeal`（作者附言；不发布）
- Administration: `GET /api/admin/audit-logs`, `POST /api/admin/test-cases` (REQ-OPS-07; body is title plus three fictitious emails; MFA-protected; does not add the administrator as a member)
- 管理：`GET /api/admin/audit-logs`、`POST /api/admin/test-cases`（REQ-OPS-07；请求体为案件名称加三个虚构邮箱；MFA 保护；不把管理员加为成员）

Invariants: no response may contain unpublished content or another party's Registered Contact Channel; pending/check_failed content is visible only to the author and coordinators with Review authority.

不变式：任何响应不得包含未发布内容、他方注册联系方式；pending/check_failed 内容仅作者与有审核权的协调员可见。

## 15. General Conventions for Errors, Retries, and Idempotency / 异常、重试与幂等通用约定

1. All external calls (LLM/email/SMS/storage/scanning) go through replaceable Provider interfaces, with timeouts, rate limits, and format errors recorded by category.
1. 所有外部调用（LLM/邮件/短信/存储/扫描）经可替换 Provider 接口，超时、限流、格式异常分类记录。
2. Write operations are idempotent: messages, files, and notifications are all deduplicated by unique keys; retries produce no duplicate side effects.
2. 写操作幂等：消息、文件、通知均以唯一键去重；重试不产生重复副作用。
3. Background tasks are persisted (database queue): replayed after crashes; workers re-validate status and permissions before execution.
3. 后台任务持久化（数据库队列）：崩溃后恢复重放；worker 执行前重新校验状态与权限。
4. Fail-safe by default: check failures stay pending and are never published by default; notification failures escalate and are never auto-released.
4. 故障默认安全：检查失败保持待处理，绝不默认发布；通知失败升级，绝不自动放行。
5. User-visible statuses are separated from internal statuses: externally, only the status wording defined in Sections 5/8/10 is exposed.
5. 用户可见状态与内部状态分离：对外只暴露第 5/8/10 节定义的状态文案。

## 16. Open Items Status and Recommended Answers (SOW Section 14, O01–O08) / 待落实项状态与推荐答案（SOW 第14节 O01–O08）

| ID / 编号 | Status (2026-10-01) / 状态（2026-10-01） | Recommended Answer / Impact / 推荐答案/影响 | Decision Owner & Latest Stage / 决定方与最迟阶段 |
| --- | --- | --- | --- |
| O01 Dev environment / main site / domain<br>O01 开发环境/主站/域名 | VPS verified: Node v24.19.0, npm 11.17.0, Docker 29.1.3, git 2.53.0; no pnpm, no local PostgreSQL client (Docker provides Postgres during development). The technical and DNS control of the main site Vietnamlawyers.ai is unverified.<br>已核查 VPS：Node v24.19.0、npm 11.17.0、Docker 29.1.3、git 2.53.0；无 pnpm、无本地 PostgreSQL 客户端（开发期用 Docker 提供 Postgres）。主站 Vietnamlawyers.ai 技术与 DNS 管理权未核实 | The dev environment is self-sufficient and does not block coding; before main-site integration, the domain owner provides a DNS/publish permission list (no keys needed).<br>开发环境自足，不阻塞编码；主站集成前由域名所有者提供 DNS/发布权限清单（不需密钥） | Domain owner; before main-site integration<br>域名所有者；主站集成前 |
| O02 Production resources / region / operations<br>O02 生产资源/地域/运维 | User decision on 2026-10-01: Shanghai Lighthouse (124.223.13.137, ap-shanghai, Ubuntu 22.04 / 2C / 3.3G / 59G / Docker 26.1.3) is the designated **test environment** (pre-existing services cleared with user authorization; firewall allows only 22/80/443). As of 2026-10-03 the application is deployed on that host; the public entry is HTTP port 80 with fictitious data only (`CLC_FICTITIOUS_TEST_HOST=1`, because real SMTP and Kimi remain blocked). Automated tests stay on localhost of the development host. Test-period entry: ① redirect link from the main site vietnamlawyers.ai; ② direct IP access; **before ICP filing is completed, only the http://IP:port form can be used (pointing the main site/subdomain to a mainland instance on 80/443 would be blocked by Tencent Cloud), direct IP access has no TLS and is limited to fictitious-data testing**. ICP filing to be applied for later; the final production route (mainland filing vs Hong Kong/Singapore) will be decided after filing progress and AC10 real-network validation. Single-point rough measurements: Shanghai→Vietnam HTTPS 3.9–5.5s, →Cloudflare 9.5s, consistent with SOW's concerns about mainland instances.<br>用户 2026-10-01 决定：上海 Lighthouse（124.223.13.137，ap-shanghai，Ubuntu 22.04／2C／3.3G／59G／Docker 26.1.3）为指定**测试环境**（原有服务已按用户授权清除、防火墙仅放行 22/80/443）。截至 2026-10-03 应用已部署到该机，对外入口为 HTTP 80 端口，仅限虚构数据（`CLC_FICTITIOUS_TEST_HOST=1`，因真实 SMTP 与 Kimi 仍被挡住）。自动化测试仍使用研发主机的 localhost。测试期入口：①主站 vietnamlawyers.ai 跳转链接；②直接 IP 访问；**备案完成前只能用 http://IP:端口 形式（主站/子域名指向境内实例 80/443 会被腾讯云拦截），IP 直连无 TLS，仅限虚构数据测试**。ICP 备案后续申请；生产最终路线（境内备案 vs 香港/新加坡）待备案进展与 AC10 真实网络验证后确定。单点粗测：上海→越南 HTTPS 3.9–5.5s、→Cloudflare 9.5s，与 SOW 对境内实例的顾虑一致 | The test environment can be used for pre-release validation; production selection still requires the operations lead + real Chinese–Vietnamese network validation.<br>测试环境可用于预发验证；生产选定仍须运维负责人＋中越真实网络验证 | User / operations lead; before production deployment<br>用户/运维负责人；生产部署前 |
| O03 Coordinator and notification parameters<br>O03 协调员与通知参数 | Confirmed 2026-10-01 (MVP: email only): first send ≤30s; retries 1/5/15 minutes ×5; cooldown 10 minutes; if a backup Coordinator is configured and the task is not picked up in 30 minutes, escalate to that backup, then to the operations lead at 2 hours. Timers use elapsed clock time, 24 hours a day. A business-hours calendar is P1. Sole-reviewer self-release is REQ-REV-06 and is not this timeout path.<br>2026-10-01 确认（MVP 仅邮件）：首发 ≤30s；重试 1/5/15 分钟×5；冷却 10 分钟；若配置了备用协调员且 30 分钟未接手，则升级到该备用协调员，2 小时再升级运营负责人。计时按已流逝时钟、每天 24 小时。工作时间日历属于 P1。唯一审核人自行放行见 REQ-REV-06，不是这条超时路径。 | Real personnel and mailboxes are configured before the pilot.<br>真实人员与邮箱在试点前配置 | Business lead; before the pilot<br>业务负责人；试点前 |
| O04 Access / retention / legal hold<br>O04 访问/留存/保全 | Undecided.<br>未决 | Recommendation: retention periods, deletion procedures, and legal hold are determined in writing by the legal lead; coordinator full-history access is not enabled by default.<br>建议：留存期限、删除流程、法律保全由法律负责人书面确定；协调员完整历史访问默认不开放 | User / legal lead; before real data onboarding<br>用户/法律负责人；真实数据接入前 |
| O05 External providers and data processing<br>O05 外部供应商与数据处理 | Kimi (Moonshot AI) has been designated by the user as the preferred evaluation candidate; accounts and keys for Chinese/international platforms are independent, and the platform in use must be confirmed when creating keys. Processing location, retention, training use, and authorization must be verified before real calls. **Outbound email decided (2026-10-01): SMTP via the operator-designated QQ/foxmail mailbox — the address and authorization code live only in .env and are never written into committable documents.**<br>Kimi（Moonshot AI）已由用户指定为首选评测候选；中国/国际平台账号与密钥独立，须在创建 key 时确认所用平台。真实调用前核实处理地点、留存、训练用途与授权。**邮件发信已定（2026-10-01）：运营方指定 QQ/foxmail 邮箱 SMTP——邮箱地址与授权码仅存于 .env，不写入任何可提交文档。** | Verify processing location, retention, training use, and authorization before real calls; Translation/Email Provider interfaces and test doubles are already included in the SPEC (SmsProvider moved to P1). Email deliverability to Vietnam recipients (Gmail etc.) must be verified with real addresses in AC01/AC08/AC12.<br>真实调用前核实处理地点、留存、训练用途与授权；Translation/Email Provider 接口与测试替身已纳入 SPEC（SmsProvider 移 P1）。对越南收件方（Gmail 等）的送达须用真实地址在 AC01/AC08/AC12 验证。 | User; before real calls<br>用户；真实调用前 |
| O06 SPEC numeric definitions<br>O06 SPEC 数值定义 | This draft provides recommended values: Verification Code (OTP) 6 digits / 10 minutes / lock 15 minutes after 5 attempts / 60-second interval / 10 per day; session 7-day rolling + 30-day idle; messages ≤4000 characters; invitations 7 days; False Block ≤3%, Missed Block for explicit fee inquiries ≤2% (v1.4); 20 pages / DOCX element definitions moved to P1.<br>本草案已给推荐值：验证码 6 位/10 分钟/5 次锁定 15 分钟/60 秒间隔/日 10 条；会话 7 天滚动＋30 天闲置；消息 ≤4000 字符；邀请 7 天；误拦 ≤3%、显式费用问询漏拦 ≤2%（v1.4）；20 页/DOCX 元素定义移 P1 | Frozen upon Review(approval) of this SPEC.<br>随本 SPEC 评审冻结 | With SPEC Review(approval)<br>随 SPEC 评审 |
| O07 Real-device / network / language evidence<br>O07 真机/网络/语言证据 | Not executed; evaluation set and test plan already defined (REQ-TR-08, AC10).<br>未执行；评测集与测试方案已定义（REQ-TR-08、AC10） | Needed from the user: a Chinese–Vietnamese network test window, bilingual reviewers (+86/+84 real-number needs moved to P1 with phone registration).<br>需要用户提供：中越网络测试窗口、双语审阅人（+86/+84 真实号码需求随手机注册移 P1） | User provides resources; before pilot acceptance<br>用户提供资源；试点验收前 |
| O08 Recovery and availability<br>O08 恢复与可用性 | Not yet drilled; REQ-OPS-04 defines RPO ≤24h / RTO ≤8h as to-be-validated targets.<br>未演练；REQ-OPS-04 已定义 RPO ≤24h/RTO ≤8h 为待验证目标 | The T12 task includes an isolated-environment restore drill.<br>T12 任务含隔离环境恢复演练 | Operations lead; before the pilot<br>运维负责人；试点前 |

## 17. Acceptance Scenario Mapping (AC → Requirements → Planned Tasks) / 验收场景映射（AC → 需求 → 计划任务）

| AC | Key Requirements / 主要需求 | Planned Tasks (PLAN.md) / 计划任务（PLAN.md） |
| --- | --- | --- |
| AC01 Email registration and login (phone part P1)<br>AC01 邮箱注册登录（手机部分 P1） | REQ-AUTH-01~12、REQ-OPS-07 | T02 (mock chain, including a second Case on the same Lawyer account) + T12 (real email acceptance and the test-case guide)<br>T02（模拟链路，含同一律师账号的第二个案件）＋T12（真实邮件验收与测试案件指引） |
| AC02 Cross-case privilege abuse / revocation<br>AC02 跨案件越权/撤权 | REQ-PM-01~10、REQ-CASE-06、REQ-FILE-06 | T03、T11、T12 |
| AC03 Multilingual display / manual mode / deduplication<br>AC03 多语显示/手动模式/去重 | REQ-MSG-02/05/07、REQ-TR-01/02/09 | T04、T06、T12 |
| AC04 LLM errors<br>AC04 LLM 异常 | REQ-MSG-09/10、REQ-TR-03 | T06 |
| AC05 Amount release / explicit fee inquiry and contact interception<br>AC05 金额放行/显式费用问询与联系拦截 | REQ-MOD-01~08 | T05、T12 |
| AC06 Pending-review attachments inaccessible<br>AC06 待审附件不可访问 | REQ-FILE-01~08 | T08 |
| AC07 DOCX bilingual (P1)<br>AC07 DOCX 双语（P1） | REQ-DOC-01~06 | T09 (P1)<br>T09（P1） |
| AC08 Urgent Alerts (email; SMS P1)<br>AC08 紧急提醒（邮件；短信 P1） | REQ-NTF-01~06 | T10、T12 (real email)<br>T10、T12（真实邮件） |
| AC09 Archive / revocation (switch-isolation UI part P1)<br>AC09 归档/撤权（切换隔离 UI 部分 P1） | REQ-CASE-05、REQ-OPS-03 | T03、T11、T12 |
| AC10 Chinese–Vietnamese network experience<br>AC10 中越网络体验 | SOW 3.3 | T12 (requires O07 resources)<br>T12（需 O07 资源） |
| AC11 Backup and Restore / logs<br>AC11 备份恢复/日志 | REQ-OPS-01~06 | T11、T12 |
| AC12 Coordinator automatic alerts (email; SMS P1)<br>AC12 协调员自动提醒（邮件；短信 P1） | REQ-NTF-07~13、REQ-REV-01~05 | T07、T12 (real email)<br>T07、T12（真实邮件） |
