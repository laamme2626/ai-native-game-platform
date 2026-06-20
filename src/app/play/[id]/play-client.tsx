"use client";

import { useCallback, useEffect, useState } from "react";
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

export default function PlayClient({
  game,
  fromJob,
}: {
  game: Game;
  fromJob?: string;
}) {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [error, setError] = useState("");
  const [isManifestLoading, setIsManifestLoading] = useState(true);
  const [isFrameLoading, setIsFrameLoading] = useState(true);
  const [frameKey, setFrameKey] = useState(0);
  const [isEnded, setIsEnded] = useState(false);
  const [publishMessage, setPublishMessage] = useState("");

  const loadManifest = useCallback(async () => {
    setIsManifestLoading(true);
    setIsFrameLoading(true);
    setError("");
    setManifest(null);
    fetch(game.manifestUrl)
      .then((response) => {
        if (!response.ok) throw new Error(`manifest 加载失败：${response.status}`);
        return response.json();
      })
      .then((payload) => setManifest(payload))
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsManifestLoading(false));
  }, [game.manifestUrl]);

  useEffect(() => {
    window.setTimeout(loadManifest, 0);
    fetch(`/api/games/${game.id}/metrics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "play" }),
    }).catch(() => {});
  }, [game.id, loadManifest]);

  const entryUrl = manifest?.entry.url ?? game.entryUrl;

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

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => {
            setFrameKey((value) => value + 1);
            setIsFrameLoading(true);
            setIsEnded(false);
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
          onClick={() => setIsEnded(true)}
          className="rounded-md bg-orange-600 px-3 py-2 text-sm text-white hover:bg-orange-700"
        >
          退出 / 游戏结束
        </button>
      </div>

      {isManifestLoading ? (
        <div className="grid h-[72vh] place-items-center rounded-lg border border-slate-300 bg-white text-slate-500">
          正在加载 manifest 和游戏入口...
        </div>
      ) : error ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          加载失败：{error}
        </p>
      ) : isEnded ? (
        <div className="grid h-[72vh] place-items-center rounded-lg border border-slate-300 bg-white">
          <div className="text-center">
            <h2 className="text-2xl font-semibold">游戏已结束</h2>
            <p className="mt-2 text-slate-600">可以重新开始，或返回首页继续探索。</p>
          </div>
        </div>
      ) : (
        <div className="relative">
          {isFrameLoading ? (
            <div className="absolute inset-0 z-10 grid place-items-center rounded-lg border border-slate-300 bg-white text-slate-500">
              正在载入游戏...
            </div>
          ) : null}
          <iframe
            key={frameKey}
            title={manifest?.title ?? game.title}
            src={entryUrl}
            sandbox="allow-scripts"
            onLoad={() => setIsFrameLoading(false)}
            className="h-[72vh] w-full rounded-lg border border-slate-300 bg-white"
          />
        </div>
      )}
    </main>
  );
}
