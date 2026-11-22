import type { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { PouleStanding } from "@/lib/schedule";

export default function Standings({
  standings,
  t,
  linkTeams,
}: {
  standings: PouleStanding[];
  t: Awaited<ReturnType<typeof getTranslations<"Schema">>>;
  linkTeams: boolean;
}) {
  return (
    <section aria-labelledby="standings-heading" className="space-y-4">
      <div>
        <h2 id="standings-heading" className="font-display text-3xl">
          {t("standingsHeading")}
        </h2>
        <p className="text-sm text-derby-ink/60">{t("standingsNote")}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {standings.map((s) => (
          <div key={s.poule} className="bg-white rounded-2xl shadow overflow-hidden">
            <h3 className="font-display text-2xl px-4 pt-3">{s.poule}</h3>
            <table className="w-full text-sm tabular-nums">
              <thead>
                <tr className="text-derby-ink/60 text-left">
                  <th scope="col" className="px-4 py-2 font-normal">
                    {t("colTeam")}
                  </th>
                  <Th short={t("colPlayed")} long={t("colPlayedLong")} />
                  <Th short={t("colWon")} long={t("colWonLong")} />
                  {s.hasDraws && <Th short={t("colDrawn")} long={t("colDrawnLong")} />}
                  <Th short={t("colLost")} long={t("colLostLong")} />
                  <Th short={t("colDiff")} long={t("colDiffLong")} />
                </tr>
              </thead>
              <tbody>
                {s.rows.map((r, i) => {
                  const diff = r.pointsFor - r.pointsAgainst;
                  return (
                    <tr key={r.team.id} className={i === 0 && r.won > 0 ? "bg-derby-accent/10" : "border-t border-derby-ink/10"}>
                      <th scope="row" className="px-4 py-2 text-left font-normal">
                        <span className="inline-flex items-center gap-2">
                          <span className="w-5 text-derby-ink/50">{i + 1}.</span>
                          {r.team.color && (
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ background: r.team.color }}
                              aria-hidden
                            />
                          )}
                          {linkTeams ? (
                            <Link href={`/teams/${r.team.id}`} className="font-bold hover:underline">
                              {r.team.name}
                            </Link>
                          ) : (
                            <span className="font-bold">{r.team.name}</span>
                          )}
                          {i === 0 && r.won > 0 && <span aria-hidden>👑</span>}
                        </span>
                      </th>
                      <td className="px-2 py-2 text-center">{r.played}</td>
                      <td className="px-2 py-2 text-center font-bold">{r.won}</td>
                      {s.hasDraws && <td className="px-2 py-2 text-center">{r.drawn}</td>}
                      <td className="px-2 py-2 text-center">{r.lost}</td>
                      <td className="px-4 py-2 text-center">{diff > 0 ? `+${diff}` : diff}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </section>
  );
}

function Th({ short, long }: { short: string; long: string }) {
  return (
    <th scope="col" className="px-2 py-2 font-normal text-center">
      <abbr title={long} className="no-underline">
        {short}
      </abbr>
    </th>
  );
}
