import Link from "next/link";
import { buttonClass, Card } from "@/components/ui";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="mx-auto grid min-h-[calc(100vh-72px)] max-w-6xl place-items-center px-4 py-10 sm:px-6 lg:px-8">
      <Card className="grid w-full max-w-4xl overflow-hidden lg:grid-cols-[1fr_420px]">
        <section className="relative hidden overflow-hidden bg-slate-950 p-8 text-white lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(59,130,246,.42),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,.30),transparent_26%)]" />
          <div className="relative">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
              Join Arcade
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight">
              创建你的第一款 AI 小游戏
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              注册后即可输入创意、上传素材、生成草稿并发布到首页。
            </p>
          </div>
        </section>

        <section className="p-6 sm:p-8">
          <h1 className="text-3xl font-black text-slate-950">注册</h1>
          {params.error ? (
            <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {params.error}
            </p>
          ) : null}
          <form action="/api/auth/register" method="post" className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              邮箱
              <input
                name="email"
                type="email"
                required
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-slate-950 outline-none ring-blue-200 transition focus:border-blue-500 focus:ring-4"
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              密码
              <input
                name="password"
                type="password"
                minLength={8}
                required
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-slate-950 outline-none ring-blue-200 transition focus:border-blue-500 focus:ring-4"
              />
            </label>
            <button className={buttonClass("primary")}>创建账号</button>
          </form>
          <p className="mt-5 text-sm text-slate-600">
            已有账号？{" "}
            <Link href="/login" className="font-black text-blue-700">
              登录
            </Link>
          </p>
        </section>
      </Card>
    </main>
  );
}
