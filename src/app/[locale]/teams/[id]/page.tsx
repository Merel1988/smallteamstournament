import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import ProtectedImage from "@/components/ProtectedImage";
import { prisma } from "@/lib/prisma";
import { assertPageVisible, getHiddenPageKeys } from "@/lib/page-visibility";
import { kindOf } from "@/lib/schedule";
import { eventTimeFormatter } from "@/lib/time";
import { SITE_NAME, SITE_URL, languageAlternates, localizedPath } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const team = await prisma.team
    .findUnique({ where: { id } })
    .catch(() => null);
  if (!team) return {};

  const description =
    (locale === "en"
      ? team.descriptionEn || team.descriptionNl
      : team.descriptionNl || team.descriptionEn
    )?.slice(0, 200) || `${team.name} — ${SITE_NAME}`;
  const path = `teams/${id}`;
  const canonical = SITE_URL + localizedPath(locale, path);

  return {
    title: team.name,
    description,
    alternates: { canonical, languages: languageAlternates(path) },
    robots: { index: true, follow: true, noimageindex: true },
    openGraph: {
      title: `${team.name} · ${SITE_NAME}`,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: locale === "nl" ? "nl_NL" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${team.name} · ${SITE_NAME}`,
      description,
    },
  };
}

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  await assertPageVisible("teams");
  setRequestLocale(locale);
  const t = await getTranslations("Teams");
  const ts = await getTranslations("Schema");

  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      players: { orderBy: { number: "asc" } },
      benchStaff: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
    },
  });

  if (!team) notFound();

  const hidden = await getHiddenPageKeys();
  // A side with a placeholder label isn't really this team yet.
  const matches = hidden.has("schema")
    ? []
    : (
        await prisma.match
          .findMany({
            where: {
              OR: [{ teamAId: id }, { teamBId: id }],
            },
            include: { teamA: true, teamB: true },
            orderBy: { startsAt: "asc" },
          })
          .catch(() => [])
      )
        .filter(
          (m) =>
            kindOf(m.poule) === "match" &&
            ((m.teamAId === id && !m.teamALabel?.trim()) ||
              (m.teamBId === id && !m.teamBLabel?.trim())),
        )
        .map((m) => {
          const isA = m.teamAId === id && !m.teamALabel?.trim();
          const opponent = isA ? m.teamB : m.teamA;
          const opponentLabel = (isA ? m.teamBLabel : m.teamALabel)?.trim();
          const own = isA ? m.scoreA : m.scoreB;
          const other = isA ? m.scoreB : m.scoreA;
          return {
            id: m.id,
            startsAt: m.startsAt,
            poule: m.poule,
            status: m.status,
            opponent: opponentLabel ? null : opponent,
            opponentName: opponentLabel || opponent.name,
            own,
            other,
          };
        });
  const timeFmt = eventTimeFormatter(locale);

  return (
    <div className="space-y-6">
      <Link href="/teams" className="text-sm text-derby-ink/60 hover:underline">
        {t("backToAll")}
      </Link>

      <header
        className="bg-white rounded-2xl p-6 shadow flex items-center gap-5"
        style={team.color ? { borderTop: `8px solid ${team.color}` } : undefined}
      >
        {team.logoUrl ? (
          <Image
            src={team.logoUrl}
            alt={team.name}
            width={96}
            height={96}
            className="rounded-xl object-cover"
          />
        ) : (
          <div className="w-24 h-24 rounded-xl stripes" />
        )}
        <div>
          <h1 className="font-display text-4xl">{team.name}</h1>
          {(() => {
            const description =
              locale === "en"
                ? team.descriptionEn || team.descriptionNl
                : team.descriptionNl || team.descriptionEn;
            return (
              description && (
                <p className="text-derby-ink/70 mt-1 text-sm whitespace-pre-line">
                  {description}
                </p>
              )
            );
          })()}
        </div>
      </header>

      {matches.length > 0 && (
        <section>
          <h2 className="font-display text-3xl mb-3">{t("matchesHeading")}</h2>
          <ul className="space-y-2">
            {matches.map((m) => {
              const hasScore = m.status !== "scheduled" && m.own != null && m.other != null;
              const result =
                m.status === "finished" && hasScore
                  ? m.own! > m.other!
                    ? "won"
                    : m.own! < m.other!
                      ? "lost"
                      : "drawn"
                  : null;
              return (
                <li
                  key={m.id}
                  className="bg-white rounded-xl p-4 shadow flex items-center gap-4"
                >
                  <div className="font-display text-2xl w-16 shrink-0">
                    {timeFmt.format(m.startsAt)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate">
                      {t("against")}{" "}
                      {m.opponent ? (
                        <Link
                          href={`/teams/${m.opponent.id}`}
                          className="font-semibold hover:text-derby-accent hover:underline"
                        >
                          {m.opponentName}
                        </Link>
                      ) : (
                        <span className="font-semibold">{m.opponentName}</span>
                      )}
                    </div>
                    {m.poule && (
                      <div className="text-xs text-derby-ink/60">{m.poule}</div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {m.status === "live" && (
                      <div className="text-xs font-bold text-derby-accent">{ts("live")}</div>
                    )}
                    {hasScore && (
                      <div className="font-display text-2xl">
                        {m.own} – {m.other}
                      </div>
                    )}
                    {result && (
                      <div
                        className={`text-xs font-semibold ${
                          result === "won"
                            ? "text-green-700"
                            : result === "lost"
                              ? "text-derby-accent"
                              : "text-derby-ink/60"
                        }`}
                      >
                        {t(`result.${result}`)}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section>
        <h2 className="font-display text-3xl mb-3">{t("roster")}</h2>
        {team.players.length === 0 ? (
          <p className="text-derby-ink/60">{t("rosterEmpty")}</p>
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {team.players.map((p) => (
              <li
                key={p.id}
                className="bg-white rounded-xl p-3 shadow text-center"
              >
                {p.headshotUrl ? (
                  <ProtectedImage
                    src={p.headshotUrl}
                    alt={p.derbyName}
                    width={300}
                    height={400}
                    className="rounded-lg w-full aspect-[3/4] object-cover object-[center_20%]"
                  />
                ) : (
                  <div className="w-full aspect-[3/4] rounded-lg bg-derby-ink/10 flex items-center justify-center font-display text-5xl text-derby-ink/40">
                    #{p.number}
                  </div>
                )}
                <div className="mt-2 font-display text-lg truncate">
                  {p.derbyName}
                </div>
                <div className="text-xs text-derby-ink/60">
                  #{p.number}
                  {p.pronouns && ` · ${p.pronouns}`}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {team.benchStaff.length > 0 && (
        <section>
          <h2 className="font-display text-3xl mb-3">{t("bench")}</h2>
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {team.benchStaff.map((b) => (
              <li key={b.id} className="bg-white rounded-xl p-3 shadow text-center">
                {b.headshotUrl ? (
                  <ProtectedImage
                    src={b.headshotUrl}
                    alt={b.name}
                    width={300}
                    height={400}
                    className="rounded-lg w-full aspect-[3/4] object-cover object-[center_20%]"
                  />
                ) : (
                  <div className="w-full aspect-[3/4] rounded-lg bg-derby-ink/10 flex items-center justify-center font-display text-5xl text-derby-ink/40">
                    {b.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="mt-2 font-display text-lg truncate">{b.name}</div>
                <div className="text-xs text-derby-ink/60">
                  {b.role}
                  {b.pronouns && ` · ${b.pronouns}`}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
