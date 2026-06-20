# 架构说明

## 模块协作

- 前端页面：Next.js App Router 渲染 Home、Create、Job Detail、Game Detail、My Works、Play。
- 后端 API：App Router API routes 处理认证、任务创建、发布、取消发布、统计、Remix。
- 数据库：Prisma + SQLite 保存用户、游戏、生成任务、Agent 日志。
- 对象存储 mock：`src/lib/storage.ts` 写入 `public/generated/games` 和 `public/generated/uploads`。
- Agent Orchestrator：`src/lib/agent.ts` 在单进程内模拟多个 Agent 步骤。

## 页面路由

- `/` 首页：published 游戏、搜索、标签筛选、统计操作。
- `/login` `/register`：邮箱密码认证和 OAuth Demo 入口。
- `/create`：受保护页面，提交 prompt 和素材。
- `/jobs/[id]`：受保护页面，轮询任务状态和日志。
- `/games/[id]`：游戏详情页。
- `/my`：受保护页面，管理我的作品和任务历史。
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
- `POST /api/games/[id]/remix`

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
10. Play 页从 DB 读取 meta，再动态 fetch manifest 并 iframe sandbox 运行 entry。

## 数据模型

- `User`：邮箱、密码 hash、游戏、生成任务。
- `Game`：owner、parentGameId、version、标题、简介、标签、状态、manifestUrl、entryUrl、specUrl、素材信息、统计字段。
- `GenerationJob`：prompt、状态、素材信息、错误、模拟 tokens/cost/steps、关联 game。
- `AgentLog`：job、agentName、level、message、metadata、createdAt。

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
