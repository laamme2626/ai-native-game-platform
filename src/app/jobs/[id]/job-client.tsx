"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type JobPayload = {
  id: string;
  status: string;
  error: string | null;
  game: null | {
    id: string;
    title: string;
    description: string;
    status: string;
    manifestUrl: string;
    entryUrl: string;
    specUrl: string;
  };
  estimatedTokens: number;
  estimatedCostCents: number;
  generationStepsCount: number;
  logs: {
    id: string;
    agentName: string;
    level: string;
    message: string;
    createdAt: string;
  }[];
};

export default function JobClient({ jobId }: { jobId: string }) {
  const [job, setJob] = useState<JobPayload | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch(`/api/jobs/${jobId}`, { cache: "no-store" });
    if (response.ok) setJob(await response.json());
  }, [jobId]);

  useEffect(() => {
    let isActive = true;
    async function tick() {
      if (!isActive) return;
      await load();
    }
    fetch(`/api/jobs/${jobId}`, { method: "POST" }).catch(() => {});
    window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 1500);
    return () => {
      isActive = false;
      window.clearInterval(timer);
    };
  }, [jobId, load]);

  async function publish() {
    if (!job?.game) return;
    setIsPublishing(true);
    const response = await fetch(`/api/games/${job.game.id}/publish`, { method: "POST" });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      window.alert(payload?.error ?? "发布失败");
    } else {
      window.alert("发布成功");
    }
    await load();
    setIsPublishing(false);
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">生成任务</h1>
          <p className="mt-2 text-sm text-slate-600">{jobId}</p>
        </div>
        <span className="w-fit rounded-full border border-slate-300 bg-white px-3 py-1 text-sm">
          {job ? statusText(job.status) : "加载中"}
        </span>
      </div>

      {job?.error ? (
        <p className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          生成失败：{job.error}
        </p>
      ) : null}

      {job ? (
        <section className="mt-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-5 sm:grid-cols-3">
          <div>
            <p className="text-xs text-slate-500">模拟 tokens</p>
            <p className="text-lg font-semibold">{job.estimatedTokens || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">模拟成本</p>
            <p className="text-lg font-semibold">
              {job.estimatedCostCents ? `¥${(job.estimatedCostCents / 100).toFixed(2)}` : "-"}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">步骤数</p>
            <p className="text-lg font-semibold">{job.generationStepsCount || "-"}</p>
          </div>
        </section>
      ) : null}

      {job?.game ? (
        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-semibold">{job.game.title}</h2>
          <p className="mt-2 text-slate-600">{job.game.description}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={`/play/${job.game.id}?fromJob=${job.id}`}
              className="rounded-md border border-slate-900 px-3 py-2 text-sm font-medium hover:bg-slate-900 hover:text-white"
            >
              预览
            </Link>
            {job.game.status === "draft" ? (
              <button
                onClick={publish}
                disabled={isPublishing}
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-600"
              >
                {isPublishing ? "发布中..." : "发布"}
              </button>
            ) : (
              <Link
                href="/"
                className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white"
              >
                已发布，返回首页
              </Link>
            )}
          </div>
          <dl className="mt-5 grid gap-2 text-sm text-slate-600">
            <div>game_spec.json：{job.game.specUrl}</div>
            <div>manifest.json：{job.game.manifestUrl}</div>
            <div>index.html：{job.game.entryUrl}</div>
          </dl>
        </section>
      ) : job?.status === "failed" ? (
        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
          <button
            onClick={async () => {
              await fetch(`/api/jobs/${jobId}`, { method: "POST" });
              await load();
            }}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            重试生成
          </button>
        </section>
      ) : null}

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-xl font-semibold">Agent 日志时间线</h2>
        <div className="mt-4 grid gap-3">
          {job?.logs.map((log) => (
            <div key={log.id} className="border-l-2 border-slate-300 pl-3">
              <p className="text-sm font-medium">{log.message}</p>
              <p className="text-xs text-slate-500">
                {new Date(log.createdAt).toLocaleString("zh-CN")} - {log.agentName} - {log.level}
              </p>
            </div>
          ))}
          {!job?.logs.length ? (
            <p className="text-sm text-slate-500">等待 Agent 输出...</p>
          ) : null}
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
