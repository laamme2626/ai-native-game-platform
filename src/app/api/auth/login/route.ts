import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { createSession, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    redirect("/login?error=Invalid%20email%20or%20password");
  }

  await createSession(user.id);
  return NextResponse.redirect(new URL("/create", request.url));
}
