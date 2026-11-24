import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";
import { assertPageVisible, getHiddenPageKeys } from "@/lib/page-visibility";
import { Link } from "@/i18n/navigation";
import { editionFinal, getEdition } from "@/lib/editions";
import type { EditionSnapshot, EditionTeam } from "@/lib/edition-types";
import { listHighlightPhotos, photographerAlbumVisible } from "@/lib/photos";
import { buildStandings, toScheduleMatch } from "@/lib/schedule";
import Standings from "@/components/Standings";
import PhotoGallery from "@/components/PhotoGallery";
import PhotographerAlbum from "@/components/PhotographerAlbum";
import EditionStats from "@/components/editions/EditionStats";
import { SectionNav } from "@/components/SectionNav";

export const dynamic = "force-dynamic";

type Params = Promise<{ locale: string; year: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, year } = await params;
  const base = await pageMetadata({ locale, page: "vorige-edities", path: `vorige-edities/${year}` });
  const t = await getTranslations({ locale, namespace: "Editions" });
  const title = t("editionTitle", { year });
  return { ...base, title, openGraph: { ...base.openGraph, title }, twitter: { ...base.twitter, title } };
}

export default async function EditionPage({ params }: { params: Params }) {
  const { locale, year: rawYear } = await params;
  await assertPageVisible("vorige-edities");
  const edition = getEdition(Number(rawYear));
  if (!edition) notFound();
  setRequestLocale(locale);

  const { snapshot, stats } = edition;
  const year = snapshot.year;
  const t = await getTranslations("Editions");
  const tSchema = await getTranslations("Schema");
  const [photos, hiddenPages, albumVisible] = await Promise.all([
    listHighlightPhotos(year),
    getHiddenPageKeys(),
    photographerAlbumVisible(),
  ]);
  const photographer = albumVisible ? edition.photographer : undefined;
  const showPhotosLink = !hiddenPages.has("fotos");

  const teamByKey = new Map(snapshot.teams.map((team) => [team.key, team]));
  const final = editionFinal(snapshot);
  const champion = final ? teamByKey.get(final.champion) : undefined;
  const introKey = `intro${year}`;
  const intro = t.has(introKey) ? String(t.raw(introKey) ?? "").trim() : "";

  const sections = [
    { id: "results", label: t("resultsHeading") },
    stats && { id: "stats", label: t("statsHeading") },
    { id: "teams", label: t("rostersHeading") },
    (photos.length > 0 || photographer) && { id: "photos", label: t("photosHeading") },
  ].filter((s): s is { id: string; label: string } => Boolean(s));

  return (
    <div className="space-y-4">
      <header className="space-y-4">
        <p className="text-xs uppercase tracking-wider text-derby-accent font-bold">{t("title")}</p>
        <h1 className="font-display text-5xl">{t("editionTitle", { year })}</h1>
      </header>
      <SectionNav items={sections} label={t("jumpTo")} align="start" />
      <div className="space-y-10">
        <div className="space-y-4">
          {intro && <p className="text-lg text-derby-ink/80 max-w-2xl whitespace-pre-line">{intro}</p>}
          {final && champion && (
            <div className="bg-derby-ink text-white rounded-2xl p-5 flex items-center gap-4 max-w-xl">
              {champion.logoUrl && (
                <Image
                  src={champion.logoUrl}
                  alt=""
                  width={72}
                  height={72}
                  className="w-18 h-18 rounded-lg object-contain bg-white p-1 shrink-0"
                />
              )}
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-derby-accent font-bold">
                  {t("champion")} <span aria-hidden>👑</span>
                </p>
                <p className="font-display text-3xl">{champion.name}</p>
                <p className="text-sm text-white/80">
                  {t("finalLine", {
                    score: `${Math.max(final.match.scoreA, final.match.scoreB)}-${Math.min(final.match.scoreA, final.match.scoreB)}`,
                    opponent: teamByKey.get(final.runnerUp)?.name ?? "",
                  })}
                </p>
              </div>
            </div>
          )}
        </div>

        <section id="results" aria-labelledby="results-heading" className="space-y-6 scroll-mt-[calc(var(--section-nav-top,100px)+4rem)]">
          <div>
            <h2 id="results-heading" className="font-display text-4xl">
              {t("resultsHeading")}
            </h2>
            <p className="text-sm text-derby-ink/60">{t("resultsNote")}</p>
          </div>
          <Results snapshot={snapshot} teamByKey={teamByKey} otherLabel={tSchema("otherPoule")} finalLabel={t("finalHeading")} />
          <Standings standings={standingsOf(snapshot, tSchema("otherPoule"))} t={tSchema} linkTeams={false} />
        </section>

        {stats && (
          <section id="stats" aria-labelledby="stats-heading" className="space-y-4 scroll-mt-[calc(var(--section-nav-top,100px)+4rem)]">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="stats-heading" className="font-display text-4xl">
                  {t("statsHeading")}
                </h2>
                <p className="text-sm text-derby-ink/60 max-w-2xl">{t("statsSource")}</p>
              </div>
              <a
                href={stats.pdfUrl}
                download
                className="inline-flex items-center gap-2 rounded-full bg-derby-accent text-white px-5 py-2.5 font-bold hover:bg-derby-accent-dark transition"
              >
                <span aria-hidden>⬇</span> {t("downloadPdf")}
              </a>
            </div>
            <div className="bg-white rounded-2xl shadow p-4 sm:p-6">
              <EditionStats
                stats={stats}
                teams={snapshot.teams.map((team) => ({ key: team.key, name: team.name }))}
                playerNames={Object.fromEntries(
                  snapshot.teams.flatMap((team) => team.players.map((p) => [`${team.key}:${p.number}`, p.derbyName])),
                )}
              />
            </div>
          </section>
        )}

        <section id="teams" aria-labelledby="teams-heading" className="space-y-4 scroll-mt-[calc(var(--section-nav-top,100px)+4rem)]">
          <h2 id="teams-heading" className="font-display text-4xl">
            {t("rostersHeading")}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {snapshot.teams.map((team) => (
              <li key={team.key}>
                <RosterCard team={team} countLabel={t("skaterCount", { count: team.players.length })} staffLabel={t("benchStaff")} />
              </li>
            ))}
          </ul>
        </section>

        {(photos.length > 0 || photographer) && (
          <section id="photos" aria-labelledby="photos-heading" className="space-y-4 scroll-mt-[calc(var(--section-nav-top,100px)+4rem)]">
            <h2 id="photos-heading" className="font-display text-4xl">
              {t("photosHeading")}
            </h2>
            {photographer && <PhotographerAlbum photographer={photographer} />}
            {photos.length > 0 && (
              <PhotoGallery initial={photos} initialCursor={null} uploadsOpen={false} showUpload={false} />
            )}
            {showPhotosLink && (
              <Link
                href="/fotos"
                className="inline-flex items-center gap-2 rounded-full bg-derby-accent text-white px-5 py-2.5 font-bold hover:bg-derby-accent-dark transition"
              >
                {t("allSubmittedPhotos")} <span aria-hidden>→</span>
              </Link>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function scheduleMatches(snapshot: EditionSnapshot) {
  const byKey = new Map(snapshot.teams.map((team) => [team.key, team]));
  const side = (key: string) => ({ id: key, name: byKey.get(key)?.name ?? key, color: byKey.get(key)?.color ?? null });
  return snapshot.matches.map((m, i) =>
    toScheduleMatch({
      id: String(i),
      startsAt: new Date(m.startsAt),
      poule: m.poule,
      teamA: side(m.teamA),
      teamB: side(m.teamB),
      scoreA: m.scoreA,
      scoreB: m.scoreB,
      status: "finished",
    }),
  );
}

function standingsOf(snapshot: EditionSnapshot, otherLabel: string) {
  return buildStandings(scheduleMatches(snapshot), otherLabel);
}

function Results({
  snapshot,
  teamByKey,
  otherLabel,
  finalLabel,
}: {
  snapshot: EditionSnapshot;
  teamByKey: Map<string, EditionTeam>;
  otherLabel: string;
  finalLabel: string;
}) {
  const groups = new Map<string, typeof snapshot.matches>();
  for (const m of snapshot.matches) {
    const key = m.poule || otherLabel;
    groups.set(key, [...(groups.get(key) ?? []), m]);
  }
  const name = (key: string) => teamByKey.get(key)?.name ?? key;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {[...groups].map(([poule, matches]) => {
        const isFinal = /final/i.test(poule);
        return (
          <div key={poule} className={`bg-white rounded-2xl shadow p-4 ${isFinal ? "md:col-span-2 border-2 border-derby-accent" : ""}`}>
            <h3 className="font-display text-2xl mb-2">{isFinal ? finalLabel : poule}</h3>
            <ul className="divide-y divide-derby-ink/10">
              {matches.map((m) => {
                const aWon = m.scoreA > m.scoreB;
                return (
                  <li key={m.startsAt} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2 text-sm">
                    <span className={`text-right ${aWon ? "font-bold" : "text-derby-ink/70"}`}>{name(m.teamA)}</span>
                    <span className="font-display text-xl tabular-nums whitespace-nowrap">
                      {m.scoreA} - {m.scoreB}
                    </span>
                    <span className={!aWon ? "font-bold" : "text-derby-ink/70"}>{name(m.teamB)}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function RosterCard({ team, countLabel, staffLabel }: { team: EditionTeam; countLabel: string; staffLabel: string }) {
  const players = [...team.players].sort((a, b) => a.derbyName.localeCompare(b.derbyName));
  return (
    <details className="group bg-white rounded-xl shadow" style={team.color ? { borderLeft: `6px solid ${team.color}` } : undefined}>
      <summary className="cursor-pointer list-none p-4 flex items-center gap-4">
        {team.logoUrl ? (
          <Image src={team.logoUrl} alt="" width={56} height={56} className="w-14 h-14 shrink-0 rounded-lg object-contain" />
        ) : (
          <div className="w-14 h-14 shrink-0 rounded-lg stripes" />
        )}
        <div className="min-w-0 flex-1">
          <div className="font-display text-2xl">{team.name}</div>
          <div className="text-xs text-derby-ink/60">{countLabel}</div>
        </div>
        <span aria-hidden className="text-derby-ink/40 group-open:rotate-180 transition">
          ▾
        </span>
      </summary>
      <div className="px-4 pb-4 space-y-3">
        <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          {players.map((p) => (
            <li key={`${p.number}-${p.derbyName}`} className="min-w-0 truncate">
              <span className="tabular-nums text-derby-ink/60">#{p.number}</span> <span className="font-bold">{p.derbyName}</span>
              {p.pronouns && <span className="text-derby-ink/60 text-xs"> ({p.pronouns})</span>}
            </li>
          ))}
        </ul>
        {team.benchStaff.length > 0 && (
          <div className="text-sm">
            <p className="text-xs uppercase tracking-wide text-derby-ink/60">{staffLabel}</p>
            <ul>
              {team.benchStaff.map((s) => (
                <li key={s.name}>
                  <span className="font-bold">{s.name}</span> <span className="text-derby-ink/60">({s.role})</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </details>
  );
}
