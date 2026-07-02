# HANDOVER — Small Teams Tournament webapp

> **Doel van dit document.** Eén plek waar we altijd zien waar we staan, welke keuzes we hebben gemaakt en wat de volgende stap is. Werk dit bij aan het **einde van elke sessie**: vink af wat af is, noteer nieuwe beslissingen, verplaats openstaande punten. Zo kan een nieuwe Claude-sessie (of Merel) in 2 minuten instappen.

Laatste update: **2026-07-02** — F1 t/m F7 afgerond; **FB1 (pagina-zichtbaarheid) afgerond, gemigreerd én live** (prod-tabel `PageVisibility` aangemaakt, code op `main` → Vercel Ready, live geverifieerd). FB2 (push-bug) en FB3 (verstuurd-historie) nog open.

---

## 1. Status in één oogopslag

- **Live in productie:** https://smallteamstournament.nl (Vercel + Turso).
- **Event:** Small Teams Tournament, Roadkill Rollers Nijmegen — 21 november 2026, Sportzaal De Horstacker.
- **Huidige fase:** eerste verbeterronde **F1 t/m F7 af** en live; **feedback ronde 2: FB1 (pagina-zichtbaarheid) af, gemigreerd en live.** **Volgende stap: FB2** (push-notificatie komt niet aan — bug), daarna **FB3** (overzicht verstuurde notificaties). Overig resterend werk: PWA-icons, e-mail (§4b), handmatige Lighthouse-nulmeting.
- **Productie-DB migratie (F1/F2/F5): ✅ GEDAAN op 2026-07-02.** Op Turso (`derby-stt-prod`) zijn `MessageOverride` + `RegistrationLink` aangemaakt en is `Team.description` vervangen door `descriptionNl` + `descriptionEn` (bestaande waarde gekopieerd naar `descriptionNl`, daarna oude kolom gedropt). Bingo-data (27 `BingoPrompt`-rijen) bleef behouden. Migratie is chirurgisch uitgevoerd via een libSQL-script met de creds uit `.env.production.local` (idempotent: `CREATE TABLE IF NOT EXISTS`-achtig + kolom-checks). Code is gecommit + gepusht naar `main` en live geverifieerd (`/aanmelden`, team-detail NL/EN → 200).
- **Let op bij volgende schemawijzigingen:** de prod-DB is bestaand, dus `db:generate-sql` (from-empty) volstaat niet — schrijf een surgical migratie (ALTER/CREATE) tegen Turso en houd bingo-data intact.
- **Bekende openstaande productiepunten** (uit `DEPLOY.md`): PWA-icons (`public/icon-192.png`, `public/icon-512.png`) ontbreken nog; preview-env-vars nog niet geïmporteerd; handmatige smoke tests (admin-login, foto-upload, push) nog te doen.

## 2. Architectuur — snelle oriëntatie

De volledige architectuur staat in [CLAUDE.md](CLAUDE.md); niet dupliceren. De punten die voor de huidige ronde relevant zijn:

- **Teksten** staan nu **statisch** in `messages/nl.json` en `messages/en.json`, geladen via next-intl in `src/i18n/request.ts`. Locales: `nl` (default, geen URL-prefix), `en` (`/en/...`). Config in `src/i18n/routing.ts`.
- **Bewerkbare content** die nu al in de DB zit als voorbeeld-patroon: `HouseRule` en `BingoPrompt`. Admin-CRUD-patroon staat in [src/app/admin/regels/page.tsx](src/app/admin/regels/page.tsx) — server actions + `requireAdmin()` + `revalidatePath()`. Dit patroon kopiëren we voor nieuwe bewerkbare content.
- **Data:** Prisma 7 + libsql. Schema in `prisma/schema.prisma`. Na schemawijziging: `npm run db:push` (lokaal) en voor prod `npm run db:generate-sql && turso db shell <db> < schema.sql`. Client genereert naar `src/generated/prisma` — importeren als `@/generated/prisma/client`.
- **Admin** leeft buiten `[locale]` (Nederlands-only), publieke pagina's onder `src/app/[locale]/...`. In locale-pagina's `Link` uit `@/i18n/navigation` gebruiken.
- **Nieuwe user-facing strings** altijd in **beide** `messages/*.json`.

## 3. Beslissingen (deze ronde)

| # | Vraag | Keuze |
|---|-------|-------|
| B1 | Hoe ver met bewerkbare teksten? | **Alles in één keer bewerkbaar** — generieke tekstlaag over next-intl heen, alle bestaande keys per taal aanpasbaar via admin, JSON als fallback/default. |
| B2 | Zichtbaarheid van links | **Handmatige aan/uit-knop** per link in admin (geen geplande datum voorlopig). |
| B3 | Teams/spelers tweetalig | **Wel meenemen.** Let op: namen (team- en derbynamen, rugnummers) zijn eigennamen en worden niet vertaald; de enige echte prozatekst is `Team.description` → die maken we tweetalig. |

## 4. Plan — eerste verbeterronde

Volgorde is bewust: F1 legt de tekstlaag die F2 nodig heeft. Elke fase is los deploybaar.

### F1 · Bewerkbare teksten (alle pagina's) — *fundament* ✅ AF
Generieke override-laag bovenop next-intl.
- [x] Schema: model `MessageOverride { locale, key, value, @@unique([locale, key]) }` (`key` = dotted path, bijv. `Home.countdownLabel`). Zie `prisma/schema.prisma`; lokaal via `db:push` toegepast.
- [x] `src/i18n/request.ts`: basis-JSON laden en DB-overrides er diep overheen mergen. Merge-logica in `src/lib/messages.ts` (`flattenMessages` / `applyOverrides`). Niet-bewerkte keys vallen terug op JSON. Hele merge in try-catch → bij DB-fout gewoon de JSON-basis.
- [x] Admin-pagina **Teksten** (`src/app/admin/teksten/page.tsx` + nav-link): per taal (nl/en via `?locale=`) de hele boom gegroepeerd per namespace, elk veld voorgevuld met de effectieve waarde. Opslaan per namespace: veld ≠ standaard → override upsert, veld = standaard → override verwijderd. Per aangepast veld een **Herstel**-knop.
- [x] Na opslaan/herstel breed `revalidatePath("/", "layout")` zodat publieke pagina's de nieuwe tekst tonen.
- [x] **Risico's afgedekt:** ICU-plurals (`Teams.playerCount`) en HTML-in-tekst (`Rules.intro*`) tonen een "ICU / HTML — bewerk met zorg"-badge. Kapotte ICU wordt niet opgeslagen (`isValidIcu` bij save) én bij merge overgeslagen (basiswaarde blijft staan); next-intl `onError`/`getMessageFallback` voorkomt een crash mocht er toch iets doorheen glippen. Lokaal end-to-end geverifieerd (override zichtbaar op publieke pagina, correct per locale, herstel werkt).

### F2 · Aanmeldpagina (`/aanmelden`) ✅ AF
- [x] Nav-item + route onder `[locale]` (`src/app/[locale]/aanmelden/page.tsx`, nav-item na Home in `[locale]/layout.tsx`). URL `/aanmelden` voor beide locales (net als `/regels`, `/venue`).
- [x] Nieuwe namespace `Aanmelden` in beide `messages/*.json` (title, subtitle, empty, openLink, questions) + `Nav.aanmelden`. Meteen bewerkbaar via F1.
- [x] Schema: model `RegistrationLink { id, order, url, labelNl, labelEn?, descriptionNl?, descriptionEn?, visible @default(false) }`. `labelEn`/`descriptionEn` optioneel → fallback naar NL. Lokaal via `db:push`.
- [x] Admin-CRUD voor links (`src/app/admin/aanmelden/page.tsx`, inline server actions à la `admin/regels`) + nav-link. Velden voor url, NL/EN label + omschrijving, volgorde, zichtbaar-checkbox.
- [x] Publieke pagina toont alleen `visible: true`, per locale het juiste veld (EN valt terug op NL). Extern-link met `target="_blank" rel="noopener noreferrer"`. Lokaal geverifieerd (zichtbare links tonen, verborgen lekt niet, EN-fallback werkt).

### F3 · Zichtbaarheid-schakelaar (B2) ✅ AF
- [x] `RegistrationLink.visible` toggle in admin (checkbox in de create/update-forms; nieuwe links standaard verborgen, met "verborgen"-badge in de lijst).
- [x] Bevestigd dat verborgen links nergens lekken: publieke pagina filtert op `visible: true` (geverifieerd in SSR-output), `RegistrationLink` wordt alleen in de publieke pagina + de auth-gated admin-pagina gebruikt, en er is geen sitemap/robots-route om in te lekken.

### F4 · Taalhint bij eerste bezoek ✅ AF
- [x] Kleine, dismissbare balk onder de header (`src/components/LanguageHintBar.tsx`, gemount in `[locale]/layout.tsx`): toont in de huidige taal dat de site ook in de andere taal bestaat, met een knop die via `router.replace(pathname, { locale })` wisselt (zelfde mechaniek als `LanguageSwitcher`).
- [x] Client component, onthoudt dismiss in `localStorage` (key `derby-lang-hint-v1`, mount-effect-patroon zoals `BingoCard` → SSR-veilig, geen hydration mismatch).
- [x] Strings in beide `messages/*.json` (namespace `LanguageHint`: `message`, `action`, `dismiss`) → meteen bewerkbaar via F1. Lokaal geverifieerd: juiste tekst per locale in de client-payload, beide routes 200.

### F5 · Teams tweetalig (B3) ✅ AF
- [x] Schema: `Team.description` → `descriptionNl` + `descriptionEn`. Lokaal via `db push --accept-data-loss` + `prisma generate`. **Prod: zie §1 voor de handmatige datamigratie** (kolom-add + copy + drop).
- [x] Admin-teamsformulier (`src/app/admin/teams/page.tsx` + `actions.ts`): twee velden (NL + "EN, optioneel") in zowel het aanmaak- als bewerkformulier.
- [x] Publieke team-detailpagina (`src/app/[locale]/teams/[id]/page.tsx`) toont het veld op basis van locale, EN valt terug op NL als leeg. Lokaal geverifieerd: NL→NL, EN→EN, en EN-leeg→NL-fallback.
- [x] Spelers: geen prozavelden om te vertalen → geen schemawijziging (bewust, alleen gedocumenteerd).
- [x] Seed (`prisma/seed.ts`) bijgewerkt naar `descriptionNl` + `descriptionEn`.

### F6 · SEO verbeteren ✅ AF
- [x] Per-pagina metadata via `generateMetadata` op elke publieke route. Titels/omschrijvingen in nieuwe namespace `PageMeta` in beide `messages/*.json` (dus bewerkbaar via F1). Helper: `src/lib/seo.ts` (`pageMetadata`, `SITE_URL`, `localizedPath`, `languageAlternates`). Titel-template `%s · Small Teams Tournament` staat in `[locale]/layout.tsx`; home gebruikt `absoluteTitle`. `notificaties` is `noindex`.
- [x] `hreflang`/`alternates`: elke pagina zet `alternates.canonical` + `languages` (nl/en/x-default). Team-detail (`teams/[id]`) heeft dynamische metadata (titel = teamnaam, omschrijving locale-based). `metadataBase` = `https://www.smallteamstournament.nl`.
- [x] `src/app/sitemap.ts` (dynamisch: statische routes × locales mét hreflang-alternates + alle team-pagina's uit de DB; `notificaties`/admin uitgesloten) en `src/app/robots.ts` (disallow `/admin`, `/api`, `notificaties`; verwijst naar sitemap). **F3 gerespecteerd:** geen verborgen `RegistrationLink`-URL's in de sitemap (die staan niet als eigen route).
- [x] Open Graph / Twitter-card tags in alle metadata + **dynamische OG-afbeelding** via `src/app/[locale]/opengraph-image.tsx` (`next/og` `ImageResponse`, 1200×630, merkkleuren). Los van de nog ontbrekende PWA-icons. NB: de OG-URL bevat de locale-prefix (`/nl/opengraph-image`) en doet één 307-redirect naar `/opengraph-image` — alle grote scrapers volgen dat.
- [x] JSON-LD `SportsEvent` op de homepage (`src/components/EventJsonLd.tsx`, data uit `src/lib/event.ts` — daar zijn `street`/`postalCode`/`country` aan toegevoegd voor een net `PostalAddress`). Lokaal geverifieerd: metadata/hreflang/canonical/OG per locale, `sitemap.xml`, `robots.txt`, JSON-LD en OG-image; `npm run build` groen.

**Nog open (bewust doorgeschoven):** echte PWA-icons (`public/icon-192.png`, `icon-512.png`) + een statische fallback-OG/`icon` ontbreken nog (zie §1).

### F7 · Toegankelijkheid / WCAG verbeteren ✅ AF
- [x] **Focus-states**: globale `:focus-visible`-ring (rode outline + offset, zichtbaar op licht/donker/geel) in `globals.css` voor alle interactieve elementen. Bingo-vakjes en knoppen waren al echte `<button>`s (toetsenbord-OK). Ook `prefers-reduced-motion` gerespecteerd (animaties/transities uit).
- [x] **Kleurcontrast** tegen WCAG AA gecontroleerd (script met echte luminantie-berekening). Alle daadwerkelijke combinaties halen AA: ink-op-cream 17.6, geel-op-ink 12.0, wit/70-op-ink 9.8, accent-op-wit 4.88, wit-op-accent 4.88, ink/60-op-wit 5.25, groen-700-op-wit 5.02. **Enige randgeval:** `derby-accent` (rood) klein tekst direct op de cream achtergrond = 4.34 (alleen AA-large) — in de praktijk staat rode tekst op witte kaarten (4.88 ✓). Palet bewust niet aangepast (branding); gebruik `derby-accent-dark` (#8b0000, 10:1) als er ooit kleine rode tekst rechtstreeks op cream moet.
- [x] **Alt-teksten**: alle 8 `<Image>` hadden al alt; icoon-knoppen (bingo-toggle, taal-switch, taalhint-dismiss, foto-sluiten) hebben `aria-label`. RollerSkateLogo heeft een `<title>`.
- [x] **Semantische structuur**: `<html lang>` nu **dynamisch per locale** via `getLocale()` in `src/app/layout.tsx` (admin buiten `[locale]` valt terug op `nl`). Skip-to-content-link + `<main id="main-content" aria-label>` + `<nav aria-label>` in `[locale]/layout.tsx`. Nieuwe `A11y`-namespace (skipToContent/mainLabel/navLabel/closePhoto) in beide `messages/*.json`.
- [x] **Formulieren**: PhotoUpload-inputs hadden alleen placeholders → nu `aria-label` op file/naam/caption (+ `fileLabel`-string). Dynamische meldingen kondigen nu aan: fout = `role="alert"`, succes/status = `role="status"` (PhotoUpload, MvpVoter, NotificationsToggle). Nickname-generator kondigt de gerolde naam aan via een `aria-live` sr-only regio. Foto-lightbox: `role="dialog"` + `aria-modal` + label + zichtbare sluitknop + focus verplaatst naar sluitknop bij openen en terug bij sluiten (Escape werkte al).
- [ ] **Automatische axe/Lighthouse-nulmeting**: niet gedraaid in deze sessie (geen headless Chromium beschikbaar in de agent-omgeving). Aanrader: Lighthouse-tab in Chrome DevTools op de live site draaien als nulmeting/verificatie; de bovenstaande fixes dekken de gangbare axe-regels (labels, contrast, landmarks, focus, lang, naam-op-knop).

## 4a. Feedback ronde 2 — te verwerken (volgende stappen)

Feedback van Merel na oplevering F1–F7 (2026-07-02). Nog **niet** geïmplementeerd; hieronder met eerste diagnose zodat een volgende sessie er direct in kan.

### FB1 · Pagina-zichtbaarheid ✅ AF (gemigreerd + live op 2026-07-02)
Besloten met Merel: **pagina-niveau** (hele nav-items aan/uit), niet link-niveau.
- [x] Schema: model `PageVisibility { key @id, visible @default(true), updatedAt }`. **Ontbrekende rij = zichtbaar** — alleen verborgen pagina's krijgen een rij met `visible=false`. Lokaal via `db:push`.
- [x] Centrale registry `src/lib/pages.ts` (`TOGGLABLE_PAGES`): één bron voor de 9 schakelbare pagina's (aanmelden, teams, schema, bingo, fotos, mvp, regels, venue, nickname) met `key`/`path`/`navKey`/`adminLabel`. **Home is bewust niet schakelbaar** (altijd aan).
- [x] Helper `src/lib/page-visibility.ts`: `getHiddenPageKeys()` (Set, DB-fout → niks verborgen) + `assertPageVisible(key)` → `notFound()`.
- [x] Nav in `[locale]/layout.tsx` filtert verborgen items (beide talen). Elke publieke route roept `assertPageVisible(...)` aan (venue + nickname kregen daarvoor `force-dynamic`; teams/[id] valt onder key "teams"). Homepage-feature-cards (`[locale]/page.tsx`) worden óók gefilterd zodat een verborgen pagina nergens meer bereikbaar is. `sitemap.ts` laat verborgen pagina's weg (en team-detailpagina's als "teams" uit staat).
- [x] Admin-scherm `/admin/zichtbaarheid` (+ AdminNav-link "Zichtbaarheid"): checkbox per pagina, één "Opslaan" die per key upsert; daarna `revalidatePath("/", "layout")`. Lokaal end-to-end geverifieerd: verborgen pagina → 404 (NL + `/en`), uit nav, uit homepage-cards, uit sitemap; herstellen → alles terug; andere pagina's onaangetast; `npm run build` groen.
- [x] **Prod:** `PageVisibility`-tabel aangemaakt op Turso (`derby-stt-prod`) via het idempotente `scripts/migrate-pagevisibility-prod.mjs` (`node --env-file=.env.production.local ...`; `CREATE TABLE IF NOT EXISTS`, 0 rijen = alles zichtbaar). Code gecommit + gepusht naar `main` (`c96c02e`) → Vercel productie-deploy Ready. Live geverifieerd: home/bingo/teams 200, `/admin/zichtbaarheid` 307→login (geen 500), sitemap intact.

### FB2 · Push-notificatie komt niet aan (bug)
- **Flow:** `/admin/push` → server action → `sendToAll()` in `src/lib/push.ts` (web-push + VAPID). Abonneren gebeurt in `NotificationsToggle` + `/api/push/subscribe`.
- **Meest waarschijnlijke oorzaken (in volgorde):**
  1. **VAPID-env vars niet (correct) in Vercel-productie gezet.** `configureWebPush()` gooit "VAPID keys not configured" als ze ontbreken; de server action vangt dat niet af → stille fout. Check `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` in Vercel (staan wél lokaal in `.env.production.local`). **Belangrijk:** de public key waarmee de browser abonneerde moet bij dezelfde private key horen — als de keys ooit gewijzigd zijn, moeten bestaande abonnementen opnieuw (oude subs falen met 403/InvalidSignature).
  2. **`sendToAll` slikt fouten stil op:** alleen HTTP 410 wordt afgehandeld (sub verwijderen); álle andere fouten (403, 400, netwerk) vallen in een lege catch → `sent` blijft 0 en er komt geen melding, zonder zichtbare foutmelding in de admin. **Fix-richting:** per-abonnee-fouten loggen/teruggeven en in de admin-UI tonen (nu geeft de pagina helemaal geen resultaat terug). Overweeg de server action het `{sent, removed}`-resultaat + fouten te laten tonen.
  3. **Service worker** (`public/sw.js`) `push`/`notificationclick`-handler verifiëren; en of de iOS-PWA daadwerkelijk "geïnstalleerd" is (iOS levert web-push alleen in geïnstalleerde PWA's).
- **Voorstel volgende stap:** eerst env vars in Vercel verifiëren; dan `sendToAll` fouten laten bubbelen + resultaat in admin tonen; dan end-to-end testen (abonneren → versturen → ontvangen) op een echt device.

### FB3 · Overzicht van reeds verstuurde notificaties
- **Huidige situatie:** er wordt **niks opgeslagen** over verzonden pushes — geen historie.
- **Voorstel volgende stap:** `SentNotification`-model (`title`, `body`, `url?`, `sentCount`, `removedCount`, `createdAt`) dat `sendToAll` na verzending wegschrijft; op `/admin/push` een lijst "Recent verstuurd" tonen (nieuwste eerst). Sluit mooi aan op de foutafhandeling uit FB2 (resultaat per verzending vastleggen).

### FB4 · Team verwijderen gaf een error ✅ FIX (deploy openstaand)
- **Oorzaak:** `Match → Team` is `ON DELETE RESTRICT`, dus een team dat in een wedstrijd voorkomt kon niet verwijderd worden (FK-fout). Lokaal viel dit niet op (0 matches), in prod wel.
- **Fix:** `deleteTeam` (`src/app/admin/teams/actions.ts`) verwijdert nu eerst de matches van het team (hun MVP-stemmen cascaden), dan het team (spelers + stemmen cascaden), atomair via `$transaction`. DB-niveau geverifieerd: directe delete faalt met FK-fout, matches-eerst-volgorde slaagt. `npm run build` groen. Commit `88a4812`. **Nog deployen naar `main`.**

### FB5 · Teams-pagina tijdelijk verborgen
- Op verzoek van Merel staat de **teams-pagina voorlopig uit** (niet in nav, niet op home). Gezet via `scripts/set-page-visibility-prod.mjs teams off` (prod `PageVisibility`-rij `teams`=0). Weer aanzetten kan in **`/admin/zichtbaarheid`** (vink Teams aan) of `... set-page-visibility-prod.mjs teams on`. NB: dit raakt alleen de **publieke** pagina; teams beheren/verwijderen in admin blijft gewoon werken.

## 4b. E-mail — `info@smallteamstournament.nl` (los van de app)

Besluit: gedeelde postbus via **Purelymail** (~€9/jaar), minstens **2 organisatoren** delen dezelfde IMAP-login. iCloud viel af (postbus hangt aan één Apple ID, geen gedeelde toegang). DNS staat bij **Vercel** (`ns1/ns2.vercel-dns.com`), nu nog géén MX/SPF ingesteld.

- [ ] Purelymail-account + domein toevoegen.
- [ ] DNS-records (MX, SPF, DKIM, DMARC) in Vercel zetten — kan via Vercel CLI.
- [ ] Postbus `info@` aanmaken, login delen met 2e organisator.
- [ ] Beiden via IMAP in mail-app; testen op bezorging (niet in spam).

## 5. Bekende beperkingen / open punten

- Team-/derbynamen worden niet vertaald (eigennamen) — bewust, zie B3.
- Caching-gedrag van de tekst-override-laag goed testen: publieke pagina's mogen niet een oude (gecachte) tekst blijven tonen na een admin-edit.
- PWA-icons ontbreken nog (zie §1).

## 6. Nieuwe sessie starten

1. Lees dit document (§1 status, §4 plan) en `CLAUDE.md`.
2. `npm install && npm run dev`, open http://localhost:3000. Voor data: `SEED_DEMO=1 npm run db:seed`.
3. Pak de eerste niet-afgevinkte taak in §4. Schemawijziging? → `npm run db:push`.
4. Aan het eind: vink af in §4, werk §1 en §3 bij, update "Laatste update".
