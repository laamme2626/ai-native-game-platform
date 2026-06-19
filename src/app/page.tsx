import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function Home() {
  const games = await prisma.game.findMany({
    where: { status: "published" },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    include: { owner: { select: { email: true } } },
  });

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <section className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">
            Published AI games
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Browse generated interactive stories. Play pages load database meta,
            fetch each manifest, and run the generated entry in a sandbox iframe.
          </p>
        </div>
        <Link
          href="/create"
          className="w-fit rounded-md bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-700"
        >
          Create a game
        </Link>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => (
          <article
            key={game.id}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-4 h-28 rounded-md bg-gradient-to-br from-emerald-100 via-sky-100 to-rose-100" />
            <h2 className="text-xl font-semibold">{game.title}</h2>
            <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">
              {game.description}
            </p>
            <p className="mt-4 text-xs text-slate-500">by {game.owner.email}</p>
            <Link
              href={`/play/${game.id}`}
              className="mt-5 inline-flex rounded-md border border-slate-900 px-3 py-2 text-sm font-medium hover:bg-slate-900 hover:text-white"
            >
              Play
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
