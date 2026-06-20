import Link from "next/link";
import { prisma } from "@/lib/db";
import GameMetricButtons from "@/components/game-metric-buttons";
import { getCurrentUser } from "@/lib/auth";
import { tagTaxonomy } from "@/lib/tags";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const q = params.q?.trim() ?? "";
  const tag = params.tag?.trim() ?? "";

  const games = await prisma.game.findMany({
    where: {
      status: "published",
      AND: [
        q
          ? {
              OR: [
                { title: { contains: q } },
                { description: { contains: q } },
              ],
            }
          : {},
        tag ? { tags: { contains: tag } } : {},
      ],
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    include: { owner: { select: { email: true } } },
  });

  const favoriteIds = user
    ? new Set(
        (
          await prisma.favorite.findMany({
            where: { userId: user.id, gameId: { in: games.map((game) => game.id) } },
            select: { gameId: true },
          })
        ).map((favorite) => favorite.gameId),
      )
    : new Set<string>();

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <section className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">
            AI Native 互动游戏
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            首页只展示已发布游戏。点击卡片查看详情，也可以直接开始游玩。
          </p>
        </div>
        <Link
          href="/create"
          className="w-fit rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700"
        >
          创建游戏
        </Link>
      </section>

      <form className="mb-5 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_auto]">
        <input
          name="q"
          defaultValue={q}
          placeholder="按标题 / 简介搜索"
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <button className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          搜索
        </button>
      </form>

      <div className="mb-8 grid gap-4 rounded-lg border border-slate-200 bg-white p-4">
        <Link
          href={q ? `/?q=${encodeURIComponent(q)}` : "/"}
          className={`rounded-full border px-3 py-1 text-sm ${
            tag ? "border-slate-300 bg-white" : "border-blue-600 bg-blue-50 text-blue-700"
          }`}
        >
          全部标签
        </Link>
        {tagTaxonomy.map((group) => (
          <section key={group.group}>
            <h2 className="mb-2 text-sm font-semibold text-slate-700">
              {group.group}
            </h2>
            <div className="flex flex-wrap gap-2">
              {group.tags.map((item) => (
                <Link
                  key={item}
                  href={`/?${new URLSearchParams({ ...(q ? { q } : {}), tag: item })}`}
                  className={`rounded-full border px-3 py-1 text-sm ${
                    tag === item
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {item}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => {
          const gameTags = game.tags.split(",").filter(Boolean);
          return (
            <article
              key={game.id}
              className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
            >
              <Link href={`/games/${game.id}`} className="block">
                <div className="h-32 bg-gradient-to-br from-blue-100 via-emerald-100 to-amber-100" />
                <div className="p-5">
                  <h2 className="text-xl font-semibold">{game.title}</h2>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">
                    {game.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {gameTags.map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                  <p className="mt-4 text-xs text-slate-500">
                    作者：{game.owner.email}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    发布时间：
                    {game.publishedAt
                      ? new Date(game.publishedAt).toLocaleString("zh-CN")
                      : "未发布"}
                  </p>
                </div>
              </Link>
              <div className="border-t border-slate-100 p-5 pt-4">
                <GameMetricButtons
                  gameId={game.id}
                  playCount={game.playCount}
                  likeCount={game.likeCount}
                  favoriteCount={game.favoriteCount}
                  isFavorite={favoriteIds.has(game.id)}
                />
                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/play/${game.id}`}
                    className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    开始游玩
                  </Link>
                  <Link
                    href={`/games/${game.id}`}
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
                  >
                    查看详情
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {!games.length ? (
        <p className="rounded-lg border border-slate-200 bg-white p-6 text-slate-600">
          暂无匹配游戏。换个关键词试试。
        </p>
      ) : null}
    </main>
  );
}
