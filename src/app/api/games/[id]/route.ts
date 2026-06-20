import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const { id } = await params;

  const game = await prisma.game.findFirst({ where: { id, ownerId: user.id } });
  if (!game) return NextResponse.json({ error: "未找到游戏或无权限" }, { status: 404 });

  await prisma.game.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
