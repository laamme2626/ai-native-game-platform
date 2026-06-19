import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { runGenerationJob } from "@/lib/agent";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const job = await prisma.generationJob.findFirst({
    where: { id, userId: user.id },
    include: {
      game: {
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
        },
      },
      logs: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(job);
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const job = await prisma.generationJob.findFirst({
    where: { id, userId: user.id },
    select: { id: true, status: true },
  });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (job.status === "queued" || job.status === "failed") {
    await runGenerationJob(id);
  }
  return NextResponse.json({ ok: true });
}
