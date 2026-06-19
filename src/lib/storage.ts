import path from "path";
import { mkdir, writeFile } from "fs/promises";

export type StoredGameAsset = {
  specUrl: string;
  manifestUrl: string;
  entryUrl: string;
};

type GameManifest = {
  schemaVersion: 1;
  title: string;
  description: string;
  entry: {
    type: "html";
    url: string;
  };
  specUrl: string;
  createdAt: string;
};

const publicRoot = path.join(process.cwd(), "public");
const generatedRoot = path.join(publicRoot, "generated", "games");

export async function saveGeneratedGameAssets(params: {
  gameId: string;
  spec: unknown;
  manifest: GameManifest;
  html: string;
}): Promise<StoredGameAsset> {
  const dir = path.join(generatedRoot, params.gameId);
  await mkdir(dir, { recursive: true });

  await writeFile(
    path.join(dir, "game_spec.json"),
    JSON.stringify(params.spec, null, 2),
    "utf8",
  );
  await writeFile(
    path.join(dir, "manifest.json"),
    JSON.stringify(params.manifest, null, 2),
    "utf8",
  );
  await writeFile(path.join(dir, "index.html"), params.html, "utf8");

  return {
    specUrl: `/generated/games/${params.gameId}/game_spec.json`,
    manifestUrl: `/generated/games/${params.gameId}/manifest.json`,
    entryUrl: `/generated/games/${params.gameId}/index.html`,
  };
}

export function buildLocalManifest(params: {
  gameId: string;
  title: string;
  description: string;
}): GameManifest {
  return {
    schemaVersion: 1,
    title: params.title,
    description: params.description,
    entry: {
      type: "html",
      url: `/generated/games/${params.gameId}/index.html`,
    },
    specUrl: `/generated/games/${params.gameId}/game_spec.json`,
    createdAt: new Date().toISOString(),
  };
}
