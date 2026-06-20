import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import GameMetricButtons from "@/components/game-metric-buttons";
import GameOwnerActions from "@/components/game-owner-actions";
import { getCurrentUser } from "@/lib/auth";

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const game = await prisma.game.findUnique({
    where: { id },
    include: {
      owner: { select: { email: true } },
      jobs: { select: { id: true }, orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!game || (game.status !== "published" && game.ownerId !== user?.id)) {
    notFound();
  }

  const tags = game.tags.split(",").filter(Boolean);

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="h-56 bg-gradient-to-br from-blue-100 via-emerald-100 to-amber-100" />
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_280px]">
          <section>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm">
                {game.status === "published" ? "已发布" : "草稿"}
              </span>
              {game.parentGameId ? (
                <span className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">
                  Remix v{game.version}
                </span>
              ) : null}
            </div>
            <h1 className="mt-4 text-4xl font-semibold">{game.title}</h1>
            <p className="mt-3 leading-7 text-slate-600">{game.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700"
                >
                  {tag}
                </span>
              ))}
            </div>
            <dl className="mt-6 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
              <div>作者：{game.owner.email}</div>
              <div>
                发布时间：
                {game.publishedAt
                  ? new Date(game.publishedAt).toLocaleString("zh-CN")
                  : "未发布"}
              </div>
              <div>版本：v{game.version}</div>
              <div>产物：{game.manifestUrl}</div>
            </dl>
          </section>
          <aside className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <GameMetricButtons
              gameId={game.id}
              playCount={game.playCount}
              likeCount={game.likeCount}
              favoriteCount={game.favoriteCount}
            />
            <div className="mt-5 grid gap-3">
              <Link
                href={`/play/${game.id}`}
                className="rounded-md bg-blue-600 px-4 py-3 text-center text-sm font-medium text-white hover:bg-blue-700"
              >
                开始游玩
              </Link>
              <Link
                href="/"
                className="rounded-md border border-slate-300 bg-white px-4 py-3 text-center text-sm font-medium text-slate-900 hover:bg-slate-50"
              >
                返回首页
              </Link>
              {user ? (
                <GameOwnerActions
                  gameId={game.id}
                  status={game.status}
                  sourceJobId={game.jobs[0]?.id}
                />
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
