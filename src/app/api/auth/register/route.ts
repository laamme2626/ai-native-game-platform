import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { createSession, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");

  if (!email || password.length < 8) {
    redirect("/register?error=Use%20a%20valid%20email%20and%208%2B%20character%20password");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) redirect("/register?error=Email%20already%20registered");

  const user = await prisma.user.create({
    data: { email, passwordHash: await hashPassword(password) },
  });
  await createSession(user.id);
  return NextResponse.redirect(new URL("/create", request.url));
}
