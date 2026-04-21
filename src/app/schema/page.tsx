import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SchemaPage() {
  const matches = await prisma.match
    .findMany({
      orderBy: { startsAt: "asc" },
      include: { teamA: true, teamB: true },
    })
    .catch(() => []);

  const byPoule = matches.reduce<Record<string, typeof matches>>((acc, m) => {
    const key = m.poule || "Overig";
    (acc[key] ||= []).push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-5xl">Speelschema</h1>
        <p className="text-derby-ink/70 mt-1">
          Bouts van 20 minuten zonder pauze — let op de whistle!
        </p>
      </header>

      {matches.length === 0 ? (
        <p className="text-derby-ink/60">Het schema wordt binnenkort gepubliceerd.</p>
      ) : (
        Object.entries(byPoule).map(([poule, items]) => (
          <section key={poule}>
            <h2 className="font-display text-3xl mb-3">{poule}</h2>
            <ul className="space-y-2">
              {items.map((m) => {
                const isLive = m.status === "live";
                const done = m.status === "finished";
                return (
                  <li
                    key={m.id}
                    className={`bg-white rounded-xl p-4 shadow flex items-center justify-between gap-3 ${
                      isLive ? "ring-2 ring-derby-accent" : ""
                    }`}
                  >
                    <div className="text-sm text-derby-ink/60 w-16 shrink-0">
                      {m.startsAt.toLocaleTimeString("nl-NL", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="flex-1 flex items-center justify-between gap-2">
                      <span className="font-display text-xl truncate">
                        {m.teamA.name}
                      </span>
                      {done || isLive ? (
                        <span className="font-display text-2xl text-derby-accent whitespace-nowrap">
                          {m.scoreA ?? 0} – {m.scoreB ?? 0}
                        </span>
                      ) : (
                        <span className="text-sm text-derby-ink/40">vs</span>
                      )}
                      <span className="font-display text-xl truncate text-right">
                        {m.teamB.name}
                      </span>
                    </div>
                    {isLive && (
                      <span className="text-xs font-bold text-derby-accent whitespace-nowrap">
                        ● LIVE
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
