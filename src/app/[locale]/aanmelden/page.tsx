import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { assertPageVisible } from "@/lib/page-visibility";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ locale, page: "aanmelden", path: "aanmelden" });
}

export default async function AanmeldenPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await assertPageVisible("aanmelden");
  setRequestLocale(locale);
  const t = await getTranslations("Aanmelden");

  const links = await prisma.registrationLink
    .findMany({ where: { visible: true }, orderBy: { order: "asc" } })
    .catch(() => []);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-5xl">{t("title")}</h1>
        <p className="text-derby-ink/70 max-w-2xl">{t("subtitle")}</p>
      </header>

      {links.length === 0 ? (
        <p className="bg-white rounded-2xl p-6 shadow text-derby-ink/70">
          {t("empty")}
        </p>
      ) : (
        <ul className="space-y-4">
          {links.map((link) => {
            const label =
              (locale === "en" ? link.labelEn : link.labelNl) || link.labelNl;
            const description =
              locale === "en"
                ? link.descriptionEn || link.descriptionNl
                : link.descriptionNl;
            return (
              <li
                key={link.id}
                className="bg-white rounded-2xl p-6 shadow space-y-3"
              >
                <h2 className="font-display text-2xl">{label}</h2>
                {description && (
                  <p className="text-derby-ink/70">{description}</p>
                )}
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-derby-ink text-derby-yellow rounded-full px-5 py-2 font-bold"
                >
                  {t("openLink")}
                </a>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-sm text-derby-ink/60">{t("questions")}</p>
    </div>
  );
}
