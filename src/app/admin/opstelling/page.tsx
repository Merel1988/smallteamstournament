import Link from "next/link";
import SubmitButton from "@/components/SubmitButton";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { kindOf } from "@/lib/schedule";
import { sideName } from "@/lib/match-teams";
import { eventTimeFormatter } from "@/lib/time";
import { toggleSitOut } from "./actions";

export const dynamic = "force-dynamic";

const PLAYERS_PER_GAME = 8;

export default async function AdminLineupPage({
  searchParams,
}: {
  searchParams: Promise<{ match?: string }>;
}) {
  await requireAdmin();
  const { match: matchParam } = await searchParams;
  const matches = (
    await prisma.match.findMany({ orderBy: { startsAt: "asc" }, include: { teamA: true, teamB: true } })
  ).filter((m) => kindOf(m.poule) === "match");
  const selected =
    matches.find((m) => m.id === matchParam) ??
    matches.find((m) => m.status === "live") ??
    matches.find((m) => m.status !== "finished") ??
    matches[matches.length - 1];
  const time = eventTimeFormatter("nl");

  const sides = selected
    ? [
        { team: selected.teamA, label: selected.teamALabel },
        { team: selected.teamB, label: selected.teamBLabel },
      ].filter((s) => !s.label?.trim())
    : [];
  const [players, sitOuts] = selected
    ? await Promise.all([
        prisma.player.findMany({
          where: { teamId: { in: sides.map((s) => s.team.id) } },
          orderBy: { number: "asc" },
          select: { id: true, teamId: true, derbyName: true, number: true },
        }),
        prisma.matchSitOut
          .findMany({ where: { matchId: selected.id }, select: { playerId: true } })
          .then((rows) => new Set(rows.map((r) => r.playerId)))
          .catch(() => null),
      ])
    : [[], new Set<string>()];

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-4xl">Opstelling</h1>
        <p className="text-derby-ink/70 max-w-2xl">
          Iedereen speelt standaard mee. Tik op een speler die deze wedstrijd niet meedoet; tik nog een keer om het
          terug te draaien. Bij een live wedstrijd zien bezoekers op het schema alleen wie meedoet.
        </p>
      </header>

      <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Wedstrijden">
        {matches.map((m) => (
          <Link
            key={m.id}
            href={`/admin/opstelling?match=${m.id}`}
            aria-current={m.id === selected?.id ? "page" : undefined}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-bold ${
              m.id === selected?.id ? "bg-derby-ink text-white border-derby-ink" : "bg-white border-derby-ink/20"
            }`}
          >
            {time.format(m.startsAt)}
            {m.status === "live" && " 🔴"}
          </Link>
        ))}
      </nav>

      {!selected ? (
        <p className="text-derby-ink/60">Nog geen wedstrijden.</p>
      ) : sitOuts === null ? (
        <p className="bg-white rounded-2xl p-5 shadow text-derby-accent font-bold">
          De opstelling kan nog niet worden opgeslagen: het migratiescript voor de database is nog niet gedraaid.
        </p>
      ) : (
        <>
          <h2 className="font-display text-2xl">
            {sideName(selected.teamA, selected.teamALabel)} tegen {sideName(selected.teamB, selected.teamBLabel)}
          </h2>
          {sides.length === 0 && <p className="text-derby-ink/60">De teams van deze wedstrijd zijn nog niet bekend.</p>}
          <div className="grid gap-4 md:grid-cols-2">
            {sides.map(({ team }) => {
              const roster = players.filter((p) => p.teamId === team.id);
              const playing = roster.filter((p) => !sitOuts.has(p.id)).length;
              return (
                <section key={team.id} className="bg-white rounded-2xl p-4 shadow space-y-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-display text-xl">{team.name}</h3>
                    <p
                      className={`text-sm font-bold tabular-nums ${
                        playing > PLAYERS_PER_GAME ? "text-derby-accent" : "text-derby-ink/60"
                      }`}
                    >
                      {playing} van {roster.length} spelen mee
                      {playing > PLAYERS_PER_GAME && ` (max ${PLAYERS_PER_GAME})`}
                    </p>
                  </div>
                  {roster.length === 0 ? (
                    <p className="text-derby-ink/60 text-sm">Nog geen spelers.</p>
                  ) : (
                    <ul className="grid gap-2">
                      {roster.map((p) => {
                        const out = sitOuts.has(p.id);
                        return (
                          <li key={p.id}>
                            <form>
                              <SubmitButton
                                type="submit"
                                formAction={toggleSitOut.bind(null, selected.id, p.id)}
                                aria-pressed={!out}
                                className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left ${
                                  out
                                    ? "border-derby-ink/10 bg-derby-bg text-derby-ink/50"
                                    : "border-derby-ink/20 bg-white font-bold"
                                }`}
                              >
                                <span className="tabular-nums w-12 shrink-0">#{p.number}</span>
                                <span className={`flex-1 min-w-0 truncate ${out ? "line-through" : ""}`}>{p.derbyName}</span>
                                <span className="text-sm">{out ? "Speelt niet" : "✓"}</span>
                              </SubmitButton>
                            </form>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
