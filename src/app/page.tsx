import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { tagTaxonomy } from "@/lib/tags";
import { ButtonLink, EmptyState, PageHeader, PageShell } from "@/components/ui";
import { GameCard } from "@/components/game-card";

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
            where: {
              userId: user.id,
              gameId: { in: games.map((game) => game.id) },
            },
            select: { gameId: true },
          })
        ).map((favorite) => favorite.gameId),
      )
    : new Set<string>();

  return (
    <PageShell>
      <PageHeader
        eyebrow="AI Game Arcade"
        title="AI Native 互动游戏创作社区"
        description="从自然语言生成轻量小游戏，浏览已发布作品，筛选题材和玩法，直接在浏览器里运行。"
        action={<ButtonLink href="/create">创建游戏</ButtonLink>}
      />

      <section className="mb-6 grid gap-4 rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm backdrop-blur lg:grid-cols-[1.1fr_2fr]">
        <form className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            name="q"
            defaultValue={q}
            placeholder="搜索标题、简介、题材..."
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none ring-blue-200 transition focus:border-blue-500 focus:ring-4"
          />
          <button className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">
            搜索
          </button>
        </form>
        <div className="grid gap-3">
          <Link
            href={q ? `/?q=${encodeURIComponent(q)}` : "/"}
            className={`w-fit rounded-full border px-3 py-1 text-sm ${
              tag ? "border-slate-300 bg-white" : "border-blue-600 bg-blue-50 text-blue-700"
            }`}
          >
            全部游戏
          </Link>
          {tagTaxonomy.map((group) => (
            <div key={group.group} className="grid gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
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
                        : "border-slate-300 bg-white text-slate-700 hover:border-blue-300"
                    }`}
                  >
                    {item}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {games.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            isFavorite={favoriteIds.has(game.id)}
          />
        ))}
      </section>

      {!games.length ? (
        <div className="mt-6">
          <EmptyState
            title="没有匹配的游戏"
            description="换一个关键词或标签试试，也可以创建一个新的游戏填补这个空位。"
            action={<ButtonLink href="/create">创建游戏</ButtonLink>}
          />
        </div>
      ) : null}
    </PageShell>
  );
}
