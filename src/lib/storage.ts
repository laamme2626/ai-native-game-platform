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
  tags: string[];
  entry: {
    type: "html";
    url: string;
  };
  specUrl: string;
  assetUrl?: string;
  createdAt: string;
};

const publicRoot = path.join(process.cwd(), "public");
const generatedRoot = path.join(publicRoot, "generated", "games");
const uploadsRoot = path.join(publicRoot, "generated", "uploads");

export type StoredUpload = {
  assetName: string;
  assetType: string;
  assetSize: number;
  assetUrl: string;
};

export const allowedUploadTypes = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "text/plain",
  "application/json",
  "application/pdf",
];

export const maxUploadBytes = 2 * 1024 * 1024;

export async function saveUploadedAsset(file: File): Promise<StoredUpload> {
  if (!allowedUploadTypes.includes(file.type)) {
    throw new Error("仅支持 PNG、JPG、WebP、GIF、TXT、JSON、PDF 素材");
  }
  if (file.size > maxUploadBytes) {
    throw new Error("素材大小不能超过 2MB");
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  const uploadId = `${Date.now()}-${crypto.randomUUID()}`;
  const dir = path.join(uploadsRoot, uploadId);
  await mkdir(dir, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, safeName), bytes);

  return {
    assetName: file.name,
    assetType: file.type,
    assetSize: file.size,
    assetUrl: `/generated/uploads/${uploadId}/${safeName}`,
  };
}

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
  tags: string[];
  assetUrl?: string | null;
}): GameManifest {
  return {
    schemaVersion: 1,
    title: params.title,
    description: params.description,
    tags: params.tags,
    entry: {
      type: "html",
      url: `/generated/games/${params.gameId}/index.html`,
    },
    specUrl: `/generated/games/${params.gameId}/game_spec.json`,
    assetUrl: params.assetUrl ?? undefined,
    createdAt: new Date().toISOString(),
  };
}
