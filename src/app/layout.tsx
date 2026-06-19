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
    <html lang="en">
      <body>
        <header className="border-b border-slate-200 bg-white">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
            <Link href="/" className="text-lg font-semibold">
              Yahaha
            </Link>
            <div className="flex items-center gap-3 text-sm">
              <Link href="/" className="rounded-md px-3 py-2 hover:bg-slate-100">
                Home
              </Link>
              {user ? (
                <>
                  <Link
                    href="/create"
                    className="rounded-md bg-slate-900 px-3 py-2 text-white hover:bg-slate-700"
                  >
                    Create
                  </Link>
                  <form action="/api/auth/logout" method="post">
                    <button className="rounded-md px-3 py-2 hover:bg-slate-100">
                      Logout
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-md px-3 py-2 hover:bg-slate-100"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-md bg-slate-900 px-3 py-2 text-white hover:bg-slate-700"
                  >
                    Register
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
