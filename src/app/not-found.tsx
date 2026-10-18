import Link from "next/link";
import { getTranslations } from "next-intl/server";
import NotFoundContent, { primaryAction } from "@/components/NotFoundContent";

export default async function RootNotFound() {
  const t = await getTranslations("NotFound");

  return (
    <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-10">
      <title>{t("metaTitle")}</title>
      <NotFoundContent
        title={t("title")}
        lead={t("lead")}
        actions={
          <Link href="/" className={primaryAction}>
            {t("home")}
          </Link>
        }
      />
    </main>
  );
}
