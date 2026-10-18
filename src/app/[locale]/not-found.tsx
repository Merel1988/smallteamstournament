import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import NotFoundContent, { primaryAction, secondaryAction } from "@/components/NotFoundContent";
import { getHiddenPageKeys } from "@/lib/page-visibility";

export default async function LocaleNotFound() {
  const t = await getTranslations("NotFound");
  const hidden = await getHiddenPageKeys();

  return (
    <>
      <title>{t("metaTitle")}</title>
      <NotFoundContent
        title={t("title")}
        lead={t("lead")}
        actions={
          <>
            <Link href="/" className={primaryAction}>
              {t("home")}
            </Link>
            {!hidden.has("schema") && (
              <Link href="/schema" className={secondaryAction}>
                {t("schema")}
              </Link>
            )}
          </>
        }
      />
    </>
  );
}
