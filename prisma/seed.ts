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
  "赛博城市里黑客躲避无人机，玩家操控蓝色角色块坚持 30 秒",
  "海盗船长在风暴甲板上进行宝藏问答闯关，答对三题打开宝箱",
  "校园考试翻牌记忆游戏，配对知识点和遗失笔记",
  "太空飞船点击收集能量核心，达到目标分数获胜",
  "魔法森林密室逃脱，找到三个线索后输入关键道具开门",
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
        favoriteCount: 0,
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
