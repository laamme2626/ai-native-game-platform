"use client";

import { useState } from "react";

export default function GameMetricButtons({
  gameId,
  playCount,
  likeCount,
  favoriteCount,
  isFavorite = false,
  dark = false,
}: {
  gameId: string;
  playCount: number;
  likeCount: number;
  favoriteCount: number;
  isFavorite?: boolean;
  dark?: boolean;
}) {
  const [counts, setCounts] = useState({ playCount, likeCount, favoriteCount });
  const [favorite, setFavorite] = useState(isFavorite);
  const [message, setMessage] = useState("");

  async function update(action: "like") {
    setMessage("");
    const response = await fetch(`/api/games/${gameId}/metrics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (!response.ok) {
      setMessage("更新失败，请稍后重试");
      return;
    }
    setCounts(await response.json());
    setMessage("点赞成功");
  }

  async function toggleFavorite() {
    setMessage("");
    const response = await fetch(`/api/games/${gameId}/favorite`, {
      method: "POST",
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setMessage(payload?.error ?? "请先登录后收藏");
      return;
    }
    setFavorite(payload.isFavorite);
    setCounts({
      playCount: payload.playCount,
      likeCount: payload.likeCount,
      favoriteCount: payload.favoriteCount,
    });
    setMessage(payload.isFavorite ? "已加入我的收藏" : "已取消收藏");
  }

  const chip = dark
    ? "border-white/10 bg-white/8 text-slate-200 hover:bg-white/12"
    : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50";
  const active = dark
    ? "border-cyan-300/40 bg-cyan-300/15 text-cyan-100"
    : "border-blue-600 bg-blue-50 text-blue-700";

  return (
    <div>
      <div className="flex flex-wrap gap-2 text-xs font-bold">
        <span className={`rounded-full border px-2.5 py-1 ${chip}`}>
          游玩 {counts.playCount}
        </span>
        <button
          type="button"
          onClick={() => update("like")}
          className={`rounded-full border px-2.5 py-1 transition ${chip}`}
        >
          点赞 {counts.likeCount}
        </button>
        <button
          type="button"
          onClick={toggleFavorite}
          className={`rounded-full border px-2.5 py-1 transition ${
            favorite ? active : chip
          }`}
        >
          {favorite ? "已收藏" : "收藏"} {counts.favoriteCount}
        </button>
      </div>
      {message ? (
        <p className={`mt-2 text-xs font-medium ${dark ? "text-cyan-100" : "text-blue-700"}`}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
