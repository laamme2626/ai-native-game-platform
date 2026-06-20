import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import GameMetricButtons from "@/components/game-metric-buttons";
import GameOwnerActions from "@/components/game-owner-actions";
import { Badge, ButtonLink, Card, PageShell } from "@/components/ui";
import { GameCover } from "@/components/game-cover";
import { displayTags } from "@/lib/tags";

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

  const tags = displayTags(game.tags, 6);
  const isFavorite = user
    ? Boolean(
        await prisma.favorite.findUnique({
          where: { userId_gameId: { userId: user.id, gameId: game.id } },
        }),
      )
    : false;

  return (
    <PageShell>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="overflow-hidden">
          <GameCover tags={tags} title={game.title} />
          <section className="p-6 sm:p-8">
            <div className="mb-4 flex flex-wrap gap-2">
              <Badge tone={game.status === "published" ? "green" : "orange"}>
                {game.status === "published" ? "已发布" : "草稿"}
              </Badge>
              {game.parentGameId ? <Badge tone="blue">Remix v{game.version}</Badge> : null}
              {tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950">
              {game.title}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
              {game.description}
            </p>
            <dl className="mt-7 grid gap-4 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600 sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-slate-950">作者</dt>
                <dd className="mt-1">{game.owner.email}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-950">发布时间</dt>
                <dd className="mt-1">
                  {game.publishedAt
                    ? new Date(game.publishedAt).toLocaleString("zh-CN")
                    : "未发布"}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-950">版本</dt>
                <dd className="mt-1">v{game.version}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-950">Manifest</dt>
                <dd className="mt-1 break-all">{game.manifestUrl}</dd>
              </div>
            </dl>
          </section>
        </Card>

        <aside className="grid gap-4 self-start">
          <Card className="p-5">
            <GameMetricButtons
              gameId={game.id}
              playCount={game.playCount}
              likeCount={game.likeCount}
              favoriteCount={game.favoriteCount}
              isFavorite={isFavorite}
            />
            <div className="mt-5 grid gap-3">
              <ButtonLink href={`/play/${game.id}`}>开始游玩</ButtonLink>
              <ButtonLink href="/" variant="secondary">返回首页</ButtonLink>
            </div>
          </Card>
          {user ? (
            <Card className="p-5">
              <h2 className="mb-3 text-sm font-semibold text-slate-950">创作者操作</h2>
              <GameOwnerActions
                gameId={game.id}
                status={game.status}
                sourceJobId={game.jobs[0]?.id}
              />
            </Card>
          ) : (
            <Card className="p-5 text-sm text-slate-600">
              登录后可以收藏、Remix 或管理自己的作品。
              <Link href="/login" className="ml-2 font-semibold text-blue-700">
                去登录
              </Link>
            </Card>
          )}
        </aside>
      </div>
    </PageShell>
  );
}
