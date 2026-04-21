import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const teams = await prisma.team
    .findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { players: true } } },
    })
    .catch(() => []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-5xl text-derby-ink">Teams</h1>
        <p className="text-derby-ink/70 mt-1">
          Max 8 teams van 8 spelers. Klik een team voor de volledige roster.
        </p>
      </header>

      {teams.length === 0 ? (
        <p className="text-derby-ink/60">
          Teams worden vanaf juli 2026 bekend gemaakt — kom later terug!
        </p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((t) => (
            <li key={t.id}>
              <Link
                href={`/teams/${t.id}`}
                className="bg-white rounded-xl p-5 shadow flex items-center gap-4 hover:shadow-lg transition block"
                style={t.color ? { borderLeft: `6px solid ${t.color}` } : undefined}
              >
                {t.logoUrl ? (
                  <Image
                    src={t.logoUrl}
                    alt={t.name}
                    width={64}
                    height={64}
                    className="rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg stripes" />
                )}
                <div>
                  <div className="font-display text-2xl">{t.name}</div>
                  <div className="text-xs text-derby-ink/60">
                    {t._count.players} spelers
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
