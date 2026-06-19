# Yahaha MVP

AI native interactive game web platform MVP built with Next.js App Router,
TypeScript, Tailwind, Prisma, and SQLite.

## Features

- Email/password registration and login with an HTTP-only cookie session.
- Home page lists only published games.
- Create page submits a natural-language game idea.
- Generation jobs are stored in SQLite and polled by the browser.
- The MVP Agent creates a constrained `game_spec.json`, validates it, then
  renders `manifest.json` and a runnable `index.html`.
- Generated assets are written through `src/lib/storage.ts` into
  `public/generated/games/{gameId}/`.
- Draft games can be previewed and published.
- Play pages load game meta from SQLite, fetch the generated manifest, and run
  the entry URL in a sandbox iframe.

## Quick Start

```bash
npm install
copy .env.example .env
npm run setup
npm run dev
```

Open `http://localhost:3000`.

Seed login:

```text
demo@yahaha.local
password123
```

## Commands

```bash
npm run dev
npm run build
npm run lint
npm run db:migrate
npm run db:seed
```

## Storage

The MVP uses local filesystem storage under `public/generated`. The rest of the
app talks to `src/lib/storage.ts`, so moving to MinIO, S3, OSS, or R2 should be
implemented behind the same service boundary instead of touching pages or API
routes.
