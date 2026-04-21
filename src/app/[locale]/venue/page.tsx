import { getTranslations, setRequestLocale } from "next-intl/server";
import { EVENT } from "@/lib/event";

export default async function VenuePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Venue");

  const mapsQuery = encodeURIComponent(EVENT.address);
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-5xl">{t("title")}</h1>
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
          {t("openMaps")}
        </a>
      </section>

      <section className="grid sm:grid-cols-2 gap-4">
        <InfoCard title={t("foodTitle")}>{t("foodBody")}</InfoCard>
        <InfoCard title={t("firstAidTitle")}>{t("firstAidBody")}</InfoCard>
        <InfoCard title={t("changingTitle")}>{t("changingBody")}</InfoCard>
        <InfoCard title={t("parkingTitle")}>{t("parkingBody")}</InfoCard>
      </section>

      <section className="bg-white rounded-2xl p-6 shadow">
        <h2 className="font-display text-3xl mb-3">{t("sponsorsHeading")}</h2>
        <p className="text-derby-ink/70 text-sm">{t("sponsorsBody")}</p>
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
