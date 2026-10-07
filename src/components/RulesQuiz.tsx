"use client";

import { useState } from "react";

export type QuizQuestion = { q: string; options: string[]; correct: number };

type Labels = {
  correct: string;
  /** Contains "{answer}". */
  wrong: string;
  next: string;
  showResult: string;
  done: string;
  /** Contains "{score}" and "{total}". */
  final: string;
  scoreLabel: string;
  start: string;
  restart: string;
  perfect: string;
  good: string;
  retry: string;
};

/** Five-question mini quiz on /regels. Nothing is stored; a reload starts over. */
export function RulesQuiz({
  questions,
  labels,
}: {
  questions: QuizQuestion[];
  labels: Labels;
}) {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);

  const total = questions.length;
  const current = questions[index];
  const answered = picked !== null;
  const progress = ((answered || finished ? index + 1 : index) / total) * 100;

  function answer(i: number) {
    if (answered) return;
    setPicked(i);
    if (i === current.correct) setScore((s) => s + 1);
  }

  function next() {
    if (index < total - 1) {
      setIndex(index + 1);
      setPicked(null);
    } else {
      setFinished(true);
    }
  }

  function restart() {
    setIndex(0);
    setScore(0);
    setPicked(null);
    setFinished(false);
  }

  const verdict = !finished
    ? labels.start
    : score === total
      ? labels.perfect
      : score >= 3
        ? labels.good
        : labels.retry;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_0.65fr]">
      <div className="rounded-2xl bg-derby-ink p-5 text-white">
        <div className="mb-5 h-2 overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full bg-derby-accent transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        {finished ? (
          <>
            <p className="mb-3 text-xl font-bold">{labels.done}</p>
            <p role="status" className="font-bold">
              {labels.final
                .replace("{score}", String(score))
                .replace("{total}", String(total))}
            </p>
          </>
        ) : (
          <>
            <p className="mb-4 text-xl font-bold leading-tight">
              {index + 1}. {current.q}
            </p>
            <div className="grid gap-2">
              {current.options.map((opt, i) => {
                const isCorrect = answered && i === current.correct;
                const isWrong = answered && i === picked && i !== current.correct;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => answer(i)}
                    disabled={answered}
                    className={`rounded-xl border px-4 py-3 text-left transition ${
                      isCorrect
                        ? "border-green-400 bg-green-800"
                        : isWrong
                          ? "border-derby-accent bg-derby-accent-dark"
                          : "border-white/20 bg-white/5 enabled:hover:bg-white/10"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            <p role="status" className="my-3 min-h-6 font-bold">
              {answered &&
                (picked === current.correct
                  ? labels.correct
                  : labels.wrong.replace(
                      "{answer}",
                      current.options[current.correct],
                    ))}
            </p>
            {answered && (
              <button
                type="button"
                onClick={next}
                className="rounded-xl bg-derby-accent px-4 py-2.5 font-bold text-white hover:bg-derby-accent-dark"
              >
                {index === total - 1 ? labels.showResult : labels.next}
              </button>
            )}
          </>
        )}
      </div>
      <div className="flex flex-col justify-center rounded-2xl border border-derby-ink/10 bg-white p-5 shadow">
        <p className="text-xs font-bold uppercase tracking-widest text-derby-accent-dark">
          {labels.scoreLabel}
        </p>
        <p className="font-display text-5xl text-derby-accent-dark">
          {score} / {total}
        </p>
        <p className="my-2 text-derby-ink/75">{verdict}</p>
        <button
          type="button"
          onClick={restart}
          className="self-start rounded-xl border border-derby-ink/15 bg-white px-4 py-2.5 font-bold hover:bg-derby-bg"
        >
          {labels.restart}
        </button>
      </div>
    </div>
  );
}
