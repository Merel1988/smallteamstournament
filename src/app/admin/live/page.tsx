import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { kindOf } from "@/lib/schedule";
import { sideName } from "@/lib/match-teams";
import type { LiveMatch } from "@/lib/live-score";
import LiveScorer from "@/components/LiveScorerClient";

export const dynamic = "force-dynamic";

export default async function AdminLivePage() {
  await requireAdmin();
  const rows = await prisma.match.findMany({
    orderBy: { startsAt: "asc" },
    include: { teamA: true, teamB: true },
  });
  const matches: LiveMatch[] = rows
    .filter((m) => kindOf(m.poule) === "match")
    .map((m) => ({
      id: m.id,
      startsAt: m.startsAt.toISOString(),
      poule: m.poule,
      teamA: sideName(m.teamA, m.teamALabel),
      teamB: sideName(m.teamB, m.teamBLabel),
      scoreA: m.scoreA,
      scoreB: m.scoreB,
      status: m.status,
    }));
  const initial =
    matches.find((m) => m.status === "live") ??
    matches.find((m) => m.status !== "finished") ??
    matches[matches.length - 1];

  return <LiveScorer matches={matches} initialId={initial?.id ?? null} />;
}
