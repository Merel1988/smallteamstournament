"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { randomNickname } from "@/lib/nicknames";

export default function NicknameGenerator() {
  const t = useTranslations("Nickname");
  const [name, setName] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  function roll() {
    const n = randomNickname();
    setName(n);
    setHistory((h) => [n, ...h].slice(0, 6));
  }

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={roll}
        className="w-full bg-derby-ink text-derby-yellow rounded-2xl py-10 font-display text-4xl sm:text-5xl shadow-lg hover:bg-derby-accent transition"
      >
        {name ?? t("clickMe")}
      </button>
      <button
        type="button"
        onClick={roll}
        className="block mx-auto bg-derby-accent text-white rounded-full px-5 py-2 font-bold"
      >
        {t("again")}
      </button>

      {history.length > 0 && (
        <div className="pt-4">
          <p className="text-xs uppercase tracking-wider text-derby-ink/60 mb-2">
            {t("previousRolls")}
          </p>
          <ul className="space-y-1 text-sm text-derby-ink/70">
            {history.slice(1).map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
