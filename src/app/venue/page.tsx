import { EVENT } from "@/lib/event";

export default function VenuePage() {
  const mapsQuery = encodeURIComponent(EVENT.address);
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-5xl">Venue &amp; info</h1>
      </header>

      <section className="bg-white rounded-2xl p-6 shadow space-y-2">
        <h2 className="font-display text-3xl">{EVENT.venue}</h2>
        <p className="text-derby-ink/80">{EVENT.address}</p>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 text-derby-accent underline"
        >
          Open in Google Maps →
        </a>
      </section>

      <section className="grid sm:grid-cols-2 gap-4">
        <InfoCard title="🥤 Eten &amp; drinken">
          Bij de sporthal is een kantine met koffie, fris, snacks en lekkers.
          Binnen de speelzaal alleen water (afsluitbare fles).
        </InfoCard>
        <InfoCard title="🩹 EHBO">
          De EHBO-post is herkenbaar aan het groene kruis bij de ingang. In geval
          van nood loop je naar de organisatietafel.
        </InfoCard>
        <InfoCard title="🚻 Kleedkamers">
          Er zijn gescheiden en gender-neutrale kleedkamers. Waardevolle
          spullen? Kluisje op slot, organisatie is niet verantwoordelijk.
        </InfoCard>
        <InfoCard title="🚲 Parkeren &amp; OV">
          Gratis parkeren rondom de hal. Vanaf Nijmegen CS bus 6 richting
          Weezenhof, halte Horstacker.
        </InfoCard>
      </section>

      <section className="bg-white rounded-2xl p-6 shadow">
        <h2 className="font-display text-3xl mb-3">Sponsors</h2>
        <p className="text-derby-ink/70 text-sm">
          Dit toernooi wordt mede mogelijk gemaakt door onze sponsors. Logo&apos;s
          volgen dichter bij de datum.
        </p>
      </section>
    </div>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow">
      <h3 className="font-display text-2xl mb-1">{title}</h3>
      <p className="text-derby-ink/80 text-sm">{children}</p>
    </div>
  );
}
