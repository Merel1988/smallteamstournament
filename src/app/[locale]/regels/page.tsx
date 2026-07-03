import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { assertPageVisible } from "@/lib/page-visibility";
import {
  TrackDiagram,
  HelmetCover,
  ScoringDiagram,
  PenaltyDiagram,
} from "@/components/RulesIllustrations";

export const dynamic = "force-dynamic";

const WFTDA_RULES_URL = "https://rules.wftda.org/";
const WFTDA_RESOURCES_URL = "https://resources.wftda.org/";

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
        <section className="bg-derby-ink text-derby-yellow rounded-2xl p-6 shadow space-y-2">
          <h2 className="font-display text-3xl">{t("formatHeading")}</h2>
          <p className="text-derby-yellow/90">{t.rich("formatBody", richTags)}</p>
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
