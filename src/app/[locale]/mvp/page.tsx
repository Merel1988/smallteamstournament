import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import MvpVoter from "@/components/MvpVoter";
import { assertPageVisible } from "@/lib/page-visibility";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ locale, page: "mvp", path: "mvp" });
}

export default async function MvpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await assertPageVisible("mvp");
  setRequestLocale(locale);
  const t = await getTranslations("Mvp");

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
        <h1 className="font-display text-5xl">{t("title")}</h1>
        <p className="text-derby-ink/70 mt-1">{t("subtitle")}</p>
      </header>

      {finished.length === 0 ? (
        <p className="text-derby-ink/60">{t("noFinished")}</p>
      ) : (
        <div className="space-y-8">
          {finished.map((m) => {
            const pool = [
              ...(playersByTeam.get(m.teamAId) || []),
              ...(playersByTeam.get(m.teamBId) || []),
            ].map((p) => ({
              id: p.id,
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
                    {t("matchWithoutPlayers")}
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
