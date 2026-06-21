# AI 协作记录

## 1. 使用的 AI 工具

本项目开发过程中使用了 AI 工具辅助需求拆解、架构设计、代码实现、问题定位和文档整理。

使用方式：

- ChatGPT：需求分析、系统架构讨论、Agent workflow 设计、交付文档草稿、问题定位思路。
- Codex：在本地代码仓库中执行代码修改、调试、lint/build 修复、UI 调整和部分文档生成。
- 人工 Review：手动运行项目、检查页面效果、测试生成流程、检查 AgentLog、确认 API key 不泄露、识别生成结果问题。

## 2. AI 参与的主要环节

### 2.1 需求拆解

AI 协助将作业要求拆解为：

- Auth
- Home
- Game Detail
- Create
- GenerationJob
- AgentLog
- Play
- Object Storage Mock
- Runtime Artifact Protocol
- LLM Provider
- Security
- Delivery Docs

### 2.2 架构设计

AI 协助设计：

- Next.js + Prisma + SQLite 的全栈结构。
- 本地对象存储 mock：`public/generated/games/{gameId}/`。
- 生成产物协议：`game_spec.json` / `manifest.json` / `index.html`。
- Play 页面通过 manifest / entryUrl 动态加载。
- iframe sandbox 运行生成 runtime。
- fallback generator 与 openai-compatible provider 并存。

### 2.3 Multi-Agent Workflow

AI 协助设计 6 阶段 Agent：

- Requirement Parser Agent
- Safety Check Agent
- Game Designer Agent
- Runtime Builder Agent
- QA Validator Agent
- Storage Publisher Agent

最终采用混合式 Agent 架构：

- Game Designer Agent 接入真实 LLM。
- Requirement Parser / Safety / QA 当前主要规则实现。
- Runtime Builder / Storage Publisher 是确定性 Tool Agent。

### 2.4 代码实现与调试

Codex 协助完成：

- Next.js 项目搭建。
- 页面与 API 实现。
- 数据模型与 Prisma 操作。
- AgentLog 和 GenerationJob。
- 多类型小游戏生成。
- fallback generator。
- openai-compatible LLM Provider。
- Play 加载体验。
- UI 可读性修复。
- unsupported type 处理。
- lint/build 问题修复。

## 3. 关键 Prompt 摘要

以下为开发过程中使用过的关键 prompt 类型摘要，非完整原文：

### 3.1 MVP 架构实现 Prompt

```text
请基于当前项目实现 AI Native 互动小游戏平台 MVP，包括邮箱登录注册、Home、Create、GenerationJob、Agent logs、Play、对象存储 mock、game_spec / manifest / index.html 产物协议。
```

### 3.2 多类型小游戏生成 Prompt

```text
将 game_spec 扩展为多类型小游戏协议，支持 choice_adventure、quiz、clicker、memory、dodge、escape_room。模型只生成结构化 game_spec，Runtime Builder 使用固定安全模板生成 index.html。
```

### 3.3 LLM Provider 接入 Prompt

```text
请只把 Game Designer Agent 接入项目自己的 OpenAI-compatible LLM Provider。API key 只在服务端读取。模型输出必须是 JSON game_spec。失败时 fallback 到规则生成器。
```

### 3.4 Play 加载体验 Prompt

```text
优化 Play 页面加载流程，展示读取游戏信息、加载 manifest、启动运行环境、加载成功和加载失败。iframe 加载失败不能白屏，保留 sandbox。
```

### 3.5 UI 修复 Prompt

```text
不要继续全站自由美化。只修首页 Hero 和 Game Card，提高可读性，修复空白按钮和低对比文字，保持搜索筛选区不变。
```

### 3.6 Unsupported Type Prompt

```text
当用户输入不支持的游戏类型时，系统应明确提示 unsupported type，不要静默降级到 dodge 或其他错误 runtime。
```

## 4. 人工 Review 发现的问题与修正记录

开发过程中，AI 工具主要负责代码实现、文档草稿和部分调试建议，但项目并不是直接接受 AI 输出。每一轮实现后都进行了人工运行、页面检查、功能验收和日志排查。人工 Review 发现并推动修正了以下典型问题。

### 4.1 收藏、点赞与用户级状态问题

早期版本中，首页和详情页已经能展示游戏列表，但收藏、点赞、游玩次数等更接近社区平台的交互能力还不完整。人工 Review 后补充了：

* 用户级 Favorite 记录；
* 收藏 / 取消收藏 API；
* 我的收藏页面；
* 游戏卡片上的收藏数、点赞数、游玩次数；
* 详情页和首页状态同步；
* 只展示 `published` 游戏，避免草稿误出现在首页。

这一轮修正让平台不只是简单展示游戏，而是更接近“社区游戏平台”的产品形态。

### 4.2 Play 页面加载体验问题

早期 Play 页面可以加载生成游戏，但加载过程不够清晰，manifest 失败或 iframe 加载异常时容易让用户误以为页面卡住。人工 Review 后补充了 Play 加载状态设计：

* 正在读取游戏信息；
* 正在加载 manifest；
* 正在启动游戏运行环境；
* iframe loading 提示；
* 加载成功状态；
* 加载失败错误提示；
* 重新加载；
* 返回首页；
* 重新开始；
* 从生成任务进入时保留“返回生成任务 / 发布此游戏 / 返回首页”等入口。

这一问题的修正强化了“Play 是动态加载远端产物”的验收证据，而不是直接运行本地硬编码组件。

### 4.3 生成任务与 Agent 日志可观测性问题

早期生成任务虽然能跑通，但用户难以理解“AI 到底在做什么”。人工 Review 后要求 Job Detail 页面展示更清晰的 Agent 日志时间线，包括：

* 任务入队；
* 读取用户创意；
* 安全检查；
* Game Designer 生成 `game_spec`；
* QA Validator 校验；
* Runtime Builder 生成 `manifest.json` 和 `index.html`；
* Storage Publisher 写入对象存储 mock；
* 写入数据库；
* 等待预览 / 发布。

后续又发现真实 LLM 调用时等待时间较长，因此提出需要基于 Agent 步骤的真实进度条，而不是纯前端假进度。该项作为后续优化方向记录。

### 4.4 Remix 与草稿 / 作品管理问题

在“我的作品”相关流程中，人工 Review 发现仅有基础列表还不够，需要覆盖创作者常见操作。随后补充或调整了：

* 我的作品页；
* 草稿和已发布作品的区分；
* 发布 / 取消发布；
* 删除作品前确认；
* 删除成功提示；
* 删除后跳转首页；
* 删除失败时显示错误；
* Remix 派生入口；
* 从已有游戏发起 Remix 时创建新的 generation job 和 draft 游戏。

这部分让 Create 不只是单次生成，而是具备“作品迭代”的产品闭环。

### 4.5 多类型小游戏生成质量问题

早期生成器偏向互动剧情，不能体现“多类型小游戏平台”。人工 Review 后提出需要支持多种轻量小游戏类型，并推动扩展为：

* `choice_adventure`：互动剧情选择；
* `quiz`：问答闯关；
* `clicker`：点击收集 / 计分；
* `memory`：翻牌记忆；
* `dodge`：躲避生存；
* `escape_room`：密室逃脱。

同时要求不同类型生成的 `index.html` 需要有真实玩法差异，而不是只改标题和文案。这一轮修正让平台从“剧情生成器”升级为“多类型小游戏生成平台”。

### 4.6 LLM Provider 接入与 fallback 边界问题

最初 Agent 流程主要由规则和 fallback generator 驱动。人工 Review 后进一步要求接入真实模型，但同时保留 fallback mode，避免没有 API key 时无法运行。随后补充了：

* `LLM_PROVIDER=fallback` 默认模式；
* `LLM_PROVIDER=openai-compatible` 真实模型模式；
* `OPENAI_API_KEY` / `OPENAI_MODEL` / `OPENAI_BASE_URL` 环境变量；
* Game Designer Agent 调用真实模型生成结构化 `game_spec`；
* 模型失败、输出非法 JSON、schema 校验失败时 fallback；
* API key 只在服务端读取；
* 不使用 `NEXT_PUBLIC_` 存放密钥；
* 不在日志、数据库和文档中写入真实 key。

### 4.7 UI 可读性与按钮显示问题

Codex 曾多次尝试自由美化 UI，但人工 Review 发现部分改动牺牲了可用性，例如：

* 首页 Hero 区按钮出现白底白字，像空白按钮；
* 搜索区以外的组件被过度重做；
* 游戏卡片封面过大，正文信息被压缩；
* 正文、元信息、统计信息颜色过浅；
* 装饰性渐变和发光过多，但没有提升信息表达；
* 卡片中的装饰元素像错误占位块；
* Game Card 的操作按钮文字不够清晰。

随后明确要求 Codex 停止全站自由美化，只修 Hero CTA 和 Game Card 可读性，并保持搜索筛选区不变。

### 4.8 示例数据和重复 seed 问题

人工 Review 发现 seed 数据和首页示例游戏可能出现重复或主题过近的问题，例如类似“魔法森林猫咪逃脱”的游戏重复出现。随后要求：

* seed 使用稳定 ID upsert；
* 重复运行 seed 不制造重复首页作品；
* 删除或改名过于相似的示例游戏；
* 保证至少 3 个示例游戏；
* 覆盖不同游戏类型；
* 至少 1 个游戏来自 Create 流程生成并发布。

这保证了测试数据更适合作为 Demo，而不是临时堆数据。

### 4.9 Unsupported Type 与类型错误降级问题

人工测试中发现，当用户输入超出当前 runtime 能力的玩法时，系统可能错误降级到已有模板。例如横屏对战 prompt 被生成成 `type: dodge`，导致 Runtime Builder 使用躲避模板，页面出现“躲避挑战”和 `undefined`。

通过查看 `game_spec.json`，人工定位到问题不是 LLM 没理解需求，而是：

* 模型生成了对战内容；
* 但最外层 `type` 仍是 `dodge`；
* Runtime Builder 只根据 `type` 选择模板；
* QA Validator 没有拦截 type 与字段不匹配；
* Runtime 模板读取缺失字段后渲染出 `undefined`。

随后提出需要引入 Game Type Registry、type-specific schema、unsupported type 提示和更强 QA Validator，避免把不支持的玩法静默塞进错误模板。

### 4.10 横屏对战 Runtime 可玩性问题

在测试横屏 2D 对战游戏时，人工发现虽然页面标题和简介已经像对战游戏，甚至可以出现 HP UI，但仍存在：

* 游戏动不起来；
* 角色移动速度过慢；
* 键盘操作不稳定；
* iframe 中可能需要 focus；
* 页面仍可能出现 `undefined`；
* Runtime 只显示静态 UI，而没有完整 game loop；
* HP、攻击、防御、敌人 AI、胜负判断没有完全打通。

该问题说明 Game Designer Agent 已经能设计游戏，但 Runtime Builder 和 QA Validator 仍需增强。后续优化方向是：不让模型自由生成任意 JS，而是将 Runtime Builder 升级为 Hybrid Runtime Planner Agent，让 LLM 参与 template selection / component composition，最终仍由固定安全组件生成可运行 runtime。

### 4.11 意图识别不足问题

人工 Review 还发现，unsupported type 不能只识别显性的“大型 3D MMO”。某些输入更隐性，例如：

```text
生成一个类似动物森友会的休闲生活游戏。
```

系统可能只提取“动物、休闲、村庄、收集”等表层关键词，并尝试映射到现有小游戏模板。但真实意图可能包含：

* 长期经营；
* 建造装饰；
* NPC 关系；
* 资源循环；
* 开放村庄探索；
* 复杂生活模拟；
* 已有商业游戏 IP 或风格复刻风险。

因此，后续计划将 Requirement Parser Agent 升级为 Intent Recognition Agent，不只识别关键词，还判断玩法复杂度、是否可映射到当前 supported runtime、是否涉及 IP 风险，以及是否应该返回 unsupported type 提示。

### 4.13 总结

整体来看，AI 工具显著加速了代码实现和文档整理，但人工 Review 在以下方面发挥了关键作用：

* 判断需求是否真正满足作业要求；
* 发现 UI 可用性问题；
* 验证 Play 是否动态加载产物；
* 检查 AgentLog 是否能体现生成链路；
* 区分真实 LLM 接入和 fallback；
* 定位 `game_spec.type` 与 runtime 不匹配问题；
* 识别 unsupported type 和复杂意图识别边界；
* 检查 GitHub 提交和 API key 安全。

因此，本项目采用的是“AI 辅助实现 + 人工验收纠偏”的开发方式，而不是无审查地接受 AI 输出。

## 5. AI 贡献比例说明

AI 主要承担：

- 架构方案草拟。
- 代码实现建议。
- 文档草稿。
- 调试方向。
- Prompt 编写。

人工主要承担：

- 需求判断。
- 功能取舍。
- 页面验收。
- API key 配置。
- 本地运行与测试。
- 安全检查。
- 最终提交决策。
- 对 AI 输出进行 review 和修正。

本项目不是无审查地接受 AI 输出，而是通过人工测试、截图检查、日志检查、数据库检查和 build/lint 验证逐步修正。

## 6. 后续 AI 协作计划

如果继续迭代，将继续使用 AI 辅助：

- 设计 Game Type Registry。
- 扩展 side_battle / runner / platformer runtime。
- 编写 type-specific QA Validator。
- 生成 smoke test。
- 整理 demo 视频脚本。
- 辅助排查 Play iframe 和 runtime 交互问题。

但所有模型生成代码仍需人工 review，并通过 lint/build/manual validation 后提交。
