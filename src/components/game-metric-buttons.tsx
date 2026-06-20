"use client";

import { useState } from "react";

export default function GameMetricButtons({
  gameId,
  playCount,
  likeCount,
  favoriteCount,
}: {
  gameId: string;
  playCount: number;
  likeCount: number;
  favoriteCount: number;
}) {
  const [counts, setCounts] = useState({ playCount, likeCount, favoriteCount });
  const [message, setMessage] = useState("");

  async function update(action: "like" | "favorite") {
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
    setMessage(action === "like" ? "点赞成功" : "收藏成功");
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
          onClick={() => update("favorite")}
          className="rounded-full border border-slate-300 bg-white px-2 py-1 text-slate-900 hover:bg-slate-50"
        >
          收藏 {counts.favoriteCount}
        </button>
      </div>
      {message ? <p className="mt-2 text-xs text-blue-700">{message}</p> : null}
    </div>
  );
}
