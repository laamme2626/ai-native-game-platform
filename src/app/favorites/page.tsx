import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ButtonLink, EmptyState, PageHeader, PageShell } from "@/components/ui";
import { GameCard } from "@/components/game-card";

export default async function FavoritesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id, game: { status: "published" } },
    orderBy: { createdAt: "desc" },
    include: {
      game: {
        include: { owner: { select: { email: true } } },
      },
    },
  });

  return (
    <PageShell>
      <PageHeader
        eyebrow="Favorite Shelf"
        title="我的收藏"
        description="你保存过的已发布游戏会出现在这里。取消收藏后会从收藏夹移除。"
        action={<ButtonLink href="/">去首页发现游戏</ButtonLink>}
      />

      {favorites.length ? (
        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {favorites.map(({ game }) => (
            <GameCard key={game.id} game={game} isFavorite />
          ))}
        </section>
      ) : (
        <EmptyState
          title="还没有收藏"
          description="去首页找一个喜欢的游戏收藏起来，之后就能在这里快速继续游玩。"
          action={<ButtonLink href="/">浏览游戏</ButtonLink>}
        />
      )}
    </PageShell>
  );
}
