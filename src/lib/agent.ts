import { prisma } from "@/lib/db";
import {
  checkPromptSafety,
  renderGameHtml,
  validateGameSpec,
} from "@/lib/game-spec";
import {
  assertSupportedPrompt,
  UnsupportedGameTypeError,
} from "@/lib/game-type-registry";
import { buildLocalManifest, saveGeneratedGameAssets } from "@/lib/storage";
import { generateGameSpecWithProvider } from "@/lib/agent/llm-provider";

async function log(
  jobId: string,
  agentName: string,
  message: string,
  metadata?: unknown,
  level = "info",
) {
  await prisma.agentLog.create({
    data: {
      jobId,
      agentName,
      level,
      message,
      metadata:
        metadata === undefined ? undefined : JSON.parse(JSON.stringify(metadata)),
    },
  });
}

function simulatedCost(promptLength: number, steps: number) {
  const estimatedTokens = 900 + promptLength * 3 + steps * 120;
  return {
    estimatedTokens,
    estimatedCostCents: Math.max(1, Math.round(estimatedTokens * 0.004)),
    generationStepsCount: steps,
  };
}

export async function runGenerationJob(jobId: string) {
  const job = await prisma.generationJob.findUnique({ where: { id: jobId } });
  if (!job || job.status === "succeeded" || job.status === "running") return;

  await prisma.generationJob.update({
    where: { id: jobId },
    data: { status: "running", error: null },
  });

  try {
    const sourceGame = job.sourceGameId
      ? await prisma.game.findUnique({ where: { id: job.sourceGameId } })
      : null;
    await log(jobId, "Requirement Parser Agent", "读取用户创意", {
      promptLength: job.prompt.length,
      sourceGameId: job.sourceGameId,
    });
    if (sourceGame) {
      await log(jobId, "Requirement Parser Agent", "读取 Remix 源游戏", {
        sourceTitle: sourceGame.title,
        sourceSpecUrl: sourceGame.specUrl,
      });
    }
    if (job.assetUrl) {
      await log(jobId, "Requirement Parser Agent", "处理上传素材", {
        assetName: job.assetName,
        assetType: job.assetType,
        assetSize: job.assetSize,
      });
    } else {
      await log(jobId, "Requirement Parser Agent", "本次未上传素材");
    }

    checkPromptSafety(job.prompt);
    await log(jobId, "Safety Check Agent", "内容安全检查通过");

    const effectivePrompt = sourceGame
      ? `${sourceGame.prompt}\nRemix 修改要求：${job.prompt}`
      : job.prompt;
    const requestedType = assertSupportedPrompt(effectivePrompt);
    await log(jobId, "Requirement Parser Agent", "识别到支持的游戏类型", {
      detectedType: requestedType.detectedType,
      type: requestedType.type,
      adaptationNotes: requestedType.adaptationNotes,
    });
    if (requestedType.adaptationNotes) {
      await log(
        jobId,
        "Requirement Parser Agent",
        "玩法需求已安全降级到现有 runtime template",
        { adaptationNotes: requestedType.adaptationNotes },
        "warn",
      );
    }
    const result = await generateGameSpecWithProvider(effectivePrompt);
    const spec = result.spec;
    await log(jobId, "Game Designer Agent", `使用 ${result.provider} provider 生成 game_spec`);
    if (result.fallbackReason) {
      await log(
        jobId,
        "QA Validator Agent",
        "模型输出校验失败，已回退到 fallback generator",
        { reason: result.fallbackReason },
        "warn",
      );
    }
    if (sourceGame) {
      spec.title = `${sourceGame.title} Remix`;
      spec.description = `${sourceGame.description} Remix 修改：${job.prompt}`;
      spec.tags = Array.from(new Set([...sourceGame.tags.split(",").filter(Boolean), ...spec.tags]));
    }
    await log(jobId, "Requirement Parser Agent", "识别游戏类型 / 主题 / 角色 / 风格", {
      type: spec.type,
      theme: spec.theme,
      protagonist: spec.protagonist,
      visualStyle: spec.visualStyle,
      tags: spec.tags,
    });
    await log(jobId, "Game Designer Agent", "生成游戏结构", {
      scenes: spec.scenes.length,
      endings: spec.endingSceneIds.length,
      items: spec.items,
    });
    await log(jobId, "Game Designer Agent", "生成多类型 game_spec.json");

    validateGameSpec(spec, effectivePrompt);
    await log(jobId, "QA Validator Agent", "校验 game_spec schema 和可玩目标通过", {
      type: spec.type,
      adaptationNotes: spec.adaptationNotes,
    });

    const game = await prisma.game.create({
      data: {
        ownerId: job.userId,
        parentGameId: sourceGame?.id,
        version: sourceGame ? sourceGame.version + 1 : 1,
        title: spec.title,
        description: spec.description,
        prompt: effectivePrompt,
        tags: spec.tags.join(","),
        status: "draft",
        manifestUrl: "",
        entryUrl: "",
        specUrl: "",
        assetName: job.assetName,
        assetUrl: job.assetUrl,
        assetType: job.assetType,
      },
    });

    const manifest = buildLocalManifest({
      gameId: game.id,
      title: spec.title,
      description: spec.description,
      tags: spec.tags,
      assetUrl: job.assetUrl,
    });
    const html = renderGameHtml(spec, job.assetUrl);
    await log(jobId, "Runtime Builder Agent", "根据 game_spec.type 生成 manifest.json 和 index.html", {
      manifestSchemaVersion: manifest.schemaVersion,
      gameType: spec.type,
    });

    const saved = await saveGeneratedGameAssets({
      gameId: game.id,
      spec,
      manifest,
      html,
    });
    await log(jobId, "Storage Publisher Agent", "写入对象存储 mock", saved);

    await prisma.game.update({
      where: { id: game.id },
      data: {
        manifestUrl: saved.manifestUrl,
        entryUrl: saved.entryUrl,
        specUrl: saved.specUrl,
      },
    });
    const cost = simulatedCost(job.prompt.length, 11);
    await prisma.generationJob.update({
      where: { id: jobId },
      data: {
        status: "succeeded",
        gameId: game.id,
        ...cost,
      },
    });
    await log(jobId, "Storage Publisher Agent", "写入数据库");
    await log(jobId, "Agent Orchestrator", "等待预览 / 发布", cost);
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    const cost = simulatedCost(job.prompt.length, 5);
    if (error instanceof UnsupportedGameTypeError) {
      await prisma.generationJob.update({
        where: { id: jobId },
        data: { status: "failed", error: message, ...cost },
      });
      await log(
        jobId,
        "Requirement Parser Agent",
        "识别到 unsupported game type",
        error.toPayload(),
        "warn",
      );
      await log(
        jobId,
        "Agent Orchestrator",
        "生成任务终止",
        { code: error.code, detectedType: error.detectedType, ...cost },
        "error",
      );
      return;
    }
    await prisma.generationJob.update({
      where: { id: jobId },
      data: { status: "failed", error: message, ...cost },
    });
    await log(
      jobId,
      "Agent Orchestrator",
      "生成失败",
      { error: message, ...cost },
      "error",
    );
  }
}
