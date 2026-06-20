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
          <section className="p-5 sm:p-7">
            <div className="mb-4 flex flex-wrap gap-2">
              <Badge tone={game.status === "published" ? "green" : "orange"}>
                {game.status === "published" ? "已发布" : "草稿"}
              </Badge>
              {game.parentGameId ? <Badge tone="purple">Remix v{game.version}</Badge> : null}
              {tags.map((item, index) => (
                <Badge key={item} tone={index === 0 ? "blue" : "neutral"}>
                  {item}
                </Badge>
              ))}
            </div>

            <h1 className="text-balance max-w-4xl text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
              {game.title}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
              {game.description}
            </p>

            <dl className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 sm:grid-cols-2">
              <Info label="作者" value={game.owner.email} />
              <Info
                label="发布时间"
                value={game.publishedAt ? new Date(game.publishedAt).toLocaleString("zh-CN") : "未发布"}
              />
              <Info label="版本" value={`v${game.version}`} />
              <Info label="Manifest" value={game.manifestUrl || "等待生成"} />
            </dl>
          </section>
        </Card>

        <aside className="grid gap-4 self-start">
          <Card className="p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
              Game Actions
            </p>
            <div className="mt-4">
              <GameMetricButtons
                gameId={game.id}
                playCount={game.playCount}
                likeCount={game.likeCount}
                favoriteCount={game.favoriteCount}
                isFavorite={isFavorite}
              />
            </div>
            <div className="mt-5 grid gap-3">
              <ButtonLink href={`/play/${game.id}`} className="w-full">
                开始游玩
              </ButtonLink>
              <ButtonLink href="/" variant="secondary" className="w-full">
                返回首页
              </ButtonLink>
            </div>
          </Card>

          {user ? (
            <Card className="p-5">
              <h2 className="text-sm font-black text-slate-950">创作者操作</h2>
              <div className="mt-4">
                <GameOwnerActions
                  gameId={game.id}
                  status={game.status}
                  sourceJobId={game.jobs[0]?.id}
                />
              </div>
            </Card>
          ) : (
            <Card className="p-5 text-sm leading-6 text-slate-600">
              登录后可以收藏、Remix 或管理自己的作品。
              <Link href="/login" className="ml-2 font-bold text-blue-700">
                去登录
              </Link>
            </Card>
          )}
        </aside>
      </div>
    </PageShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="font-black text-slate-950">{label}</dt>
      <dd className="mt-1 break-words">{value}</dd>
    </div>
  );
}
