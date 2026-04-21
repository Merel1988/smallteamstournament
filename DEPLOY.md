# Deploy checklist — Small Teams Tournament app

Laatste update: 2026-04-21 — paused, resumable.

## 👉 Pick up hier de volgende keer

Begin bij **stap 1**. Alles daarboven is al gedaan, alles daaronder wacht op jouw input.

---

## ✅ Al gedaan

- [x] Vercel CLI geïnstalleerd
- [x] Turso CLI ingelogd als `merel1988`
- [x] VAPID keys + `ADMIN_SECRET` gegenereerd en opgeslagen in `.env.production.local` (gitignored)
- [x] Git repo gepushed → https://github.com/Merel1988/smallteamstournament
- [x] Turso prod-db `derby-stt-prod` aangemaakt (aws-eu-west-1)
- [x] Turso credentials in `.env.production.local`
- [x] Schema gepushed naar Turso (8 tabellen: Team, Player, Match, Photo, MvpVote, BingoPrompt, HouseRule, PushSubscription)

---

## 🔜 Nog te doen

### 1. Kies een `ADMIN_PASSWORD`
- [ ] Sterke string bedenken
- [ ] Opslaan in 1Password (delen met mede-organisatoren kan later)
- [ ] Invullen in `.env.production.local` (regel: `ADMIN_PASSWORD=""`)

### 2. Vercel project aan repo koppelen (interactief)
```bash
cd ~/Sites/derbyapp
vercel login
vercel link          # answer: link existing? No → create new → name: derby-stt
```

### 3. Vercel Blob store koppelen
Dashboard van het nieuwe project → **Storage → Create → Blob Store**.
Naam bv. `derby-photos`. `BLOB_READ_WRITE_TOKEN` wordt automatisch toegevoegd.

### 4. Env vars naar Vercel
**Makkelijkst:** dashboard → **Settings → Environment Variables → Import .env** → upload `.env.production.local` → selecteer Production + Preview.

Of via CLI (één voor één):
```bash
vercel env add TURSO_DATABASE_URL production
vercel env add TURSO_AUTH_TOKEN production
vercel env add ADMIN_PASSWORD production
vercel env add ADMIN_SECRET production
vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY production
vercel env add VAPID_PRIVATE_KEY production
vercel env add VAPID_SUBJECT production
```

💡 Tip: zeg tegen Claude "zet nu de env vars naar Vercel" zodra stap 2 en 3 klaar zijn — die kan het dan voor je automatiseren.

### 5. Eerste deploy
```bash
vercel --prod
```
Of push naar `main` — Vercel deployt automatisch na stap 2.

### 6. Smoke test na deploy
- [ ] Homepage laadt, countdown werkt
- [ ] `/teams`, `/schema`, `/bingo`, `/fotos`, `/mvp` laden
- [ ] `/admin/login` werkt met het prod wachtwoord
- [ ] Foto uploaden werkt (test Blob)
- [ ] Push-notificaties: site toevoegen aan mobiel home screen → notificaties aanzetten → test vanaf `/admin/push`
- [ ] PWA icons zichtbaar (`public/icon-192.png`, `icon-512.png`)

### 7. Optioneel
- [ ] Custom domein koppelen (bv. `stt.roadkillrollers.nl`) via **Settings → Domains**
- [ ] Demo-data seeden: `cp .env.production.local .env && npm run db:seed && rm .env`
- [ ] URL + `ADMIN_PASSWORD` delen met mede-organisatoren via 1Password

---

## 📂 Relevante bestanden

- `.env.production.local` — alle secrets, gitignored (niet verwijderen!)
- `prisma/schema.prisma` — database schema
- `vercel.json` — build config (`prisma generate && next build`)
- `src/proxy.ts` — admin auth middleware

## 🔗 Resources

- GitHub: https://github.com/Merel1988/smallteamstournament
- Turso dashboard: https://app.turso.tech
- Vercel: https://vercel.com/dashboard (nog niet gekoppeld)
