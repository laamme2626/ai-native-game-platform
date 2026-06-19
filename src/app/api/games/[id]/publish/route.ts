import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const game = await prisma.game.findFirst({
    where: { id, ownerId: user.id },
  });
  if (!game) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!game.manifestUrl || !game.entryUrl) {
    return NextResponse.json(
      { error: "Game is missing generated assets" },
      { status: 400 },
    );
  }

  const updated = await prisma.game.update({
    where: { id },
    data: { status: "published", publishedAt: new Date() },
  });
  return NextResponse.json(updated);
}
