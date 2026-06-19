"use client";

import { useEffect, useState } from "react";

type Game = {
  id: string;
  title: string;
  description: string;
  status: string;
  manifestUrl: string;
  entryUrl: string;
};

type Manifest = {
  schemaVersion: 1;
  title: string;
  description: string;
  entry: { type: "html"; url: string };
  specUrl: string;
};

export default function PlayClient({ game }: { game: Game }) {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(game.manifestUrl)
      .then((response) => {
        if (!response.ok) throw new Error("Manifest request failed");
        return response.json();
      })
      .then(setManifest)
      .catch((err: Error) => setError(err.message));
  }, [game.manifestUrl]);

  const entryUrl = manifest?.entry.url ?? game.entryUrl;

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{game.title}</h1>
          <p className="mt-2 text-slate-600">{game.description}</p>
        </div>
        <span className="w-fit rounded-full border border-slate-300 bg-white px-3 py-1 text-sm">
          {game.status}
        </span>
      </div>
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : (
        <iframe
          title={manifest?.title ?? game.title}
          src={entryUrl}
          sandbox="allow-scripts"
          className="h-[72vh] w-full rounded-lg border border-slate-300 bg-white"
        />
      )}
    </main>
  );
}
