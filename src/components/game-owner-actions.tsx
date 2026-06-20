"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GameOwnerActions({
  gameId,
  status,
  sourceJobId,
  showRemix = true,
}: {
  gameId: string;
  status: string;
  sourceJobId?: string | null;
  showRemix?: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  async function mutate(path: string, success: string) {
    setIsBusy(true);
    setMessage("");
    const response = await fetch(path, { method: "POST" });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setMessage(payload?.error ?? "操作失败");
      setIsBusy(false);
      return;
    }
    setMessage(success);
    setIsBusy(false);
    router.refresh();
  }

  async function remix() {
    setIsBusy(true);
    const response = await fetch(`/api/games/${gameId}/remix`, { method: "POST" });
    const payload = await response.json().catch(() => null);
    setIsBusy(false);
    if (!response.ok) {
      setMessage(payload?.error ?? "Remix 失败");
      return;
    }
    router.push(payload.createUrl);
  }

  async function deleteGame() {
    const text =
      status === "draft"
        ? "确认删除这个草稿吗？该操作不可恢复。"
        : "确认删除这个已发布游戏吗？该操作不可恢复，并会从首页消失。";
    if (!window.confirm(text)) return;
    setIsBusy(true);
    setMessage("");
    const response = await fetch(`/api/games/${gameId}`, { method: "DELETE" });
    const payload = await response.json().catch(() => null);
    setIsBusy(false);
    if (!response.ok) {
      setMessage(payload?.error ?? "删除失败");
      return;
    }
    setMessage("删除成功");
    router.refresh();
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        {status === "draft" ? (
          <button
            disabled={isBusy}
            onClick={() => mutate(`/api/games/${gameId}/publish`, "发布成功")}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-600"
          >
            发布
          </button>
        ) : (
          <button
            disabled={isBusy}
            onClick={() => mutate(`/api/games/${gameId}/unpublish`, "已取消发布")}
            className="rounded-md bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:bg-slate-300 disabled:text-slate-600"
          >
            取消发布
          </button>
        )}
        {sourceJobId ? (
          <a
            href={`/jobs/${sourceJobId}`}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            查看生成任务
          </a>
        ) : null}
        {showRemix ? (
          <button
            disabled={isBusy}
            onClick={remix}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-500"
          >
            Remix 派生
          </button>
        ) : null}
        <button
          disabled={isBusy}
          onClick={deleteGame}
          className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:bg-slate-300 disabled:text-slate-600"
        >
          删除
        </button>
      </div>
      {message ? <p className="text-sm text-blue-700">{message}</p> : null}
    </div>
  );
}
