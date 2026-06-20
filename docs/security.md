# 安全说明

## 已实现

- 密码使用 bcrypt hash。
- session 使用签名 JWT，存放在 HTTP-only cookie。
- Create、Job Detail、My Works 需要登录。
- 发布、取消发布校验 owner。
- Play 页使用 `<iframe sandbox="allow-scripts">`。
- 生成游戏通过受约束 `game_spec` 和固定 HTML 模板运行。
- 上传素材限制类型和 2MB 大小。
- Demo 内容审核会拒绝明显危险词。

## Prompt Injection 风险

用户 prompt 可能要求输出不安全代码或越权读取数据。本项目不执行模型直接生成的 JS，而是只接受受约束的 `game_spec`，再由应用模板渲染，降低 prompt injection 的执行面。

## 素材上传风险

当前只做 MIME 和大小限制，生产环境还应：

- 文件内容扫描。
- 图片重编码。
- 病毒扫描。
- 存储隔离。
- 私有 bucket + CDN 或签名 URL。

## 密钥保护

- `.env` 被 gitignore。
- `.env.example` 只放占位值。
- 不应提交真实 OAuth、LLM、对象存储密钥。

## 资源限制和成本统计

当前 prompt 长度、上传大小、estimated tokens/cost 都是 Demo 级限制。生产环境应接入：

- 用户级 quota。
- IP / 用户限流。
- 真实 moderation。
- 真实 billing 和 token usage。
- 异步队列和任务超时。

## 为什么不用模型直接生成代码

直接执行模型生成代码会扩大 XSS、数据泄漏、无限循环、恶意外链等风险。MVP 使用 `game_spec` 作为中间层，由可信模板渲染互动逻辑，既能 Demo AI Native 生成，也能保持可控安全边界。

## OAuth 当前状态

登录页展示 GitHub / Google Demo 入口，但不接真实 OAuth。生产接入需要 state、PKCE、callback 校验、账号绑定表和 token 加密存储。
