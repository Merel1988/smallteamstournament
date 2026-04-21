"use client";

import { useState } from "react";

type Player = {
  id: string;
  name: string;
  derbyName: string | null;
  number: string;
  teamName: string;
};

export default function MvpVoter({
  matchId,
  players,
}: {
  matchId: string;
  players: Player[];
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/mvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, playerId: selected }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Er ging iets mis.");
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <p className="bg-derby-yellow rounded-xl p-4 font-display text-xl text-center">
        Bedankt voor je stem! 🎉
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
        {players.map((p) => (
          <li key={p.id}>
            <label
              className={`block rounded-lg px-3 py-2 cursor-pointer border ${
                selected === p.id
                  ? "border-derby-accent bg-derby-accent/10"
                  : "border-transparent bg-white"
              }`}
            >
              <input
                type="radio"
                name="mvp"
                className="sr-only"
                checked={selected === p.id}
                onChange={() => setSelected(p.id)}
              />
              <span className="font-display text-lg">
                #{p.number} {p.derbyName || p.name}
              </span>
              <span className="block text-xs text-derby-ink/60">
                {p.teamName}
              </span>
            </label>
          </li>
        ))}
      </ul>

      {error && <p className="text-sm text-derby-accent">{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={!selected || busy}
        className="w-full bg-derby-ink text-derby-yellow rounded-full py-3 font-bold disabled:opacity-40"
      >
        {busy ? "Bezig…" : "Stem uitbrengen"}
      </button>
    </div>
  );
}
