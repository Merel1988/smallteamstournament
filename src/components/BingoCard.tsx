"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

type Prompt = { id: string; text: string };
type CardState = { promptIds: (string | null)[]; checked: boolean[] };

const STORAGE_KEY = "derby-bingo-v1";
const FREE_INDEX = 12;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildCard(prompts: Prompt[]): CardState {
  const picks = shuffle(prompts).slice(0, 24);
  const ids: (string | null)[] = [];
  const checked: boolean[] = [];
  for (let i = 0; i < 25; i++) {
    if (i === FREE_INDEX) {
      ids.push(null);
      checked.push(true);
    } else {
      ids.push(picks.shift()?.id ?? null);
      checked.push(false);
    }
  }
  return { promptIds: ids, checked };
}

function hasBingo(checked: boolean[]): boolean {
  const lines: number[][] = [];
  for (let r = 0; r < 5; r++) lines.push([0, 1, 2, 3, 4].map((c) => r * 5 + c));
  for (let c = 0; c < 5; c++) lines.push([0, 1, 2, 3, 4].map((r) => r * 5 + c));
  lines.push([0, 6, 12, 18, 24]);
  lines.push([4, 8, 12, 16, 20]);
  return lines.some((line) => line.every((i) => checked[i]));
}

export default function BingoCard({ prompts }: { prompts: Prompt[] }) {
  const t = useTranslations("Bingo");
  const byId = useMemo(
    () => Object.fromEntries(prompts.map((p) => [p.id, p.text])),
    [prompts],
  );
  const [card, setCard] = useState<CardState | null>(null);
  const bingo = card ? hasBingo(card.checked) : false;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CardState;
        if (
          parsed?.promptIds?.length === 25 &&
          parsed?.checked?.length === 25 &&
          parsed.promptIds.every((id) => id === null || byId[id])
        ) {
          setCard(parsed);
          return;
        }
      }
    } catch {}
    if (prompts.length >= 24) setCard(buildCard(prompts));
  }, [prompts, byId]);

  useEffect(() => {
    if (card) localStorage.setItem(STORAGE_KEY, JSON.stringify(card));
  }, [card]);

  if (prompts.length < 24) {
    return <p className="text-derby-ink/60">{t("notEnough")}</p>;
  }

  if (!card) return <p>{t("loading")}</p>;

  function toggle(i: number) {
    if (i === FREE_INDEX || !card) return;
    const next = { ...card, checked: [...card.checked] };
    next.checked[i] = !next.checked[i];
    setCard(next);
  }

  function newCard() {
    setCard(buildCard(prompts));
  }

  return (
    <div className="space-y-4">
      {bingo && (
        <div className="bingo-banner bg-derby-accent text-white font-display text-5xl text-center rounded-2xl py-6 shadow-xl">
          {t("celebration")}
        </div>
      )}

      <div className="grid grid-cols-5 gap-1.5 sm:gap-2 aspect-square">
        {card.promptIds.map((id, i) => {
          const isFree = i === FREE_INDEX;
          const checked = card.checked[i];
          const text = isFree ? t("free") : id ? byId[id] : "";
          return (
            <button
              key={i}
              type="button"
              onClick={() => toggle(i)}
              disabled={isFree}
              className={`rounded-md text-[10px] sm:text-xs p-1 sm:p-2 leading-tight text-center flex items-center justify-center transition shadow-sm ${
                checked
                  ? "bg-derby-accent text-white"
                  : "bg-white hover:bg-derby-yellow/60 text-derby-ink"
              } ${isFree ? "font-display text-lg sm:text-2xl" : ""}`}
            >
              {text}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2 justify-center">
        <button
          type="button"
          onClick={newCard}
          className="bg-derby-ink text-derby-yellow rounded-full px-5 py-2 font-bold"
        >
          {t("newCard")}
        </button>
      </div>
    </div>
  );
}
