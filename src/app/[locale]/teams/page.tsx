import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TeamsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Teams");

  const teams = await prisma.team
    .findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { players: true } } },
    })
    .catch(() => []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-5xl text-derby-ink">{t("title")}</h1>
        <p className="text-derby-ink/70 mt-1">{t("subtitle")}</p>
      </header>

      {teams.length === 0 ? (
        <p className="text-derby-ink/60">{t("empty")}</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <li key={team.id}>
              <Link
                href={`/teams/${team.id}`}
                className="bg-white rounded-xl p-5 shadow flex items-center gap-4 hover:shadow-lg transition block"
                style={
                  team.color ? { borderLeft: `6px solid ${team.color}` } : undefined
                }
              >
                {team.logoUrl ? (
                  <Image
                    src={team.logoUrl}
                    alt={team.name}
                    width={64}
                    height={64}
                    className="rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg stripes" />
                )}
                <div>
                  <div className="font-display text-2xl">{team.name}</div>
                  <div className="text-xs text-derby-ink/60">
                    {t("playerCount", { count: team._count.players })}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
