import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function RegelsPage() {
  const rules = await prisma.houseRule
    .findMany({ orderBy: { order: "asc" } })
    .catch(() => []);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-display text-5xl">Regels &amp; huisregels</h1>
      </header>

      <section className="bg-white rounded-2xl p-6 shadow space-y-3">
        <h2 className="font-display text-3xl">Roller derby in 1 minuut</h2>
        <p>
          Twee teams van 5 skaters rijden op een ovale baan. Per jam (max 2
          minuten) probeert de <strong>jammer</strong> — te herkennen aan de
          ster op de helm — zoveel mogelijk tegenstanders in te halen. Elke
          gepasseerde tegenstander = 1 punt.
        </p>
        <p>
          De <strong>blockers</strong> houden de jammer tegen én helpen hun
          eigen jammer door. De <strong>pivot</strong> (streep op de helm) kan
          tijdens de jam de rol van jammer overnemen via een{" "}
          <em>star pass</em>.
        </p>
        <p>
          Illegale hits, blokken in de rug, trips of out-of-bounds spelen →
          <strong> penalty</strong> van 30 seconden in de penalty box. Vier
          penalties in één jam betekent je team speelt met minder skaters.
        </p>
        <p className="text-sm text-derby-ink/60">
          Officieel reglement: WFTDA Rules of Flat Track Roller Derby. Dit
          toernooi speelt met 20-minuten bouts (zonder pauze) — een verkorte
          versie van het reguliere 60-minuten format.
        </p>
      </section>

      <section className="bg-white rounded-2xl p-6 shadow space-y-3">
        <h2 className="font-display text-3xl">Huisregels</h2>
        {rules.length === 0 ? (
          <ul className="space-y-2 list-disc pl-5">
            <li>Respecteer skaters, officials en publiek.</li>
            <li>Geen eten of drinken in de speelhal behalve water in een afsluitbare fles.</li>
            <li>Tassen uit de wisselzone — gebruik de kleedkamers.</li>
            <li>Foto&apos;s maken mag, flitslicht niet.</li>
            <li>EHBO / vragen? Loop naar de organisatietafel bij de ingang.</li>
          </ul>
        ) : (
          <ol className="space-y-3 list-decimal pl-5">
            {rules.map((r) => (
              <li key={r.id}>
                <strong>{r.title}</strong>
                {r.body ? ` — ${r.body}` : ""}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
