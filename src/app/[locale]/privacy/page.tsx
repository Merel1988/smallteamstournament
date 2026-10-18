import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ locale, page: "privacy", path: "privacy" });
}

const SECTIONS = ["who", "what", "why", "photos", "cookies", "sharing", "retention", "rights"];

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Privacy");

  return (
    <div className="space-y-6 max-w-3xl">
      <header className="space-y-3">
        <h1 className="font-display text-5xl">{t("title")}</h1>
        <p className="text-lg text-derby-ink/80">{t("lead")}</p>
      </header>

      {SECTIONS.map((key) => (
        <section key={key} id={key} className="bg-white rounded-2xl p-6 shadow space-y-2">
          <h2 className="font-display text-3xl">{t(`${key}Heading`)}</h2>
          <p className="text-derby-ink/80 whitespace-pre-line">{t(`${key}Body`)}</p>
        </section>
      ))}

      <p className="text-sm text-derby-ink/60">{t("updated")}</p>
    </div>
  );
}
