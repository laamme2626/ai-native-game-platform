# 交付状态

## 已完成

- 全站主要用户文案中文化。
- 邮箱注册、登录、退出登录。
- 登录状态刷新保持。
- GitHub / Google 第三方登录 Demo 入口。
- 首页 published 游戏展示、搜索、分类标签筛选。
- 游戏卡片统计：游玩、点赞、用户级收藏。
- `/favorites` 我的收藏页。
- `Favorite` 模型，防止同一用户重复收藏同一游戏。
- `/games/[id]` 游戏详情页。
- `/my` 我的作品页和生成任务历史。
- Create prompt 长度限制、素材上传、类型和大小校验。
- generation job、Agent logs、失败重试、成功预览/发布。
- 多 Agent 角色日志。
- 模拟 tokens、cost、steps。
- 主题化 fallback generator。
- 本地 storage mock 保存上传素材和生成产物。
- Play 动态加载 manifest/entry，sandbox iframe 运行。
- fromJob 预览返回任务 / 发布 / 返回首页。
- 发布、取消发布、删除草稿/作品、Remix 派生。
- Remix 通过 Create 创建新任务，生成新的 draft，并记录 parent/source 关系。
- Play 加载状态机：读取信息、加载 manifest、启动运行环境、运行中、失败。
- 多类型小游戏协议和 runtime：互动剧情、问答、点击、记忆、躲避、密室逃脱。
- 可选 OpenAI-compatible LLM Provider，默认 fallback。
- 删除作品后清理 `public/generated/games/{gameId}` 并跳转首页。

## 部分完成 / Mock

- OAuth 是 UI + 文档设计，不接真实 provider。
- Agent 默认是本地规则 generator；真实 LLM provider 是可选配置，未配置 key 时不调用外部服务。
- 内容审核是关键词 Demo，不是生产 moderation。
- 成本统计是模拟值。
- 对象存储是本地 public 目录 mock。
- 删除游戏会清理本地 `public/generated/games/{gameId}`；上传素材目录仍由后续生命周期任务清理。
- Remix 是轻量派生，不提供完整差异编辑器。

这些不影响 Demo 主链路验收。

## 未完成

- 真实异步队列。
- 真实云对象存储。
- 真实 LLM Provider 只完成 OpenAI-compatible 单 provider；未做多 provider 管理台。
- 端到端自动化测试。
- 用户级点赞去重。
- 完整版本 diff / 协作编辑。

## 如果再给 1 周

- 接入队列和 worker。
- 增加更多 LLM provider、重试策略和模型成本看板。
- 接入 MinIO/S3/OSS。
- 增加 Playwright 主链路测试。
- 增加 quota、rate limit、CSRF。
- 做完整 Remix 编辑器和版本 diff。

## 主链路验收

1. 注册或登录。
2. 进入创建游戏。
3. 输入创意并上传素材。
4. 查看生成任务、日志和成本统计。
5. 预览生成游戏。
6. 发布。
7. 回首页搜索或筛选找到游戏。
8. 进入详情页，点赞、收藏、开始游玩。
9. 在我的收藏中确认收藏/取消收藏。
10. 在我的作品中取消发布、删除草稿或 Remix。

## 测试命令

```bash
npm run db:seed
npm run db
npm run lint
npm run build
```

最近一次结果：

- `npm run db`：通过
- `npm run lint`：通过
- `npm run build`：通过
