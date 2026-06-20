import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const action = String(body?.action ?? "");

  const data =
    action === "play"
      ? { playCount: { increment: 1 } }
      : action === "like"
        ? { likeCount: { increment: 1 } }
        : null;

  if (!data) {
    return NextResponse.json({ error: "未知统计动作" }, { status: 400 });
  }

  const game = await prisma.game.update({
    where: { id },
    data,
    select: {
      id: true,
      playCount: true,
      likeCount: true,
      favoriteCount: true,
    },
  });

  return NextResponse.json(game);
}
