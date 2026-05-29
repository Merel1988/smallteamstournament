# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Webapp for the **Small Teams Tournament** of Roadkill Rollers Nijmegen (event date: 21 November 2026). Dutch is the default locale; English is the secondary locale via `next-intl`. UI copy lives in `messages/{nl,en}.json`.

## Commands

```bash
npm run dev              # Next.js dev server on :3000
npm run build            # prisma generate && next build
npm run lint             # eslint
npm run db:push          # apply prisma/schema.prisma to local SQLite
SEED_DEMO=1 npm run db:seed   # seed demo data (teams, players, matches, bingo, rules)
npm run db:generate-sql  # emit schema.sql for syncing to Turso
```

No test runner is configured.

To sync Turso (production DB) after schema changes: `npm run db:generate-sql && turso db shell <db-naam> < schema.sql`.

## Architecture

### Routing layout

- App Router under `src/app`. Public pages live under `src/app/[locale]/...` (next-intl with `localePrefix: "as-needed"` — Dutch URLs have no prefix, English URLs are `/en/...`).
- Admin pages live under `src/app/admin/...` and are **outside** the `[locale]` segment — admin is Dutch-only.
- API routes under `src/app/api/...`.
- `src/proxy.ts` is the Next.js 16 middleware (named `proxy`, not `middleware`). It branches by pathname: `/admin/*` runs admin auth (cookie verify or redirect to `/admin/login`); `/api/*` passes through; everything else runs `next-intl` middleware. The `matcher` excludes `_next` and files with extensions.

### Admin auth

Shared-password gate (organisers share one password), not per-user accounts.

- `ADMIN_PASSWORD` (the shared secret) and `ADMIN_SECRET` (HMAC key for the signed cookie) are **required** — `getSecret()` throws if `ADMIN_SECRET` is missing.
- `src/lib/admin-auth.ts` issues an HMAC-signed cookie `derby_admin` (12h). `verify()` uses `timingSafeEqual`. `requireAdmin()` is the server-side guard for admin pages; the proxy enforces it at the edge.

### Data layer

- Prisma 7 with the **libsql adapter** (`@prisma/adapter-libsql`). Local dev uses `file:./dev.db`; production uses Turso (`TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`). The same client code works for both — selection happens in `src/lib/prisma.ts` based on env.
- Prisma client is generated to `src/generated/prisma` (custom output) and imported as `@/generated/prisma/client`. Do **not** import from `@prisma/client`.
- Schema in `prisma/schema.prisma`: `Team`, `Player`, `Match`, `Photo`, `MvpVote`, `BingoPrompt`, `HouseRule`, `PushSubscription`. MVP votes are deduped per voter+match via `voterHash` (anonymous hash from `src/lib/voter-id.ts`) and a `@@unique([voterHash, matchId])` constraint.
- `prisma.config.ts` exists separately from the schema and is what `prisma db push` / migrate diff use.

### External services

- **Vercel Blob** for photos / team logos / player headshots. `BLOB_READ_WRITE_TOKEN` required in prod. `next.config.ts` whitelists `*.public.blob.vercel-storage.com` for `next/image`.
- **Web Push (PWA)** with self-hosted VAPID keys. `public/sw.js` is the service worker; `src/components/ServiceWorkerRegister.tsx` registers it. Subscriptions stored in `PushSubscription`. Sending happens in `src/app/api/push/send` (admin-gated).

### Conventions

- Server Components by default; `'use client'` only on interactive components (`BingoCard`, `MvpVoter`, `PhotoUpload`, `NotificationsToggle`, `NicknameGenerator`, `LanguageSwitcher`, `Countdown`).
- Bingo state and other per-visitor progress is kept in `localStorage` — no user accounts.
- New user-facing strings must be added to both `messages/nl.json` and `messages/en.json`.
- Event metadata (date, venue) lives in `src/lib/event.ts` — change there, not in components.
