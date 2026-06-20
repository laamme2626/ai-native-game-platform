import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import CreateClient from "./create-client";

export default async function CreatePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="text-3xl font-semibold">创建游戏</h1>
      <p className="mt-3 text-slate-600">
        输入玩法、风格、角色、胜负条件和素材用途。Agent 会生成受约束的
        game_spec.json、manifest.json 和可运行 HTML。
      </p>
      <CreateClient />
    </main>
  );
}
