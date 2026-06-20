"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateClient() {
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
    if (asset) form.set("asset", asset);
    const response = await fetch("/api/jobs", {
      method: "POST",
      body: form,
    });
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
    const allowed = [
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/gif",
      "text/plain",
      "application/json",
      "application/pdf",
    ];
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
    <form onSubmit={submit} className="mt-6 grid gap-5">
      <label className="grid gap-2">
        <span className="text-sm font-medium">自然语言创意</span>
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value.slice(0, maxLength))}
          required
          minLength={10}
          rows={9}
          className="resize-none rounded-lg border border-slate-300 bg-white p-4 leading-7"
          placeholder="例如：生成一个可爱的猫咪逃出魔法森林的互动小游戏，有 3 个场景和 2 个结局，上传图片作为猫咪护符素材..."
        />
        <span className="text-xs text-slate-500">
          还可输入 {maxLength - prompt.length} 字
        </span>
      </label>
      <label className="grid gap-2 rounded-lg border border-dashed border-slate-300 bg-white p-4">
        <span className="text-sm font-medium">上传素材（可选）</span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,text/plain,application/json,application/pdf"
          onChange={(event) => pickFile(event.target.files?.[0] ?? null)}
          className="text-sm"
        />
        <span className="text-xs text-slate-500">
          支持图片或普通文件，最大 2MB。生产环境可迁移到 OSS / S3 / MinIO。
        </span>
        {asset ? (
          <span className="rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-800">
            已选择：{asset.name}（{Math.ceil(asset.size / 1024)} KB）
          </span>
        ) : null}
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        disabled={isSubmitting}
        className="w-fit rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-600"
      >
        {isSubmitting ? "正在创建任务..." : "生成游戏"}
      </button>
    </form>
  );
}
