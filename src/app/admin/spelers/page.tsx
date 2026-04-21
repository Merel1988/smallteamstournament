import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { createPlayer, deletePlayer, updatePlayer } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminSpelersPage() {
  await requireAdmin();
  const [teams, players] = await Promise.all([
    prisma.team.findMany({ orderBy: { name: "asc" } }),
    prisma.player.findMany({
      include: { team: true },
      orderBy: [{ team: { name: "asc" } }, { number: "asc" }],
    }),
  ]);

  if (teams.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-4xl">Spelers beheren</h1>
        <p className="text-derby-ink/60">
          Maak eerst een team aan voordat je spelers toevoegt.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="font-display text-4xl">Spelers beheren</h1>

      <form
        action={createPlayer}
        className="bg-white rounded-2xl p-5 shadow space-y-3"
        encType="multipart/form-data"
      >
        <h2 className="font-display text-2xl">Nieuwe speler</h2>
        <label className="block">
          <span className="block text-sm mb-1">Team</span>
          <select
            name="teamId"
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
        <TextField name="name" label="Naam" required />
        <TextField name="derbyName" label="Derby-naam" />
        <TextField name="number" label="Nummer" required />
        <TextField name="position" label="Positie (Jammer / Blocker / Pivot)" />
        <label className="block">
          <span className="block text-sm mb-1">Headshot</span>
          <input type="file" name="headshot" accept="image/*" />
        </label>
        <button
          type="submit"
          className="bg-derby-ink text-derby-yellow rounded-full px-4 py-2 font-bold"
        >
          Aanmaken
        </button>
      </form>

      <section className="space-y-4">
        {players.map((p) => (
          <form
            key={p.id}
            action={updatePlayer.bind(null, p.id)}
            className="bg-white rounded-2xl p-5 shadow"
            encType="multipart/form-data"
          >
            <div className="flex items-start gap-4">
              {p.headshotUrl ? (
                <Image
                  src={p.headshotUrl}
                  alt={p.name}
                  width={72}
                  height={72}
                  className="rounded-lg object-cover"
                />
              ) : (
                <div className="w-[72px] h-[72px] rounded-lg bg-derby-ink/10 shrink-0" />
              )}
              <div className="flex-1 space-y-2">
                <label className="block">
                  <span className="block text-sm mb-1">Team</span>
                  <select
                    name="teamId"
                    defaultValue={p.teamId}
                    className="w-full border border-derby-ink/20 rounded-lg px-3 py-2"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </label>
                <TextField name="name" label="Naam" defaultValue={p.name} required />
                <TextField
                  name="derbyName"
                  label="Derby-naam"
                  defaultValue={p.derbyName ?? ""}
                />
                <TextField
                  name="number"
                  label="Nummer"
                  defaultValue={p.number}
                  required
                />
                <TextField
                  name="position"
                  label="Positie"
                  defaultValue={p.position ?? ""}
                />
                <label className="block">
                  <span className="block text-sm mb-1">Headshot vervangen</span>
                  <input type="file" name="headshot" accept="image/*" />
                </label>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                type="submit"
                className="bg-derby-ink text-derby-yellow rounded-full px-4 py-2 font-bold"
              >
                Opslaan
              </button>
              <button
                type="submit"
                formAction={deletePlayer.bind(null, p.id)}
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

function TextField({
  name,
  label,
  required,
  defaultValue,
}: {
  name: string;
  label: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm mb-1">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="w-full border border-derby-ink/20 rounded-lg px-3 py-2"
      />
    </label>
  );
}
