import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminMvpPage() {
  await requireAdmin();

  const matches = await prisma.match.findMany({
    orderBy: { startsAt: "asc" },
    include: { teamA: true, teamB: true },
  });

  const allVotes = await prisma.mvpVote.groupBy({
    by: ["matchId", "playerId"],
    _count: { playerId: true },
  });

  const players = await prisma.player.findMany({ include: { team: true } });
  const playerMap = new Map(players.map((p) => [p.id, p]));

  return (
    <div className="space-y-8">
      <h1 className="font-display text-4xl">MVP stemresultaten</h1>

      {matches.length === 0 ? (
        <p className="text-derby-ink/60">Nog geen wedstrijden.</p>
      ) : (
        matches.map((m) => {
          const forMatch = allVotes
            .filter((v) => v.matchId === m.id)
            .sort((a, b) => b._count.playerId - a._count.playerId);
          const totalVotes = forMatch.reduce(
            (s, v) => s + v._count.playerId,
            0,
          );
          return (
            <section
              key={m.id}
              className="bg-white rounded-2xl p-5 shadow space-y-2"
            >
              <h2 className="font-display text-2xl">
                {m.teamA.name} – {m.teamB.name}{" "}
                <span className="text-derby-ink/40 text-lg">
                  ({m.scoreA ?? "-"}–{m.scoreB ?? "-"}, {m.status})
                </span>
              </h2>
              {totalVotes === 0 ? (
                <p className="text-derby-ink/60 text-sm">
                  Nog geen stemmen uitgebracht.
                </p>
              ) : (
                <ol className="space-y-1">
                  {forMatch.map((v, i) => {
                    const p = playerMap.get(v.playerId);
                    const pct = Math.round(
                      (v._count.playerId / totalVotes) * 100,
                    );
                    return (
                      <li
                        key={v.playerId}
                        className="flex items-center gap-3 text-sm"
                      >
                        <span className="font-display text-lg w-5">{i + 1}.</span>
                        <span className="flex-1">
                          {p
                            ? `${p.derbyName || p.name} (#${p.number}, ${p.team.name})`
                            : "Onbekende speler"}
                        </span>
                        <span className="font-bold">
                          {v._count.playerId} ({pct}%)
                        </span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}
