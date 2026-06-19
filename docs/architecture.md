# Architecture

## Stack

- Next.js App Router for pages and API routes.
- TypeScript for app code.
- Tailwind CSS for UI.
- Prisma 7 with SQLite and `@prisma/adapter-better-sqlite3`.
- Local public storage as the object-storage MVP.

## Runtime Flow

1. User registers or logs in.
2. Create page posts a prompt to `/api/jobs`.
3. API creates a `GenerationJob` and initial `AgentLog`.
4. Job detail page starts processing with `POST /api/jobs/[id]` and polls
   `GET /api/jobs/[id]`.
5. Agent generates and validates `game_spec.json`.
6. Agent renders `manifest.json` and `index.html`.
7. Storage service writes assets to `public/generated/games/{gameId}`.
8. Agent creates a draft `Game`.
9. User previews `/play/[gameId]`, then publishes.
10. Published games appear on Home.

## Data Model

- `User`: email, password hash, games, jobs.
- `Game`: owner, title, description, prompt, status, manifest URL, entry URL,
  spec URL.
- `GenerationJob`: prompt, status, owning user, resulting game.
- `AgentLog`: ordered log messages for polling UI.

## Storage Boundary

`src/lib/storage.ts` owns all generated asset writes and public URLs. Replacing
local storage with MinIO/S3/OSS should keep the same interface:

- `saveGeneratedGameAssets`
- `buildLocalManifest` or a provider-specific manifest builder

Pages and API routes should continue to use database URLs, not filesystem paths.
