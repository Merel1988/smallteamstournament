import { getTranslations, setRequestLocale } from "next-intl/server";
import NicknameGenerator from "@/components/NicknameGenerator";

export default async function NicknamePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Nickname");

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <header>
        <h1 className="font-display text-5xl">{t("title")}</h1>
        <p className="text-derby-ink/70 mt-1">{t("subtitle")}</p>
      </header>
      <NicknameGenerator />
    </div>
  );
}
