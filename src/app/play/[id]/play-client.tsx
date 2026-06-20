"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { buttonClass, ErrorState, LoadingState } from "@/components/ui";

type Game = {
  id: string;
  title: string;
  description: string;
  status: string;
  manifestUrl: string;
  entryUrl: string;
  ownerId: string;
};

type Manifest = {
  schemaVersion: 1;
  title: string;
  description: string;
  entry: { type: "html"; url: string };
  specUrl: string;
};

type LoadStage = "reading-meta" | "loading-manifest" | "starting-runtime" | "running" | "failed" | "ended";

export default function PlayClient({
  game,
  fromJob,
}: {
  game: Game;
  fromJob?: string;
}) {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [error, setError] = useState("");
  const [stage, setStage] = useState<LoadStage>("reading-meta");
  const [frameKey, setFrameKey] = useState(0);
  const [publishMessage, setPublishMessage] = useState("");

  const loadManifest = useCallback(async () => {
    setStage("loading-manifest");
    setError("");
    setManifest(null);
    try {
      const response = await fetch(game.manifestUrl);
      if (!response.ok) throw new Error(`manifest 加载失败：${response.status}`);
      const payload = (await response.json()) as Manifest;
      setManifest(payload);
      setStage("starting-runtime");
      setFrameKey((value) => value + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "manifest 加载失败");
      setStage("failed");
    }
  }, [game.manifestUrl]);

  useEffect(() => {
    const timer = window.setTimeout(loadManifest, 150);
    return () => window.clearTimeout(timer);
  }, [loadManifest]);

  useEffect(() => {
    fetch(`/api/games/${game.id}/metrics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "play" }),
    }).catch(() => {});
  }, [game.id]);

  const entryUrl = manifest?.entry.url ?? game.entryUrl;
  const stageItems = useMemo(
    () => [
      ["reading-meta", "读取游戏信息"],
      ["loading-manifest", "加载 manifest"],
      ["starting-runtime", "启动运行环境"],
      ["running", "运行中"],
    ],
    [],
  );

  async function publish() {
    setPublishMessage("");
    const response = await fetch(`/api/games/${game.id}/publish`, {
      method: "POST",
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setPublishMessage(payload?.error ?? "发布失败");
      return;
    }
    setPublishMessage("发布成功，可以返回首页查看。");
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <section className="mb-5 flex flex-col gap-4 rounded-[28px] border border-white/70 bg-white/82 p-4 shadow-xl shadow-blue-950/8 backdrop-blur-xl lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
            Play Session
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
            {game.title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{game.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700">
            {game.status === "published" ? "已发布" : "草稿预览"}
          </span>
          <Link href="/" className={buttonClass("secondary")}>
            返回首页
          </Link>
        </div>
      </section>

      {fromJob ? (
        <section className="mb-5 rounded-[24px] border border-blue-200 bg-blue-50/90 p-4 shadow-sm">
          <p className="text-sm font-bold text-blue-900">你正在从生成任务预览此游戏。</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={`/jobs/${fromJob}`} className={buttonClass("secondary")}>
              返回生成任务
            </Link>
            {game.status === "draft" ? (
              <button onClick={publish} className={buttonClass("primary")}>
                发布此游戏
              </button>
            ) : null}
            <Link href="/" className={buttonClass("ghost")}>
              返回首页
            </Link>
          </div>
          {publishMessage ? (
            <p className="mt-3 text-sm font-medium text-blue-800">{publishMessage}</p>
          ) : null}
        </section>
      ) : null}

      <section className="mb-4 rounded-[24px] border border-white/70 bg-slate-950 p-4 text-white shadow-xl shadow-blue-950/15">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-black">游戏启动流程</h2>
            <p className="mt-1 text-xs text-slate-300">
              动态读取数据库 meta，加载对象存储 mock 中的 manifest 和 entry。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setStage("starting-runtime");
                setFrameKey((value) => value + 1);
              }}
              className={buttonClass("secondary")}
            >
              重新开始
            </button>
            <button onClick={loadManifest} className={buttonClass("secondary")}>
              重新加载
            </button>
            <button onClick={() => setStage("ended")} className={buttonClass("danger")}>
              退出 / 游戏结束
            </button>
          </div>
        </div>
        <ol className="mt-4 grid gap-3 md:grid-cols-4">
          {stageItems.map(([key, label], index) => {
            const state = stepState(stage, key as LoadStage);
            return (
              <li key={key} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-black ${
                    state === "done"
                      ? "bg-emerald-500 text-white"
                      : state === "active"
                        ? "bg-blue-500 text-white"
                        : state === "error"
                          ? "bg-red-500 text-white"
                          : "bg-white/10 text-slate-400"
                  }`}
                >
                  {state === "done" ? "✓" : state === "error" ? "!" : state === "active" ? "…" : index + 1}
                </span>
                <div>
                  <p className={`text-sm font-bold ${state === "pending" ? "text-slate-400" : "text-white"}`}>
                    {label}
                  </p>
                  <p className="text-xs text-slate-400">
                    {state === "active" ? "正在进行" : state === "done" ? "已完成" : state === "error" ? "发生错误" : "未开始"}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {stage === "reading-meta" || stage === "loading-manifest" ? (
        <LoadingState text={stage === "reading-meta" ? "正在读取游戏信息..." : "正在加载 manifest..."} />
      ) : stage === "failed" ? (
        <ErrorState
          title="加载失败"
          description={error}
          action={
            <button onClick={loadManifest} className={buttonClass("primary")}>
              重新加载
            </button>
          }
        />
      ) : stage === "ended" ? (
        <section className="grid h-[68vh] place-items-center rounded-[28px] border border-white/70 bg-white/88 shadow-xl shadow-blue-950/10 backdrop-blur-xl">
          <div className="px-6 text-center">
            <h2 className="text-3xl font-black text-slate-950">游戏已结束</h2>
            <p className="mt-2 text-slate-600">可以重新开始，或返回首页继续探索。</p>
          </div>
        </section>
      ) : (
        <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950 p-2 shadow-2xl shadow-blue-950/20">
          {stage === "starting-runtime" ? (
            <div className="absolute inset-2 z-10 overflow-hidden rounded-[22px]">
              <LoadingState text="正在启动游戏运行环境..." />
            </div>
          ) : null}
          <iframe
            key={frameKey}
            title={manifest?.title ?? game.title}
            src={entryUrl}
            sandbox="allow-scripts"
            onLoad={() => setStage("running")}
            className="h-[68vh] w-full rounded-[22px] border border-white/10 bg-white"
          />
        </div>
      )}
    </main>
  );
}

function stepState(current: LoadStage, key: LoadStage) {
  const order: LoadStage[] = ["reading-meta", "loading-manifest", "starting-runtime", "running"];
  if (current === "failed") {
    return key === "loading-manifest" || key === "starting-runtime" ? "error" : "pending";
  }
  if (current === "ended") return "done";
  const currentIndex = order.indexOf(current);
  const keyIndex = order.indexOf(key);
  if (keyIndex < currentIndex) return "done";
  if (keyIndex === currentIndex) return current === "running" ? "done" : "active";
  return "pending";
}
