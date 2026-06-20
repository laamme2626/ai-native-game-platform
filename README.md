# Yahaha AI Native 互动游戏平台 MVP

一个两天内可交付的 AI Native 互动游戏 Web 平台 Demo。用户注册登录后，可以输入自然语言创意并上传素材，系统创建生成任务，模拟 Multi-Agent 工作流生成受约束的 `game_spec.json`、`manifest.json` 和可运行 `index.html`，用户预览后发布，发布游戏会出现在首页并可在 Web 端游玩。

## 技术栈

- Next.js App Router + TypeScript
- Tailwind CSS
- Prisma 7 + SQLite
- 本地对象存储 mock：`public/generated`
- Cookie session 邮箱密码认证
- 单进程模拟 Agent Orchestrator
- 可选 OpenAI-compatible LLM Provider，默认 fallback

## 本地启动

```bash
npm install
copy .env.example .env
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

打开 `http://localhost:3000`。

Demo 账号：

```text
demo@yahaha.local
password123
```

## 常用命令

```bash
npm run dev
npm run lint
npm run build
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db
```

## 核心功能

- 中文化首页、登录、注册、创建游戏、生成任务、详情、我的作品、游玩页。
- 邮箱注册、登录、退出登录；刷新后仍通过 cookie session 识别用户。
- GitHub / Google 第三方登录 Demo 入口，当前不接真实 OAuth。
- 首页只展示 `published` 游戏，支持搜索和按固定分类标签筛选。
- 游戏卡片展示封面占位、标题、简介、作者、标签、发布时间、游玩次数、点赞数、收藏数。
- 点赞、收藏、游玩次数通过 API 更新数据库；收藏是用户级 Favorite 记录，可进入“我的收藏”查看。
- `/games/[id]` 游戏详情页。
- `/favorites` 我的收藏页，展示当前用户收藏过的 published 游戏。
- `/my` 我的作品页，支持预览、发布、取消发布、删除草稿/作品、查看生成任务、Remix 派生。
- Create 页面支持 prompt 长度限制、素材上传、类型/大小校验。
- Create 支持从源游戏发起 Remix，提交修改要求后创建新的 generation job 和 draft 游戏。
- Job Detail 页面轮询状态、展示多 Agent 日志、失败重试、成功预览/发布、产物路径和模拟成本。
- Play 页面从数据库读取 meta，动态加载本地对象存储 mock 的 manifest/entry，并用 sandbox iframe 运行游戏。
- 支持多类型小游戏：互动剧情、问答闯关、点击收集、翻牌记忆、Canvas 躲避、密室逃脱。
- 默认 fallback mode 无需 API key；配置服务端环境变量后可尝试 OpenAI-compatible provider。

## 验收步骤

1. 运行 `npm run db:seed`，首页应出现 6 个已发布示例游戏，覆盖互动剧情、问答、点击、记忆、躲避、密室逃脱。
2. 使用 Demo 账号登录。
3. 进入“创建游戏”，输入猫咪/赛博/海盗/校园/太空主题创意并上传一个允许类型文件。
4. 提交后进入“生成任务”，观察状态和 Agent 日志。
5. 生成成功后点击“预览”，Play 页应显示返回任务、发布此游戏、返回首页。
6. 发布后回到首页，能看到新游戏。
7. 点击详情页，测试点赞、收藏、取消收藏、开始游玩。
8. 进入“我的收藏”，确认收藏列表会随取消收藏变化。
9. 进入“我的作品”，测试取消发布、删除草稿和 Remix 派生。

## 标签体系

标签来自固定 taxonomy，而不是临时从游戏里抽取：

- 类型：互动剧情、分支选择、问答、解谜、点击、收集、记忆、配对、动作、躲避、密室逃脱、冒险、生存、轻度动作
- 题材：魔法、森林、奇幻、赛博、城市、校园、考试、太空、飞船、科幻、海盗、宝藏、童话、悬疑
- 风格：可爱、黑暗、治愈、搞笑、像素、未来感
- 难度：简单、中等、困难
- 时长：1 分钟、3 分钟、5 分钟

生成器会根据 prompt 自动选择标签，例如“猫咪 / 魔法森林”会得到魔法、森林、奇幻、可爱、简单和互动剧情/冒险等标签。非剧情类型不会默认打上“互动剧情”。

Seed 使用稳定 ID upsert，重复运行不会在数据库里制造重复首页作品，也会覆盖同一批本地 generated 路径。

## Demo / Mock 说明

- 不接真实 OpenAI、Supabase 或云服务。
- Agent 默认使用本地 fallback generator，按关键词生成不同类型的受控 game_spec。
- 如果要启用真实模型，需要自行创建 `.env`，设置 `LLM_PROVIDER=openai-compatible` 和 `OPENAI_API_KEY`，不要提交 `.env`。
- 部署时应在平台环境变量中配置 API key，不要使用 `NEXT_PUBLIC_` 前缀存放模型密钥。
- 第三方登录按钮只展示 Demo 提示。
- 对象存储用本地 `public/generated` 模拟，代码边界在 `src/lib/storage.ts`，可迁移到 MinIO / S3 / OSS。
- 内容审核、成本统计、资源限额均为 Demo 级实现。
