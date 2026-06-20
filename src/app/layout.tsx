import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { buttonClass } from "@/components/ui";

export const metadata: Metadata = {
  title: "Yahaha AI Game Arcade",
  description: "AI Native 互动小游戏创作者社区",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <header className="sticky top-0 z-40 border-b border-white/70 bg-white/78 shadow-sm shadow-blue-950/5 backdrop-blur-xl">
          <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <Link href="/" className="group flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-sm font-black text-white shadow-lg shadow-blue-300/40">
                YA
              </span>
              <span>
                <span className="block text-base font-black tracking-tight text-slate-950">
                  Yahaha
                </span>
                <span className="hidden text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:block">
                  AI Game Arcade
                </span>
              </span>
            </Link>

            <div className="flex min-w-0 items-center gap-1 overflow-x-auto text-sm sm:gap-2">
              <Link href="/" className={buttonClass("ghost")}>
                首页
              </Link>
              {user ? (
                <>
                  <Link href="/create" className={buttonClass("primary")}>
                    创建游戏
                  </Link>
                  <Link href="/my" className={buttonClass("ghost")}>
                    我的作品
                  </Link>
                  <Link href="/favorites" className={buttonClass("ghost")}>
                    我的收藏
                  </Link>
                  <form action="/api/auth/logout" method="post">
                    <button className={buttonClass("ghost")}>退出登录</button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" className={buttonClass("ghost")}>
                    登录
                  </Link>
                  <Link href="/register" className={buttonClass("primary")}>
                    注册
                  </Link>
                </>
              )}
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
