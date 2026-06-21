"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { buttonClass, Card, ErrorState, LoadingState } from "@/components/ui";

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
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <section className="relative mb-6 overflow-hidden rounded-[30px] border border-white/70 bg-slate-950 p-6 text-white shadow-2xl shadow-blue-950/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_20%,rgba(59,130,246,.35),transparent_26%),radial-gradient(circle_at_88%_8%,rgba(168,85,247,.25),transparent_28%)]" />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
              Agent Workflow
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">生成任务</h1>
            <p className="mt-2 break-all text-sm text-slate-300">{jobId}</p>
          </div>
          <span className="w-fit rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold">
            {job ? statusText(job.status) : "加载中"}
          </span>
        </div>
      </section>

      {!job ? <LoadingState text="正在读取生成任务..." /> : null}

      {job?.error ? (
        <div className="mb-5">
          <ErrorState
            title="生成失败"
            description={unsupportedDescription(job.error)}
            action={
              <div className="flex flex-wrap gap-3">
                <Link href="/create" className={buttonClass("primary")}>
                  返回创建页修改创意
                </Link>
                <Link href="/" className={buttonClass("secondary")}>
                  返回首页
                </Link>
              </div>
            }
          />
        </div>
      ) : null}
      {message ? (
        <div className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-medium text-blue-800">
          {message}
        </div>
      ) : null}

      {job ? (
        <section className="grid gap-5 lg:grid-cols-[330px_1fr]">
          <aside className="grid gap-5 self-start">
            <Card className="p-5">
              <h2 className="text-sm font-black text-slate-950">任务状态</h2>
              <div className="mt-4 grid gap-3">
                {["queued", "running", "succeeded", "failed"].map((item) => (
                  <div
                    key={item}
                    className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
                      job.status === item
                        ? "border-blue-500 bg-blue-50 text-blue-700 shadow-md shadow-blue-100"
                        : "border-slate-200 bg-slate-50 text-slate-500"
                    }`}
                  >
                    {statusText(item)}
                  </div>
                ))}
              </div>
            </Card>

            <Card className="grid gap-3 p-5">
              <Stat label="模拟 tokens" value={job.estimatedTokens || "-"} />
              <Stat
                label="模拟成本"
                value={
                  job.estimatedCostCents
                    ? `¥${(job.estimatedCostCents / 100).toFixed(2)}`
                    : "-"
                }
              />
              <Stat label="步骤数" value={job.generationStepsCount || "-"} />
            </Card>
          </aside>

          <section className="grid gap-5">
            {job.game ? (
              <Card className="p-5 sm:p-6">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
                  Generated Game
                </p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">{job.game.title}</h2>
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
                <dl className="mt-5 grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                  <div className="break-all">game_spec.json：{job.game.specUrl}</div>
                  <div className="break-all">manifest.json：{job.game.manifestUrl}</div>
                  <div className="break-all">index.html：{job.game.entryUrl}</div>
                </dl>
              </Card>
            ) : job.status === "failed" ? (
              <Card className="grid gap-3 p-5">
                <p className="text-sm font-medium leading-6 text-slate-700">
                  当前任务已失败。请返回创建页修改创意，或回到首页查看已发布游戏。
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/create" className={buttonClass("primary")}>
                    返回创建页修改创意
                  </Link>
                  <Link href="/" className={buttonClass("secondary")}>
                    返回首页
                  </Link>
                </div>
              </Card>
            ) : null}

            <Card className="p-5 sm:p-6">
              <h2 className="text-xl font-black text-slate-950">Agent 日志时间线</h2>
              <div className="mt-5 grid gap-4">
                {job.logs.map((log) => (
                  <div key={log.id} className="relative border-l-2 border-blue-100 pl-5">
                    <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-blue-600 shadow-md shadow-blue-200" />
                    <p className="text-sm font-black text-slate-950">{log.message}</p>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      {new Date(log.createdAt).toLocaleString("zh-CN")} · {log.agentName} · {log.level}
                    </p>
                  </div>
                ))}
                {!job.logs.length ? (
                  <p className="text-sm text-slate-500">等待 Agent 输出...</p>
                ) : null}
              </div>
            </Card>
          </section>
        </section>
      ) : null}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
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

function unsupportedDescription(error: string) {
  if (error.includes("暂不支持") || error.includes("UNSUPPORTED_GAME_TYPE")) {
    return "当前 Demo 暂不支持该玩法类型。请返回创建页，改写为当前支持的轻量小游戏玩法。";
  }
  return error;
}
