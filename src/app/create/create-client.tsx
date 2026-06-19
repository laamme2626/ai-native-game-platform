"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateClient() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    const response = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Could not create job");
      setIsSubmitting(false);
      return;
    }
    router.push(`/jobs/${payload.jobId}`);
  }

  return (
    <form onSubmit={submit} className="mt-6 grid gap-4">
      <textarea
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        required
        minLength={10}
        rows={8}
        className="resize-none rounded-lg border border-slate-300 bg-white p-4 leading-7"
        placeholder="A time-loop mystery inside a floating tea house where every choice changes trust and focus..."
      />
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        disabled={isSubmitting}
        className="w-fit rounded-md bg-slate-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
      >
        {isSubmitting ? "Creating job..." : "Generate game"}
      </button>
    </form>
  );
}
