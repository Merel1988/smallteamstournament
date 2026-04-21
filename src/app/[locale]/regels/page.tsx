import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function RegelsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Rules");

  const rules = await prisma.houseRule
    .findMany({ orderBy: { order: "asc" } })
    .catch(() => []);

  const richTags = {
    strong: (chunks: React.ReactNode) => <strong>{chunks}</strong>,
    em: (chunks: React.ReactNode) => <em>{chunks}</em>,
  };

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-display text-5xl">{t("title")}</h1>
      </header>

      <section className="bg-white rounded-2xl p-6 shadow space-y-3">
        <h2 className="font-display text-3xl">{t("quickHeading")}</h2>
        <p>{t.rich("intro1", richTags)}</p>
        <p>{t.rich("intro2", richTags)}</p>
        <p>{t.rich("intro3", richTags)}</p>
        <p className="text-sm text-derby-ink/60">{t("intro4")}</p>
      </section>

      <section className="bg-white rounded-2xl p-6 shadow space-y-3">
        <h2 className="font-display text-3xl">{t("houseHeading")}</h2>
        {rules.length === 0 ? (
          <ul className="space-y-2 list-disc pl-5">
            <li>{t("houseDefault1")}</li>
            <li>{t("houseDefault2")}</li>
            <li>{t("houseDefault3")}</li>
            <li>{t("houseDefault4")}</li>
            <li>{t("houseDefault5")}</li>
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
