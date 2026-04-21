import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { createMatch, deleteMatch, updateMatch } from "./actions";

export const dynamic = "force-dynamic";

function toInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export default async function AdminSchemaPage() {
  await requireAdmin();
  const [teams, matches] = await Promise.all([
    prisma.team.findMany({ orderBy: { name: "asc" } }),
    prisma.match.findMany({
      orderBy: { startsAt: "asc" },
      include: { teamA: true, teamB: true },
    }),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="font-display text-4xl">Speelschema beheren</h1>

      {teams.length < 2 ? (
        <p className="text-derby-ink/60">
          Voeg minstens 2 teams toe voordat je wedstrijden kunt plannen.
        </p>
      ) : (
        <form
          action={createMatch}
          className="bg-white rounded-2xl p-5 shadow grid gap-3 sm:grid-cols-2"
        >
          <h2 className="font-display text-2xl sm:col-span-2">Nieuwe wedstrijd</h2>
          <label className="block">
            <span className="block text-sm mb-1">Starttijd</span>
            <input
              type="datetime-local"
              name="startsAt"
              required
              defaultValue="2026-11-21T12:00"
              className="w-full border border-derby-ink/20 rounded-lg px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="block text-sm mb-1">Poule / fase</span>
            <input
              name="poule"
              placeholder="bv. Poule A of Finale"
              className="w-full border border-derby-ink/20 rounded-lg px-3 py-2"
            />
          </label>
          <TeamSelect name="teamAId" label="Team A" teams={teams} />
          <TeamSelect name="teamBId" label="Team B" teams={teams} />
          <label className="block sm:col-span-2">
            <span className="block text-sm mb-1">Notities</span>
            <textarea
              name="notes"
              className="w-full border border-derby-ink/20 rounded-lg px-3 py-2"
            />
          </label>
          <button
            type="submit"
            className="bg-derby-ink text-derby-yellow rounded-full px-4 py-2 font-bold justify-self-start"
          >
            Toevoegen
          </button>
        </form>
      )}

      <section className="space-y-4">
        {matches.map((m) => (
          <form
            key={m.id}
            action={updateMatch.bind(null, m.id)}
            className="bg-white rounded-2xl p-5 shadow grid gap-3 sm:grid-cols-2"
          >
            <div className="sm:col-span-2 font-display text-xl">
              {m.teamA.name} – {m.teamB.name}
            </div>
            <label className="block">
              <span className="block text-sm mb-1">Starttijd</span>
              <input
                type="datetime-local"
                name="startsAt"
                defaultValue={toInput(m.startsAt)}
                className="w-full border border-derby-ink/20 rounded-lg px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="block text-sm mb-1">Poule</span>
              <input
                name="poule"
                defaultValue={m.poule ?? ""}
                className="w-full border border-derby-ink/20 rounded-lg px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="block text-sm mb-1">Score A</span>
              <input
                type="number"
                name="scoreA"
                defaultValue={m.scoreA ?? ""}
                className="w-full border border-derby-ink/20 rounded-lg px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="block text-sm mb-1">Score B</span>
              <input
                type="number"
                name="scoreB"
                defaultValue={m.scoreB ?? ""}
                className="w-full border border-derby-ink/20 rounded-lg px-3 py-2"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="block text-sm mb-1">Status</span>
              <select
                name="status"
                defaultValue={m.status}
                className="w-full border border-derby-ink/20 rounded-lg px-3 py-2"
              >
                <option value="scheduled">Gepland</option>
                <option value="live">Live</option>
                <option value="finished">Afgerond</option>
              </select>
            </label>
            <div className="sm:col-span-2 flex gap-2">
              <button
                type="submit"
                className="bg-derby-ink text-derby-yellow rounded-full px-4 py-2 font-bold"
              >
                Opslaan
              </button>
              <button
                type="submit"
                formAction={deleteMatch.bind(null, m.id)}
                className="bg-white border border-derby-accent text-derby-accent rounded-full px-4 py-2 font-bold"
              >
                Verwijder
              </button>
            </div>
          </form>
        ))}
      </section>
    </div>
  );
}

function TeamSelect({
  name,
  label,
  teams,
}: {
  name: string;
  label: string;
  teams: { id: string; name: string }[];
}) {
  return (
    <label className="block">
      <span className="block text-sm mb-1">{label}</span>
      <select
        name={name}
        required
        className="w-full border border-derby-ink/20 rounded-lg px-3 py-2"
      >
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </label>
  );
}
