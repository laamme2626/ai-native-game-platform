"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type JobPayload = {
  id: string;
  status: string;
  error: string | null;
  game: null | {
    id: string;
    title: string;
    description: string;
    status: string;
  };
  logs: {
    id: string;
    level: string;
    message: string;
    createdAt: string;
  }[];
};

export default function JobClient({ jobId }: { jobId: string }) {
  const [job, setJob] = useState<JobPayload | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  async function load() {
    const response = await fetch(`/api/jobs/${jobId}`, { cache: "no-store" });
    if (response.ok) setJob(await response.json());
  }

  useEffect(() => {
    fetch(`/api/jobs/${jobId}`, { method: "POST" }).catch(() => {});
    load();
    const timer = window.setInterval(load, 1500);
    return () => window.clearInterval(timer);
  }, [jobId]);

  async function publish() {
    if (!job?.game) return;
    setIsPublishing(true);
    await fetch(`/api/games/${job.game.id}/publish`, { method: "POST" });
    await load();
    setIsPublishing(false);
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Generation job</h1>
          <p className="mt-2 text-sm text-slate-600">{jobId}</p>
        </div>
        <span className="w-fit rounded-full border border-slate-300 bg-white px-3 py-1 text-sm">
          {job?.status ?? "loading"}
        </span>
      </div>

      {job?.error ? (
        <p className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {job.error}
        </p>
      ) : null}

      {job?.game ? (
        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-semibold">{job.game.title}</h2>
          <p className="mt-2 text-slate-600">{job.game.description}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={`/play/${job.game.id}`}
              className="rounded-md border border-slate-900 px-3 py-2 text-sm font-medium hover:bg-slate-900 hover:text-white"
            >
              Preview
            </Link>
            {job.game.status === "draft" ? (
              <button
                onClick={publish}
                disabled={isPublishing}
                className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {isPublishing ? "Publishing..." : "Publish"}
              </button>
            ) : (
              <Link
                href="/"
                className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white"
              >
                Published on Home
              </Link>
            )}
          </div>
        </section>
      ) : null}

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-xl font-semibold">Agent logs</h2>
        <div className="mt-4 grid gap-3">
          {job?.logs.map((log) => (
            <div key={log.id} className="border-l-2 border-slate-300 pl-3">
              <p className="text-sm font-medium">{log.message}</p>
              <p className="text-xs text-slate-500">
                {new Date(log.createdAt).toLocaleString()} - {log.level}
              </p>
            </div>
          ))}
          {!job?.logs.length ? (
            <p className="text-sm text-slate-500">Waiting for Agent output...</p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
