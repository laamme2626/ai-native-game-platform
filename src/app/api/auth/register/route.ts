import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { createSession, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");

  if (!email || password.length < 8) {
    redirect("/register?error=%E8%AF%B7%E4%BD%BF%E7%94%A8%E6%9C%89%E6%95%88%E9%82%AE%E7%AE%B1%E5%92%8C%208%20%E4%BD%8D%E4%BB%A5%E4%B8%8A%E5%AF%86%E7%A0%81");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) redirect("/register?error=%E8%AF%A5%E9%82%AE%E7%AE%B1%E5%B7%B2%E6%B3%A8%E5%86%8C");

  const user = await prisma.user.create({
    data: { email, passwordHash: await hashPassword(password) },
  });
  await createSession(user.id);
  return NextResponse.redirect(new URL("/create", request.url));
}
