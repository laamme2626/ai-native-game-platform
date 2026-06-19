import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const prompt = String(body?.prompt ?? "").trim();
  if (prompt.length < 10) {
    return NextResponse.json(
      { error: "Prompt must be at least 10 characters" },
      { status: 400 },
    );
  }

  const job = await prisma.generationJob.create({
    data: { userId: user.id, prompt, status: "queued" },
  });

  await prisma.agentLog.create({
    data: {
      jobId: job.id,
      message: "Queued generation job",
      metadata: { promptLength: prompt.length },
    },
  });

  return NextResponse.json({ jobId: job.id });
}
