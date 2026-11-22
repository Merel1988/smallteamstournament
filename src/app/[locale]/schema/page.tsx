import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import AutoRefresh from "@/components/AutoRefresh";
import ScheduleBoard from "@/components/ScheduleBoard";
import Standings from "@/components/Standings";
import { pageMetadata } from "@/lib/seo";
import { assertPageVisible, getHiddenPageKeys } from "@/lib/page-visibility";
import { prisma } from "@/lib/prisma";
import { buildStandings, fitItemDurations, pouleStyles, toScheduleMatch } from "@/lib/schedule";

export const dynamic = "force-dynamic";

const LIVE_REFRESH_MS = 10_000;
const IDLE_REFRESH_MS = 30_000;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ locale, page: "schema", path: "schema" });
}

export default async function SchemaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await assertPageVisible("schema");
  setRequestLocale(locale);
  const t = await getTranslations("Schema");

  const teamsVisible = !(await getHiddenPageKeys()).has("teams");
  const rows = await prisma.match
    .findMany({
      orderBy: { startsAt: "asc" },
      include: { teamA: true, teamB: true },
    })
    .catch(() => []);

  // Rosters are only needed for live matches, and only when the teams page is public.
  const liveTeamIds = teamsVisible
    ? rows
        .filter((m) => m.status === "live")
        .flatMap((m) => [m.teamALabel ? "" : m.teamAId, m.teamBLabel ? "" : m.teamBId])
        .filter(Boolean)
    : [];
  const liveIds = rows.filter((m) => m.status === "live").map((m) => m.id);
  const sittingOut = new Set(
    liveIds.length
      ? (
          await prisma.matchSitOut
            .findMany({ where: { matchId: { in: liveIds } }, select: { playerId: true } })
            .catch(() => [])
        ).map((s) => s.playerId)
      : [],
  );
  const players = liveTeamIds.length
    ? await prisma.player
        .findMany({
          where: { teamId: { in: liveTeamIds } },
          orderBy: { number: "asc" },
          select: { id: true, teamId: true, derbyName: true, number: true, headshotUrl: true },
        })
        .catch(() => [])
    : [];
  const rosterOf = (teamId: string) => {
    if (!liveTeamIds.includes(teamId)) return undefined;
    return players
      .filter((p) => p.teamId === teamId && !sittingOut.has(p.id))
      .map(({ id, derbyName, number, headshotUrl }) => ({ id, derbyName, number, headshotUrl }));
  };

  const matches = fitItemDurations(
    rows.map((m) =>
      toScheduleMatch({
      ...m,
      teamA: { ...m.teamA, players: rosterOf(m.teamAId) },
        teamB: { ...m.teamB, players: rosterOf(m.teamBId) },
      }),
    ),
  );
  const otherLabel = t("otherPoule");
  const styles = [...pouleStyles(matches, otherLabel)];
  const standings = buildStandings(matches, otherLabel);

  const hasOpenMatches = rows.some((m) => m.status !== "finished");

  return (
    <div className="space-y-8">
      {hasOpenMatches && (
        <AutoRefresh intervalMs={liveIds.length ? LIVE_REFRESH_MS : IDLE_REFRESH_MS} />
      )}
      <header>
        <h1 className="font-display text-5xl">{t("title")}</h1>
        <p className="text-derby-ink/70 mt-1">{t("subtitle")}</p>
      </header>

      {matches.length === 0 ? (
        <p className="text-derby-ink/60">{t("empty")}</p>
      ) : (
        <>
          <ScheduleBoard
            matches={matches}
            styles={styles}
            locale={locale}
            otherLabel={otherLabel}
            linkTeams={teamsVisible}
          />
          {standings.length > 0 && (
            <Standings standings={standings} t={t} linkTeams={teamsVisible} />
          )}
        </>
      )}
    </div>
  );
}
