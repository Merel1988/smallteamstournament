import Image from "next/image";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import AutoRefresh from "@/components/AutoRefresh";
import Countdown from "@/components/Countdown";
import RoadkillLogo from "@/components/RoadkillLogo";
import EventJsonLd from "@/components/EventJsonLd";
import { EVENT } from "@/lib/event";
import { prisma } from "@/lib/prisma";
import { pageMetadata } from "@/lib/seo";
import { getHiddenPageKeys } from "@/lib/page-visibility";
import { eventTimeFormatter } from "@/lib/time";
import { sideName } from "@/lib/match-teams";
import { kindOf } from "@/lib/schedule";

const UPCOMING_COUNT = 3;
const LIVE_REFRESH_MS = 10_000;

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ locale, page: "home", path: "", absoluteTitle: true });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  const tEvent = await getTranslations("Event");
  const tVenue = await getTranslations("Venue");
  const tNav = await getTranslations("Nav");
  const hidden = await getHiddenPageKeys();
  // Editable via /admin/teksten (Home.eventInfo); only shown when filled.
  const eventInfo = t("eventInfo").trim();

  const now = new Date();
  // The match blocks expose team names (teams page) and the schedule
  // (schema page), so only show them when both of those pages are visible.
  const showMatches = !hidden.has("teams") && !hidden.has("schema");
  const [openMatches, teams] = await Promise.all([
    showMatches
      ? prisma.match
          .findMany({
            where: { status: { not: "finished" } },
            orderBy: { startsAt: "asc" },
            include: { teamA: true, teamB: true },
          })
          .catch(() => [])
      : [],
    hidden.has("teams")
      ? []
      : prisma.team
          .findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, logoUrl: true } })
          .catch(() => []),
  ]);
  const bouts = openMatches.filter((m) => kindOf(m.poule) === "match");
  const liveMatch = bouts.find((m) => m.status === "live") ?? null;
  const upcoming = bouts
    .filter((m) => m.status === "scheduled" && m.startsAt >= now)
    .slice(0, liveMatch ? UPCOMING_COUNT - 1 : UPCOMING_COUNT);

  const beforeEvent = EVENT.date.getTime() > now.getTime();
  const timeFormatter = eventTimeFormatter(locale);
  const side = (team: { id: string; name: string }, label: string | null) => ({
    name: sideName(team, label),
    href: label?.trim() ? null : `/teams/${team.id}`,
  });
  const mapsQuery = encodeURIComponent(EVENT.address);
  const visitInfo = [
    { title: tVenue("ticketsTitle"), body: tVenue("ticketsBody") },
    { title: tVenue("foodTitle"), body: tVenue("foodBody") },
    { title: tVenue("parkingTitle"), body: tVenue("parkingBody") },
  ].filter((item) => item.body.trim());
  const funCards = [
    { href: "/bingo", label: t("cards.bingo"), emoji: "🎯" },
    { href: "/fotos", label: t("cards.photos"), emoji: "📸" },
    { href: "/mvp", label: t("cards.mvpVote"), emoji: "⭐" },
    { href: "/nickname", label: t("cards.nickname"), emoji: "💀" },
  ].filter((card) => !hidden.has(card.href.slice(1)));
  const teamLinks = [
    { key: "info", href: "/info", label: tNav("info") },
    { key: "toernooi", href: "/toernooi", label: tNav("toernooi") },
  ].filter((link) => !hidden.has(link.key));

  return (
    <div className="space-y-8">
      <EventJsonLd description={tEvent("description")} />
      {liveMatch && <AutoRefresh intervalMs={LIVE_REFRESH_MS} />}
      <section className="relative overflow-hidden bg-derby-ink text-white rounded-2xl p-6 pb-8 sm:p-10 sm:pb-12 shadow-lg">
        <div
          className="pointer-events-none absolute -right-16 -top-6 w-56 opacity-30 rotate-[-8deg] sm:w-80 lg:-right-10 lg:top-4 lg:opacity-100"
          aria-hidden
        >
          <RoadkillLogo className="w-full h-auto text-white" />
        </div>
        <div className="stripes absolute inset-x-0 bottom-0 h-2" aria-hidden />
        <div className="relative">
          <p className="font-display text-derby-accent text-xl sm:text-2xl">
            {tEvent("league")}
          </p>
          <h1 className="font-display text-5xl sm:text-7xl text-white leading-[0.9] mt-1">
            {tEvent("name")}
          </h1>
          <p className="text-white/80 mt-3 max-w-2xl">{tEvent("description")}</p>
          <div className="mt-4 text-sm text-white/90">
            <p>
              <strong>{tEvent("dateLine")}</strong>
            </p>
            <p>{tEvent("venueLine")}</p>
          </div>

          <div className="mt-8">
            {beforeEvent ? (
              <>
                <p className="text-xs uppercase tracking-wider text-white/70 mb-2">
                  {t("countdownLabel")}
                </p>
                <Countdown target={EVENT.date} />
              </>
            ) : (
              <div className="bg-derby-accent rounded-xl p-4">
                <p className="font-display text-3xl">{t("tournamentLive")}</p>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {!hidden.has("schema") && (
              <Link
                href="/schema"
                className="rounded-full bg-derby-accent text-white px-5 py-2 font-bold hover:bg-white hover:text-derby-ink transition"
              >
                {t("ctaSchedule")}
              </Link>
            )}
            {!hidden.has("regels") && (
              <Link
                href="/regels"
                className="rounded-full border border-white/60 text-white px-5 py-2 font-bold hover:bg-white hover:text-derby-ink transition"
              >
                {t("ctaRules")}
              </Link>
            )}
          </div>
        </div>
      </section>

      {eventInfo && (
        <section className="bg-white rounded-2xl p-6 shadow whitespace-pre-line">
          {eventInfo}
        </section>
      )}

      {(liveMatch || upcoming.length > 0) && (
        <section aria-labelledby="matches-heading" className="space-y-3">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="matches-heading" className="font-display text-3xl">
              {t("matchesHeading")}
            </h2>
            <Link href="/schema" className="text-sm font-bold text-derby-accent hover:underline">
              {t("allMatches")}
            </Link>
          </div>
          <ul className="space-y-3">
            {liveMatch && (
              <li className="border-2 border-derby-accent rounded-2xl p-5 bg-white">
                <p className="text-xs uppercase tracking-wider text-derby-accent font-bold">
                  {t("liveNow")}
                  {liveMatch.poule && <span className="text-derby-ink/60"> · {liveMatch.poule}</span>}
                </p>
                <MatchRow
                  teamA={side(liveMatch.teamA, liveMatch.teamALabel)}
                  teamB={side(liveMatch.teamB, liveMatch.teamBLabel)}
                  scoreA={liveMatch.scoreA}
                  scoreB={liveMatch.scoreB}
                  vsLabel={t("vs")}
                  timeFormatter={timeFormatter}
                />
              </li>
            )}
            {upcoming.map((m, i) => (
              <li key={m.id} className="border border-derby-ink/10 rounded-2xl p-5 bg-white">
                <p className="text-xs uppercase tracking-wider text-derby-ink/60 font-bold">
                  {i === 0 && !liveMatch ? t("nextMatch") : m.poule}
                  {i === 0 && !liveMatch && m.poule && <span> · {m.poule}</span>}
                </p>
                <MatchRow
                  teamA={side(m.teamA, m.teamALabel)}
                  teamB={side(m.teamB, m.teamBLabel)}
                  when={m.startsAt}
                  vsLabel={t("vs")}
                  timeFormatter={timeFormatter}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {teams.length > 0 && (
        <section aria-labelledby="teams-heading" className="space-y-3">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="teams-heading" className="font-display text-3xl">
              {t("teamsHeading")}
            </h2>
            <Link href="/teams" className="text-sm font-bold text-derby-accent hover:underline">
              {t("allTeams")}
            </Link>
          </div>
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {teams.map((team) => (
              <li key={team.id} className="flex">
                <Link
                  href={`/teams/${team.id}`}
                  className="group bg-white rounded-xl p-4 shadow flex flex-1 flex-col items-center text-center gap-2 hover:-rotate-1 hover:shadow-lg transition"
                >
                  {team.logoUrl ? (
                    <Image
                      src={team.logoUrl}
                      alt=""
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-lg object-contain"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg stripes" aria-hidden />
                  )}
                  <span className="font-display text-lg leading-tight group-hover:text-derby-accent">
                    {team.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {!hidden.has("regels") && (
          <section aria-labelledby="learn-heading" className="bg-derby-ink text-white rounded-2xl p-6 shadow-lg flex flex-col">
            <h2 id="learn-heading" className="font-display text-3xl text-white">
              {t("learnHeading")}
            </h2>
            <p className="text-white/80 mt-1">{t("learnIntro")}</p>
            <ul className="mt-3 space-y-2">
              {(["learnPoint1", "learnPoint2", "learnPoint3"] as const).map((key) => (
                <li key={key} className="flex gap-2">
                  <span className="text-derby-accent" aria-hidden>
                    ★
                  </span>
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>
            <Link href="/regels" className="mt-auto pt-4 font-bold text-derby-accent hover:underline">
              {t("learnCta")}
            </Link>
          </section>
        )}

        <section aria-labelledby="visit-heading" className="bg-white rounded-2xl p-6 shadow flex flex-col">
          <h2 id="visit-heading" className="font-display text-3xl">
            {t("visitHeading")}
          </h2>
          <p className="mt-1">
            <strong>{tEvent("dateLine")}</strong>
          </p>
          <p className="text-derby-ink/80">
            {EVENT.venue}, {EVENT.address}
          </p>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-derby-accent underline"
          >
            {tVenue("openMaps")}
          </a>
          {visitInfo.length > 0 && (
            <dl className="mt-3 space-y-2">
              {visitInfo.map((item) => (
                <div key={item.title}>
                  <dt className="font-bold">{item.title}</dt>
                  <dd className="text-derby-ink/80">{item.body}</dd>
                </div>
              ))}
            </dl>
          )}
          {!hidden.has("venue") && (
            <Link href="/venue" className="mt-auto pt-4 font-bold text-derby-accent hover:underline">
              {t("visitMore")}
            </Link>
          )}
        </section>
      </div>

      {funCards.length > 0 && (
        <section aria-labelledby="fun-heading" className="space-y-3">
          <h2 id="fun-heading" className="font-display text-3xl">
            {t("funHeading")}
          </h2>
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {funCards.map((card) => (
              <li key={card.href} className="flex">
                <Link
                  href={card.href}
                  className="flex-1 bg-white hover:bg-derby-accent hover:text-white rounded-xl p-5 text-center shadow transition"
                >
                  <div className="text-3xl" aria-hidden>
                    {card.emoji}
                  </div>
                  <div className="font-display text-xl mt-2">{card.label}</div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {teamLinks.length > 0 && (
        <p className="text-sm text-derby-ink/70">
          {t("forTeams")}{" "}
          {teamLinks.map((link, i) => (
            <span key={link.key}>
              {i > 0 && " · "}
              <Link href={link.href} className="font-bold underline hover:text-derby-accent">
                {link.label}
              </Link>
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

function MatchRow({
  teamA,
  teamB,
  scoreA,
  scoreB,
  when,
  vsLabel,
  timeFormatter,
}: {
  teamA: MatchSide;
  teamB: MatchSide;
  scoreA?: number | null;
  scoreB?: number | null;
  when?: Date;
  vsLabel: string;
  timeFormatter: Intl.DateTimeFormat;
}) {
  return (
    <div className="mt-2 flex items-center justify-between gap-4">
      <TeamName side={teamA} className="font-display text-2xl" />
      {scoreA != null && scoreB != null ? (
        <div className="font-display text-3xl text-derby-accent">
          {scoreA} – {scoreB}
        </div>
      ) : when ? (
        <div className="text-sm text-derby-ink/70">{timeFormatter.format(when)}</div>
      ) : (
        <div className="text-sm text-derby-ink/70">{vsLabel}</div>
      )}
      <TeamName side={teamB} className="font-display text-2xl text-right" />
    </div>
  );
}

type MatchSide = { name: string; href: string | null };

function TeamName({ side, className }: { side: MatchSide; className: string }) {
  if (!side.href) return <div className={className}>{side.name}</div>;
  return (
    <Link
      href={side.href}
      className={`${className} hover:text-derby-accent underline decoration-2 decoration-transparent underline-offset-4 hover:decoration-current transition-colors`}
    >
      {side.name}
    </Link>
  );
}
