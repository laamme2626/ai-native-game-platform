"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { buttonClass, Card } from "@/components/ui";

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
  const [message, setMessage] = useState("");

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
    setMessage("");
    const response = await fetch(`/api/games/${job.game.id}/publish`, {
      method: "POST",
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setMessage(payload?.error ?? "发布失败");
    } else {
      setMessage("发布成功，可以返回首页查看。");
    }
    await load();
    setIsPublishing(false);
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:py-10">
      <section className="mb-6 rounded-2xl border border-white/70 bg-slate-950 p-6 text-white shadow-xl shadow-blue-950/10">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-200">
          Agent Workflow
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">生成任务</h1>
            <p className="mt-2 break-all text-sm text-slate-300">{jobId}</p>
          </div>
          <span className="w-fit rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm">
            {job ? statusText(job.status) : "加载中"}
          </span>
        </div>
      </section>

      {job?.error ? (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          生成失败：{job.error}
        </div>
      ) : null}
      {message ? (
        <div className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          {message}
        </div>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <aside className="grid gap-5 self-start">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-slate-950">任务状态</h2>
            <div className="mt-4 grid gap-3">
              {["queued", "running", "succeeded", "failed"].map((item) => (
                <div
                  key={item}
                  className={`rounded-xl border px-3 py-2 text-sm ${
                    job?.status === item
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-slate-50 text-slate-500"
                  }`}
                >
                  {statusText(item)}
                </div>
              ))}
            </div>
          </Card>
          <Card className="grid gap-3 p-5">
            <Stat label="模拟 tokens" value={job?.estimatedTokens || "-"} />
            <Stat
              label="模拟成本"
              value={
                job?.estimatedCostCents
                  ? `¥${(job.estimatedCostCents / 100).toFixed(2)}`
                  : "-"
              }
            />
            <Stat label="步骤数" value={job?.generationStepsCount || "-"} />
          </Card>
        </aside>

        <section className="grid gap-5">
          {job?.game ? (
            <Card className="p-5">
              <h2 className="text-xl font-semibold text-slate-950">{job.game.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{job.game.description}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href={`/play/${job.game.id}?fromJob=${job.id}`} className={buttonClass("primary")}>
                  预览
                </Link>
                {job.game.status === "draft" ? (
                  <button
                    onClick={publish}
                    disabled={isPublishing}
                    className={`${buttonClass("primary")} disabled:bg-slate-300 disabled:text-slate-600`}
                  >
                    {isPublishing ? "发布中..." : "发布"}
                  </button>
                ) : (
                  <Link href="/" className={buttonClass("secondary")}>
                    已发布，返回首页
                  </Link>
                )}
              </div>
              <dl className="mt-5 grid gap-2 rounded-xl bg-slate-50 p-4 text-xs text-slate-600">
                <div>game_spec.json：{job.game.specUrl}</div>
                <div>manifest.json：{job.game.manifestUrl}</div>
                <div>index.html：{job.game.entryUrl}</div>
              </dl>
            </Card>
          ) : job?.status === "failed" ? (
            <Card className="p-5">
              <button
                onClick={async () => {
                  await fetch(`/api/jobs/${jobId}`, { method: "POST" });
                  await load();
                }}
                className={buttonClass("primary")}
              >
                重试生成
              </button>
            </Card>
          ) : null}

          <Card className="p-5">
            <h2 className="text-xl font-semibold text-slate-950">Agent 日志时间线</h2>
            <div className="mt-5 grid gap-4">
              {job?.logs.map((log) => (
                <div key={log.id} className="relative border-l-2 border-blue-100 pl-5">
                  <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-blue-600" />
                  <p className="text-sm font-semibold text-slate-950">{log.message}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(log.createdAt).toLocaleString("zh-CN")} · {log.agentName} · {log.level}
                  </p>
                </div>
              ))}
              {!job?.logs.length ? (
                <p className="text-sm text-slate-500">等待 Agent 输出...</p>
              ) : null}
            </div>
          </Card>
        </section>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function statusText(status: string) {
  if (status === "queued") return "排队中";
  if (status === "running") return "生成中";
  if (status === "succeeded") return "生成成功";
  if (status === "failed") return "生成失败";
  return status;
}
