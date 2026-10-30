import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { formatMinutes } from "@/lib/time";
import {
  createLockerRoom,
  createProgramItem,
  deleteLockerRoom,
  deleteProgramItem,
  updateLockerRoom,
  saveOfficials,
  updateProgramItem,
} from "./actions";
import SubmitButton from "@/components/SubmitButton";

export const dynamic = "force-dynamic";

const input = "w-full border border-derby-ink/20 rounded-lg px-3 py-2";

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
  searchParams: Promise<{ saved?: string }>;
}) {
  await requireAdmin();
  const { saved } = await searchParams;

  const [items, lockerRooms, officials] = await Promise.all([
    prisma.programItem.findMany({ orderBy: { start: "asc" } }),
    prisma.lockerRoom.findMany({ orderBy: { sortOrder: "asc" } }).catch(() => []),
    prisma.official.findMany({ orderBy: { sortOrder: "asc" } }).catch(() => []),
  ]);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-display text-4xl">Infopack</h1>
        <p className="text-derby-ink/70">
          Beheer het dagprogramma, de kleedkamers en de officials op{" "}
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

      <section id="officials" className="space-y-4 scroll-mt-6">
        <h2 className="font-display text-3xl">Officials</h2>
        {saved && (
          <p role="status" className="bg-green-50 text-green-800 rounded-lg px-4 py-2 text-sm">
            Opgeslagen.
          </p>
        )}
        <form action={saveOfficials} className="bg-white rounded-2xl p-5 shadow space-y-3">
          <label className="block">
            <span className="block text-sm mb-1">
              Eén naam per regel. Op /info verschijnen ze op alfabetische volgorde.
            </span>
            <textarea
              name="names"
              rows={Math.max(8, officials.length + 2)}
              defaultValue={officials.map((o) => o.name).join("\n")}
              className={input}
            />
          </label>
          <SubmitButton type="submit" className="bg-derby-ink text-white rounded-full px-4 py-2 font-bold">
            Officials opslaan
          </SubmitButton>
        </form>
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
