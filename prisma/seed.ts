import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import {
  generateConstrainedGameSpec,
  renderGameHtml,
  validateGameSpec,
} from "../src/lib/game-spec";
import { buildLocalManifest, saveGeneratedGameAssets } from "../src/lib/storage";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

const prompts = [
  "生成一个可爱的猫咪逃出魔法森林的互动小游戏，有 3 个场景和 2 个结局",
  "赛博城市里黑客躲避无人机，寻找芯片钥匙打开数据金库",
  "海盗船长在风暴甲板上寻找藏宝图和失落宝箱",
];

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "demo@yahaha.local" },
    update: {},
    create: {
      email: "demo@yahaha.local",
      passwordHash: await bcrypt.hash("password123", 12),
    },
  });

  await prisma.agentLog.deleteMany({
    where: { job: { userId: user.id } },
  });
  await prisma.generationJob.deleteMany({ where: { userId: user.id } });
  await prisma.game.deleteMany({ where: { ownerId: user.id } });

  for (const [index, prompt] of prompts.entries()) {
    const job = await prisma.generationJob.create({
      data: {
        userId: user.id,
        prompt,
        status: "running",
      },
    });

    await prisma.agentLog.createMany({
      data: [
        {
          jobId: job.id,
          agentName: "Requirement Parser Agent",
          message: "读取用户创意",
        },
        {
          jobId: job.id,
          agentName: "Safety Check Agent",
          message: "内容安全检查通过",
        },
        {
          jobId: job.id,
          agentName: "Game Designer Agent",
          message: "生成游戏结构",
        },
      ],
    });

    const spec = generateConstrainedGameSpec(prompt);
    validateGameSpec(spec);
    const game = await prisma.game.create({
      data: {
        ownerId: user.id,
        title: spec.title,
        description: spec.description,
        prompt,
        tags: spec.tags.join(","),
        status: "published",
        manifestUrl: "",
        entryUrl: "",
        specUrl: "",
        playCount: 18 + index * 7,
        likeCount: 5 + index * 3,
        favoriteCount: 3 + index * 2,
        publishedAt: new Date(Date.now() - index * 3600_000),
      },
    });
    const manifest = buildLocalManifest({
      gameId: game.id,
      title: spec.title,
      description: spec.description,
      tags: spec.tags,
    });
    const saved = await saveGeneratedGameAssets({
      gameId: game.id,
      spec,
      manifest,
      html: renderGameHtml(spec),
    });
    await prisma.game.update({
      where: { id: game.id },
      data: saved,
    });
    await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        status: "succeeded",
        gameId: game.id,
        estimatedTokens: 1800 + index * 320,
        estimatedCostCents: 8 + index,
        generationStepsCount: 11,
      },
    });
    await prisma.agentLog.createMany({
      data: [
        {
          jobId: job.id,
          agentName: "Manifest Builder Agent",
          message: "生成 manifest.json 和 index.html",
        },
        {
          jobId: job.id,
          agentName: "Storage Publisher Agent",
          message: "写入对象存储 mock",
        },
        {
          jobId: job.id,
          agentName: "Agent Orchestrator",
          message: "等待预览 / 发布",
        },
      ],
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
