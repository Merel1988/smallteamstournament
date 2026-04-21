import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SchemaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Schema");

  const matches = await prisma.match
    .findMany({
      orderBy: { startsAt: "asc" },
      include: { teamA: true, teamB: true },
    })
    .catch(() => [] as Awaited<ReturnType<typeof prisma.match.findMany<{ include: { teamA: true; teamB: true } }>>>);

  type Match = (typeof matches)[number];
  const otherLabel = t("otherPoule");
  const byPoule: Record<string, Match[]> = {};
  for (const m of matches) {
    const key = m.poule || otherLabel;
    if (!byPoule[key]) byPoule[key] = [];
    byPoule[key].push(m);
  }

  const timeFormatter = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-5xl">{t("title")}</h1>
        <p className="text-derby-ink/70 mt-1">{t("subtitle")}</p>
      </header>

      {matches.length === 0 ? (
        <p className="text-derby-ink/60">{t("empty")}</p>
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
                      {timeFormatter.format(m.startsAt)}
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
                        <span className="text-sm text-derby-ink/40">{t("vs")}</span>
                      )}
                      <span className="font-display text-xl truncate text-right">
                        {m.teamB.name}
                      </span>
                    </div>
                    {isLive && (
                      <span className="text-xs font-bold text-derby-accent whitespace-nowrap">
                        {t("live")}
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
