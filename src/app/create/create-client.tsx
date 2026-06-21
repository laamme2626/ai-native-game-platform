"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buttonClass, Card, Panel } from "@/components/ui";
import { supportedGameTypeLabels } from "@/lib/game-type-registry";

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
  const [unsupportedType, setUnsupportedType] = useState<{
    detectedType: string;
    supportedTypes: string[];
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const maxLength = 500;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (prompt.trim().length < 10) {
      setError("请至少输入 10 个字符的游戏创意");
      setUnsupportedType(null);
      return;
    }
    setIsSubmitting(true);
    setError("");
    setUnsupportedType(null);
    const form = new FormData();
    form.set("prompt", prompt);
    if (sourceGameId) form.set("sourceGameId", sourceGameId);
    if (asset) form.set("asset", asset);
    const response = await fetch("/api/jobs", { method: "POST", body: form });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "创建任务失败");
      if (payload.code === "UNSUPPORTED_GAME_TYPE") {
        setUnsupportedType({
          detectedType: payload.detectedType ?? "该玩法类型",
          supportedTypes: payload.supportedTypes ?? supportedGameTypeLabels,
        });
      }
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
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Panel className="overflow-hidden">
        <div className="border-b border-slate-200/70 bg-slate-950 px-5 py-4 text-white sm:px-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
            Prompt Studio
          </p>
          <h2 className="mt-1 text-2xl font-black">描述你的小游戏</h2>
        </div>
        <div className="p-5 sm:p-6">
          <label className="grid gap-3">
            <span className="text-sm font-black text-slate-950">自然语言创意</span>
            <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-3 text-xs leading-5 text-blue-900">
              当前支持：{supportedGameTypeLabels.join("、")}。如果创意很大，请改写为轻量小游戏玩法。
            </div>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value.slice(0, maxLength))}
              required
              minLength={10}
              rows={9}
              className="min-h-[260px] resize-none rounded-[22px] border border-slate-200 bg-white/90 p-4 text-base leading-7 text-slate-900 outline-none ring-blue-200 transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4"
              placeholder={
                sourceGameId
                  ? "例如：把主角改成狐狸，增加一个隐藏结局，并改成赛博朋克风格..."
                  : "例如：做一个赛博城市躲避无人机的小游戏，玩家操控蓝色角色块，坚持 30 秒获胜..."
              }
            />
            <div className="flex items-center justify-between gap-3 text-xs font-medium text-slate-500">
              <span>写清楚玩法、题材、目标和素材用途，生成质量会更稳定。</span>
              <span className="shrink-0">剩余 {maxLength - prompt.length} 字</span>
            </div>
          </label>
          {error ? (
            <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
              {error}
            </p>
          ) : null}
          {unsupportedType ? (
            <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              <p className="font-black">
                当前 Demo 暂不支持「{unsupportedType.detectedType}」玩法。
              </p>
              <p className="mt-1">
                目前支持：{unsupportedType.supportedTypes.join("、")}。请换一个轻量小游戏类型，或改写为当前支持的玩法。
              </p>
            </div>
          ) : null}
          <button
            disabled={isSubmitting}
            className={`${buttonClass("primary")} mt-5 w-full disabled:bg-slate-300 disabled:text-slate-600 sm:w-auto`}
          >
            {isSubmitting ? "正在创建任务..." : sourceGameId ? "生成 Remix" : "生成游戏"}
          </button>
        </div>
      </Panel>

      <aside className="grid gap-5 self-start">
        <Card className="p-5">
          <h2 className="text-sm font-black text-slate-950">上传素材</h2>
          <label className="mt-3 grid cursor-pointer gap-3 rounded-[22px] border border-dashed border-blue-300 bg-blue-50/70 p-5 text-sm text-slate-700 transition hover:border-blue-500 hover:bg-blue-50">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,text/plain,application/json,application/pdf"
              onChange={(event) => pickFile(event.target.files?.[0] ?? null)}
              className="text-sm"
            />
            <span className="text-xs leading-5 text-slate-500">
              支持图片或普通文件，最大 2MB。素材会进入本地 storage mock。
            </span>
            {asset ? (
              <span className="rounded-2xl bg-white px-3 py-2 text-sm font-bold text-blue-800 shadow-sm">
                已选择：{asset.name}（{Math.ceil(asset.size / 1024)} KB）
              </span>
            ) : null}
          </label>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-black text-slate-950">推荐 prompt</h2>
          <div className="mt-3 grid gap-2">
            {examples.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setPrompt(item)}
                className="rounded-2xl border border-slate-200 bg-white p-3 text-left text-xs font-medium leading-5 text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md"
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
