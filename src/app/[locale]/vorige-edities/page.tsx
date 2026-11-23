import Image from "next/image";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { pageMetadata } from "@/lib/seo";
import { assertPageVisible } from "@/lib/page-visibility";
import { EDITION_YEARS, editionFinal, getEdition } from "@/lib/editions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ locale, page: "vorige-edities", path: "vorige-edities" });
}

export default async function EditionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  await assertPageVisible("vorige-edities");
  setRequestLocale(locale);
  const t = await getTranslations("Editions");

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-5xl">{t("title")}</h1>
        <p className="text-lg text-derby-ink/80 max-w-2xl">{t("lead")}</p>
      </header>
      <ul className="grid gap-4 sm:grid-cols-2">
        {EDITION_YEARS.map((year) => {
          const { snapshot } = getEdition(year)!;
          const final = editionFinal(snapshot);
          const champion = snapshot.teams.find((team) => team.key === final?.champion);
          return (
            <li key={year}>
              <Link
                href={`/vorige-edities/${year}`}
                className="bg-white rounded-2xl p-5 shadow flex items-center gap-4 hover:shadow-lg transition"
              >
                {champion?.logoUrl ? (
                  <Image src={champion.logoUrl} alt="" width={64} height={64} className="w-16 h-16 shrink-0 rounded-lg object-contain" />
                ) : (
                  <div className="w-16 h-16 shrink-0 rounded-lg stripes" />
                )}
                <div className="min-w-0">
                  <div className="font-display text-4xl">{year}</div>
                  {champion && (
                    <div className="text-sm text-derby-ink/70">
                      {t("champion")}: <b>{champion.name}</b>
                    </div>
                  )}
                  <div className="text-sm font-bold text-derby-accent mt-1">{t("viewEdition", { year })} →</div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
