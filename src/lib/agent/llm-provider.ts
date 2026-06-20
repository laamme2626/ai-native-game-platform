import {
  generateConstrainedGameSpec,
  GameSpec,
  validateGameSpec,
} from "@/lib/game-spec";

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

  if (provider !== "openai-compatible" || !apiKey) {
    return { spec: generateConstrainedGameSpec(prompt), provider: "fallback" };
  }

  try {
    const spec = await callOpenAICompatible(prompt, apiKey);
    validateGameSpec(spec);
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
            "你是受约束的 game_spec 生成器。只输出 JSON，不输出 Markdown。schemaVersion 必须为 1。type 必须是 choice_adventure、quiz、clicker、memory、dodge、escape_room 之一。必须包含 title、description、theme、protagonist、visualStyle、playerGoal、tags、items、stats、scenes、endingSceneIds，并按 type 补齐 quiz/clicker/memory/dodge/escapeRoom 字段。不要输出任意 JS、HTML、外链脚本或密钥。",
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
