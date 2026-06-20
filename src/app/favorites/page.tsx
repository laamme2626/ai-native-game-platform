import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import GameMetricButtons from "@/components/game-metric-buttons";

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
    <main className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="text-3xl font-semibold">我的收藏</h1>
      <p className="mt-2 text-slate-600">
        这里展示你收藏过的已发布游戏。取消收藏后会从列表消失。
      </p>

      <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {favorites.map(({ game }) => (
          <article
            key={game.id}
            className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
          >
            <Link href={`/games/${game.id}`} className="block">
              <div className="h-32 bg-gradient-to-br from-blue-100 via-emerald-100 to-amber-100" />
              <div className="p-5">
                <h2 className="text-xl font-semibold">{game.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {game.description}
                </p>
                <p className="mt-4 text-xs text-slate-500">
                  作者：{game.owner.email}
                </p>
              </div>
            </Link>
            <div className="border-t border-slate-100 p-5 pt-4">
              <GameMetricButtons
                gameId={game.id}
                playCount={game.playCount}
                likeCount={game.likeCount}
                favoriteCount={game.favoriteCount}
                isFavorite
              />
              <Link
                href={`/play/${game.id}`}
                className="mt-4 inline-flex rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                开始游玩
              </Link>
            </div>
          </article>
        ))}
      </section>

      {!favorites.length ? (
        <p className="mt-8 rounded-lg border border-slate-200 bg-white p-6 text-slate-600">
          还没有收藏。去首页找一个喜欢的游戏吧。
        </p>
      ) : null}
    </main>
  );
}
