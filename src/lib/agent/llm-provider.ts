import {
  generateConstrainedGameSpec,
  GameSpec,
  validateGameSpec,
} from "@/lib/game-spec";
import { assertSupportedPrompt, supportedGameTypeValues } from "@/lib/game-type-registry";

export type GeneratedSpecResult = {
  spec: GameSpec;
  provider: "fallback" | "openai-compatible";
  fallbackReason?: string;
};

export async function generateGameSpecWithProvider(
  prompt: string,
): Promise<GeneratedSpecResult> {
  const provider = process.env.LLM_PROVIDER ?? "fallback";
  const apiKey = process.env.OPENAI_API_KEY;
  const requestedType = assertSupportedPrompt(prompt);

  if (provider !== "openai-compatible" || !apiKey) {
    return { spec: generateConstrainedGameSpec(prompt), provider: "fallback" };
  }

  try {
    const spec = await callOpenAICompatible(prompt, apiKey);
    if (spec.type !== requestedType.type) {
      throw new Error(`模型输出 type ${spec.type} 与识别到的 ${requestedType.type} 不一致`);
    }
    if (requestedType.adaptationNotes && !spec.adaptationNotes) {
      spec.adaptationNotes = requestedType.adaptationNotes;
    }
    validateGameSpec(spec, prompt);
    return { spec, provider: "openai-compatible" };
  } catch (error) {
    return {
      spec: generateConstrainedGameSpec(prompt),
      provider: "fallback",
      fallbackReason:
        error instanceof Error ? error.message : "模型输出校验失败，已回退到 fallback generator",
    };
  }
}

async function callOpenAICompatible(prompt: string, apiKey: string) {
  const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            `你是受约束的 game_spec 生成器。只输出 JSON，不输出 Markdown。schemaVersion 必须为 1。type 只能从 supported game types 中选择：${supportedGameTypeValues.join("、")}。必须包含 title、description、theme、protagonist、visualStyle、playerGoal、tags、items、stats、scenes、endingSceneIds，并按 type 补齐 quiz/clicker/memory/dodge/escapeRoom/sideBattle/runner/platformer 字段。side_battle 必须使用 sideBattle.player/name/maxHp/moveSpeed/attackDamage、sideBattle.enemy/name/maxHp/moveSpeed/attackDamage、sideBattle.controls/left/right/attack/guard/restart、winCondition、loseCondition、sceneTheme。不能把不匹配玩法塞进其他 type：横屏对战不能塞进 dodge，赛车不能塞进 runner 除非明确降级为轻量横版跑酷并写 adaptationNotes，音游不能塞进 clicker。如果需要降级，必须写 adaptationNotes，并且仍然匹配 runtime template；无法合理降级时应返回 unsupported type 错误对象，不要生成坏 spec。不要输出任意 JS、HTML、外链脚本或密钥。`,
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`模型请求失败：${response.status}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("模型没有返回 JSON 内容");
  }
  return JSON.parse(content) as GameSpec;
}
