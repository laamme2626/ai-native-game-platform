import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const { id } = await params;
  const source = await prisma.game.findUnique({ where: { id } });
  if (!source) return NextResponse.json({ error: "未找到原游戏" }, { status: 404 });

  const remix = await prisma.game.create({
    data: {
      ownerId: user.id,
      parentGameId: source.id,
      version: source.version + 1,
      title: `${source.title} Remix`,
      description: source.description,
      prompt: `${source.prompt}\n\nRemix demo from ${source.title}`,
      tags: source.tags,
      status: "draft",
      manifestUrl: source.manifestUrl,
      entryUrl: source.entryUrl,
      specUrl: source.specUrl,
      coverUrl: source.coverUrl,
      assetName: source.assetName,
      assetUrl: source.assetUrl,
      assetType: source.assetType,
    },
  });

  return NextResponse.json({ gameId: remix.id });
}
