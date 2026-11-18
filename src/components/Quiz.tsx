"use client";

import { useState } from "react";

export type QuizQuestion = {
  q: string;
  options: string[];
  correct: number;
  explain?: string;
};

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
  /** Only used with `roundSize`. */
  startButton?: string;
  /** Contains "{score}" and "{total}". Only used with `storageKey`. */
  best?: string;
};

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function drawRound(pool: QuizQuestion[], size: number): QuizQuestion[] {
  return shuffled(pool)
    .slice(0, size)
    .map((question) => {
      const order = shuffled(question.options.map((_, i) => i));
      return {
        ...question,
        options: order.map((i) => question.options[i]),
        correct: order.indexOf(question.correct),
      };
    });
}

/**
 * Multiple-choice quiz. Without `roundSize` it plays all questions in order and
 * starts immediately. With `roundSize` it shows a start screen and draws a
 * random round with shuffled answers on each start.
 */
export function Quiz({
  questions,
  labels,
  roundSize,
  storageKey,
}: {
  questions: QuizQuestion[];
  labels: Labels;
  roundSize?: number;
  storageKey?: string;
}) {
  const randomRounds = roundSize !== undefined;
  const [deck, setDeck] = useState<QuizQuestion[] | null>(
    randomRounds ? null : questions,
  );
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [best, setBest] = useState<number | null>(null);

  const total = deck?.length ?? Math.min(roundSize ?? 0, questions.length);
  const current = deck?.[index];
  const answered = picked !== null;
  const progress = deck
    ? ((answered || finished ? index + 1 : index) / total) * 100
    : 0;

  function answer(i: number) {
    if (answered || !current) return;
    setPicked(i);
    if (i === current.correct) setScore((s) => s + 1);
  }

  function next() {
    if (index < total - 1) {
      setIndex(index + 1);
      setPicked(null);
      return;
    }
    setFinished(true);
    if (storageKey && score > (best ?? 0)) {
      setBest(score);
      try {
        localStorage.setItem(storageKey, String(score));
      } catch {}
    }
  }

  function readBest() {
    if (!storageKey) return null;
    try {
      const stored = Number(localStorage.getItem(storageKey));
      return stored > 0 ? stored : null;
    } catch {
      return null;
    }
  }

  function restart() {
    if (best === null) setBest(readBest());
    setDeck(randomRounds ? drawRound(questions, roundSize ?? questions.length) : questions);
    setIndex(0);
    setScore(0);
    setPicked(null);
    setFinished(false);
  }

  const verdict = !finished
    ? index === 0 && !answered
      ? labels.start
      : ""
    : score === total
      ? labels.perfect
      : score >= Math.ceil(total * 0.6)
        ? labels.good
        : labels.retry;

  const fill = (text: string, value: number) =>
    text.replace("{score}", String(value)).replace("{total}", String(total));

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_0.65fr]">
      <div className="rounded-2xl bg-derby-ink p-5 text-white">
        <div className="mb-5 h-2 overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full bg-derby-accent transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        {!deck || !current ? (
          <div className="space-y-4">
            <p className="text-xl font-bold leading-tight">{labels.start}</p>
            <button
              type="button"
              onClick={restart}
              className="rounded-xl bg-derby-accent px-4 py-2.5 font-bold text-white hover:bg-derby-accent-dark"
            >
              {labels.startButton}
            </button>
          </div>
        ) : finished ? (
          <>
            <p className="mb-3 text-xl font-bold">{labels.done}</p>
            <p role="status" className="font-bold">
              {fill(labels.final, score)}
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
            <div role="status" className="my-3 min-h-6 space-y-1">
              {answered && (
                <>
                  <p className="font-bold">
                    {picked === current.correct
                      ? labels.correct
                      : labels.wrong.replace(
                          "{answer}",
                          current.options[current.correct],
                        )}
                  </p>
                  {current.explain && (
                    <p className="text-white/80">{current.explain}</p>
                  )}
                </>
              )}
            </div>
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
        {best !== null && labels.best && (
          <p className="mb-2 text-sm font-bold text-derby-ink/60">
            {fill(labels.best, best)}
          </p>
        )}
        {deck && (
          <button
            type="button"
            onClick={restart}
            className="self-start rounded-xl border border-derby-ink/15 bg-white px-4 py-2.5 font-bold hover:bg-derby-bg"
          >
            {labels.restart}
          </button>
        )}
      </div>
    </div>
  );
}
