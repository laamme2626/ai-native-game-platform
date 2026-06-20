"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

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
      ["reading-meta", "正在读取游戏信息"],
      ["loading-manifest", "正在加载 manifest"],
      ["starting-runtime", "正在启动游戏运行环境"],
      ["running", "加载成功，游戏运行中"],
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
    <main className="mx-auto max-w-6xl px-5 py-8">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{game.title}</h1>
          <p className="mt-2 text-slate-600">{game.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="w-fit rounded-full border border-slate-300 bg-white px-3 py-1 text-sm">
            {game.status === "published" ? "已发布" : "草稿预览"}
          </span>
          <Link
            href="/"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 hover:bg-slate-50"
          >
            返回首页
          </Link>
        </div>
      </div>

      {fromJob ? (
        <section className="mb-5 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-800">你正在从生成任务预览此游戏。</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/jobs/${fromJob}`}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 hover:bg-slate-50"
            >
              返回生成任务
            </Link>
            {game.status === "draft" ? (
              <button
                onClick={publish}
                className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
              >
                发布此游戏
              </button>
            ) : null}
            <Link
              href="/"
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 hover:bg-slate-50"
            >
              返回首页
            </Link>
          </div>
          {publishMessage ? (
            <p className="mt-3 text-sm text-blue-800">{publishMessage}</p>
          ) : null}
        </section>
      ) : null}

      <section className={`mb-4 rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm transition ${stage === "running" ? "opacity-80" : ""}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-950">游戏启动流程</h2>
            <p className="mt-1 text-xs text-slate-500">
              {stage === "running" ? "游戏运行中，启动面板已收起为状态概览。" : "按步骤加载 manifest 和运行环境。"}
            </p>
          </div>
          {stage === "running" ? (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              运行中
            </span>
          ) : null}
        </div>
        <ol className={`mt-4 grid gap-3 ${stage === "running" ? "sm:grid-cols-4" : ""}`}>
          {stageItems.map(([key, label], index) => {
            const state = stepState(stage, key as LoadStage);
            return (
              <li key={key} className="flex items-center gap-3">
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${
                    state === "done"
                      ? "bg-emerald-600 text-white"
                      : state === "active"
                        ? "bg-blue-600 text-white"
                        : state === "error"
                          ? "bg-red-600 text-white"
                          : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {state === "done" ? "✓" : state === "error" ? "!" : state === "active" ? "…" : index + 1}
                </span>
                <div>
                  <p className={`text-sm font-medium ${state === "pending" ? "text-slate-400" : "text-slate-950"}`}>
                    {label}
                  </p>
                  <p className="text-xs text-slate-500">
                    {state === "active" ? "正在进行..." : state === "done" ? "已完成" : state === "error" ? "发生错误" : "未开始"}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => {
            setStage("starting-runtime");
            setFrameKey((value) => value + 1);
          }}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 hover:bg-slate-50"
        >
          重新开始
        </button>
        <button
          onClick={loadManifest}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 hover:bg-slate-50"
        >
          重新加载
        </button>
        <button
          onClick={() => setStage("ended")}
          className="rounded-md bg-orange-600 px-3 py-2 text-sm text-white hover:bg-orange-700"
        >
          退出 / 游戏结束
        </button>
      </div>

      {stage === "reading-meta" || stage === "loading-manifest" ? (
        <LoadingPanel text={stage === "reading-meta" ? "正在读取游戏信息..." : "正在加载 manifest..."} />
      ) : stage === "failed" ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
          <h2 className="text-lg font-semibold">加载失败</h2>
          <p className="mt-2 text-sm">{error}</p>
          <button
            onClick={loadManifest}
            className="mt-4 rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
          >
            重新加载
          </button>
        </div>
      ) : stage === "ended" ? (
        <div className="grid h-[72vh] place-items-center rounded-lg border border-slate-300 bg-white">
          <div className="text-center">
            <h2 className="text-2xl font-semibold">游戏已结束</h2>
            <p className="mt-2 text-slate-600">可以重新开始，或返回首页继续探索。</p>
          </div>
        </div>
      ) : (
        <div className="relative">
          {stage === "starting-runtime" ? (
            <div className="absolute inset-0 z-10">
              <LoadingPanel text="正在启动游戏运行环境..." />
            </div>
          ) : null}
          <iframe
            key={frameKey}
            title={manifest?.title ?? game.title}
            src={entryUrl}
            sandbox="allow-scripts"
            onLoad={() => setStage("running")}
            className="h-[72vh] w-full rounded-lg border border-slate-300 bg-white"
          />
        </div>
      )}
    </main>
  );
}

function LoadingPanel({ text }: { text: string }) {
  return (
    <div className="grid h-[72vh] place-items-center rounded-lg border border-slate-300 bg-white">
      <div className="w-full max-w-sm px-6 text-center">
        <div className="mb-4 h-3 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-2/3 animate-pulse rounded-full bg-blue-500" />
        </div>
        <p className="text-sm text-slate-600">{text}</p>
      </div>
    </div>
  );
}

function stepState(current: LoadStage, key: LoadStage) {
  const order: LoadStage[] = ["reading-meta", "loading-manifest", "starting-runtime", "running"];
  if (current === "failed") {
    return key === "loading-manifest" || key === "starting-runtime" ? "error" : "pending";
  }
  if (current === "ended") return key === "running" ? "done" : "done";
  const currentIndex = order.indexOf(current);
  const keyIndex = order.indexOf(key);
  if (keyIndex < currentIndex) return "done";
  if (keyIndex === currentIndex) return current === "running" ? "done" : "active";
  return "pending";
}
