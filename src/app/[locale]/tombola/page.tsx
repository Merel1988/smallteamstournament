import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { assertPageVisible } from "@/lib/page-visibility";
import { prisma } from "@/lib/prisma";
import { pageMetadata } from "@/lib/seo";
import { MAX_TICKETS_PER_CHECK, parseTickets, ticketKey } from "@/lib/tombola";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ locale, page: "tombola", path: "tombola" });
}

export default async function TombolaPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ lot?: string | string[] }>;
}) {
  const { locale } = await params;
  await assertPageVisible("tombola");
  setRequestLocale(locale);
  const t = await getTranslations("Tombola");

  const { lot } = await searchParams;
  const input = (Array.isArray(lot) ? lot.join(",") : (lot ?? "")).slice(0, 500);
  const tickets = parseTickets(input);

  const [prizeCount, prizes] = await Promise.all([
    prisma.tombolaPrize.count().catch(() => 0),
    tickets.length > 0
      ? prisma.tombolaPrize.findMany({ where: { ticketKey: { in: tickets.map(ticketKey) } } }).catch(() => [])
      : Promise.resolve([]),
  ]);
  const prizeByKey = new Map(prizes.map((p) => [p.ticketKey, p]));
  const drawn = prizeCount > 0;
  const anyWin = prizes.length > 0;

  return (
    <div className="space-y-8 max-w-2xl">
      <header className="space-y-3">
        <h1 className="font-display text-5xl">{t("title")}</h1>
        <p className="text-lg text-derby-ink/80">{drawn ? t("lead") : t("notDrawn")}</p>
      </header>

      <form method="get" className="bg-white rounded-2xl p-6 shadow space-y-3">
        <label htmlFor="lot" className="block font-bold">
          {t("label")}
        </label>
        <input
          id="lot"
          name="lot"
          defaultValue={input}
          inputMode="text"
          autoComplete="off"
          placeholder={t("placeholder")}
          className="w-full border-2 border-derby-ink/20 rounded-xl px-4 py-3 text-lg"
        />
        <p className="text-sm text-derby-ink/60">{t("hint", { max: MAX_TICKETS_PER_CHECK })}</p>
        <button type="submit" className="bg-derby-accent text-white rounded-full px-6 py-2.5 font-bold hover:bg-derby-ink transition">
          {t("check")}
        </button>
      </form>

      {drawn && tickets.length > 0 && (
        <section aria-live="polite" className="space-y-3">
          <ul className="space-y-2">
            {tickets.map((ticket) => {
              const prize = prizeByKey.get(ticketKey(ticket));
              return (
                <li
                  key={ticket}
                  className={`rounded-2xl p-4 flex flex-wrap items-baseline gap-x-3 ${
                    prize ? "bg-derby-accent text-white shadow-lg" : "bg-white/60 border border-derby-ink/10"
                  }`}
                >
                  <span className="font-display text-3xl leading-none">{ticket}</span>
                  <span className={prize ? "font-bold" : "text-derby-ink/70"}>
                    {prize ? (
                      <>
                        <span aria-hidden>🎉 </span>
                        {t("won", { prize: prize.prize })}
                        {prize.claimedAt && <span className="block font-normal text-sm">{t("claimed")}</span>}
                      </>
                    ) : (
                      t("noPrize")
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="text-derby-ink/80">{anyWin ? t("collect") : t("nextTime")}</p>
        </section>
      )}
    </div>
  );
}
