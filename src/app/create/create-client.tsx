"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buttonClass, Card } from "@/components/ui";

const examples = [
  "做一个赛博城市躲避无人机的小游戏，玩家操控蓝色角色块，坚持 30 秒获胜。",
  "生成一个猫咪逃出魔法森林的分支剧情游戏，有 3 个场景和 2 个结局。",
  "做一个海盗宝藏问答闯关，答对三道题才能打开宝箱。",
  "做一个校园考试翻牌记忆游戏，配对知识点和线索。",
  "做一个密室逃脱谜题，玩家找到 3 个线索后输入关键物品开门。",
];

export default function CreateClient({ sourceGameId }: { sourceGameId?: string }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [asset, setAsset] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const maxLength = 500;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (prompt.trim().length < 10) {
      setError("请至少输入 10 个字符的游戏创意");
      return;
    }
    setIsSubmitting(true);
    setError("");
    const form = new FormData();
    form.set("prompt", prompt);
    if (sourceGameId) form.set("sourceGameId", sourceGameId);
    if (asset) form.set("asset", asset);
    const response = await fetch("/api/jobs", { method: "POST", body: form });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "创建任务失败");
      setIsSubmitting(false);
      return;
    }
    router.push(`/jobs/${payload.jobId}`);
  }

  function pickFile(file: File | null) {
    setError("");
    if (!file) {
      setAsset(null);
      return;
    }
    const allowed = ["image/png", "image/jpeg", "image/webp", "image/gif", "text/plain", "application/json", "application/pdf"];
    if (!allowed.includes(file.type)) {
      setError("仅支持 PNG、JPG、WebP、GIF、TXT、JSON、PDF 素材");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("素材大小不能超过 2MB");
      return;
    }
    setAsset(file);
  }

  return (
    <form onSubmit={submit} className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
      <Card className="p-5 sm:p-6">
        <label className="grid gap-3">
          <span className="text-sm font-semibold text-slate-950">自然语言创意</span>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value.slice(0, maxLength))}
            required
            minLength={10}
            rows={12}
            className="resize-none rounded-2xl border border-slate-300 bg-white p-4 leading-7 text-slate-900 outline-none ring-blue-200 transition focus:border-blue-500 focus:ring-4"
            placeholder={
              sourceGameId
                ? "例如：把主角改成狐狸，增加一个隐藏结局，并改成赛博朋克风格..."
                : "例如：做一个赛博城市躲避无人机的小游戏，玩家操控蓝色角色块，坚持 30 秒获胜..."
            }
          />
          <span className="text-xs text-slate-500">
            还可输入 {maxLength - prompt.length} 字
          </span>
        </label>
        {error ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        <button
          disabled={isSubmitting}
          className={`${buttonClass("primary")} mt-5 disabled:bg-slate-300 disabled:text-slate-600`}
        >
          {isSubmitting ? "正在创建任务..." : sourceGameId ? "生成 Remix" : "生成游戏"}
        </button>
      </Card>

      <aside className="grid gap-5">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-slate-950">上传素材</h2>
          <label className="mt-3 grid cursor-pointer gap-2 rounded-2xl border border-dashed border-blue-300 bg-blue-50/70 p-4 text-sm text-slate-700 hover:bg-blue-50">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,text/plain,application/json,application/pdf"
              onChange={(event) => pickFile(event.target.files?.[0] ?? null)}
              className="text-sm"
            />
            <span className="text-xs text-slate-500">
              支持图片或普通文件，最大 2MB。
            </span>
            {asset ? (
              <span className="rounded-md bg-white px-3 py-2 text-sm text-blue-800">
                已选择：{asset.name}（{Math.ceil(asset.size / 1024)} KB）
              </span>
            ) : null}
          </label>
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-slate-950">推荐 prompt</h2>
          <div className="mt-3 grid gap-2">
            {examples.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setPrompt(item)}
                className="rounded-xl border border-slate-200 bg-white p-3 text-left text-xs leading-5 text-slate-700 hover:border-blue-300 hover:bg-blue-50"
              >
                {item}
              </button>
            ))}
          </div>
        </Card>
      </aside>
    </form>
  );
}
