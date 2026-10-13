import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { randomBytes } from "crypto";
import { MIN_PASSWORD_LENGTH } from "@/lib/team-auth";
import { SITE_URL } from "@/lib/seo";
import {
  clearTeamPassword,
  createTeam,
  deleteTeam,
  setTeamPassword,
  updateTeam,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminTeamsPage() {
  await requireAdmin();
  const teams = await prisma.team.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { players: true, benchStaff: true } } },
  });

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
        <Field name="descriptionNl" label="Korte beschrijving (NL)" />
        <Field name="descriptionEn" label="Korte beschrijving (EN, optioneel)" />
        <label className="block">
          <span className="block text-sm mb-1">Logo</span>
          <input type="file" name="logo" accept="image/*" />
        </label>
        <button
          type="submit"
          className="bg-derby-ink text-white rounded-full px-4 py-2 font-bold"
        >
          Aanmaken
        </button>
      </form>

      <section className="space-y-4">
        {teams.map((t) => (
          <div key={t.id} className="bg-white rounded-2xl p-5 shadow space-y-5">
            <form
              action={updateTeam.bind(null, t.id)}
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
                    name="descriptionNl"
                    label="Beschrijving (NL)"
                    defaultValue={t.descriptionNl ?? ""}
                  />
                  <Field
                    name="descriptionEn"
                    label="Beschrijving (EN, optioneel)"
                    defaultValue={t.descriptionEn ?? ""}
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
                  className="bg-derby-ink text-white rounded-full px-4 py-2 font-bold"
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
            <TeamPortalAdmin
              id={t.id}
              hasPassword={!!t.passwordHash}
              locked={!!t.lockedUntil && t.lockedUntil > new Date()}
              players={t._count.players}
              bench={t._count.benchStaff}
            />
          </div>
        ))}
      </section>
    </div>
  );
}

function TeamPortalAdmin({
  id,
  hasPassword,
  locked,
  players,
  bench,
}: {
  id: string;
  hasPassword: boolean;
  locked: boolean;
  players: number;
  bench: number;
}) {
  const url = `${SITE_URL}/team/${id}`;
  const suggestion = randomBytes(9).toString("base64url");
  return (
    <div className="border-t border-derby-ink/10 pt-4 space-y-3">
      <h3 className="font-display text-xl">Teampagina</h3>
      <p className="text-sm">
        {hasPassword ? "Open, met wachtwoord" : "Dicht (geen wachtwoord ingesteld)"}
        {locked && " · tijdelijk geblokkeerd na te veel inlogpogingen"}
        {` · ${players} skaters, ${bench} bench staff`}
      </p>
      <p className="text-sm break-all">
        Link:{" "}
        <a href={url} className="underline" target="_blank" rel="noopener noreferrer">
          {url}
        </a>
      </p>
      <form action={setTeamPassword.bind(null, id)} className="flex flex-wrap items-end gap-2">
        <label className="block flex-1 min-w-[12rem]">
          <span className="block text-sm mb-1">
            {hasPassword ? "Nieuw wachtwoord" : "Wachtwoord"} (min. {MIN_PASSWORD_LENGTH} tekens,
            voorstel ingevuld)
          </span>
          <input
            name="password"
            defaultValue={suggestion}
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="off"
            className="w-full border border-derby-ink/20 rounded-lg px-3 py-2 font-mono"
          />
        </label>
        <button
          type="submit"
          className="bg-derby-ink text-white rounded-full px-4 py-2 font-bold"
        >
          {hasPassword ? "Wachtwoord wijzigen" : "Wachtwoord instellen"}
        </button>
        {hasPassword && (
          <button
            type="submit"
            formAction={clearTeamPassword.bind(null, id)}
            formNoValidate
            className="bg-white border border-derby-accent text-derby-accent rounded-full px-4 py-2 font-bold"
          >
            Teampagina sluiten
          </button>
        )}
      </form>
      <p className="text-xs text-derby-ink/60">
        Het wachtwoord wordt versleuteld opgeslagen en is daarna niet meer te zien: kopieer het
        voor je opslaat en stuur het samen met de link naar het team. Wijzigen of sluiten logt het
        team uit. Als admin kun je via de link zelf ook de roster bewerken.
      </p>
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
