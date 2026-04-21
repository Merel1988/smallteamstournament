import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { createTeam, deleteTeam, updateTeam } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminTeamsPage() {
  await requireAdmin();
  const teams = await prisma.team.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-8">
      <h1 className="font-display text-4xl">Teams beheren</h1>

      <form
        action={createTeam}
        className="bg-white rounded-2xl p-5 shadow space-y-3"
        encType="multipart/form-data"
      >
        <h2 className="font-display text-2xl">Nieuw team</h2>
        <Field name="name" label="Naam" required />
        <Field name="shortName" label="Afkorting" />
        <Field name="color" label="Accent-kleur (hex, bv #ff3e6c)" />
        <Field name="description" label="Korte beschrijving" />
        <label className="block">
          <span className="block text-sm mb-1">Logo</span>
          <input type="file" name="logo" accept="image/*" />
        </label>
        <button
          type="submit"
          className="bg-derby-ink text-derby-yellow rounded-full px-4 py-2 font-bold"
        >
          Aanmaken
        </button>
      </form>

      <section className="space-y-4">
        {teams.map((t) => (
          <form
            key={t.id}
            action={updateTeam.bind(null, t.id)}
            className="bg-white rounded-2xl p-5 shadow"
            encType="multipart/form-data"
          >
            <div className="flex items-start gap-4">
              {t.logoUrl ? (
                <Image
                  src={t.logoUrl}
                  alt={t.name}
                  width={64}
                  height={64}
                  className="rounded-lg object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg stripes shrink-0" />
              )}
              <div className="flex-1 space-y-2">
                <Field name="name" label="Naam" defaultValue={t.name} required />
                <Field
                  name="shortName"
                  label="Afkorting"
                  defaultValue={t.shortName ?? ""}
                />
                <Field
                  name="color"
                  label="Accent-kleur"
                  defaultValue={t.color ?? ""}
                />
                <Field
                  name="description"
                  label="Beschrijving"
                  defaultValue={t.description ?? ""}
                />
                <label className="block">
                  <span className="block text-sm mb-1">Logo vervangen</span>
                  <input type="file" name="logo" accept="image/*" />
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
                formAction={deleteTeam.bind(null, t.id)}
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

function Field({
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
