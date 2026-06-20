"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buttonClass } from "@/components/ui";

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
    setMessage("");
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
    setMessage("删除成功，正在返回首页...");
    window.setTimeout(() => router.push("/"), 500);
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        {status === "draft" ? (
          <button
            disabled={isBusy}
            onClick={() => mutate(`/api/games/${gameId}/publish`, "发布成功")}
            className={`${buttonClass("primary")} disabled:bg-slate-300 disabled:text-slate-600`}
          >
            发布
          </button>
        ) : (
          <button
            disabled={isBusy}
            onClick={() => mutate(`/api/games/${gameId}/unpublish`, "已取消发布")}
            className={`${buttonClass("danger")} disabled:bg-slate-300 disabled:text-slate-600`}
          >
            取消发布
          </button>
        )}
        {sourceJobId ? (
          <a href={`/jobs/${sourceJobId}`} className={buttonClass("secondary")}>
            生成任务
          </a>
        ) : null}
        {showRemix ? (
          <button
            disabled={isBusy}
            onClick={remix}
            className={`${buttonClass("secondary")} disabled:bg-slate-100 disabled:text-slate-500`}
          >
            Remix 派生
          </button>
        ) : null}
        <button
          disabled={isBusy}
          onClick={deleteGame}
          className={`${buttonClass("danger")} disabled:bg-slate-300 disabled:text-slate-600`}
        >
          删除
        </button>
      </div>
      {message ? <p className="text-sm font-medium text-blue-700">{message}</p> : null}
    </div>
  );
}
