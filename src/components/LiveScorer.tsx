"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { applyOp, type LiveMatch, type LiveScore, type ScoreOp } from "@/lib/live-score";
import { eventTimeFormatter } from "@/lib/time";

const QUEUE_KEY = "derby-live-queue";
const POLL_MS = 5_000;
const RETRY_MS = 3_000;
const SMALL_STEPS = [1, 2, 3, 5];

type Sync = "ok" | "busy" | "offline" | "auth";
type Side = "A" | "B";
type Dialog = { type: "edit" } | { type: "custom"; side: Side } | { type: "finish" } | null;
type Draft<T extends ScoreOp = ScoreOp> = T extends ScoreOp ? Omit<T, "key"> : never;

const SYNC_LABEL: Record<Sync, string> = {
  ok: "✓ Opgeslagen",
  busy: "⏳ Opslaan…",
  offline: "⚠ Offline, wordt bewaard",
  auth: "⚠ Niet ingelogd",
};

function newKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readQueue(): ScoreOp[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as ScoreOp[]) : [];
  } catch {
    return [];
  }
}

export default function LiveScorer({
  matches: initialMatches,
  initialId,
}: {
  matches: LiveMatch[];
  initialId: string | null;
}) {
  const [server, setServer] = useState(initialMatches);
  const [queue, setQueue] = useState<ScoreOp[]>(readQueue);
  const [history, setHistory] = useState<Extract<ScoreOp, { action: "add" }>[]>([]);
  const [selectedId, setSelectedId] = useState(initialId);
  const [sync, setSync] = useState<Sync>("ok");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [retryTick, setRetryTick] = useState(0);
  const sending = useRef(false);
  const version = useRef(0);
  const queueRef = useRef(queue);

  const matches = useMemo(() => server.map((m) => queue.reduce(applyOp, m)), [server, queue]);
  const index = Math.max(0, matches.findIndex((m) => m.id === selectedId));
  const match = matches[index];
  const time = useMemo(() => eventTimeFormatter("nl"), []);

  const merge = useCallback((scores: LiveScore[]) => {
    const byId = new Map(scores.map((s) => [s.id, s]));
    setServer((prev) => prev.map((m) => ({ ...m, ...byId.get(m.id) })));
  }, []);

  useEffect(() => {
    queueRef.current = queue;
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch {
      // Storage unavailable: the queue still lives in memory.
    }
  }, [queue]);

  useEffect(() => {
    const op = queue[0];
    if (!op || sending.current) return;
    sending.current = true;
    setSync("busy");
    const { key, ...payload } = op;
    fetch("/api/admin/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        if (res.status === 401) {
          sending.current = false;
          setSync("auth");
          return;
        }
        if (res.status >= 500) throw new Error(String(res.status));
        const data = (await res.json().catch(() => ({}))) as { match?: LiveScore };
        version.current++;
        if (data.match) merge([data.match]);
        sending.current = false;
        setQueue((q) => q.filter((o) => o.key !== key));
        setSync("ok");
      })
      .catch(() => {
        sending.current = false;
        setSync("offline");
        setTimeout(() => setRetryTick((t) => t + 1), RETRY_MS);
      });
  }, [queue, retryTick, merge]);

  useEffect(() => {
    const poll = async () => {
      if (queueRef.current.length > 0 || sending.current || document.visibilityState !== "visible") return;
      const seen = version.current;
      try {
        const res = await fetch("/api/admin/score", { cache: "no-store" });
        if (res.status === 401) return setSync("auth");
        const data = (await res.json()) as { matches?: LiveScore[] };
        if (data.matches && seen === version.current && queueRef.current.length === 0) merge(data.matches);
      } catch {
        // Next poll will try again.
      }
    };
    const id = setInterval(poll, POLL_MS);
    document.addEventListener("visibilitychange", poll);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [merge]);

  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    const request = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        lock = (await navigator.wakeLock?.request("screen")) ?? null;
      } catch {
        // Not supported or denied: the screen may dim as usual.
      }
    };
    request();
    document.addEventListener("visibilitychange", request);
    return () => {
      document.removeEventListener("visibilitychange", request);
      lock?.release().catch(() => undefined);
    };
  }, []);

  const enqueue = (...drafts: Draft[]) => {
    const ops = drafts.map((d) => ({ ...d, key: newKey() }) as ScoreOp);
    setQueue((q) => [...q, ...ops]);
    return ops;
  };

  const add = (side: Side, delta: number) => {
    if (!match || !Number.isInteger(delta) || delta === 0) return;
    navigator.vibrate?.(15);
    const drafts: Draft[] = [];
    if (match.status === "scheduled") drafts.push({ matchId: match.id, action: "status", status: "live" });
    drafts.push({ matchId: match.id, action: "add", side, delta });
    const ops = enqueue(...drafts);
    setHistory((h) => [...h, ops[ops.length - 1] as Extract<ScoreOp, { action: "add" }>]);
  };

  const lastOwn = [...history].reverse().find((op) => op.matchId === match?.id);

  const undo = () => {
    if (!lastOwn) return;
    navigator.vibrate?.(15);
    setHistory((h) => h.filter((op) => op.key !== lastOwn.key));
    enqueue({ matchId: lastOwn.matchId, action: "add", side: lastOwn.side, delta: -lastOwn.delta });
  };

  const setStatus = (status: string, notify = false) => {
    if (!match) return;
    enqueue({ matchId: match.id, action: "status", status, notify });
  };

  const finish = (notify: boolean) => {
    setStatus("finished", notify);
    setDialog(null);
    const next = matches.slice(index + 1).find((m) => m.status !== "finished");
    if (next) setSelectedId(next.id);
  };

  if (!match) {
    return (
      <div className="fixed inset-0 z-50 bg-derby-bg p-6">
        <p>Er staan nog geen wedstrijden in het schema.</p>
        <Link href="/admin/schema" className="underline">
          Naar Schema
        </Link>
      </div>
    );
  }

  const names: Record<Side, string> = { A: match.teamA, B: match.teamB };

  return (
    <div className="fixed inset-0 z-50 bg-derby-bg overflow-y-auto select-none touch-manipulation">
      <div className="mx-auto flex min-h-full max-w-xl flex-col gap-3 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between text-sm">
          <Link href="/admin/schema" className="font-bold underline">
            ← Admin
          </Link>
          <span
            role="status"
            className={sync === "offline" || sync === "auth" ? "font-bold text-derby-accent" : "text-derby-ink/60"}
          >
            {SYNC_LABEL[sync]}
            {queue.length > 1 && ` (${queue.length})`}
          </span>
        </div>
        {sync === "auth" && (
          <p className="rounded-lg bg-white p-3 text-sm shadow">
            Je bent uitgelogd. Je invoer is bewaard op dit toestel.{" "}
            <Link href="/admin/login" className="font-bold underline">
              Log opnieuw in
            </Link>{" "}
            en open daarna deze pagina weer.
          </p>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedId(matches[index - 1]?.id ?? match.id)}
            disabled={index === 0}
            aria-label="Vorige wedstrijd"
            className="h-12 w-12 shrink-0 rounded-full bg-white text-2xl shadow disabled:opacity-30"
          >
            ‹
          </button>
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate font-bold">
              {time.format(new Date(match.startsAt))}
              {match.poule && ` · ${match.poule}`}
            </p>
            <p className="text-xs uppercase tracking-wider">
              {match.status === "live" ? (
                <span className="font-bold text-derby-accent">● Live</span>
              ) : match.status === "finished" ? (
                <span className="text-derby-ink/60">Afgelopen</span>
              ) : (
                <span className="text-derby-ink/60">Nog niet begonnen</span>
              )}
              <span className="text-derby-ink/40">
                {" "}
                · {index + 1}/{matches.length}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedId(matches[index + 1]?.id ?? match.id)}
            disabled={index === matches.length - 1}
            aria-label="Volgende wedstrijd"
            className="h-12 w-12 shrink-0 rounded-full bg-white text-2xl shadow disabled:opacity-30"
          >
            ›
          </button>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-3">
          {(["A", "B"] as const).map((side) => {
            const score = side === "A" ? match.scoreA : match.scoreB;
            const tone =
              side === "A"
                ? "bg-derby-ink text-white active:bg-derby-ink/70"
                : "bg-derby-accent text-white active:bg-derby-accent-dark";
            return (
              <section key={side} aria-label={names[side]} className="flex flex-col gap-2">
                <h2 className="line-clamp-2 min-h-[2.5em] text-center font-display text-xl leading-tight">
                  {names[side]}
                </h2>
                <button
                  type="button"
                  onClick={() => setDialog({ type: "edit" })}
                  aria-label={`Score ${names[side]}: ${score ?? 0}. Tik om aan te passen`}
                  className="rounded-2xl bg-white py-2 font-display text-7xl tabular-nums shadow"
                >
                  {score ?? 0}
                </button>
                <button
                  type="button"
                  onClick={() => add(side, 4)}
                  className={`h-24 rounded-2xl font-display text-5xl shadow ${tone}`}
                >
                  +4
                </button>
                <div className="grid grid-cols-2 gap-2">
                  {SMALL_STEPS.map((step) => (
                    <button
                      key={step}
                      type="button"
                      onClick={() => add(side, step)}
                      className={`h-14 rounded-xl font-display text-2xl shadow ${tone}`}
                    >
                      +{step}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setDialog({ type: "custom", side })}
                    className="h-12 rounded-xl border-2 border-derby-ink/20 bg-white font-bold"
                  >
                    + …
                  </button>
                  <button
                    type="button"
                    onClick={() => add(side, -1)}
                    disabled={!score}
                    className="h-12 rounded-xl border-2 border-derby-ink/20 bg-white font-bold disabled:opacity-30"
                  >
                    −1
                  </button>
                </div>
              </section>
            );
          })}
        </div>

        <button
          type="button"
          onClick={undo}
          disabled={!lastOwn}
          className="h-12 rounded-xl bg-white font-bold shadow disabled:opacity-40"
        >
          ↶ Ongedaan maken{lastOwn && `: ${names[lastOwn.side]} ${lastOwn.delta > 0 ? "+" : ""}${lastOwn.delta}`}
        </button>
        {match.status === "scheduled" && (
          <button
            type="button"
            onClick={() => setStatus("live")}
            className="h-14 rounded-xl bg-derby-ink font-bold text-white shadow"
          >
            Start wedstrijd
          </button>
        )}
        {match.status === "live" && (
          <button
            type="button"
            onClick={() => setDialog({ type: "finish" })}
            className="h-14 rounded-xl border-2 border-derby-ink bg-white font-bold shadow"
          >
            Einde wedstrijd
          </button>
        )}
        {match.status === "finished" && (
          <button
            type="button"
            onClick={() => setStatus("live")}
            className="h-12 rounded-xl border-2 border-derby-ink/20 bg-white font-bold"
          >
            Wedstrijd heropenen
          </button>
        )}
      </div>

      {dialog && (
        <div
          className="fixed inset-0 z-10 flex items-end justify-center bg-black/50 p-3 sm:items-center"
          onClick={(e) => e.target === e.currentTarget && setDialog(null)}
        >
          <div role="dialog" aria-modal="true" className="w-full max-w-md space-y-4 rounded-2xl bg-white p-5 shadow-xl">
            {dialog.type === "custom" && (
              <CustomPoints
                team={names[dialog.side]}
                onCancel={() => setDialog(null)}
                onSubmit={(n) => {
                  add(dialog.side, n);
                  setDialog(null);
                }}
              />
            )}
            {dialog.type === "edit" && (
              <EditScores
                match={match}
                onCancel={() => setDialog(null)}
                onSubmit={(scoreA, scoreB) => {
                  setHistory((h) => h.filter((op) => op.matchId !== match.id));
                  enqueue({ matchId: match.id, action: "set", scoreA, scoreB });
                  setDialog(null);
                }}
              />
            )}
            {dialog.type === "finish" && (
              <>
                <h2 className="font-display text-2xl">Wedstrijd afsluiten?</h2>
                <p className="text-lg">
                  {match.teamA} <strong>{match.scoreA ?? 0}-{match.scoreB ?? 0}</strong> {match.teamB}
                </p>
                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={() => finish(true)}
                    className="h-12 rounded-xl bg-derby-accent font-bold text-white"
                  >
                    Afsluiten en eindstand pushen
                  </button>
                  <button
                    type="button"
                    onClick={() => finish(false)}
                    className="h-12 rounded-xl bg-derby-ink font-bold text-white"
                  >
                    Afsluiten zonder pushmelding
                  </button>
                  <button
                    type="button"
                    onClick={() => setDialog(null)}
                    className="h-12 rounded-xl border-2 border-derby-ink/20 font-bold"
                  >
                    Annuleren
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const field = "w-full rounded-xl border-2 border-derby-ink/20 px-3 py-3 text-center font-display text-4xl";

function CustomPoints({
  team,
  onSubmit,
  onCancel,
}: {
  team: string;
  onSubmit: (points: number) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState("");
  const points = Number(value);
  const valid = value !== "" && Number.isInteger(points) && points > 0 && points <= 50;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSubmit(points);
      }}
      className="space-y-4"
    >
      <label className="block space-y-2">
        <span className="block font-display text-2xl">Punten voor {team}</span>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={50}
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={field}
        />
      </label>
      <DialogButtons valid={valid} onCancel={onCancel} label="Toevoegen" />
    </form>
  );
}

function EditScores({
  match,
  onSubmit,
  onCancel,
}: {
  match: LiveMatch;
  onSubmit: (scoreA: number, scoreB: number) => void;
  onCancel: () => void;
}) {
  const [a, setA] = useState(String(match.scoreA ?? 0));
  const [b, setB] = useState(String(match.scoreB ?? 0));
  const ok = (v: string) => v !== "" && Number.isInteger(Number(v)) && Number(v) >= 0 && Number(v) <= 999;
  const valid = ok(a) && ok(b);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSubmit(Number(a), Number(b));
      }}
      className="space-y-4"
    >
      <h2 className="font-display text-2xl">Score aanpassen</h2>
      <div className="grid grid-cols-2 gap-3">
        {[
          { team: match.teamA, value: a, set: setA },
          { team: match.teamB, value: b, set: setB },
        ].map(({ team, value, set }) => (
          <label key={team} className="block space-y-1">
            <span className="line-clamp-2 block text-sm font-bold">{team}</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={999}
              value={value}
              onChange={(e) => set(e.target.value)}
              onFocus={(e) => e.target.select()}
              className={field}
            />
          </label>
        ))}
      </div>
      <DialogButtons valid={valid} onCancel={onCancel} label="Opslaan" />
    </form>
  );
}

function DialogButtons({ valid, onCancel, label }: { valid: boolean; onCancel: () => void; label: string }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <button type="button" onClick={onCancel} className="h-12 rounded-xl border-2 border-derby-ink/20 font-bold">
        Annuleren
      </button>
      <button type="submit" disabled={!valid} className="h-12 rounded-xl bg-derby-ink font-bold text-white disabled:opacity-40">
        {label}
      </button>
    </div>
  );
}
