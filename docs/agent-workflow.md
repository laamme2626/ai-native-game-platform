# Agent 工作流

## 当前实现

代码仍是单进程 orchestrator，但日志模拟 Multi-Agent workflow：

1. Requirement Parser Agent：读取用户创意，处理上传素材。
2. Safety Check Agent：执行 Demo 内容审核，校验 `game_spec`。
3. Game Designer Agent：识别主题、角色、风格，生成游戏结构。
4. Manifest Builder Agent：生成 `manifest.json` 和固定模板 `index.html`。
5. Storage Publisher Agent：写入对象存储 mock，更新数据库。
6. Agent Orchestrator：汇总状态、成本统计、等待预览/发布。

## game_spec schema

核心字段：

- `schemaVersion`
- `title`
- `description`
- `theme`
- `protagonist`
- `visualStyle`
- `playerGoal`
- `tags`
- `items`
- `stats`
- `scenes`
- `endingSceneIds`

每个 scene 包含 `id`、`title`、`text`、`choices`。每个 choice 指向 `nextSceneId`，并可带 `effects` 和 `item`。

## 生成策略

本地 fallback generator 根据关键词识别主题：

- 猫咪 / 魔法森林
- 赛博 / 城市
- 海盗 / 宝藏
- 校园 / 考试
- 太空 / 飞船

它不会直接照搬 prompt 作为标题，而是生成短标题、场景、道具、选项和结局。

## manifest / index.html

- `manifest.json` 记录 title、description、tags、entry URL、spec URL、asset URL。
- `index.html` 使用应用固定安全模板渲染互动剧情。
- 模型或 fallback generator 不直接生成任意 JS 作为核心逻辑。

## 真实 LLM 扩展

后续接入真实 LLM 时，system prompt 应要求：

- 只输出 JSON。
- 必须符合 `game_spec` schema。
- 不输出 HTML、JS、外链脚本或凭据。
- 不绕过内容安全和上传限制。
- 结局、选项、道具必须可校验。

生成后仍必须经过 schema 校验，不通过则重试或失败。
