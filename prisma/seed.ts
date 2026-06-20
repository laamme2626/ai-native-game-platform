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

const seeds = [
  {
    id: "seed-cat-forest-choice",
    prompt: "生成一个可爱的猫咪逃出魔法森林的互动小游戏，有 3 个场景和 2 个结局",
  },
  {
    id: "seed-cyber-city-dodge",
    prompt: "赛博城市里黑客躲避无人机，玩家操控蓝色角色块坚持 30 秒",
  },
  {
    id: "seed-pirate-treasure-quiz",
    prompt: "海盗船长在风暴甲板上进行宝藏问答闯关，答对三题打开宝箱",
  },
  {
    id: "seed-school-exam-memory",
    prompt: "校园考试翻牌记忆游戏，配对知识点和遗失笔记",
  },
  {
    id: "seed-space-ship-clicker",
    prompt: "太空飞船点击收集能量核心，达到目标分数获胜",
  },
  {
    id: "seed-forest-escape-room",
    prompt: "古堡钟楼密室逃脱，玩家调查齿轮、钟摆和月光档案，输入关键道具打开塔楼出口",
  },
];
const seedIds = seeds.map((seed) => seed.id);
const seedJobIds = seeds.map((seed) => `${seed.id}-job`);

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
    where: { jobId: { in: seedJobIds } },
  });
  await prisma.generationJob.deleteMany({
    where: {
      userId: user.id,
      OR: [{ id: { in: seedJobIds } }, { gameId: { in: seedIds } }],
    },
  });
  await prisma.favorite.deleteMany({ where: { userId: user.id, gameId: { in: seedIds } } });
  await prisma.game.deleteMany({
    where: {
      ownerId: user.id,
      OR: [
        { id: "seed-forest-escape-room" },
        { id: "seed-forest-escape-room-duplicate" },
      ],
    },
  });

  for (const [index, seed] of seeds.entries()) {
    const jobId = `${seed.id}-job`;
    const job = await prisma.generationJob.upsert({
      where: { id: jobId },
      update: {
        userId: user.id,
        prompt: seed.prompt,
        status: "running",
        error: null,
        gameId: null,
        sourceGameId: null,
        assetName: null,
        assetUrl: null,
        assetType: null,
        assetSize: null,
        estimatedTokens: 0,
        estimatedCostCents: 0,
        generationStepsCount: 0,
      },
      create: {
        id: jobId,
        userId: user.id,
        prompt: seed.prompt,
        status: "running",
      },
    });

    await prisma.agentLog.deleteMany({
      where: { jobId: job.id },
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

    const spec = generateConstrainedGameSpec(seed.prompt);
    if (seed.id === "seed-forest-escape-room") {
      spec.title = "古堡钟楼密室逃脱";
      spec.description = "在古堡钟楼里调查齿轮、钟摆和月光档案，收集 3 条线索后输入关键道具打开塔楼出口。";
      spec.theme = "clocktower_escape";
      spec.protagonist = "一名夜巡档案员";
      spec.visualStyle = "冷月光、石墙、铜制齿轮和简洁悬疑感";
      spec.playerGoal = "找到钟楼出口的关键道具并解开塔楼门锁";
      spec.tags = ["密室逃脱", "逃脱", "解谜", "悬疑", "中等", "5 分钟"];
      spec.items = ["铜齿轮", "钟摆钥匙", "月光档案"];
      spec.scenes = [
        {
          id: "start",
          title: "齿轮机房",
          text: "夜巡档案员进入停摆的古堡钟楼，墙上的铜齿轮缺了一块。",
          choices: [
            { label: "检查缺口里的铜粉", nextSceneId: "middle", effects: { 专注: 2 }, item: "铜齿轮" },
            { label: "沿着钟声回音上楼", nextSceneId: "ally", effects: { 勇气: 2 }, item: "钟摆钥匙" },
          ],
        },
        {
          id: "middle",
          title: "停摆钟室",
          text: "钟摆后方夹着月光档案，档案页写着出口机关的顺序。",
          choices: [
            { label: "装回铜齿轮并转动钟摆", nextSceneId: "good_end", effects: { 专注: 1, 勇气: 1 }, item: "月光档案" },
            { label: "先记录档案再寻找侧门", nextSceneId: "bittersweet_end", effects: { 专注: 2 } },
          ],
        },
        {
          id: "ally",
          title: "月光档案室",
          text: "档案室的窗格投下钥匙形状的光，提示钟摆钥匙并不是普通钥匙。",
          choices: [
            { label: "把钟摆钥匙插入月光机关", nextSceneId: "good_end", effects: { 勇气: 2 } },
            { label: "回到钟室验证档案编号", nextSceneId: "bittersweet_end", effects: { 专注: 2 } },
          ],
        },
        { id: "good_end", title: "理想结局", text: "塔楼出口打开，停摆多年的钟声重新响起。", choices: [] },
        { id: "bittersweet_end", title: "代价结局", text: "你找到出口，却选择留下整理失落档案。", choices: [] },
      ];
      spec.escapeRoom = {
        roomName: "古堡钟楼",
        clues: [
          { id: "clue_0", label: "铜齿轮", text: "铜齿轮背面刻着钟摆的方向。" },
          { id: "clue_1", label: "钟摆钥匙", text: "钟摆钥匙只能在月光照到时转动。" },
          { id: "clue_2", label: "月光档案", text: "档案写明关键道具是钟摆钥匙。" },
        ],
        puzzles: [
          { question: "输入关键道具名称打开塔楼出口", answer: "钟摆钥匙", reward: "塔楼出口打开，停摆多年的钟声重新响起。" },
        ],
      };
    }
    validateGameSpec(spec);
    const game = await prisma.game.upsert({
      where: { id: seed.id },
      update: {
        ownerId: user.id,
        title: spec.title,
        description: spec.description,
        prompt: seed.prompt,
        tags: spec.tags.join(","),
        status: "published",
        manifestUrl: "",
        entryUrl: "",
        specUrl: "",
        coverUrl: null,
        assetName: null,
        assetUrl: null,
        assetType: null,
        playCount: 18 + index * 7,
        likeCount: 5 + index * 3,
        favoriteCount: 0,
        publishedAt: new Date(Date.now() - index * 3600_000),
      },
      create: {
        id: seed.id,
        ownerId: user.id,
        title: spec.title,
        description: spec.description,
        prompt: seed.prompt,
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
