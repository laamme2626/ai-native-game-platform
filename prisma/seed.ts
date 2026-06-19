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
  "A neon rain detective story where memories are traded as currency",
  "A tiny kingdom inside a broken arcade cabinet seeking a new ruler",
  "A lunar greenhouse mystery where plants whisper possible futures",
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

  for (const prompt of prompts) {
    const existing = await prisma.game.findFirst({ where: { prompt } });
    if (existing) continue;

    const spec = generateConstrainedGameSpec(prompt);
    validateGameSpec(spec);
    const game = await prisma.game.create({
      data: {
        ownerId: user.id,
        title: spec.title,
        description: spec.description,
        prompt,
        status: "published",
        manifestUrl: "",
        entryUrl: "",
        specUrl: "",
        publishedAt: new Date(),
      },
    });
    const manifest = buildLocalManifest({
      gameId: game.id,
      title: spec.title,
      description: spec.description,
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
