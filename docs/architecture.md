# 架构说明

## 模块协作

- 前端页面：Next.js App Router 渲染 Home、Create、Job Detail、Game Detail、My Works、Play。
- 后端 API：App Router API routes 处理认证、任务创建、发布、取消发布、统计、Remix。
- 数据库：Prisma + SQLite 保存用户、游戏、生成任务、Agent 日志。
- 对象存储 mock：`src/lib/storage.ts` 写入 `public/generated/games` 和 `public/generated/uploads`。
- Agent Orchestrator：`src/lib/agent.ts` 在单进程内模拟多个 Agent 步骤。
- LLM Provider：`src/lib/agent/llm-provider.ts` 默认 fallback，可选 OpenAI-compatible 服务端调用。

## 页面路由

- `/` 首页：published 游戏、搜索、分类标签筛选、统计操作。
- `/login` `/register`：邮箱密码认证和 OAuth Demo 入口。
- `/create`：受保护页面，提交 prompt 和素材。
- `/jobs/[id]`：受保护页面，轮询任务状态和日志。
- `/games/[id]`：游戏详情页。
- `/my`：受保护页面，管理我的作品和任务历史。
- `/favorites`：受保护页面，展示我的收藏。
- `/play/[id]`：动态加载 manifest/entry 并运行游戏。

## API 路由

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/jobs`
- `GET /api/jobs/[id]`
- `POST /api/jobs/[id]`
- `POST /api/games/[id]/publish`
- `POST /api/games/[id]/unpublish`
- `POST /api/games/[id]/metrics`
- `POST /api/games/[id]/favorite`
- `POST /api/games/[id]/remix`
- `DELETE /api/games/[id]`

## 数据流

1. 用户在 Create 输入创意并上传素材。
2. `/api/jobs` 保存上传素材到 storage mock，并创建 `GenerationJob`。
3. Job Detail 调用 `POST /api/jobs/[id]` 启动本地 Agent。
4. Agent 解析需求、检查安全、生成和校验 `game_spec`。
5. Agent 使用固定模板生成 `manifest.json` 和 `index.html`。
6. storage service 写入本地对象存储 mock。
7. 数据库写入 `Game` meta 和产物 URL。
8. 用户预览、发布。
9. 首页和详情页只展示 published 游戏。
10. 收藏按钮写入 `Favorite`，我的收藏页按当前用户查询。
11. Remix 从游戏详情进入 Create，提交修改要求后创建带 `sourceGameId` 的 generation job。
12. Play 页从 DB 读取 meta，再动态 fetch manifest 和 entryUrl，并用 iframe sandbox 运行 entry。

## Play 动态加载策略

Play 页面服务端先读取 `Game` meta，客户端依次展示：

1. 正在读取游戏信息
2. 正在加载 manifest
3. 正在启动游戏运行环境
4. 加载成功，游戏运行中

manifest 加载失败会显示错误原因和重新加载按钮。iframe 保留 `sandbox="allow-scripts"`，生成游戏只能在隔离 frame 中运行，不能直接访问平台页面 DOM。

## 多类型小游戏协议

`game_spec.type` 支持：

- `choice_adventure`
- `quiz`
- `clicker`
- `memory`
- `dodge`
- `escape_room`

Agent 只生成结构化 `game_spec`。Runtime Builder 使用固定安全模板把 spec 渲染成 `index.html`，不同 type 使用不同原生 HTML/CSS/JS 或 Canvas 玩法，不执行模型自由生成的 JS。

## 数据模型

- `User`：邮箱、密码 hash、游戏、生成任务、收藏。
- `Game`：owner、parentGameId、version、标题、简介、标签、状态、manifestUrl、entryUrl、specUrl、素材信息、统计字段。
- `GenerationJob`：prompt、sourceGameId、状态、素材信息、错误、模拟 tokens/cost/steps、关联 game。
- `AgentLog`：job、agentName、level、message、metadata、createdAt。
- `Favorite`：userId、gameId、createdAt，`@@unique([userId, gameId])` 防止重复收藏。

## 标签体系

标签定义在 `src/lib/tags.ts`，按类型、题材、风格、难度、时长分组。首页筛选直接使用固定 taxonomy，生成器只写入 taxonomy 中的合法标签。后续可迁移为后台可配置表：

- `TagGroup`
- `Tag`
- `GameTag`

这样运营可以调整标签显示顺序、上下线标签和多语言文案。

## Remix 派生

当前 Remix 是轻量派生：

1. 详情页点击 Remix。
2. API 返回 `/create?sourceGameId=...`。
3. Create 展示源游戏，用户输入修改要求。
4. `/api/jobs` 创建带 `sourceGameId` 的 generation job。
5. Agent 读取源游戏 prompt/meta，结合 remix prompt 生成新的 `game_spec`、manifest 和 entry。
6. 新游戏保存为 draft，并记录 `parentGameId` 和 `version`。

后续可扩展为版本管理、差异对比和多人协作编辑。

## 删除策略

删除流程：前端二次确认 → `DELETE /api/games/[id]` 校验 owner → 删除数据库记录 → 调用 storage service 清理 `public/generated/games/{gameId}` → 前端展示删除成功并跳转首页。

上传素材目录当前不做级联清理；生产环境可通过对象存储生命周期或后台任务清理孤儿素材。

## LLM Provider

默认：

```text
LLM_PROVIDER=fallback
```

可选：

```text
LLM_PROVIDER=openai-compatible
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1
```

真实 API 只在服务端 provider 中读取。模型输出必须是 JSON，并通过 `validateGameSpec`；失败时记录 Agent log 并回退 fallback。

## OAuth 扩展设计

当前 GitHub / Google 登录是 Demo 入口。生产设计：

- 增加 `Account` 表：`userId`、`provider`、`providerAccountId`、`accessTokenHash`、`refreshTokenEncrypted`、`expiresAt`。
- OAuth callback 校验 state + PKCE。
- 首次 OAuth 登录按 providerAccountId 查找账号，未命中则按已验证 email 绑定或创建 User。
- 邮箱密码用户可在设置页绑定第三方账号。
- 回调完成后仍签发当前 cookie session。

## 对象存储迁移

当前 `src/lib/storage.ts` 返回 public URL。迁移到 MinIO / S3 / OSS 时：

- 保持 `saveUploadedAsset` 和 `saveGeneratedGameAssets` 接口。
- 将本地 `writeFile` 替换为 SDK `putObject`。
- URL 可改为 CDN public URL 或签名 URL。
- 页面和 API 继续只读取数据库中的 `manifestUrl` / `entryUrl` / `assetUrl`。
