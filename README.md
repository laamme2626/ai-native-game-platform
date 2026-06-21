# AI Native 互动游戏平台 MVP

一个 AI Native 互动小游戏生成平台 Demo。用户注册 / 登录后，可以输入自然语言创意并上传素材，系统会创建生成任务，通过 Multi-Agent Workflow 生成受约束的 `game_spec.json`、`manifest.json` 和可运行的 `index.html`。用户可以预览、发布生成游戏，发布后的游戏会出现在首页，并可在 Web 端通过 sandboxed iframe 动态运行。

本项目重点验证：

* AI Native 游戏生成主链路；
* Multi-Agent 生成流程；
* 结构化 `game_spec` 协议；
* 运行时产物 `manifest.json` / `index.html`；
* Play 页面动态加载生成游戏；
* fallback 与可选真实 LLM Provider；
* API key、iframe sandbox、Runtime Builder 的安全边界。

---

## 1. 项目状态

本仓库包含 AI Native 互动游戏平台 MVP 的完整源码、数据库 schema、示例数据脚本、`.env.example` 以及 `docs/` 目录下的系统设计与项目说明文档。

当前版本提供本地 Demo 运行方式，暂未部署线上服务。启动项目后可访问：

```text
http://localhost:3000
```

项目包含清晰的 Git commit 记录，可通过以下命令查看开发过程：

```bash
git log --oneline --decorate --graph -n 20
```

主要文档位于 `docs/` 目录下，包括系统架构、Agent 工作流、安全方案、完成度说明、测试验证记录和 AI 协作记录。

---

## 2. 技术栈

* Frontend / Full-stack Framework：Next.js App Router + TypeScript
* UI：Tailwind CSS
* Database ORM：Prisma 7
* Database：SQLite
* Auth：Cookie Session + 邮箱密码登录
* Object Storage Mock：本地 `public/generated`
* Agent Workflow：自研状态机式 Multi-Agent Orchestrator
* LLM Provider：

  * `fallback`：默认本地规则生成器，无需 API key
  * `openai-compatible`：可选真实模型服务
* Game Runtime：原生 HTML / CSS / JavaScript
* Runtime Isolation：sandboxed iframe

---

## 3. 本地启动

### 安装依赖

```bash
npm install
```

### 创建环境变量文件

```bash
copy .env.example .env
```

`.env` 用于本地开发，请不要放入版本控制。

### 初始化数据库

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

也可以使用项目中封装的数据库命令：

```bash
npm run db
```

### 启动开发服务

```bash
npm run dev
```

打开：

```text
http://localhost:3000
```

---

## 4. Demo 账号

```text
demo@yahaha.local
password123
```

---

## 5. 常用命令

```bash
npm run dev
npm run lint
npm run build
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db
```

---

## 6. 环境变量

项目提供 `.env.example`，用于列出必要环境变量。

```env
LLM_PROVIDER=fallback
OPENAI_API_KEY=
OPENAI_MODEL=
OPENAI_BASE_URL=
```

默认模式：

```env
LLM_PROVIDER=fallback
```

该模式不需要 API key，使用本地 fallback generator，保证项目在本地开发和演示环境中也可以完整运行。

如果要启用真实模型：

```env
LLM_PROVIDER=openai-compatible
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=your_model_name
OPENAI_BASE_URL=https://your-openai-compatible-endpoint/v1
```

安全注意事项：

* 不要将真实 `.env` 放入版本控制；
* 不要把真实 API key 写入 README、docs、数据库或日志；
* 不要使用 `NEXT_PUBLIC_` 前缀保存模型密钥；
* API key 只允许在服务端读取；
* 线上部署时应在部署平台的环境变量面板中配置密钥。

---

## 7. 核心功能

### 7.1 用户与页面

* 中文化首页、登录、注册、创建游戏、生成任务、详情、我的作品、游玩页。
* 邮箱注册、登录、退出登录。
* 刷新后通过 Cookie Session 识别用户。
* GitHub / Google 第三方登录 Demo 入口，当前不接真实 OAuth。
* `/games/[id]` 游戏详情页。
* `/favorites` 我的收藏页。
* `/my` 我的作品页，支持预览、发布、取消发布、删除、查看生成任务和 Remix 派生。

### 7.2 首页与游戏社区

* 首页只展示 `published` 游戏。
* 支持搜索和固定分类标签筛选。
* 游戏卡片展示：

  * 封面占位
  * 标题
  * 简介
  * 作者
  * 标签
  * 发布时间
  * 游玩次数
  * 点赞数
  * 收藏数
* 点赞、收藏、游玩次数通过 API 更新数据库。
* 收藏是用户级 `Favorite` 记录，可进入“我的收藏”查看。

### 7.3 Create 生成流程

* Create 页面支持自然语言 prompt。
* 支持 prompt 长度限制。
* 支持素材上传入口，并进行类型 / 大小校验。
* 提交后创建 `GenerationJob`。
* 任务详情页轮询状态并展示 Agent 日志。
* 生成成功后可预览 / 发布。
* 支持从已有游戏发起 Remix，创建新的 generation job 和 draft 游戏。

### 7.4 Play 动态运行

Play 页面不是运行硬编码 React 游戏组件，而是：

```text
读取数据库中的 Game meta
→ 加载 manifest.json
→ 读取 entryUrl
→ 使用 sandbox iframe 加载 index.html
→ iframe onLoad 后进入运行中状态
```

每个生成游戏对应：

```text
public/generated/games/{gameId}/
  ├─ game_spec.json
  ├─ manifest.json
  └─ index.html
```

Play 页面保留 iframe sandbox，用于隔离生成 runtime。

### 7.5 多类型小游戏

当前稳定支持的轻量小游戏类型包括：

* `choice_adventure`：互动剧情选择
* `quiz`：问答闯关
* `clicker`：点击收集 / 计分
* `memory`：翻牌记忆
* `dodge`：Canvas 躲避生存
* `escape_room`：密室逃脱

项目也已经开始探索更开放的类型识别和 unsupported type 处理。对于横屏对战、跑酷、平台跳跃等类型，后续需要通过 Game Type Registry、type-specific schema 和专用 runtime template 继续增强，避免错误降级到不匹配的模板。

---

## 8. Multi-Agent Workflow

本项目采用自研状态机式 Multi-Agent Orchestrator，将游戏生成流程拆分为 6 个阶段：

```text
Requirement Parser Agent
Safety Check Agent
Game Designer Agent
Runtime Builder Agent
QA Validator Agent
Storage Publisher Agent
```

### 8.1 Agent 职责

| Agent                    | 职责                                                                    | 当前实现                                           |
| ------------------------ | --------------------------------------------------------------------- | ---------------------------------------------- |
| Requirement Parser Agent | 解析 prompt，识别游戏类型、主题、角色、目标和风格                                          | 规则 / 关键词为主，后续可升级为 Intent Recognition Agent     |
| Safety Check Agent       | 检查安全、prompt injection、输入长度和资源限制                                       | 规则检查                                           |
| Game Designer Agent      | 生成结构化 `game_spec`                                                     | 已接入 openai-compatible LLM Provider，支持 fallback |
| Runtime Builder Agent    | 根据 `game_spec.type` 选择固定 Runtime 模板，生成 `index.html` / `manifest.json` | 确定性 Tool Agent                                 |
| QA Validator Agent       | 校验 schema、必需字段和最小可玩性                                                  | 规则校验，后续增强 type-specific validator              |
| Storage Publisher Agent  | 写入本地对象存储 mock，并更新数据库                                                  | 确定性 Tool Agent                                 |

### 8.2 当前 LLM 接入范围

当前版本不是让所有 Agent 都调用大模型，而是采用混合式 Agent 设计：

```text
LLM Agent + Rule Agent + Tool Agent
```

其中：

* Game Designer Agent 是当前主要接入真实模型的核心 Agent。
* Requirement Parser / Safety Check / QA Validator 当前主要使用规则或轻量逻辑。
* Runtime Builder / Storage Publisher 是确定性 Tool Agent。

这样设计的原因是：游戏创意设计适合交给 LLM，但运行时代码生成、对象存储写入和安全校验需要稳定、可控和可复现。

当前系统不允许模型自由生成任意 JavaScript，而是让模型生成受约束的 `game_spec`，再由 Runtime Builder 使用固定安全模板渲染为可运行小游戏。

---

## 9. LLM Provider 与 fallback

当前支持两种模式：

### fallback mode

默认模式，无需 API key。

```env
LLM_PROVIDER=fallback
```

作用：

* 本地规则生成器。
* 保证没有模型服务时也能完成演示。
* 适合本地开发、功能验证和基础流程展示。

### openai-compatible mode

真实模型模式。

```env
LLM_PROVIDER=openai-compatible
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=your_model_name
OPENAI_BASE_URL=your_base_url
```

作用：

* Game Designer Agent 调用真实模型生成结构化 `game_spec`。
* 模型输出必须是 JSON。
* 输出会经过 schema 校验。
* 如果模型调用失败、输出非 JSON 或校验失败，则回退到 fallback generator 或标记任务失败。
* 日志中只记录 provider / model / fallback 状态，不记录 API key。

---

## 10. 标签体系

标签来自固定 taxonomy，而不是临时从游戏里随意抽取。

### 类型

```text
互动剧情、分支选择、问答、解谜、点击、收集、记忆、配对、动作、躲避、密室逃脱、冒险、生存、轻度动作
```

### 题材

```text
魔法、森林、奇幻、赛博、城市、校园、考试、太空、飞船、科幻、海盗、宝藏、童话、悬疑
```

### 风格

```text
可爱、黑暗、治愈、搞笑、像素、未来感
```

### 难度

```text
简单、中等、困难
```

### 时长

```text
1 分钟、3 分钟、5 分钟
```

生成器会根据 prompt 自动选择标签。例如“猫咪 / 魔法森林”会得到魔法、森林、奇幻、可爱、简单和互动剧情 / 冒险等标签。非剧情类型不会默认打上“互动剧情”。

Seed 使用稳定 ID upsert，重复运行不会在数据库里制造重复首页作品，也会覆盖同一批本地 generated 路径。

---

## 11. 测试数据与验证流程

### 11.1 Seed 数据

运行：

```bash
npm run db:seed
```

首页应出现多种已发布示例游戏，覆盖：

* 互动剧情
* 问答
* 点击收集
* 记忆翻牌
* 躲避生存
* 密室逃脱

### 11.2 手动验证步骤

1. 运行 `npm run db:seed`。
2. 使用 Demo 账号登录。
3. 进入首页，确认示例游戏出现。
4. 进入“创建游戏”，输入猫咪 / 赛博 / 海盗 / 校园 / 太空等主题创意。
5. 可上传一个允许类型文件。
6. 提交后进入“生成任务”，观察状态和 Agent 日志。
7. 生成成功后点击“预览”。
8. Play 页应显示返回任务、发布此游戏、返回首页。
9. 发布后回到首页，能看到新游戏。
10. 点击详情页，测试点赞、收藏、取消收藏、开始游玩。
11. 进入“我的收藏”，确认收藏列表会随取消收藏变化。
12. 进入“我的作品”，测试取消发布、删除草稿和 Remix 派生。

### 11.3 LLM 验证 Prompt

如果启用了 `openai-compatible` provider，可使用较特殊的 prompt 测试是否真的调用模型：

```text
生成一个粉色章鱼在月球图书馆收集星星书签的记忆翻牌小游戏。
```

期望：

* AgentLog 中出现 Game Designer Agent 使用 openai-compatible provider。
* 生成内容包含“粉色章鱼”“月球图书馆”“星星书签”“记忆翻牌”等主题信息。
* `game_spec.json` 与 prompt 相关。
* 不泄露 API key。

### 11.4 Unsupported Type 验证

测试：

```text
生成一个 3D 开放世界多人在线赛车 MMO，有多人匹配、真实物理、开放地图和车辆改装。
```

期望：

* 系统不应错误生成 dodge / clicker 等不匹配模板。
* 如果 unsupported type 处理已启用，应在 Create 或 Job Detail 显示“当前 Demo 暂不支持该玩法类型”。
* AgentLog 应记录 Requirement Parser 识别到 unsupported type。

---

## 12. 安全设计

### 12.1 API key

* `.env` 不放入版本控制。
* `.env.example` 只保留变量名。
* API key 只在服务端读取。
* 不使用 `NEXT_PUBLIC_` 存放模型密钥。
* 不在日志、数据库、README 或 docs 中记录真实 API key。

### 12.2 模型输出

* 模型只生成结构化 `game_spec`。
* 不允许模型自由生成任意 JS 作为核心逻辑。
* 输出必须 JSON parse。
* 输出必须经过 schema / QA 校验。
* 校验失败时 fallback 或 failed。

### 12.3 iframe sandbox

Play 页面通过 sandboxed iframe 加载生成游戏，避免 runtime 直接影响主应用。

### 12.4 对象存储 mock

当前本地对象存储为：

```text
public/generated
```

代码边界在存储层，可迁移到：

* MinIO
* S3
* OSS
* R2

### 12.5 Prompt Injection 与资源限制

Safety Check Agent 用于检查：

* prompt injection 风险
* 输入长度
* 上传文件类型
* 上传文件大小
* 危险内容

当前为 Demo 级实现，后续可接入更完整的内容审核和资源配额。

---

## 13. Demo / Mock 说明

当前 Demo 级实现包括：

* 第三方登录按钮只展示 Demo 提示，未接真实 OAuth。
* 对象存储使用本地 `public/generated` 模拟。
* fallback generator 用于无 API key 的本地演示。
* 内容审核、成本统计、资源限额为 Demo 级实现。
* 多模态素材已作为输入入口，深度图像 / 视频理解可后续接入视觉模型。
* Runtime 类型仍有限，不支持所有复杂玩法。
* 当前真实 LLM 主要接入 Game Designer Agent，其他 Agent 多为规则 / 工具型实现。

---

## 14. 已知问题

当前版本仍存在以下边界：

1. 游戏类型受 Runtime Template 限制，不能无限生成所有复杂游戏。
2. 对于“类似动物森友会”这类隐含复杂生活模拟 / 商业 IP 参考的 prompt，当前意图识别仍需增强。
3. QA Validator 需要继续增强 type-specific schema 校验，防止 type 与字段不匹配。
4. Runtime Builder 当前主要使用固定模板，复杂新玩法需要新增 schema 和 runtime template。
5. 真实对象存储、线上部署、成本监控和更完整的失败重试机制仍可继续完善。
6. 部分 experimental runtime 可能需要继续优化手感、键盘焦点和 game loop。

这些问题不影响主链路 MVP，但属于产品化迭代重点。

---

## 15. 后续优化计划

### Day 1-2：Intent Recognition 与 Game Type Registry

* 建立统一 Game Type Registry。
* 每个 type 定义关键词、schema、runtime template 和支持状态。
* 将 Requirement Parser 升级为 Intent Recognition Agent。
* 增强“类似动物森友会”等隐含复杂类型识别。
* 对 unsupported type 在 Create 页面明确提示。

### Day 3：QA Validator 强化

* 增加 type-specific schema validator。
* 检查 HTML 中是否出现 `undefined`。
* 检查 runtime 是否具备开始、目标、胜负、重开。
* 增加基础 smoke test。
* 模型失败时增加 retry 和更清楚的错误原因。

### Day 4：Runtime Builder 升级

* 完善 side_battle、runner、platformer 等 runtime。
* 抽象通用组件：

  * HP 系统
  * 计时系统
  * 键盘控制
  * 碰撞系统
  * 胜负结算
  * 重新开始
* 引入可选 Runtime Planner Agent，只输出 `runtime_plan` JSON，不自由生成 JS。

### Day 5：真实对象存储

* 将 `public/generated` mock 替换为 S3 / OSS / R2 / MinIO。
* 设计真实 manifest / entryUrl / assetUrl 协议。
* 增加资源清理策略。

### Day 6：可观测性与成本

* 记录 LLM provider、model、duration、fallbackUsed。
* 接入 token usage / cost estimate。
* 增加任务失败 dashboard 或日志过滤。

### Day 7：体验与验证完善

* 优化生成游戏的可玩性和视觉反馈。
* 增加更多示例数据。
* 补充 demo 视频。
* 增加自动化 smoke test 和截图验证。

---

## 16. 总结

当前版本已经实现 AI Native 互动小游戏平台的核心 MVP：用户可以通过自然语言创建小游戏，系统通过 Multi-Agent Workflow 生成结构化 game_spec 和可运行 runtime 产物，并通过 Play 页面动态加载运行。

项目当前采用安全优先的混合式 Agent 架构：Game Designer Agent 接入真实 LLM，负责创意生成；Runtime Builder 和 Storage Publisher 使用确定性工具实现，保证运行时安全和可复现。后续优化重点是更强的意图识别、Game Type Registry、Runtime Planner、type-specific QA 和真实对象存储。
