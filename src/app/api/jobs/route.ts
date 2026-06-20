import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { saveUploadedAsset } from "@/lib/storage";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const form = await request.formData();
  const prompt = String(form.get("prompt") ?? "").trim();
  if (prompt.length < 10) {
    return NextResponse.json(
      { error: "创意描述至少需要 10 个字符" },
      { status: 400 },
    );
  }
  if (prompt.length > 500) {
    return NextResponse.json(
      { error: "创意描述不能超过 500 个字符" },
      { status: 400 },
    );
  }

  let upload = null;
  const file = form.get("asset");
  if (file instanceof File && file.size > 0) {
    try {
      upload = await saveUploadedAsset(file);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "素材上传失败" },
        { status: 400 },
      );
    }
  }

  const job = await prisma.generationJob.create({
    data: {
      userId: user.id,
      prompt,
      status: "queued",
      assetName: upload?.assetName,
      assetUrl: upload?.assetUrl,
      assetType: upload?.assetType,
      assetSize: upload?.assetSize,
    },
  });

  await prisma.agentLog.create({
    data: {
      jobId: job.id,
      agentName: "Agent Orchestrator",
      message: "生成任务已进入队列",
      metadata: { promptLength: prompt.length, assetName: upload?.assetName },
    },
  });

  return NextResponse.json({ jobId: job.id });
}
