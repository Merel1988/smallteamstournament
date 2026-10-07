import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { assertPageVisible } from "@/lib/page-visibility";
import {
  TrackDiagram,
  HelmetCover,
  ScoringDiagram,
  PenaltyDiagram,
  TacticDiagram,
  CheatIcon,
} from "@/components/RulesIllustrations";

export const dynamic = "force-dynamic";

const WFTDA_RULES_URL = "https://rules.wftda.org/";
const WFTDA_RESOURCES_URL = "https://resources.wftda.org/";
const VIDEO_URLS = [
  "https://www.youtube.com/watch?v=OId6gTd2LCM",
  "https://www.youtube.com/watch?v=sFC6YE8zLmY",
];
const RULE_ICONS = ["clock", "team", "star", "contact", "penalty"] as const;
const TACTICS = ["wall", "pack", "isolate"] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ locale, page: "regels", path: "regels" });
}

export default async function RegelsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await assertPageVisible("regels");
  setRequestLocale(locale);
  const t = await getTranslations("Rules");

  const richTags = {
    strong: (chunks: React.ReactNode) => (
      <strong className="font-semibold">{chunks}</strong>
    ),
    em: (chunks: React.ReactNode) => <em>{chunks}</em>,
  };

  // A field cleared via /admin/teksten should not render as empty markup.
  const hasText = (key: string) => String(t.raw(key) ?? "").trim().length > 0;

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="font-display text-5xl">{t("title")}</h1>
        {hasText("lead") && (
          <p className="text-lg text-derby-ink/70 max-w-2xl">{t("lead")}</p>
        )}
      </header>

      <Cheatsheet />

      {/* De basis — track diagram */}
      <ExplainerCard
        heading={t("basicsHeading")}
        illustration={
          <TrackDiagram
            className="w-full h-auto"
            label={t("basicsHeading")}
          />
        }
      >
        <p>{t.rich("basicsBody", richTags)}</p>
      </ExplainerCard>

      {/* De rollen — helmet covers */}
      <section className="bg-white rounded-2xl p-6 shadow space-y-5">
        <div className="space-y-2">
          <h2 className="font-display text-3xl">{t("rolesHeading")}</h2>
          {hasText("rolesBody") && (
            <p className="text-derby-ink/80">{t.rich("rolesBody", richTags)}</p>
          )}
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <RoleCard
            illustration={
              <HelmetCover
                variant="jammer"
                className="h-24 w-24"
                label={t("jammerLabel")}
              />
            }
            label={t("jammerLabel")}
          >
            {t.rich("jammerDesc", richTags)}
          </RoleCard>
          <RoleCard
            illustration={
              <HelmetCover
                variant="pivot"
                className="h-24 w-24"
                label={t("pivotLabel")}
              />
            }
            label={t("pivotLabel")}
          >
            {t.rich("pivotDesc", richTags)}
          </RoleCard>
          <RoleCard
            illustration={
              <HelmetCover
                variant="blocker"
                className="h-24 w-24"
                label={t("blockerLabel")}
              />
            }
            label={t("blockerLabel")}
          >
            {t.rich("blockerDesc", richTags)}
          </RoleCard>
        </div>
      </section>

      {/* Scoren — scoring diagram */}
      <ExplainerCard
        heading={t("scoringHeading")}
        illustration={
          <ScoringDiagram className="w-full h-auto" label={t("scoringHeading")} />
        }
        flip
      >
        <p>{t.rich("scoringBody", richTags)}</p>
      </ExplainerCard>

      {/* Penalties — whistle + clock */}
      <ExplainerCard
        heading={t("penaltiesHeading")}
        illustration={
          <PenaltyDiagram
            className="h-40 w-auto mx-auto"
            label={t("penaltiesHeading")}
          />
        }
      >
        <p>{t.rich("penaltiesBody", richTags)}</p>
      </ExplainerCard>

      {/* Dit toernooi */}
      {hasText("formatBody") && (
        <section className="bg-derby-ink text-white rounded-2xl p-6 shadow space-y-2">
          <h2 className="font-display text-3xl">{t("formatHeading")}</h2>
          <p className="text-white/90">{t.rich("formatBody", richTags)}</p>
        </section>
      )}

      {/* Bronnen */}
      {hasText("sourcesBody") && (
        <section className="rounded-2xl border border-derby-ink/15 p-6 space-y-3">
          <h2 className="font-display text-2xl">{t("sourcesHeading")}</h2>
          <p className="text-derby-ink/70 text-sm">{t("sourcesBody")}</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <li>
              <a
                href={WFTDA_RULES_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-derby-accent underline"
              >
                {t("sourceRulesLabel")} →
              </a>
            </li>
            <li>
              <a
                href={WFTDA_RESOURCES_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-derby-accent underline"
              >
                {t("sourceResourcesLabel")} →
              </a>
            </li>
          </ul>
        </section>
      )}
    </div>
  );
}

function ExplainerCard({
  heading,
  illustration,
  children,
  flip = false,
}: {
  heading: string;
  illustration: React.ReactNode;
  children: React.ReactNode;
  flip?: boolean;
}) {
  return (
    <section className="bg-white rounded-2xl p-6 shadow">
      <div className="grid gap-6 sm:grid-cols-2 sm:items-center">
        <div className={`space-y-3 ${flip ? "sm:order-2" : ""}`}>
          <h2 className="font-display text-3xl">{heading}</h2>
          <div className="space-y-3 text-derby-ink/80">{children}</div>
        </div>
        <div
          className={`rounded-xl bg-derby-bg p-4 ${flip ? "sm:order-1" : ""}`}
        >
          {illustration}
        </div>
      </div>
    </section>
  );
}

function RoleCard({
  illustration,
  label,
  children,
}: {
  illustration: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-derby-bg p-4 text-center flex flex-col items-center gap-2">
      {illustration}
      <h3 className="font-display text-xl">{label}</h3>
      <p className="text-sm text-derby-ink/75">{children}</p>
    </div>
  );
}

/** Compact one-card summary ("spiekbriefje") of the key rules, tactics and jam flow. */
async function Cheatsheet() {
  const t = await getTranslations("Rules.cheat");
  const has = (key: string) => String(t.raw(key) ?? "").trim().length > 0;
  const n = (count: number) => Array.from({ length: count }, (_, i) => i + 1);

  return (
    <section
      id="spiekbriefje"
      aria-labelledby="spiekbriefje-heading"
      className="scroll-mt-24 rounded-2xl border-4 border-derby-ink bg-white shadow overflow-hidden"
    >
      <div className="bg-derby-ink text-white px-6 py-5 space-y-1">
        <p className="text-xs font-bold uppercase tracking-widest text-derby-accent">
          {t("eyebrow")}
        </p>
        <h2 id="spiekbriefje-heading" className="font-display text-4xl">
          {t("heading")}
        </h2>
        {has("lead") && <p className="text-white/80 max-w-2xl">{t("lead")}</p>}
      </div>

      <div className="grid gap-px bg-derby-ink/15 lg:grid-cols-3">
        <CheatBlock heading={t("rulesHeading")}>
          <ul className="space-y-3">
            {n(5)
              .filter((i) => has(`rule${i}`))
              .map((i) => (
                <li key={i} className="flex gap-3 items-start">
                  <CheatIcon
                    kind={RULE_ICONS[i - 1]}
                    className="h-8 w-8 shrink-0"
                  />
                  <span className="text-sm text-derby-ink/80">
                    {t(`rule${i}`)}
                  </span>
                </li>
              ))}
          </ul>
        </CheatBlock>

        <CheatBlock heading={t("tacticsHeading")}>
          <ul className="space-y-4">
            {TACTICS.map((key) => (
              <li key={key} className="flex gap-3 items-center">
                <div className="w-32 shrink-0 rounded-lg bg-derby-bg p-1.5">
                  <TacticDiagram
                    variant={key}
                    className="w-full h-auto"
                    label={t(`${key}Label`)}
                  />
                </div>
                <div>
                  <h4 className="font-display text-lg text-derby-accent leading-tight">
                    {t(`${key}Label`)}
                  </h4>
                  <p className="text-sm text-derby-ink/80">{t(`${key}Desc`)}</p>
                </div>
              </li>
            ))}
          </ul>
        </CheatBlock>

        <CheatBlock heading={t("leadHeading")}>
          <div className="flex gap-4 items-start">
            <HelmetCover
              variant="jammer"
              className="h-16 w-16 shrink-0"
              label={t("leadHeading")}
            />
            <ul className="list-disc pl-4 space-y-2 text-sm text-derby-ink/80">
              {n(3)
                .filter((i) => has(`lead${i}`))
                .map((i) => (
                  <li key={i}>{t(`lead${i}`)}</li>
                ))}
            </ul>
          </div>
        </CheatBlock>
      </div>

      <div className="border-t border-derby-ink/15 p-6 space-y-4">
        <h3 className="font-display text-2xl">{t("stepsHeading")}</h3>
        <ol className="grid gap-4 sm:grid-cols-5">
          {n(5).map((i) => (
            <li key={i} className="flex gap-3 sm:flex-col sm:gap-2">
              <span
                aria-hidden="true"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-derby-accent font-bold text-white"
              >
                {i}
              </span>
              <div>
                <h4 className="font-semibold">{t(`step${i}Title`)}</h4>
                <p className="text-sm text-derby-ink/75">{t(`step${i}Body`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="bg-derby-ink text-white px-6 py-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h3 className="font-display text-xl">{t("videosHeading")}</h3>
          <ul className="flex flex-wrap gap-2">
            {VIDEO_URLS.map((url, i) => (
              <li key={url}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-derby-accent px-4 py-2 text-sm font-semibold text-white hover:bg-derby-accent-dark"
                >
                  <span aria-hidden="true">▶</span>
                  {t(`video${i + 1}Label`)}
                </a>
              </li>
            ))}
          </ul>
          {has("videosNote") && (
            <p className="text-xs text-white/70">{t("videosNote")}</p>
          )}
        </div>
        {has("tagline") && (
          <p className="font-display text-2xl text-derby-accent -rotate-2 sm:text-right">
            {t("tagline")}
          </p>
        )}
      </div>
    </section>
  );
}

function CheatBlock({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white p-6 space-y-4">
      <h3 className="font-display text-2xl">{heading}</h3>
      {children}
    </div>
  );
}
