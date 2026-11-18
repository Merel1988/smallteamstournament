import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { assertPageVisible } from "@/lib/page-visibility";
import { Link } from "@/i18n/navigation";
import { Quiz, type QuizQuestion } from "@/components/Quiz";

export const dynamic = "force-dynamic";

// Questions live in Quiz.questions.q{n}; answer a1 is always the right one (shuffled on screen).
const QUESTION_COUNT = 30;
const ROUND_SIZE = 10;

const range = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ locale, page: "quiz", path: "quiz" });
}

export default async function QuizPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await assertPageVisible("quiz");
  setRequestLocale(locale);
  const t = await getTranslations("Quiz");

  const questions: QuizQuestion[] = range(QUESTION_COUNT).map((n) => ({
    q: t(`questions.q${n}.q`),
    options: range(4).map((a) => t(`questions.q${n}.a${a}`)),
    correct: 0,
    explain: t(`questions.q${n}.explain`),
  }));

  return (
    <div className="space-y-8">
      <header className="space-y-3 max-w-2xl">
        <h1 className="font-display text-5xl">{t("title")}</h1>
        <p className="text-lg text-derby-ink/80">
          {t("lead", { count: ROUND_SIZE, total: QUESTION_COUNT })}
        </p>
      </header>

      <Quiz
        questions={questions}
        roundSize={ROUND_SIZE}
        storageKey="derby-quiz-best"
        labels={{
          correct: t("correct"),
          wrong: t.raw("wrong"),
          next: t("next"),
          showResult: t("showResult"),
          done: t("done"),
          final: t.raw("final"),
          scoreLabel: t("scoreLabel"),
          start: t("start"),
          startButton: t("startButton"),
          restart: t("restart"),
          perfect: t("perfect"),
          good: t("good"),
          retry: t("retry"),
          best: t.raw("best"),
        }}
      />

      <p className="text-derby-ink/70">
        {t("rulesHint")}{" "}
        <Link href="/regels" className="font-bold underline underline-offset-2">
          {t("rulesLink")}
        </Link>
      </p>
    </div>
  );
}
