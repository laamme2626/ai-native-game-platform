import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "请先登录后收藏" }, { status: 401 });
  const { id } = await params;

  const game = await prisma.game.findFirst({
    where: { id, status: "published" },
    select: { id: true },
  });
  if (!game) return NextResponse.json({ error: "只能收藏已发布游戏" }, { status: 404 });

  const existing = await prisma.favorite.findUnique({
    where: { userId_gameId: { userId: user.id, gameId: id } },
  });

  if (existing) {
    await prisma.$transaction([
      prisma.favorite.delete({ where: { id: existing.id } }),
      prisma.game.update({
        where: { id },
        data: { favoriteCount: { decrement: 1 } },
      }),
    ]);
  } else {
    await prisma.$transaction([
      prisma.favorite.create({ data: { userId: user.id, gameId: id } }),
      prisma.game.update({
        where: { id },
        data: { favoriteCount: { increment: 1 } },
      }),
    ]);
  }

  const updated = await prisma.game.findUnique({
    where: { id },
    select: { playCount: true, likeCount: true, favoriteCount: true },
  });

  return NextResponse.json({
    isFavorite: !existing,
    playCount: updated?.playCount ?? 0,
    likeCount: updated?.likeCount ?? 0,
    favoriteCount: Math.max(0, updated?.favoriteCount ?? 0),
  });
}
