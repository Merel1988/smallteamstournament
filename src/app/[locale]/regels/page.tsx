import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { assertPageVisible } from "@/lib/page-visibility";
import { RulesSectionNav } from "@/components/RulesSectionNav";
import { RulesQuiz, type QuizQuestion } from "@/components/RulesQuiz";

export const dynamic = "force-dynamic";

// Beginner explainer, modelled on the "Roller derby simpel uitgelegd" page a club
// member made. All copy lives in the `Rules` namespace (editable via /admin/teksten).

const WFTDA_RULES_URL = "https://rules.wftda.com/";
const CLUB_URL = "https://roadkillrollers.nl/";
const VIDEO_URLS = [
  "https://www.youtube.com/watch?v=OId6gTd2LCM",
  "https://www.youtube.com/watch?v=sFC6YE8zLmY",
];
// Index of the right answer per quiz question (answers come from q{n}a1..a4).
const QUIZ_CORRECT = [0, 3, 0, 1, 1];

const ROLES = [
  { key: "jammer", icon: "⭐" },
  { key: "blocker", icon: "🧱" },
  { key: "pivot", icon: "▰" },
] as const;
const TACTICS = ["wall", "pack", "isolate"] as const;

const range = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

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
  const tA11y = await getTranslations("A11y");

  const rich = {
    strong: (chunks: React.ReactNode) => <strong>{chunks}</strong>,
  };

  const navItems = [
    { id: "rollen", label: t("navRoles") },
    { id: "basisregels", label: t("navRules") },
    { id: "pass", label: t("navPass") },
    { id: "jam", label: t("navJam") },
    { id: "video", label: t("navVideo") },
    { id: "quiz", label: t("navQuiz") },
  ];

  const questions: QuizQuestion[] = range(5).map((n) => ({
    q: t(`q${n}`),
    options: range(4).map((a) => t(`q${n}a${a}`)),
    correct: QUIZ_CORRECT[n - 1],
  }));

  return (
    <div className="space-y-2">
      {/* Hero */}
      <section className="pt-4 pb-6 space-y-4">
        <span className="inline-block rounded-full bg-derby-ink px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-white">
          {t("kicker")}
        </span>
        <h1 className="font-display text-5xl sm:text-7xl leading-[0.92]">
          {t("titleLine1")}
          <br />
          <span className="text-derby-accent">{t("titleLine2")}</span>
        </h1>
        <p className="max-w-3xl text-lg text-derby-ink/75">{t("lead")}</p>
        <div className="flex flex-wrap gap-2">
          <a href="#rollen" className={BTN}>
            {t("ctaStart")}
          </a>
          <a href="#jam" className={BTN_SECONDARY}>
            {t("ctaJam")}
          </a>
        </div>
      </section>

      <RulesSectionNav items={navItems} label={tA11y("navLabel")} />

      {/* 01 Rollen */}
      <Section
        id="rollen"
        eyebrow={t("rolesEyebrow")}
        heading={t("rolesHeading")}
        sub={t.rich("rolesSub", rich)}
      >
        <div className="grid gap-4 md:grid-cols-3">
          {ROLES.map(({ key, icon }) => (
            <article
              key={key}
              className={`${CARD} border-t-[6px] border-t-derby-accent`}
            >
              <div className="flex items-center gap-3">
                <div
                  aria-hidden="true"
                  className="grid h-12 w-12 place-items-center rounded-xl bg-derby-accent/10 text-2xl"
                >
                  {icon}
                </div>
                <h3 className="text-xl font-bold">{t(`${key}Label`)}</h3>
              </div>
              <span className="mt-2 inline-block rounded-full bg-derby-ink px-2.5 py-1 text-xs font-black text-white">
                {t(`${key}Count`)}
              </span>
              <p className="mt-3 text-derby-ink/75">
                {t.rich(`${key}Desc`, rich)}
              </p>
              <p className="mt-3 text-sm text-derby-ink/60">
                {t.rich(`${key}Note`, rich)}
              </p>
            </article>
          ))}
        </div>
      </Section>

      {/* 02 Basisregels */}
      <Section
        id="basisregels"
        eyebrow={t("rulesEyebrow")}
        heading={t("rulesHeading")}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <ol className="rounded-2xl bg-derby-ink p-5 text-white">
            {range(4).map((n) => (
              <li
                key={n}
                className="flex gap-3 border-b border-white/15 py-3.5 last:border-b-0"
              >
                <span
                  aria-hidden="true"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-derby-accent font-black"
                >
                  {n}
                </span>
                <div>
                  <p className="font-bold">{t(`rule${n}Title`)}</p>
                  <p className="text-sm text-white/75">{t(`rule${n}Body`)}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className={CARD}>
            <h3 className="text-xl font-bold">{t("tipHeading")}</h3>
            <p className="mt-3 text-derby-ink/75">{t.rich("tipBody", rich)}</p>
            <p className="mt-3 text-sm text-derby-ink/60">{t("tipNote")}</p>
          </div>
        </div>
      </Section>

      {/* 03 Legal pass */}
      <Section id="pass" eyebrow={t("passEyebrow")} heading={t("passHeading")}>
        <div className="rounded-2xl border-2 border-derby-accent/30 bg-gradient-to-r from-derby-accent/10 to-white p-5">
          <h3 className="text-2xl font-bold">{t("passTitle")}</h3>
          <p className="mt-2 text-derby-ink/80">{t.rich("passBody", rich)}</p>
          <div className="mt-4 grid gap-2 md:grid-cols-3">
            {range(3).map((n) => (
              <div
                key={n}
                className="rounded-xl border border-derby-ink/10 bg-white p-3.5"
              >
                <p className="font-bold text-derby-accent-dark">
                  {t(`passStep${n}Title`)}
                </p>
                <p className="mt-1 text-sm text-derby-ink/65">
                  {t(`passStep${n}Body`)}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 rounded-lg border-l-[5px] border-green-600 bg-white px-4 py-3 text-sm">
            {t.rich("passTip", rich)}
          </p>
        </div>
      </Section>

      {/* 04 Lead jammer */}
      <Section id="lead" eyebrow={t("leadEyebrow")} heading={t("leadHeading")}>
        <div className="space-y-3 rounded-2xl bg-derby-ink p-5 text-white">
          <h3 className="text-2xl font-bold">{t("leadTitle")}</h3>
          <p className="text-white/80">{t("leadBody1")}</p>
          <p className="text-white/80">{t.rich("leadBody2", rich)}</p>
          <p className="text-white/80">{t.rich("leadBody3", rich)}</p>
        </div>
      </Section>

      {/* 05 Tactiek */}
      <Section
        id="tactiek"
        eyebrow={t("tacticsEyebrow")}
        heading={t("tacticsHeading")}
      >
        <div className="grid gap-4 md:grid-cols-3">
          {TACTICS.map((key) => (
            <article
              key={key}
              className="rounded-2xl border border-derby-ink/10 bg-white p-5"
            >
              <span className="inline-block rounded-full bg-derby-accent/10 px-2 py-1 text-[11px] font-black uppercase text-derby-accent-dark">
                {t(`${key}Tag`)}
              </span>
              <h3 className="mt-2 text-lg font-bold">{t(`${key}Title`)}</h3>
              <p className="mt-1 text-sm text-derby-ink/65">
                {t(`${key}Body`)}
              </p>
            </article>
          ))}
        </div>
      </Section>

      {/* 06 Een jam in vijf stappen */}
      <Section
        id="jam"
        eyebrow={t("jamEyebrow")}
        heading={t("jamHeading")}
        sub={t("jamSub")}
      >
        <ol className="grid overflow-hidden rounded-2xl border border-derby-ink/10 bg-white md:grid-cols-5">
          {range(5).map((n) => (
            <li
              key={n}
              className="border-b border-derby-ink/10 p-4 last:border-b-0 md:min-h-44 md:border-b-0 md:border-r md:last:border-r-0"
            >
              <p className="text-[11px] font-black uppercase text-derby-accent-dark">
                {t("stepLabel", { n })}
              </p>
              <h3 className="mt-1.5 text-lg font-bold">{t(`step${n}Title`)}</h3>
              <p className="mt-1 text-sm text-derby-ink/65">
                {t(`step${n}Body`)}
              </p>
            </li>
          ))}
        </ol>
        <p className="mt-3 rounded-2xl bg-derby-ink p-4 text-white/85 [&_strong]:text-derby-accent">
          {t.rich("example", rich)}
        </p>
      </Section>

      {/* 07 Begrippen */}
      <Section
        id="begrippen"
        eyebrow={t("glossaryEyebrow")}
        heading={t("glossaryHeading")}
        sub={t("glossarySub")}
      >
        <div className="grid gap-2 md:grid-cols-2 md:items-start">
          {range(10).map((n) => (
            <details
              key={n}
              className="rounded-xl border border-derby-ink/10 bg-white px-3.5 py-3"
            >
              <summary className="cursor-pointer font-bold">
                {t(`term${n}Title`)}
              </summary>
              <p className="mt-2 text-sm text-derby-ink/65">
                {t(`term${n}Body`)}
              </p>
            </details>
          ))}
        </div>
      </Section>

      {/* 08 Video */}
      <Section
        id="video"
        eyebrow={t("videoEyebrow")}
        heading={t("videoHeading")}
        sub={t("videoSub")}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {VIDEO_URLS.map((url, i) => (
            <article
              key={url}
              className="overflow-hidden rounded-2xl border border-derby-ink/10 bg-white shadow"
            >
              <div
                aria-hidden="true"
                className="grid aspect-video place-items-center bg-gradient-to-br from-derby-ink to-derby-accent-dark text-center text-white"
              >
                <div>
                  <div className="text-5xl">▶</div>
                  <div className="font-display text-2xl uppercase">
                    {t("videoPoster", { n: i + 1 })}
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-bold">{t(`video${i + 1}Title`)}</h3>
                <p className="mb-3 mt-1 text-sm text-derby-ink/65">
                  {t(`video${i + 1}Body`)}
                </p>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={BTN}
                >
                  {t("videoButton")}
                </a>
              </div>
            </article>
          ))}
        </div>
      </Section>

      {/* 09 Quiz */}
      <Section id="quiz" eyebrow={t("quizEyebrow")} heading={t("quizHeading")}>
        <RulesQuiz
          questions={questions}
          labels={{
            correct: t("quizCorrect"),
            wrong: t.raw("quizWrong"),
            next: t("quizNext"),
            showResult: t("quizShowResult"),
            done: t("quizDone"),
            final: t.raw("quizFinal"),
            scoreLabel: t("quizScoreLabel"),
            start: t("quizStart"),
            restart: t("quizRestart"),
            perfect: t("quizPerfect"),
            good: t("quizGood"),
            retry: t("quizRetry"),
          }}
        />
      </Section>

      {/* 10 Officiële bron */}
      <section className="py-7">
        <div className="rounded-2xl border border-derby-ink/10 bg-white p-5">
          <p className={EYEBROW}>{t("sourceEyebrow")}</p>
          <h2 className={H2}>{t("sourceHeading")}</h2>
          <p className="max-w-3xl text-derby-ink/65">{t("sourceBody")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={WFTDA_RULES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={BTN}
            >
              {t("sourceRulesLabel")}
            </a>
            <a
              href={CLUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={BTN_SECONDARY}
            >
              {t("sourceClubLabel")}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

const BTN =
  "inline-block rounded-xl bg-derby-accent px-4 py-2.5 font-black text-white no-underline hover:bg-derby-accent-dark";
const BTN_SECONDARY =
  "inline-block rounded-xl border border-derby-ink/15 bg-white px-4 py-2.5 font-black text-derby-ink no-underline hover:bg-derby-bg";
const CARD = "rounded-2xl border border-derby-ink/10 bg-white p-5 shadow";
const EYEBROW =
  "text-[11px] font-black uppercase tracking-widest text-derby-accent-dark";
const H2 = "font-display text-3xl sm:text-4xl leading-none mt-1 mb-2";

function Section({
  id,
  eyebrow,
  heading,
  sub,
  children,
}: {
  id: string;
  eyebrow: string;
  heading: string;
  sub?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="py-7 scroll-mt-[calc(var(--rules-sticky-top,100px)+4rem)]"
    >
      <p className={EYEBROW}>{eyebrow}</p>
      <h2 className={H2}>{heading}</h2>
      {sub && <p className="max-w-3xl text-derby-ink/65">{sub}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}
