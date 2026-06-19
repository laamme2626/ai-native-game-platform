import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import JobClient from "./job-client";

export default async function JobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const job = await prisma.generationJob.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!job) redirect("/create");
  return <JobClient jobId={id} />;
}
