"use client";

import { useState } from "react";

export default function GameMetricButtons({
  gameId,
  playCount,
  likeCount,
  favoriteCount,
  isFavorite = false,
}: {
  gameId: string;
  playCount: number;
  likeCount: number;
  favoriteCount: number;
  isFavorite?: boolean;
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

  return (
    <div>
      <div className="flex flex-wrap gap-2 text-xs text-slate-600">
        <span className="rounded-full bg-slate-100 px-2 py-1">
          游玩 {counts.playCount}
        </span>
        <button
          type="button"
          onClick={() => update("like")}
          className="rounded-full border border-slate-300 bg-white px-2 py-1 text-slate-900 hover:bg-slate-50"
        >
          点赞 {counts.likeCount}
        </button>
        <button
          type="button"
          onClick={toggleFavorite}
          className={`rounded-full border px-2 py-1 hover:bg-slate-50 ${
            favorite
              ? "border-blue-600 bg-blue-50 text-blue-700"
              : "border-slate-300 bg-white text-slate-900"
          }`}
        >
          {favorite ? "已收藏" : "收藏"} {counts.favoriteCount}
        </button>
      </div>
      {message ? <p className="mt-2 text-xs text-blue-700">{message}</p> : null}
    </div>
  );
}
