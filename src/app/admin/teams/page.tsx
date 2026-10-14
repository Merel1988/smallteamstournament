import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { MIN_PASSWORD_LENGTH, revealPassword } from "@/lib/team-auth";
import { SITE_URL } from "@/lib/seo";
import {
  clearTeamPassword,
  createTeam,
  unlockTeam,
  deleteTeam,
  setTeamPassword,
  updateTeam,
} from "./actions";
import SubmitButton from "@/components/SubmitButton";

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
        <SubmitButton
          type="submit"
          className="bg-derby-ink text-white rounded-full px-4 py-2 font-bold"
        >
          Aanmaken
        </SubmitButton>
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
                <SubmitButton
                  type="submit"
                  className="bg-derby-ink text-white rounded-full px-4 py-2 font-bold"
                >
                  Opslaan
                </SubmitButton>
                <SubmitButton
                  type="submit"
                  formAction={deleteTeam.bind(null, t.id)}
                  className="bg-white border border-derby-accent text-derby-accent rounded-full px-4 py-2 font-bold"
                >
                  Verwijder
                </SubmitButton>
              </div>
            </form>
            <TeamPortalAdmin
              id={t.id}
              hasPassword={!!t.password}
              password={t.password ? revealPassword(t.password) : null}
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
  password,
  locked,
  players,
  bench,
}: {
  id: string;
  hasPassword: boolean;
  password: string | null;
  locked: boolean;
  players: number;
  bench: number;
}) {
  const url = `${SITE_URL}/team/${id}`;
  return (
    <div className="border-t border-derby-ink/10 pt-4 space-y-3">
      <h3 className="font-display text-xl">Teampagina</h3>
      <p className="text-sm">
        {hasPassword ? "Open" : "Dicht (geen wachtwoord ingesteld)"}
        {` · ${players} skaters, ${bench} bench staff`}
      </p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="font-bold">Link</dt>
        <dd className="break-all">
          <a href={url} className="underline" target="_blank" rel="noopener noreferrer">
            {url}
          </a>
        </dd>
        <dt className="font-bold">Wachtwoord</dt>
        <dd>
          {!hasPassword ? (
            <span className="text-derby-ink/60">nog niet ingesteld</span>
          ) : password ? (
            <code className="font-mono bg-derby-ink/5 rounded px-2 py-0.5 select-all">
              {password}
            </code>
          ) : (
            <span className="text-derby-accent">
              ingesteld vóór wachtwoorden zichtbaar werden, stel het hieronder opnieuw in
            </span>
          )}
        </dd>
      </dl>
      {locked && (
        <form action={unlockTeam.bind(null, id)} className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-derby-accent">Tijdelijk geblokkeerd na te veel foute inlogpogingen.</span>
          <SubmitButton className="underline font-bold">Blokkade opheffen</SubmitButton>
        </form>
      )}
      <form action={setTeamPassword.bind(null, id)} className="flex flex-wrap items-end gap-2">
        <label className="block flex-1 min-w-[12rem]">
          <span className="block text-sm mb-1">
            {hasPassword ? "Ander wachtwoord" : "Wachtwoord"} (min. {MIN_PASSWORD_LENGTH} tekens)
          </span>
          <input
            name="password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="off"
            className="w-full border border-derby-ink/20 rounded-lg px-3 py-2 font-mono"
          />
        </label>
        <SubmitButton className="bg-derby-ink text-white rounded-full px-4 py-2 font-bold">
          {hasPassword ? "Wachtwoord wijzigen" : "Wachtwoord instellen"}
        </SubmitButton>
        {hasPassword && (
          <SubmitButton
            formAction={clearTeamPassword.bind(null, id)}
            formNoValidate
            className="bg-white border border-derby-accent text-derby-accent rounded-full px-4 py-2 font-bold"
          >
            Teampagina sluiten
          </SubmitButton>
        )}
      </form>
      <p className="text-xs text-derby-ink/60">
        Stuur de link en het wachtwoord naar het team. Een ander wachtwoord instellen of de
        teampagina sluiten logt het team uit. Als admin kun je via de link zelf ook de roster
        bewerken.
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
