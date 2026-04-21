# Deploy checklist — Small Teams Tournament app

Status: werk-in-uitvoering. Vink af per stap.

## Al gedaan (automatisch)

- [x] Vercel CLI geïnstalleerd
- [x] Turso CLI al aanwezig + ingelogd als `merel1988`
- [x] VAPID keys gegenereerd → in `.env.production.local`
- [x] `ADMIN_SECRET` gegenereerd → in `.env.production.local`
- [x] Git repo geïnitialiseerd + gepushed naar https://github.com/Merel1988/smallteamstournament
- [x] Turso prod-db `derby-stt-prod` aangemaakt (regio aws-eu-west-1)
- [x] Turso credentials in `.env.production.local` gezet
- [x] Schema gepushed naar Turso (8 tabellen: Team, Player, Match, Photo, MvpVote, BingoPrompt, HouseRule, PushSubscription)

## Nog te doen (interactief / productie)

### 1. Optioneel: demo-data seeden
```bash
cp .env.production.local .env
npm run db:seed
rm .env
```

### 2. Kies een `ADMIN_PASSWORD`
Sterke string, opslaan in 1Password en delen met mede-organisatoren.
Vul in in `.env.production.local`.

### 3. Vercel project aan repo koppelen
```bash
vercel login
vercel link          # kies team + "create new project" → derby-stt
```

### 4. Vercel Blob store koppelen
Vercel dashboard → project → **Storage → Create → Blob Store**. Naam bv. `derby-photos`.
Token `BLOB_READ_WRITE_TOKEN` wordt dan automatisch toegevoegd aan de env vars.

### 5. Env vars naar Vercel
Voor elke var: zet op Production + Preview (en Development als je `vercel env pull` wil gebruiken).

```bash
vercel env add TURSO_DATABASE_URL production
vercel env add TURSO_AUTH_TOKEN production
vercel env add ADMIN_PASSWORD production
vercel env add ADMIN_SECRET production
vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY production
vercel env add VAPID_PRIVATE_KEY production
vercel env add VAPID_SUBJECT production
```

Of via dashboard: **Settings → Environment Variables** → bulk plakken vanuit `.env.production.local`.

### 6. Eerste deploy
```bash
vercel --prod
```
Of push naar `main` — Vercel deployt automatisch.

### 7. Custom domein (optioneel)
Vercel dashboard → **Settings → Domains** → bv. `stt.roadkillrollers.nl`. Vercel toont de DNS records die je bij je registrar moet zetten.

### 8. Smoke test na deploy
- [ ] Homepage laadt, countdown werkt
- [ ] `/teams`, `/schema`, `/bingo`, `/fotos`, `/mvp` laden
- [ ] `/admin/login` werkt met het prod wachtwoord
- [ ] Foto uploaden werkt (test Blob)
- [ ] Push-notificaties: site als PWA toegevoegd aan mobiel home screen → notificaties aanzetten → test vanaf `/admin/push`
- [ ] PWA icons zichtbaar (`public/icon-192.png`, `icon-512.png`)

### 9. Delen met mede-organisatoren
- URL
- `ADMIN_PASSWORD` via 1Password (niet via Slack/mail)
- Korte uitleg van admin-pagina's
