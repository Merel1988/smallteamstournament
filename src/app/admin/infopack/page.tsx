import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_POSITIONS } from "@/lib/infopack";
import { kindOf } from "@/lib/schedule";
import { eventMinutes, formatMinutes } from "@/lib/time";
import { sideName } from "@/lib/match-teams";
import {
  copyRoster,
  createLockerRoom,
  createProgramItem,
  deleteLockerRoom,
  deleteProgramItem,
  updateLockerRoom,
  saveRoster,
  updateProgramItem,
} from "./actions";
import SubmitButton from "@/components/SubmitButton";

export const dynamic = "force-dynamic";

const input = "w-full border border-derby-ink/20 rounded-lg px-3 py-2";
const EXTRA_ROWS = 4;

type ProgramRow = {
  start: number;
  end: number | null;
  titleNl: string;
  titleEn: string | null;
  noteNl: string | null;
  noteEn: string | null;
};

type LockerRow = { room: string; labelNl: string; labelEn: string | null };

export default async function AdminInfopackPage({
  searchParams,
}: {
  searchParams: Promise<{ match?: string; saved?: string }>;
}) {
  await requireAdmin();
  const { match: matchParam, saved } = await searchParams;

  const [items, matchRows, lockerRooms] = await Promise.all([
    prisma.programItem.findMany({ orderBy: { start: "asc" } }),
    prisma.match.findMany({
      orderBy: { startsAt: "asc" },
      include: { teamA: true, teamB: true, _count: { select: { officials: true } } },
    }),
    prisma.lockerRoom.findMany({ orderBy: { sortOrder: "asc" } }).catch(() => []),
  ]);
  const matches = matchRows.filter((m) => kindOf(m.poule) === "match");
  const selected = matches.find((m) => m.id === matchParam) ?? matches[0];
  const assignments = selected
    ? await prisma.officialAssignment.findMany({
        where: { matchId: selected.id },
        orderBy: { sortOrder: "asc" },
      })
    : [];
  const rows = [
    ...(assignments.length > 0
      ? assignments.map((a) => ({ position: a.position, name: a.name, pronouns: a.pronouns ?? "" }))
      : DEFAULT_POSITIONS.map((position) => ({ position, name: "", pronouns: "" }))),
    ...Array.from({ length: EXTRA_ROWS }, () => ({ position: "", name: "", pronouns: "" })),
  ];
  const label = (m: (typeof matches)[number]) =>
    `${formatMinutes(eventMinutes(m.startsAt))} · ${m.poule ?? ""} · ${sideName(m.teamA, m.teamALabel)} vs ${sideName(m.teamB, m.teamBLabel)}`;

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-display text-4xl">Infopack</h1>
        <p className="text-derby-ink/70">
          Beheer het dagprogramma, de kleedkamers en de officials roster op{" "}
          <Link href="/info" className="underline">
            /info
          </Link>
          . De wedstrijden zelf komen uit Schema en verschijnen automatisch in het dagprogramma.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="font-display text-3xl">Dagprogramma</h2>
        <form action={createProgramItem} className="bg-white rounded-2xl p-5 shadow space-y-3">
          <h3 className="font-display text-2xl">Nieuw onderdeel</h3>
          <ProgramFields />
          <SubmitButton type="submit" className="bg-derby-ink text-white rounded-full px-4 py-2 font-bold">
            Toevoegen
          </SubmitButton>
        </form>

        {items.length === 0 ? (
          <p className="text-derby-ink/60">
            Nog niets toegevoegd. Denk aan: deuren open voor teams en officials, captains meeting,
            officials meeting, warm-ups, deuren open voor publiek, prijsuitreiking, opruimen.
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id}>
                <form
                  action={updateProgramItem.bind(null, item.id)}
                  className="bg-white rounded-2xl p-5 shadow space-y-3"
                >
                  <ProgramFields item={item} />
                  <div className="flex gap-2">
                    <SubmitButton type="submit" className="bg-derby-ink text-white rounded-full px-4 py-2 font-bold">
                      Opslaan
                    </SubmitButton>
                    <SubmitButton
                      type="submit"
                      formAction={deleteProgramItem.bind(null, item.id)}
                      className="bg-white border border-derby-accent text-derby-accent rounded-full px-4 py-2 font-bold"
                    >
                      Verwijder
                    </SubmitButton>
                  </div>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="kleedkamers" className="space-y-4 scroll-mt-6">
        <h2 className="font-display text-3xl">Kleedkamers</h2>
        <p className="text-derby-ink/70">
          Eén naam per regel. Een regel die precies een teamnaam is, linkt op /info naar dat team.
        </p>
        <ul className="space-y-3">
          {lockerRooms.map((r) => (
            <li key={r.id}>
              <form
                action={updateLockerRoom.bind(null, r.id)}
                className="bg-white rounded-2xl p-5 shadow space-y-3"
              >
                <LockerFields room={r} />
                <div className="flex gap-2">
                  <SubmitButton type="submit" className="bg-derby-ink text-white rounded-full px-4 py-2 font-bold">
                    Opslaan
                  </SubmitButton>
                  <SubmitButton
                    type="submit"
                    formAction={deleteLockerRoom.bind(null, r.id)}
                    className="bg-white border border-derby-accent text-derby-accent rounded-full px-4 py-2 font-bold"
                  >
                    Verwijder
                  </SubmitButton>
                </div>
              </form>
            </li>
          ))}
        </ul>
        <form action={createLockerRoom} className="bg-white rounded-2xl p-5 shadow space-y-3">
          <h3 className="font-display text-2xl">Nieuwe kleedkamer</h3>
          <LockerFields />
          <SubmitButton type="submit" className="bg-derby-ink text-white rounded-full px-4 py-2 font-bold">
            Toevoegen
          </SubmitButton>
        </form>
      </section>

      <section id="roster" className="space-y-4 scroll-mt-6">
        <h2 className="font-display text-3xl">Officials roster</h2>
        {matches.length === 0 ? (
          <p className="text-derby-ink/60">Voeg eerst wedstrijden toe in Schema.</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
            <nav aria-label="Wedstrijden" className="bg-white rounded-2xl p-2 shadow self-start">
              <ul className="space-y-1">
                {matches.map((m) => (
                  <li key={m.id}>
                    <Link
                      href={`/admin/infopack?match=${m.id}#roster`}
                      aria-current={m.id === selected?.id ? "page" : undefined}
                      className={`flex justify-between gap-2 rounded-lg px-3 py-2 text-sm ${
                        m.id === selected?.id ? "bg-derby-ink text-white" : "hover:bg-derby-ink/5"
                      }`}
                    >
                      <span className="truncate">{label(m)}</span>
                      <span className="shrink-0 opacity-70">{m._count.officials}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {selected && (
              <div className="space-y-4">
                {saved && (
                  <p role="status" className="bg-green-50 text-green-800 rounded-lg px-4 py-2 text-sm">
                    Opgeslagen.
                  </p>
                )}
                <form
                  key={selected.id}
                  action={saveRoster.bind(null, selected.id)}
                  className="bg-white rounded-2xl p-5 shadow space-y-3"
                >
                  <h3 className="font-display text-2xl">{label(selected)}</h3>
                  <p className="text-sm text-derby-ink/60">
                    Lege namen worden niet opgeslagen. Posities mag je aanpassen (bijv. FIPR/BIPR) of
                    aanvullen in de lege regels onderaan.
                  </p>
                  <div className="grid grid-cols-[6rem_1fr_8rem] gap-2 text-sm font-bold">
                    <span>Positie</span>
                    <span>Naam</span>
                    <span>Voornaamwoorden</span>
                  </div>
                  {rows.map((r, i) => (
                    <div key={i} className="grid grid-cols-[6rem_1fr_8rem] gap-2">
                      <input name="position" defaultValue={r.position} aria-label="Positie" className={input} />
                      <input name="name" defaultValue={r.name} aria-label="Naam" className={input} />
                      <input
                        name="pronouns"
                        defaultValue={r.pronouns}
                        aria-label="Voornaamwoorden"
                        placeholder="bijv. she/her"
                        className={input}
                      />
                    </div>
                  ))}
                  <SubmitButton type="submit" className="bg-derby-ink text-white rounded-full px-4 py-2 font-bold">
                    Roster opslaan
                  </SubmitButton>
                </form>

                <form
                  action={copyRoster.bind(null, selected.id)}
                  className="bg-white rounded-2xl p-5 shadow flex flex-wrap items-end gap-3"
                >
                  <label className="block flex-1 min-w-60">
                    <span className="block text-sm mb-1">Kopieer roster van (vervangt deze wedstrijd)</span>
                    <select name="source" className={input} defaultValue="">
                      <option value="" disabled>
                        Kies een wedstrijd
                      </option>
                      {matches
                        .filter((m) => m.id !== selected.id && m._count.officials > 0)
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            {label(m)}
                          </option>
                        ))}
                    </select>
                  </label>
                  <SubmitButton
                    type="submit"
                    className="bg-white border border-derby-ink rounded-full px-4 py-2 font-bold"
                  >
                    Kopieer
                  </SubmitButton>
                </form>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function ProgramFields({ item }: { item?: ProgramRow }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block">
        <span className="block text-sm mb-1">Van</span>
        <input
          type="time"
          name="start"
          required
          defaultValue={item ? formatMinutes(item.start) : ""}
          className={input}
        />
      </label>
      <label className="block">
        <span className="block text-sm mb-1">Tot (optioneel)</span>
        <input
          type="time"
          name="end"
          defaultValue={item?.end != null ? formatMinutes(item.end) : ""}
          className={input}
        />
      </label>
      <label className="block">
        <span className="block text-sm mb-1">Wat (NL)</span>
        <input name="titleNl" required defaultValue={item?.titleNl ?? ""} className={input} />
      </label>
      <label className="block">
        <span className="block text-sm mb-1">Wat (EN, optioneel)</span>
        <input name="titleEn" defaultValue={item?.titleEn ?? ""} className={input} />
      </label>
      <label className="block">
        <span className="block text-sm mb-1">Toelichting (NL, optioneel)</span>
        <input name="noteNl" defaultValue={item?.noteNl ?? ""} className={input} />
      </label>
      <label className="block">
        <span className="block text-sm mb-1">Toelichting (EN, optioneel)</span>
        <input name="noteEn" defaultValue={item?.noteEn ?? ""} className={input} />
      </label>
    </div>
  );
}

function LockerFields({ room }: { room?: LockerRow }) {
  return (
    <div className="grid gap-3 sm:grid-cols-[6rem_1fr_1fr]">
      <label className="block">
        <span className="block text-sm mb-1">Nummer</span>
        <input name="room" required defaultValue={room?.room ?? ""} className={input} />
      </label>
      <label className="block">
        <span className="block text-sm mb-1">Wie (NL)</span>
        <textarea name="labelNl" required rows={2} defaultValue={room?.labelNl ?? ""} className={input} />
      </label>
      <label className="block">
        <span className="block text-sm mb-1">Wie (EN, optioneel)</span>
        <textarea name="labelEn" rows={2} defaultValue={room?.labelEn ?? ""} className={input} />
      </label>
    </div>
  );
}
