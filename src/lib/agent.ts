import { prisma } from "@/lib/db";
import {
  checkPromptSafety,
  generateConstrainedGameSpec,
  renderGameHtml,
  validateGameSpec,
} from "@/lib/game-spec";
import { buildLocalManifest, saveGeneratedGameAssets } from "@/lib/storage";

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
    await log(jobId, "Requirement Parser Agent", "读取用户创意", {
      promptLength: job.prompt.length,
    });
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

    const spec = generateConstrainedGameSpec(job.prompt);
    await log(jobId, "Game Designer Agent", "识别主题 / 角色 / 风格", {
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
    await log(jobId, "Game Designer Agent", "生成 game_spec.json");

    validateGameSpec(spec);
    await log(jobId, "Safety Check Agent", "校验 game_spec 通过");

    const game = await prisma.game.create({
      data: {
        ownerId: job.userId,
        title: spec.title,
        description: spec.description,
        prompt: job.prompt,
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
    await log(jobId, "Manifest Builder Agent", "生成 manifest.json 和 index.html", {
      manifestSchemaVersion: manifest.schemaVersion,
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
