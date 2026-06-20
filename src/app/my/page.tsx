import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import GameOwnerActions from "@/components/game-owner-actions";

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
    <main className="mx-auto max-w-6xl px-5 py-10">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">我的作品</h1>
          <p className="mt-2 text-slate-600">
            管理草稿和已发布游戏，查看生成历史，继续预览或发布。
          </p>
        </div>
        <Link
          href="/create"
          className="w-fit rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700"
        >
          创建新游戏
        </Link>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        {games.map((game) => (
          <article
            key={game.id}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">
                  {game.status === "published" ? "已发布" : "草稿"}
                </span>
                <h2 className="mt-3 text-xl font-semibold">{game.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {game.description}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/play/${game.id}`}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
              >
                预览
              </Link>
              <Link
                href={`/games/${game.id}`}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
              >
                详情
              </Link>
            </div>
            <div className="mt-4">
              <GameOwnerActions
                gameId={game.id}
                status={game.status}
                sourceJobId={game.jobs[0]?.id}
              />
            </div>
          </article>
        ))}
      </section>

      <section className="mt-10 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-xl font-semibold">生成任务历史</h2>
        <div className="mt-4 grid gap-3">
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="rounded-md border border-slate-200 p-3 text-sm hover:bg-slate-50"
            >
              <span className="font-medium">{statusText(job.status)}</span>
              <span className="ml-3 text-slate-600">{job.prompt}</span>
              {job.game ? (
                <span className="ml-3 text-blue-700">{job.game.title}</span>
              ) : null}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

function statusText(status: string) {
  if (status === "queued") return "排队中";
  if (status === "running") return "生成中";
  if (status === "succeeded") return "生成成功";
  if (status === "failed") return "生成失败";
  return status;
}
