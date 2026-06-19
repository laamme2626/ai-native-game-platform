import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import PlayClient from "./play-client";

export default async function PlayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const game = await prisma.game.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      manifestUrl: true,
      entryUrl: true,
    },
  });
  if (!game) notFound();

  return <PlayClient game={game} />;
}
