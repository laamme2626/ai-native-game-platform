import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { tagTaxonomy } from "@/lib/tags";
import { ButtonLink, EmptyState, Panel } from "@/components/ui";
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
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <section className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-[linear-gradient(135deg,#0f172a_0%,#1e1b4b_56%,#1d4ed8_100%)] px-5 py-9 text-white shadow-xl shadow-slate-900/10 sm:px-8 lg:px-10 lg:py-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(96,165,250,.20),transparent_32%),linear-gradient(180deg,rgba(255,255,255,.05),transparent_60%)]" />
        <div className="relative max-w-3xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">
            AI Native Game Platform
          </p>
          <h1 className="text-balance text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            用 AI 生成可玩的互动小游戏
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-100 sm:text-lg">
            输入一个主题，AI 会生成规则、关卡、界面和可发布的小游戏，让玩家可以直接打开试玩，也让创作者快速迭代作品。
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <ButtonLink href="/create" className="min-w-28 px-5 shadow-sm shadow-blue-950/20">
              开始创建
            </ButtonLink>
            <Link
              href="#games"
              className="inline-flex h-14 items-center justify-center rounded-2xl border border-white/45 bg-slate-950/55 px-8 text-base font-bold text-white shadow-sm transition hover:border-white/70 hover:bg-slate-900/80 focus:outline-none focus:ring-2 focus:ring-cyan-200/70"
            >
              浏览游戏
            </Link>
          </div>
        </div>
      </section>

      <Panel className="mt-6 p-4 sm:p-5">
        <form className="flex flex-col gap-3 sm:flex-row">
          <input
            name="q"
            defaultValue={q}
            placeholder="搜索标题、简介、题材..."
            className="h-[52px] min-h-[52px] flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none ring-blue-200 transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 sm:h-14"
          />
          <button className="h-[52px] min-h-[52px] rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-6 text-sm font-black text-white shadow-lg shadow-blue-300/40 transition hover:-translate-y-0.5 hover:shadow-blue-400/50 sm:h-14">
            搜索
          </button>
        </form>

        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            <TagLink href={q ? `/?q=${encodeURIComponent(q)}` : "/"} active={!tag}>
              全部游戏
            </TagLink>
          </div>
          {tagTaxonomy.map((group) => (
            <div key={group.group} className="grid gap-2 lg:grid-cols-[74px_1fr] lg:items-start">
              <h2 className="pt-1 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                {group.group}
              </h2>
              <div className="flex flex-wrap gap-2">
                {group.tags.map((item) => (
                  <TagLink
                    key={item}
                    href={`/?${new URLSearchParams({ ...(q ? { q } : {}), tag: item })}`}
                    active={tag === item}
                    group={group.group}
                  >
                    {item}
                  </TagLink>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <section id="games" className="mt-8">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
              Published Games
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
              已发布游戏
            </h2>
          </div>
          <p className="text-sm font-medium text-slate-500">
            {games.length} 款可游玩作品
          </p>
        </div>

        {games.length ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {games.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                isFavorite={favoriteIds.has(game.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="没有匹配的游戏"
            description="换一个关键词或标签试试，也可以创建一个新的游戏填补这个空位。"
            action={<ButtonLink href="/create">创建游戏</ButtonLink>}
          />
        )}
      </section>
    </main>
  );
}

function TagLink({
  href,
  active,
  group,
  children,
}: {
  href: string;
  active: boolean;
  group?: string;
  children: React.ReactNode;
}) {
  const color =
    group === "题材"
      ? "hover:border-cyan-300 hover:bg-cyan-50"
      : group === "风格"
        ? "hover:border-violet-300 hover:bg-violet-50"
        : group === "难度"
          ? "hover:border-orange-300 hover:bg-orange-50"
          : group === "时长"
            ? "hover:border-emerald-300 hover:bg-emerald-50"
            : "hover:border-blue-300 hover:bg-blue-50";

  return (
    <Link
      href={href}
      className={`inline-flex h-9 items-center rounded-full border px-3 text-sm font-bold transition ${
        active
          ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-200"
          : `border-slate-200 bg-white/82 text-slate-700 ${color}`
      }`}
    >
      {children}
    </Link>
  );
}
