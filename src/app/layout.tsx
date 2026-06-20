import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Yahaha MVP",
  description: "AI native interactive game platform MVP",
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
        <header className="sticky top-0 z-40 border-b border-white/70 bg-white/85 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
            <Link href="/" className="text-lg font-semibold text-slate-950">
              Yahaha
            </Link>
            <div className="flex items-center gap-3 text-sm">
              <Link href="/" className="rounded-md px-3 py-2 hover:bg-slate-100">
                首页
              </Link>
              {user ? (
                <>
                  <Link
                    href="/create"
                    className="rounded-md bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
                  >
                    创建游戏
                  </Link>
                  <Link
                    href="/my"
                    className="rounded-md px-3 py-2 hover:bg-slate-100"
                  >
                    我的作品
                  </Link>
                  <Link
                    href="/favorites"
                    className="rounded-md px-3 py-2 hover:bg-slate-100"
                  >
                    我的收藏
                  </Link>
                  <form action="/api/auth/logout" method="post">
                    <button className="rounded-md px-3 py-2 hover:bg-slate-100">
                      退出登录
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-md px-3 py-2 hover:bg-slate-100"
                  >
                    登录
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-md bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
                  >
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
