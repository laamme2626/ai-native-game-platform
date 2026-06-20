# Agent 工作流

## 当前实现

代码仍是单进程 orchestrator，但日志模拟 Multi-Agent workflow：

1. Requirement Parser Agent：读取用户创意，处理上传素材。
2. Safety Check Agent：执行 Demo 内容审核，校验 `game_spec`。
3. Game Designer Agent：识别主题、角色、风格和游戏类型，生成多类型游戏结构。
4. Runtime Builder Agent：按 `game_spec.type` 选择固定 runtime 模板，生成 `manifest.json` 和 `index.html`。
5. QA Validator Agent：校验 schema、开始条件、胜负条件和可玩目标。
6. Storage Publisher Agent：写入对象存储 mock，更新数据库。
7. Agent Orchestrator：汇总状态、成本统计、等待预览/发布。

## game_spec schema

核心字段：

- `schemaVersion`
- `type`: `choice_adventure`、`quiz`、`clicker`、`memory`、`dodge`、`escape_room`
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
- type-specific 字段：`quiz`、`clicker`、`memory`、`dodge`、`escapeRoom`

每个 scene 包含 `id`、`title`、`text`、`choices`。每个 choice 指向 `nextSceneId`，并可带 `effects` 和 `item`。

## 生成策略

本地 fallback generator 根据关键词识别主题和游戏类型：

- 猫咪 / 魔法森林
- 赛博 / 城市
- 海盗 / 宝藏
- 校园 / 考试
- 太空 / 飞船

游戏类型识别：

- 选择 / 剧情 / 结局 → `choice_adventure`
- 问答 / 测验 / 答题 → `quiz`
- 点击 / 收集 / 分数 → `clicker`
- 记忆 / 翻牌 / 配对 → `memory`
- 躲避 / 飞船 / 障碍 / 生存 → `dodge`
- 密室 / 逃脱 / 谜题 / 找线索 → `escape_room`

它不会直接照搬 prompt 作为标题，而是生成短标题、按玩法区分的简介、场景、道具、选项和结局。具体设计底线见 `docs/mini-game-design-guide.md`。

类型化可玩性要求：

- `quiz` 至少 5 道题，并展示每题解释。
- `clicker` 使用随机目标、奖励和干扰物，不允许只有一个静态大按钮。
- `memory` 使用多组可配对卡牌和步数限制。
- `dodge` 必须有开始按钮、倒计时和逐步增加的障碍，不能进入即失败。
- `escape_room` 必须有线索收集、答案输入、失败提示。

## manifest / index.html

- `manifest.json` 记录 title、description、tags、entry URL、spec URL、asset URL。
- `index.html` 使用应用固定安全模板渲染多类型小游戏。
- 模型或 fallback generator 不直接生成任意 JS 作为核心逻辑。

## 真实 LLM 扩展

当前已提供可选 OpenAI-compatible provider。默认 fallback，无 API key 也能运行。真实 LLM 的 system prompt 要求：

- 只输出 JSON。
- 必须符合 `game_spec` schema。
- 不输出 HTML、JS、外链脚本或凭据。
- 不绕过内容安全和上传限制。
- 结局、选项、道具必须可校验。

生成后仍必须经过 schema 校验，不通过则重试或失败。

## Multi-Agent 模型分配

当前 Demo 里所有 Agent 共用一个 provider。生产环境可以拆分：

- Requirement Parser / Game Designer / QA Validator：强模型
- Safety / tags / summary：便宜快模型
- Runtime Builder / Storage Publisher：纯代码，不需要模型

模型输出校验失败时，系统会记录“模型输出校验失败，已回退到 fallback generator”，然后继续用本地 generator 保证 Demo 可运行。
