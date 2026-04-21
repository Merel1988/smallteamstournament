import MvpVoter from "@/components/MvpVoter";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MvpPage() {
  const matches = await prisma.match
    .findMany({
      orderBy: { startsAt: "asc" },
      include: { teamA: true, teamB: true },
    })
    .catch(() => []);

  const finished = matches.filter((m) => m.status === "finished");

  const players = await prisma.player
    .findMany({ include: { team: true } })
    .catch(() => []);

  const playersByTeam = new Map<string, typeof players>();
  for (const p of players) {
    const arr = playersByTeam.get(p.teamId) || [];
    arr.push(p);
    playersByTeam.set(p.teamId, arr);
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-5xl">MVP / Best Jammer</h1>
        <p className="text-derby-ink/70 mt-1">
          Stem per afgelopen wedstrijd op de speler die jou het meest
          indrukwekkend was.
        </p>
      </header>

      {finished.length === 0 ? (
        <p className="text-derby-ink/60">
          Er zijn nog geen afgeronde wedstrijden om op te stemmen.
        </p>
      ) : (
        <div className="space-y-8">
          {finished.map((m) => {
            const pool = [
              ...(playersByTeam.get(m.teamAId) || []),
              ...(playersByTeam.get(m.teamBId) || []),
            ].map((p) => ({
              id: p.id,
              name: p.name,
              derbyName: p.derbyName,
              number: p.number,
              teamName: p.team.name,
            }));
            return (
              <section
                key={m.id}
                className="bg-white rounded-2xl p-5 shadow space-y-3"
              >
                <h2 className="font-display text-2xl">
                  {m.teamA.name} – {m.teamB.name}{" "}
                  <span className="text-derby-ink/40 text-lg">
                    ({m.scoreA ?? 0}-{m.scoreB ?? 0})
                  </span>
                </h2>
                {pool.length === 0 ? (
                  <p className="text-derby-ink/60 text-sm">
                    Geen spelers bekend voor deze wedstrijd.
                  </p>
                ) : (
                  <MvpVoter matchId={m.id} players={pool} />
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
