import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import GameOwnerActions from "@/components/game-owner-actions";
import { Badge, ButtonLink, Card, EmptyState, PageHeader, PageShell } from "@/components/ui";
import { displayTags } from "@/lib/tags";

export default async function MyWorksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [games, jobs] = await Promise.all([
    prisma.game.findMany({
      where: { ownerId: user.id },
      include: { jobs: { select: { id: true }, orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.generationJob.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { game: { select: { id: true, title: true, status: true } } },
    }),
  ]);

  return (
    <PageShell>
      <PageHeader
        eyebrow="Creator Library"
        title="我的作品"
        description="管理草稿、已发布游戏和最近生成任务。发布前可以先预览，Remix 会创建新的派生任务。"
        action={<ButtonLink href="/create">创建新游戏</ButtonLink>}
      />

      {games.length ? (
        <section className="grid gap-5 lg:grid-cols-2">
          {games.map((game) => (
            <Card key={game.id} className="p-5">
              <div className="flex flex-wrap gap-2">
                <Badge tone={game.status === "published" ? "green" : "orange"}>
                  {game.status === "published" ? "已发布" : "草稿"}
                </Badge>
                {displayTags(game.tags, 4).map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
              <h2 className="mt-4 text-xl font-semibold text-slate-950">{game.title}</h2>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                {game.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <ButtonLink href={`/play/${game.id}`} variant="secondary">预览</ButtonLink>
                <ButtonLink href={`/games/${game.id}`} variant="secondary">详情</ButtonLink>
              </div>
              <div className="mt-4 rounded-xl bg-slate-50 p-3">
                <GameOwnerActions
                  gameId={game.id}
                  status={game.status}
                  sourceJobId={game.jobs[0]?.id}
                />
              </div>
            </Card>
          ))}
        </section>
      ) : (
        <EmptyState
          title="还没有作品"
          description="从一个 prompt 开始，生成你的第一款轻量小游戏。"
          action={<ButtonLink href="/create">创建游戏</ButtonLink>}
        />
      )}

      <Card className="mt-8 p-5">
        <h2 className="text-xl font-semibold text-slate-950">生成任务历史</h2>
        <div className="mt-4 grid gap-3">
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="rounded-xl border border-slate-200 bg-white p-3 text-sm hover:border-blue-300 hover:bg-blue-50"
            >
              <span className="font-semibold text-slate-950">{statusText(job.status)}</span>
              <span className="ml-3 text-slate-600">{job.prompt}</span>
              {job.game ? (
                <span className="ml-3 text-blue-700">{job.game.title}</span>
              ) : null}
            </Link>
          ))}
          {!jobs.length ? <p className="text-sm text-slate-500">暂无生成任务。</p> : null}
        </div>
      </Card>
    </PageShell>
  );
}

function statusText(status: string) {
  if (status === "queued") return "排队中";
  if (status === "running") return "生成中";
  if (status === "succeeded") return "生成成功";
  if (status === "failed") return "生成失败";
  return status;
}
