import { getTranslations, setRequestLocale } from "next-intl/server";
import BingoCard from "@/components/BingoCard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function BingoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Bingo");

  const prompts = await prisma.bingoPrompt
    .findMany({ where: { active: true }, select: { id: true, text: true } })
    .catch(() => []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-5xl">{t("title")}</h1>
        <p className="text-derby-ink/70 mt-1">{t("subtitle")}</p>
      </header>

      <BingoCard prompts={prompts} />
    </div>
  );
}
