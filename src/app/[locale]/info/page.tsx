import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import DayProgram from "@/components/DayProgram";
import OfficialsRoster from "@/components/OfficialsRoster";
import { Link } from "@/i18n/navigation";
import { MATCH_MINUTES } from "@/lib/event";
import type { ProgramEntry, RosterMatch } from "@/lib/infopack";
import { assertPageVisible, getHiddenPageKeys } from "@/lib/page-visibility";
import type { PageKey } from "@/lib/pages";
import { prisma } from "@/lib/prisma";
import { kindOf } from "@/lib/schedule";
import { pageMetadata } from "@/lib/seo";
import { eventMinutes } from "@/lib/time";
import { sideName } from "@/lib/match-teams";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ locale, page: "info", path: "info" });
}

const LINKS: { key: PageKey; navKey: string; href: string; emoji: string }[] = [
  { key: "toernooi", navKey: "toernooi", href: "/toernooi", emoji: "🏆" },
  { key: "schema", navKey: "schema", href: "/schema", emoji: "⏱️" },
  { key: "venue", navKey: "venue", href: "/venue", emoji: "📍" },
  { key: "regels", navKey: "rules", href: "/regels", emoji: "📖" },
];

export default async function InfoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await assertPageVisible("info");
  setRequestLocale(locale);
  const t = await getTranslations("Info");
  const tNav = await getTranslations("Nav");
  const hasText = (key: string) => String(t.raw(key) ?? "").trim().length > 0;
  const en = locale === "en";

  const hidden = await getHiddenPageKeys();
  const [items, matches, lockerRooms, teams] = await Promise.all([
    prisma.programItem.findMany({ orderBy: { start: "asc" } }).catch(() => []),
    prisma.match
      .findMany({
        orderBy: { startsAt: "asc" },
        include: { teamA: true, teamB: true, officials: { orderBy: { sortOrder: "asc" } } },
      })
      .catch(() => []),
    prisma.lockerRoom.findMany({ orderBy: { sortOrder: "asc" } }).catch(() => []),
    prisma.team.findMany({ select: { id: true, name: true, color: true } }).catch(() => []),
  ]);
  const teamByName = new Map(
    hidden.has("teams") ? [] : teams.map((team) => [team.name.toLowerCase(), team]),
  );

  const showMatches = !hidden.has("schema");
  const entries: ProgramEntry[] = [
    ...items.map((i) => ({
      id: i.id,
      start: i.start,
      end: i.end,
      title: (en && i.titleEn) || i.titleNl,
      note: (en && i.noteEn) || i.noteNl,
      kind: "item" as const,
    })),
    ...(showMatches ? matches : []).map((m) => {
      const kind = kindOf(m.poule);
      const start = eventMinutes(m.startsAt);
      return {
        id: m.id,
        start,
        end: kind === "match" ? start + MATCH_MINUTES : null,
        title:
          kind === "match"
            ? `${m.poule ? `${m.poule} · ` : ""}${sideName(m.teamA, m.teamALabel)} vs ${sideName(m.teamB, m.teamBLabel)}`
            : (m.poule ?? ""),
        note: null,
        kind: kind === "break" ? ("break" as const) : kind === "match" ? ("match" as const) : ("item" as const),
      };
    }),
  ].sort((a, b) => a.start - b.start || (a.kind === "match" ? 1 : -1));

  const roster: RosterMatch[] = matches
    .filter((m) => kindOf(m.poule) === "match" && m.officials.length > 0)
    .map((m) => ({
      id: m.id,
      start: eventMinutes(m.startsAt),
      label: `${sideName(m.teamA, m.teamALabel)} vs ${sideName(m.teamB, m.teamBLabel)}`,
      poule: m.poule,
      assignments: m.officials.map((a) => ({
        id: a.id,
        position: a.position,
        name: a.name,
        pronouns: a.pronouns,
      })),
    }));

  const links = LINKS.filter((l) => !hidden.has(l.key));

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <h1 className="font-display text-5xl">{t("title")}</h1>
        {hasText("lead") && <p className="text-lg text-derby-ink/80 max-w-2xl">{t("lead")}</p>}
        <nav aria-label={t("jumpLabel")} className="flex flex-wrap gap-2 text-sm">
          <a href="#programma" className="rounded-full bg-derby-ink text-white px-4 py-1.5 font-bold hover:bg-derby-accent transition">
            {t("programHeading")}
          </a>
          {lockerRooms.length > 0 && (
            <a href="#kleedkamers" className="rounded-full bg-derby-ink text-white px-4 py-1.5 font-bold hover:bg-derby-accent transition">
              {t("lockerHeading")}
            </a>
          )}
          <a href="#officials" className="rounded-full bg-derby-ink text-white px-4 py-1.5 font-bold hover:bg-derby-accent transition">
            {t("rosterHeading")}
          </a>
        </nav>
      </header>

      {links.length > 0 && (
        <section aria-labelledby="links-heading" className="space-y-3">
          <h2 id="links-heading" className="font-display text-3xl">
            {t("linksHeading")}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {links.map((l) => (
              <li key={l.key}>
                <Link
                  href={l.href}
                  className="group flex h-full items-start gap-3 bg-white rounded-2xl p-4 shadow hover:-rotate-1 hover:shadow-lg transition"
                >
                  <span className="text-2xl" aria-hidden>
                    {l.emoji}
                  </span>
                  <span>
                    <span className="font-display text-2xl leading-none group-hover:text-derby-accent">
                      {tNav(l.navKey)} →
                    </span>
                    <span className="block text-sm text-derby-ink/70 mt-1">{t(`links.${l.key}`)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section id="programma" aria-labelledby="program-heading" className="space-y-3 scroll-mt-32">
        <div>
          <h2 id="program-heading" className="font-display text-3xl">
            {t("programHeading")}
          </h2>
          {hasText("programNote") && <p className="text-sm text-derby-ink/60">{t("programNote")}</p>}
        </div>
        {entries.length === 0 ? (
          <p className="text-derby-ink/60">{t("programEmpty")}</p>
        ) : (
          <DayProgram entries={entries} />
        )}
      </section>

      {lockerRooms.length > 0 && (
        <section id="kleedkamers" aria-labelledby="locker-heading" className="space-y-3 scroll-mt-32">
          <h2 id="locker-heading" className="font-display text-3xl">
            {t("lockerHeading")}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {lockerRooms.map((r) => (
              <li key={r.id} className="bg-white rounded-2xl p-4 shadow flex items-start gap-4">
                <span className="font-display text-4xl leading-none w-10 shrink-0 text-derby-accent">
                  {r.room}
                </span>
                <ul className="space-y-1 pt-1">
                  {((en && r.labelEn) || r.labelNl)
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .map((line) => {
                      const team = teamByName.get(line.toLowerCase());
                      return (
                        <li key={line} className="flex items-center gap-2 font-bold">
                          {team?.color && (
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: team.color }}
                              aria-hidden
                            />
                          )}
                          {team ? (
                            <Link href={`/teams/${team.id}`} className="hover:text-derby-accent hover:underline underline-offset-4">
                              {line}
                            </Link>
                          ) : (
                            line
                          )}
                        </li>
                      );
                    })}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section id="officials" aria-labelledby="officials-heading" className="space-y-3 scroll-mt-32">
        <h2 id="officials-heading" className="font-display text-3xl">
          {t("rosterHeading")}
        </h2>
        {hasText("officialsBody") && (
          <div className="bg-white rounded-2xl p-5 shadow max-w-3xl">
            <h3 className="font-display text-2xl">{t("officialsHeading")}</h3>
            <p className="text-derby-ink/80 whitespace-pre-line">{t("officialsBody")}</p>
          </div>
        )}
        {roster.length === 0 ? (
          <p className="text-derby-ink/60">{t("rosterEmpty")}</p>
        ) : (
          <OfficialsRoster matches={roster} />
        )}
      </section>

      {hasText("teamsBody") && (
        <section className="bg-white rounded-2xl p-6 shadow space-y-2">
          <h2 className="font-display text-3xl">{t("teamsHeading")}</h2>
          <p className="text-derby-ink/80 whitespace-pre-line">{t("teamsBody")}</p>
        </section>
      )}
    </div>
  );
}
