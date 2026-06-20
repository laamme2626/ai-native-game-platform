import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import PlayClient from "./play-client";

export default async function PlayPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ fromJob?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const game = await prisma.game.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      manifestUrl: true,
      entryUrl: true,
      ownerId: true,
    },
  });
  if (!game) notFound();

  return <PlayClient game={game} fromJob={query.fromJob} />;
}
