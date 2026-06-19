import { prisma } from "@/lib/db";
import {
  generateConstrainedGameSpec,
  renderGameHtml,
  validateGameSpec,
} from "@/lib/game-spec";
import { buildLocalManifest, saveGeneratedGameAssets } from "@/lib/storage";

async function log(jobId: string, message: string, metadata?: unknown) {
  await prisma.agentLog.create({
    data: {
      jobId,
      message,
      metadata: metadata === undefined ? undefined : JSON.parse(JSON.stringify(metadata)),
    },
  });
}

export async function runGenerationJob(jobId: string) {
  const job = await prisma.generationJob.findUnique({ where: { id: jobId } });
  if (!job || job.status === "succeeded" || job.status === "running") return;

  await prisma.generationJob.update({
    where: { id: jobId },
    data: { status: "running", error: null },
  });

  try {
    await log(jobId, "Agent accepted generation job", { prompt: job.prompt });
    const spec = generateConstrainedGameSpec(job.prompt);
    await log(jobId, "Generated constrained game_spec.json", {
      scenes: spec.scenes.length,
      stats: spec.stats.map((stat) => stat.name),
    });

    validateGameSpec(spec);
    await log(jobId, "Validated game_spec.json against MVP constraints");

    const game = await prisma.game.create({
      data: {
        ownerId: job.userId,
        title: spec.title,
        description: spec.description,
        prompt: job.prompt,
        status: "draft",
        manifestUrl: "",
        entryUrl: "",
        specUrl: "",
      },
    });

    const manifest = buildLocalManifest({
      gameId: game.id,
      title: spec.title,
      description: spec.description,
    });
    const html = renderGameHtml(spec);
    await log(jobId, "Rendered manifest.json and sandboxable index.html");

    const saved = await saveGeneratedGameAssets({
      gameId: game.id,
      spec,
      manifest,
      html,
    });
    await log(jobId, "Saved generated assets through storage service", saved);

    await prisma.game.update({
      where: { id: game.id },
      data: {
        manifestUrl: saved.manifestUrl,
        entryUrl: saved.entryUrl,
        specUrl: saved.specUrl,
      },
    });
    await prisma.generationJob.update({
      where: { id: jobId },
      data: { status: "succeeded", gameId: game.id },
    });
    await log(jobId, "Generation finished; draft game is ready to preview");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await prisma.generationJob.update({
      where: { id: jobId },
      data: { status: "failed", error: message },
    });
    await log(jobId, "Generation failed", { error: message });
  }
}
