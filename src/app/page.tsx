import Link from "next/link";
import Countdown from "@/components/Countdown";
import { EVENT } from "@/lib/event";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const now = new Date();
  const liveMatch = await prisma.match
    .findFirst({
      where: { status: "live" },
      include: { teamA: true, teamB: true },
    })
    .catch(() => null);

  const nextMatch = await prisma.match
    .findFirst({
      where: { status: "scheduled", startsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
      include: { teamA: true, teamB: true },
    })
    .catch(() => null);

  const beforeEvent = EVENT.date.getTime() > now.getTime();

  return (
    <div className="space-y-8">
      <section className="bg-derby-ink text-white rounded-2xl p-6 sm:p-10 shadow-lg">
        <p className="font-display text-derby-yellow text-xl sm:text-2xl">
          {EVENT.league}
        </p>
        <h1 className="font-display text-5xl sm:text-7xl text-derby-yellow leading-[0.9] mt-1">
          {EVENT.name}
        </h1>
        <p className="text-white/80 mt-3 max-w-2xl">{EVENT.description}</p>
        <div className="mt-4 text-sm text-white/90">
          <p>
            <strong>Zaterdag 21 november 2026</strong> · 12:00–18:00
          </p>
          <p>
            {EVENT.venue}, {EVENT.city}
          </p>
        </div>

        <div className="mt-8">
          {beforeEvent ? (
            <>
              <p className="text-xs uppercase tracking-wider text-white/70 mb-2">
                Aftellen naar eerste whistle
              </p>
              <Countdown target={EVENT.date} />
            </>
          ) : (
            <div className="bg-derby-accent rounded-xl p-4">
              <p className="font-display text-3xl">Het toernooi is bezig!</p>
            </div>
          )}
        </div>
      </section>

      {liveMatch && (
        <section className="border-2 border-derby-accent rounded-2xl p-5 bg-white">
          <p className="text-xs uppercase tracking-wider text-derby-accent font-bold">
            ● Live nu
          </p>
          <MatchRow
            teamA={liveMatch.teamA.name}
            teamB={liveMatch.teamB.name}
            scoreA={liveMatch.scoreA}
            scoreB={liveMatch.scoreB}
          />
        </section>
      )}

      {nextMatch && !liveMatch && (
        <section className="border border-derby-ink/10 rounded-2xl p-5 bg-white">
          <p className="text-xs uppercase tracking-wider text-derby-ink/60 font-bold">
            Volgende wedstrijd
          </p>
          <MatchRow
            teamA={nextMatch.teamA.name}
            teamB={nextMatch.teamB.name}
            when={nextMatch.startsAt}
          />
        </section>
      )}

      <section className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { href: "/teams", label: "Teams", emoji: "🛼" },
          { href: "/schema", label: "Schema", emoji: "📅" },
          { href: "/bingo", label: "Bingo", emoji: "🎯" },
          { href: "/fotos", label: "Foto's", emoji: "📸" },
          { href: "/mvp", label: "MVP stem", emoji: "⭐" },
          { href: "/nickname", label: "Derby-naam", emoji: "💀" },
        ].map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="bg-white hover:bg-derby-yellow rounded-xl p-5 text-center shadow transition"
          >
            <div className="text-3xl">{card.emoji}</div>
            <div className="font-display text-xl mt-2">{card.label}</div>
          </Link>
        ))}
      </section>
    </div>
  );
}

function MatchRow({
  teamA,
  teamB,
  scoreA,
  scoreB,
  when,
}: {
  teamA: string;
  teamB: string;
  scoreA?: number | null;
  scoreB?: number | null;
  when?: Date;
}) {
  return (
    <div className="mt-2 flex items-center justify-between gap-4">
      <div className="font-display text-2xl">{teamA}</div>
      {scoreA != null && scoreB != null ? (
        <div className="font-display text-3xl text-derby-accent">
          {scoreA} – {scoreB}
        </div>
      ) : when ? (
        <div className="text-sm text-derby-ink/70">
          {when.toLocaleTimeString("nl-NL", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      ) : (
        <div className="text-sm text-derby-ink/70">vs</div>
      )}
      <div className="font-display text-2xl text-right">{teamB}</div>
    </div>
  );
}
