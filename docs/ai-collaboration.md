# AI 协作说明

## 使用方式

本项目使用 Codex / ChatGPT 辅助完成从空目录到 MVP 的搭建，以及本轮全量验收补齐。

## 关键 Prompt 摘要

- 从零实现 AI Native 互动游戏 Web 平台 MVP。
- 使用 Next.js App Router、TypeScript、Tailwind、Prisma、SQLite。
- 不接真实付费 API，对象存储用本地 mock。
- 用户可注册登录、创建生成任务、查看 Agent 日志、预览发布、首页展示、Play 动态加载 manifest。
- 本轮要求中文化、素材上传、统计、详情页、我的作品、Remix、内容审核、成本统计和文档补齐。

## AI 贡献比例

- 代码生成和文档初稿：约 80%。
- 人工约束、验收标准、产品方向：约 20%。

## 人工 Review 和测试方式

- 用户给出明确验收清单和执行边界。
- Codex 按阶段修改项目文件。
- 使用 `npm run lint`、`npm run build`、`npm run db:seed` 验证。
- Git 提交前检查忽略规则，避免提交 `.env`、`dev.db` 和生成产物。

## 典型问题和修复

- PowerShell 环境下 `npm.ps1` 被执行策略拦截，改用 `npm.cmd`。
- Prisma 7 SQLite 需要 better-sqlite3 adapter，已接入 `@prisma/adapter-better-sqlite3`。
- React lint 禁止 effect 内同步 setState，改为异步 tick / callback。
- 生成器最初会照搬 prompt，已改为主题化 fallback generator。
- 预览后返回发布流程不顺，已通过 `fromJob` 参数补齐。
