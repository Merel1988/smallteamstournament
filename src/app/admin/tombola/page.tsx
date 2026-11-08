import Link from "next/link";
import SubmitButton from "@/components/SubmitButton";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { addPrizes, deletePrize, toggleClaimed } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminTombolaPage() {
  await requireAdmin();
  const prizes = await prisma.tombolaPrize.findMany().catch(() => []);
  const sorted = prizes.sort((a, b) => a.ticket.localeCompare(b.ticket, "nl", { numeric: true }));
  const claimed = prizes.filter((p) => p.claimedAt).length;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-4xl">Tombola</h1>
        <p className="text-derby-ink/70">
          Bezoekers checken hun lotnummer op{" "}
          <Link href="/tombola" className="underline">
            /tombola
          </Link>
          . Zet de pagina aan bij{" "}
          <Link href="/admin/zichtbaarheid" className="underline">
            Zichtbaarheid
          </Link>{" "}
          en stuur eventueel een pushbericht zodra de trekking erin staat.
        </p>
      </header>

      <form action={addPrizes} className="bg-white rounded-2xl p-5 shadow space-y-3">
        <h2 className="font-display text-2xl">Winnende nummers toevoegen</h2>
        <p className="text-sm text-derby-ink/70">
          Eén lot per regel, nummer en prijs gescheiden door een dubbele punt. Een nummer dat er al staat krijgt de
          nieuwe prijs. Voorloopnullen, hoofdletters en spaties maken niet uit.
        </p>
        <textarea
          name="lines"
          rows={8}
          placeholder={"42: Roadkill hoodie\n117: Bon voor de bar\nRood 7: Tas met merch"}
          className="w-full border border-derby-ink/20 rounded-lg px-3 py-2 font-mono"
        />
        <SubmitButton type="submit" className="bg-derby-ink text-white rounded-full px-4 py-2 font-bold">
          Toevoegen
        </SubmitButton>
      </form>

      <section className="space-y-3">
        <h2 className="font-display text-2xl">
          Prijzen ({claimed} van {prizes.length} opgehaald)
        </h2>
        {sorted.length === 0 ? (
          <p className="text-derby-ink/60">Nog geen winnende nummers. Tot die er zijn, zien bezoekers dat de trekking nog komt.</p>
        ) : (
          <ul className="bg-white rounded-2xl shadow divide-y divide-derby-ink/10">
            {sorted.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-2">
                <span className="font-bold tabular-nums w-24">{p.ticket}</span>
                <span className={`flex-1 ${p.claimedAt ? "line-through text-derby-ink/50" : ""}`}>{p.prize}</span>
                <form className="flex gap-2">
                  <SubmitButton
                    type="submit"
                    formAction={toggleClaimed.bind(null, p.id)}
                    className="border border-derby-ink/30 rounded-full px-3 py-1 text-sm font-bold"
                  >
                    {p.claimedAt ? "Toch niet opgehaald" : "Opgehaald"}
                  </SubmitButton>
                  <SubmitButton
                    type="submit"
                    formAction={deletePrize.bind(null, p.id)}
                    className="border border-derby-accent text-derby-accent rounded-full px-3 py-1 text-sm font-bold"
                  >
                    Verwijder
                  </SubmitButton>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
