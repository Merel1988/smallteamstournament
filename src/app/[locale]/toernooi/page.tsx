import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { assertPageVisible } from "@/lib/page-visibility";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ locale, page: "toernooi", path: "toernooi" });
}

export default async function ToernooiPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await assertPageVisible("toernooi");
  setRequestLocale(locale);
  const t = await getTranslations("Toernooi");

  // Every field is editable via /admin/teksten; a section only renders when its
  // body has been filled in, so an emptied field never leaves an empty block.
  const hasText = (key: string) => String(t.raw(key) ?? "").trim().length > 0;

  const sections = [
    { heading: "introHeading", body: "introBody" },
    { heading: "formatHeading", body: "formatBody" },
    { heading: "dayHeading", body: "dayBody" },
  ];

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="font-display text-5xl">{t("title")}</h1>
        {hasText("lead") && (
          <p className="text-lg text-derby-ink/80 max-w-2xl">{t("lead")}</p>
        )}
      </header>

      {sections
        .filter((s) => hasText(s.body))
        .map((s) => (
          <section
            key={s.heading}
            className="bg-white rounded-2xl p-6 shadow space-y-2"
          >
            <h2 className="font-display text-3xl">{t(s.heading)}</h2>
            <p className="text-derby-ink/80 whitespace-pre-line">{t(s.body)}</p>
          </section>
        ))}
    </div>
  );
}
