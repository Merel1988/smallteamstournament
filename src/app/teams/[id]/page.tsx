import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const team = await prisma.team.findUnique({
    where: { id },
    include: { players: { orderBy: { number: "asc" } } },
  });

  if (!team) notFound();

  return (
    <div className="space-y-6">
      <Link href="/teams" className="text-sm text-derby-ink/60 hover:underline">
        ← Alle teams
      </Link>

      <header
        className="bg-white rounded-2xl p-6 shadow flex items-center gap-5"
        style={team.color ? { borderTop: `8px solid ${team.color}` } : undefined}
      >
        {team.logoUrl ? (
          <Image
            src={team.logoUrl}
            alt={team.name}
            width={96}
            height={96}
            className="rounded-xl object-cover"
          />
        ) : (
          <div className="w-24 h-24 rounded-xl stripes" />
        )}
        <div>
          <h1 className="font-display text-4xl">{team.name}</h1>
          {team.description && (
            <p className="text-derby-ink/70 mt-1 text-sm">{team.description}</p>
          )}
        </div>
      </header>

      <section>
        <h2 className="font-display text-3xl mb-3">Roster</h2>
        {team.players.length === 0 ? (
          <p className="text-derby-ink/60">
            De roster is nog niet bekend.
          </p>
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {team.players.map((p) => (
              <li
                key={p.id}
                className="bg-white rounded-xl p-3 shadow text-center"
              >
                {p.headshotUrl ? (
                  <Image
                    src={p.headshotUrl}
                    alt={p.derbyName || p.name}
                    width={200}
                    height={200}
                    className="rounded-lg w-full h-40 object-cover"
                  />
                ) : (
                  <div className="w-full h-40 rounded-lg bg-derby-ink/10 flex items-center justify-center font-display text-5xl text-derby-ink/40">
                    #{p.number}
                  </div>
                )}
                <div className="mt-2 font-display text-lg truncate">
                  {p.derbyName || p.name}
                </div>
                <div className="text-xs text-derby-ink/60">
                  #{p.number}
                  {p.position ? ` · ${p.position}` : ""}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
