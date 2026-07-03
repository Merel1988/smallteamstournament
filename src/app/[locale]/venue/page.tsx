import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { assertPageVisible } from "@/lib/page-visibility";
import { EVENT } from "@/lib/event";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ locale, page: "venue", path: "venue" });
}

export default async function VenuePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await assertPageVisible("venue");
  setRequestLocale(locale);
  const t = await getTranslations("Venue");

  const houseRules = await prisma.houseRule
    .findMany({ orderBy: { order: "asc" } })
    .catch(() => []);
  const hasText = (key: string) => String(t.raw(key) ?? "").trim().length > 0;

  // Only show a card when its body has been filled in — an emptied field
  // should hide the whole card, not leave a blank white block.
  const infoCards = [
    { title: t("foodTitle"), body: t("foodBody") },
    { title: t("firstAidTitle"), body: t("firstAidBody") },
    { title: t("changingTitle"), body: t("changingBody") },
    { title: t("parkingTitle"), body: t("parkingBody") },
    { title: t("floorTitle"), body: t("floorBody") },
  ].filter((c) => c.body.trim().length > 0);

  // Default house rules: skip any entry whose text was emptied so we don't
  // render a bullet with nothing after it.
  const houseDefaults = [1, 2, 3, 4, 5]
    .map((n) => t(`houseDefault${n}`))
    .filter((v) => v.trim().length > 0);
  const dbHouseRules = houseRules.filter(
    (r) => r.title.trim().length > 0 || (r.body ?? "").trim().length > 0,
  );

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

      {infoCards.length > 0 && (
        <section className="grid sm:grid-cols-2 gap-4">
          {infoCards.map((c) => (
            <InfoCard key={c.title} title={c.title}>
              {c.body}
            </InfoCard>
          ))}
        </section>
      )}

      <section className="bg-white rounded-2xl p-6 shadow space-y-3">
        <h2 className="font-display text-3xl">{t("houseHeading")}</h2>
        {hasText("houseIntro") && (
          <p className="text-derby-ink/70 text-sm">{t("houseIntro")}</p>
        )}
        {houseRules.length === 0 ? (
          <ul className="space-y-2 list-disc pl-5">
            {houseDefaults.map((rule, i) => (
              <li key={i}>{rule}</li>
            ))}
          </ul>
        ) : (
          <ol className="space-y-3 list-decimal pl-5">
            {dbHouseRules.map((r) => (
              <li key={r.id}>
                <strong>{r.title}</strong>
                {r.body ? `: ${r.body}` : ""}
              </li>
            ))}
          </ol>
        )}
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
