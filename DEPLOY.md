# Deploy checklist — Small Teams Tournament app

Status: werk-in-uitvoering. Vink af per stap.

## Al gedaan (automatisch)

- [x] Vercel CLI geïnstalleerd (`vercel --version`)
- [x] Turso CLI al aanwezig + ingelogd als `merel1988`
- [x] VAPID keys gegenereerd → staan in `.env.production.local`
- [x] `ADMIN_SECRET` gegenereerd → staat in `.env.production.local`

## Nog te doen (interactief / productie)

### 1. Git repo aanmaken en pushen
```bash
cd ~/Sites/derbyapp
git init
git add .
git commit -m "Initial commit: Small Teams Tournament app"

# Maak leeg repo op github.com (bijv. derbyapp) en:
git remote add origin git@github.com:<jouw-github-user>/derbyapp.git
git branch -M main
git push -u origin main
```

### 2. Turso productie-database
```bash
turso db create derby-stt-prod
turso db show derby-stt-prod --url           # → TURSO_DATABASE_URL
turso db tokens create derby-stt-prod        # → TURSO_AUTH_TOKEN
```
Vul beide waarden in in `.env.production.local`.

Schema pushen naar productie-db:
```bash
# Tijdelijk lokale env-file gebruiken:
cp .env.production.local .env
npx prisma db push
npm run db:seed    # optioneel — zet demo-data erin
rm .env            # weer opruimen
```

### 3. Kies een `ADMIN_PASSWORD`
Sterke string, opslaan in 1Password en delen met mede-organisatoren.
Vul in in `.env.production.local`.

### 4. Vercel project aan repo koppelen
```bash
vercel login
vercel link          # kies team + "create new project" → derby-stt
```

### 5. Vercel Blob store koppelen
Vercel dashboard → project → **Storage → Create → Blob Store**. Naam bv. `derby-photos`.
Token `BLOB_READ_WRITE_TOKEN` wordt dan automatisch toegevoegd aan de env vars.

### 6. Env vars naar Vercel
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

### 7. Eerste deploy
```bash
vercel --prod
```
Of push naar `main` — Vercel deployt automatisch.

### 8. Custom domein (optioneel)
Vercel dashboard → **Settings → Domains** → bv. `stt.roadkillrollers.nl`. Vercel toont de DNS records die je bij je registrar moet zetten.

### 9. Smoke test na deploy
- [ ] Homepage laadt, countdown werkt
- [ ] `/teams`, `/schema`, `/bingo`, `/fotos`, `/mvp` laden
- [ ] `/admin/login` werkt met het prod wachtwoord
- [ ] Foto uploaden werkt (test Blob)
- [ ] Push-notificaties: site als PWA toegevoegd aan mobiel home screen → notificaties aanzetten → test vanaf `/admin/push`
- [ ] PWA icons zichtbaar (`public/icon-192.png`, `icon-512.png`)

### 10. Delen met mede-organisatoren
- URL
- `ADMIN_PASSWORD` via 1Password (niet via Slack/mail)
- Korte uitleg van admin-pagina's
