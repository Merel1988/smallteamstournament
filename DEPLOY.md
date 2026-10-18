# Deploy checklist — Small Teams Tournament app

Laatste update: 2026-05-29 — **🚀 LIVE op https://smallteamstournament.nl**

## 👉 Wat moet er nog gebeuren

De app draait in productie. Stappen 1 t/m 5 zijn klaar. Wat nog open staat:

1. **Preview env vars** importeren via het dashboard → zie [stap 4](#4-env-vars-naar-vercel) (alleen nodig voor PR/branch-previews).
2. **Handmatige smoke tests** die ik niet kan automatiseren → zie [stap 6](#6-smoke-test-na-deploy): admin-login met prod-wachtwoord, foto-upload (Blob), push-notificaties op mobiel, PWA-icons.
3. **Optioneel** → zie [stap 7](#7-optioneel): demo-data seeden, URL + wachtwoord delen via 1Password.

> ⚠️ **PWA-icons ontbreken nog:** `public/icon-192.png` en `public/icon-512.png` bestaan nog niet in de repo. De manifest verwijst ernaar — deze moeten nog aangemaakt/toegevoegd worden.

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

## Stappen

### 1. Kies een `ADMIN_PASSWORD` ✅
- [x] Sterke string gekozen en ingevuld in `.env.production.local` + gezet op Vercel Production
- [ ] Nog doen: opslaan/delen via 1Password (zie stap 7)

### 2. Vercel project aan repo koppelen ✅
- [x] Gekoppeld als project `derbyapp` (`merel1988s-projects`). Auto-deploy bij push naar `main` actief.

### 3. Vercel Blob store koppelen ✅
- [x] Blob-store aangemaakt; `BLOB_READ_WRITE_TOKEN`, `BLOB_STORE_ID`, `BLOB_WEBHOOK_PUBLIC_KEY` automatisch toegevoegd op alle envs.

### 4. Env vars naar Vercel
- [x] **Production** — 7 secrets via CLI gezet (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `ADMIN_PASSWORD`, `ADMIN_SECRET`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`). De 3 Blob-vars (`BLOB_READ_WRITE_TOKEN`, `BLOB_STORE_ID`, `BLOB_WEBHOOK_PUBLIC_KEY`) zijn al door de Blob-store toegevoegd op alle envs.
- [ ] **Preview** — nog te doen via dashboard → **Settings → Environment Variables → Import .env** → upload `.env.production.local` → selecteer **alleen Preview** (Production staat al goed). Niet via CLI: de veilige stdin-methode kan niet zonder `--value` (secret op command line) "alle Preview branches" zetten in agent-mode.

💡 Production is klaar — `vercel --prod` werkt nu volledig. Preview is alleen nodig voor PR/branch-deploys.

### 5. Eerste deploy ✅
- [x] Gedaan via push naar `main` (commit `126d8dc`, 2026-05-29) → Vercel auto-deploy. Status: **Ready**.
- Live op: **https://smallteamstournament.nl** (+ www), `https://derbyapp.vercel.app`.

### 6. Smoke test na deploy
- [x] Homepage laadt (HTTP 200) — countdown visueel nog handmatig checken
- [x] `/teams`, `/schema`, `/bingo`, `/fotos`, `/mvp` laden (allemaal 200, ook `/en`)
- [x] `/admin/login` bereikbaar (200) — inloggen met prod wachtwoord nog handmatig testen
- [ ] Foto uploaden werkt (test Blob)
- [ ] Push-notificaties: site toevoegen aan mobiel home screen → notificaties aanzetten → test vanaf `/admin/push`
- [ ] PWA icons zichtbaar (`public/icon-192.png`, `icon-512.png`)

### 7. Optioneel
- [x] Custom domein `smallteamstournament.nl` al gekoppeld (alias actief)
- [ ] Demo-data seeden: `cp .env.production.local .env && npm run db:seed && rm .env`
- [ ] URL + `ADMIN_PASSWORD` delen met mede-organisatoren via 1Password

---

## Foto's rond het toernooi (FB30)

**Vooraf**
- [x] Prod-migratie (2026-10-18): `node --env-file=.env.production.local scripts/migrate-photos-prod.mjs`
- [x] AI Gateway-tegoed gekocht ($10, 2026-10-18)
- [ ] Rond 14 november: Vercel Pro aanzetten (Settings → Billing), Spend Management-melding op ca. $30
- [ ] Na Pro: env `PHOTO_MODERATION_ZDR=1` op Production zetten en opnieuw deployen
- [ ] Testen op iPhone en Android: uploaden (beide toestemmingskeuzes), downloaden via deelmenu, verwijderverzoek

**Na het toernooi**
- [ ] Uploads sluiten in `/admin/fotos`
- [ ] Archiveren: `node --env-file=.env.production.local scripts/archive-photos-prod.mjs` (zet alles + `photos.csv` in `./photo-archive`, gitignored)
- [ ] Na de bewaartermijn: foto's verwijderen (bulk in `/admin/fotos`) zodat Blob onder 1 GB blijft
- [ ] Blob-store overzetten volgens de Vercel-downgrade-instructies en terug naar Hobby

## 📂 Relevante bestanden

- `.env.production.local` — alle secrets, gitignored (niet verwijderen!)
- `prisma/schema.prisma` — database schema
- `vercel.json` — build config (`prisma generate && next build`)
- `src/proxy.ts` — admin auth middleware

## 🔗 Resources

- GitHub: https://github.com/Merel1988/smallteamstournament
- Turso dashboard: https://app.turso.tech
- Vercel: https://vercel.com/merel1988s-projects/derbyapp
- Live site: https://smallteamstournament.nl
