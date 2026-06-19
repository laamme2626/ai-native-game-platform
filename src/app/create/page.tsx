import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import CreateClient from "./create-client";

export default async function CreatePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="text-3xl font-semibold">Create an AI game</h1>
      <p className="mt-3 text-slate-600">
        Describe a compact interactive story. The MVP Agent creates a
        constrained game_spec.json, manifest.json, and runnable HTML entry.
      </p>
      <CreateClient />
    </main>
  );
}
