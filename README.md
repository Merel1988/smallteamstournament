# Derby STT Nijmegen

Webapp voor het **Small Teams Tournament** van Roadkill Rollers Nijmegen (21 november 2026, Sportzaal De Horstacker).

## Stack

- Next.js 16 App Router · React 19 · TypeScript
- Prisma 7 + Turso (libsql) — lokaal SQLite (`dev.db`), productie Turso
- Tailwind CSS 4
- Vercel Blob (foto's, logo's, headshots)
- Web Push (PWA) met eigen VAPID keys
- Shared-password admin (HMAC-signed cookie + `proxy.ts`)

## Eerste keer setup

```bash
npm install
cp .env.example .env
# vul .env in (ADMIN_PASSWORD en ADMIN_SECRET zijn verplicht)
npx prisma db push
SEED_DEMO=1 npm run db:seed
npm run dev
```

Open http://localhost:3000.

### Verplichte env vars (lokaal)

- `ADMIN_PASSWORD` — gedeeld wachtwoord voor organisatoren
- `ADMIN_SECRET` — HMAC key voor de admin cookie (`openssl rand -base64 32`)

Voor push notifications extra:

```bash
npx web-push generate-vapid-keys --json
```

Zet `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` en `VAPID_SUBJECT` in `.env`.

Voor foto-upload in prod: `BLOB_READ_WRITE_TOKEN` via Vercel Blob.

## Deploy

```bash
vercel link
vercel env pull .env.local
vercel deploy           # preview
vercel deploy --prod    # productie
```

Zet op Vercel:
- `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`
- `ADMIN_PASSWORD`, `ADMIN_SECRET`
- `BLOB_READ_WRITE_TOKEN`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`

Turso schema synchroniseren:

```bash
npm run db:generate-sql
turso db shell <db-naam> < schema.sql
```

## Admin

- `/admin/login` — wachtwoord uit `ADMIN_PASSWORD`
- `/admin/teams`, `/admin/spelers`, `/admin/schema`, `/admin/bingo`,
  `/admin/regels`, `/admin/fotos`, `/admin/mvp`, `/admin/push`, `/admin/qr`

## Features voor bezoekers

- Countdown + live/next match op de homepage
- Teams + rosters met nummers/headshots
- Speelschema per poule, live highlight van de lopende wedstrijd
- Regels + huisregels
- **Bingo** — random 5×5 kaart, voortgang in localStorage
- **Foto's** — upload direct publiek
- **MVP / Best Jammer** — anoniem stemmen per afgeronde wedstrijd
- **Derby-naam roller** — nickname generator
- Venue + sponsors
- PWA + push notificaties
