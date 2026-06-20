import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import CreateClient from "./create-client";
import { prisma } from "@/lib/db";
import { PageHeader, PageShell } from "@/components/ui";

export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ sourceGameId?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const params = await searchParams;
  const sourceGame = params.sourceGameId
    ? await prisma.game.findUnique({
        where: { id: params.sourceGameId },
        select: { id: true, title: true, description: true },
      })
    : null;

  return (
    <PageShell>
      <PageHeader
        eyebrow="Creator Workbench"
        title={sourceGame ? "Remix 派生" : "创建 AI 小游戏"}
        description={
          sourceGame
            ? `正在基于《${sourceGame.title}》进行 Remix。输入你想修改的方向，例如更换主角、增加隐藏结局或改变风格。`
            : "描述玩法、风格、角色、胜负条件和素材用途。Agent 会生成受约束的 game_spec、manifest 和可运行 HTML。"
        }
      />
      {sourceGame ? (
        <section className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          <p className="font-medium">源游戏：{sourceGame.title}</p>
          <p className="mt-1">{sourceGame.description}</p>
        </section>
      ) : null}
      <CreateClient sourceGameId={sourceGame?.id} />
    </PageShell>
  );
}
