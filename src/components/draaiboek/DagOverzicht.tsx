"use client";

import type { DraaiboekState } from "@/lib/draaiboek-types";
import { AREAS } from "@/lib/draaiboek-types";
import { AREA_COLOR, allShifts, hard, m2s, status, teamName } from "./util";
import { Card, btnGhost } from "./ui";

export default function DagOverzicht({
  S,
  org,
  onOpenShift,
}: {
  S: DraaiboekState;
  org: boolean;
  onOpenShift: (id: string) => void;
}) {
  const sh = allShifts(S);
  const need = sh.reduce((a, s) => a + s.need, 0);
  const got = sh.reduce((a, s) => a + Math.min(s.who.length, s.need), 0);
  let clashes = 0;
  sh.forEach((s) =>
    s.who.forEach((id) => {
      const v = S.volunteers.find((x) => x.id === id);
      if (v && hard(status(S, v, s).k)) clashes++;
    }),
  );
  const stats: [string, number, string][] = [
    ["Diensten", sh.length, ""],
    ["Plekken totaal", need, ""],
    ["Nog te vullen", need - got, need - got > 0 ? "bg-derby-accent" : "bg-green-600"],
    ["Vrijwilligers", S.volunteers.length, ""],
    ["Knelpunten", clashes, clashes > 0 ? "bg-derby-accent" : "bg-green-600"],
  ];

  // Timeline bounds, snapped to whole hours.
  let a = 9 * 60;
  let b = 21 * 60;
  sh.forEach((s) => {
    a = Math.min(a, s.start);
    b = Math.max(b, s.end);
  });
  S.games.forEach((g) => {
    a = Math.min(a, g.start);
    b = Math.max(b, g.end);
  });
  a = Math.floor(a / 60) * 60;
  b = Math.ceil(b / 60) * 60;
  const span = b - a;
  const px = Math.max(1, Math.min(2.2, 1050 / span));
  const W = span * px;

  const gaps = sh.filter((s) => s.who.length < s.need).sort((x, y) => x.start - y.start);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
        {stats.map(([l, v, c]) => (
          <div key={l} className={`rounded-xl p-3 text-white ${c || "bg-derby-ink"}`}>
            <b className="block font-display text-3xl leading-none">{String(v).padStart(2, "0")}</b>
            <span className="text-[10px] uppercase tracking-widest text-white/60 font-mono">{l}</span>
          </div>
        ))}
      </div>

      <Card
        title="De hele dag in één balk"
        sub={
          org
            ? "Bovenin de wedstrijden, daaronder de posten. Gearceerd betekent: hier missen nog handen. Klik een blok om mensen in te delen."
            : "Bovenin de wedstrijden, daaronder de posten. Gearceerd betekent: hier missen nog handen. Inschrijven doe je op het tabblad Inschrijven."
        }
      >
        <div className="bg-derby-ink rounded-xl overflow-x-auto">
          {/* ruler */}
          <div className="flex border-b border-white/10">
            <Label>
              <span className="text-white/50 font-mono text-[10px]">TIJD</span>
            </Label>
            <div className="relative h-7 shrink-0" style={{ width: W }}>
              {range(a, b, 30).map((m) => (
                <div key={m}>
                  <div
                    className={`absolute top-0 bottom-0 border-l ${m % 60 === 0 ? "border-white/10" : "border-dotted border-white/5"}`}
                    style={{ left: (m - a) * px }}
                  />
                  {m % 60 === 0 && m < b && (
                    <div className="absolute top-1.5 font-mono text-[11px] text-white/50 translate-x-1" style={{ left: (m - a) * px }}>
                      {m2s(m)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          {/* games */}
          <div className="flex bg-[#1A1A20] border-b-[3px] border-derby-accent">
            <Label dark>
              <i className="w-2 h-2 rounded-sm bg-derby-accent shrink-0" />
              <span className="text-white text-sm font-semibold uppercase leading-tight">Wedstrijden</span>
            </Label>
            <div className="relative h-12 shrink-0" style={{ width: W }}>
              {range(a, b, 60).map((m) => (
                <div key={m} className="absolute top-0 bottom-0 border-l border-white/10" style={{ left: (m - a) * px }} />
              ))}
              {S.games.length === 0 && (
                <div className="absolute inset-0 flex items-center px-3 text-xs text-white/40">
                  {org ? "Nog geen wedstrijden. Teams vul je in via /admin/teams, het speelschema via /admin/schema." : "Het speelschema volgt in oktober."}
                </div>
              )}
              {S.games.map((g) => {
                const lbl = `${short(teamName(S, g.teamAId))} · ${short(teamName(S, g.teamBId))}`;
                return (
                  <div
                    key={g.id}
                    className="absolute top-1.5 bottom-1.5 bg-white text-derby-ink rounded px-1.5 py-1 overflow-hidden"
                    style={{ left: (g.start - a) * px, width: Math.max(22, (g.end - g.start) * px) }}
                    title={`${m2s(g.start)} ${lbl}`}
                  >
                    <em className="not-italic block text-[11px] font-bold uppercase whitespace-nowrap overflow-hidden leading-tight">{lbl}</em>
                    <b className="font-mono text-[10px] font-normal opacity-60">{m2s(g.start)}</b>
                  </div>
                );
              })}
            </div>
          </div>
          {/* tasks */}
          {(Object.keys(AREAS) as (keyof typeof AREAS)[]).map((ar) =>
            S.tasks
              .filter((t) => t.area === ar)
              .map((t) => {
                const col = AREA_COLOR[t.area];
                return (
                  <div key={t.id} className="flex border-b border-white/10 last:border-b-0">
                    <Label>
                      <i className="w-2 h-2 rounded-sm shrink-0" style={{ background: col }} />
                      <span className="text-white text-sm font-semibold uppercase leading-tight">{t.name}</span>
                    </Label>
                    <div className="relative h-[50px] shrink-0" style={{ width: W }}>
                      {range(a, b, 60).map((m) => (
                        <div key={m} className="absolute top-0 bottom-0 border-l border-white/10" style={{ left: (m - a) * px }} />
                      ))}
                      {t.shifts.map((s) => {
                        const g = Math.min(s.who.length, s.need);
                        const pct = Math.round((g / s.need) * 100);
                        const w = Math.max(30, (s.end - s.start) * px);
                        const Tag = org ? "button" : "div";
                        return (
                          <Tag
                            key={s.id}
                            type={org ? "button" : undefined}
                            onClick={org ? () => onOpenShift(s.id) : undefined}
                            className={`absolute top-1.5 bottom-1.5 rounded-md overflow-hidden text-white text-left ${org ? "cursor-pointer" : ""}`}
                            style={{ left: (s.start - a) * px, width: w, background: col }}
                            title={`${t.name} ${m2s(s.start)} tot ${m2s(s.end)} · ${g}/${s.need}`}
                          >
                            <span className="absolute inset-0 bg-black/45">
                              <i className="absolute left-0 top-0 bottom-0" style={{ width: `${pct}%`, background: col }} />
                            </span>
                            {g < s.need && (
                              <span
                                className="absolute top-0 bottom-0 right-0"
                                style={{
                                  width: `${100 - pct}%`,
                                  background:
                                    "repeating-linear-gradient(135deg,rgba(0,0,0,.5) 0 6px,rgba(255,255,255,.16) 6px 12px)",
                                }}
                              />
                            )}
                            <span className="relative flex flex-col justify-between h-full px-1.5 py-1">
                              <em className="not-italic text-[11px] font-semibold uppercase whitespace-nowrap overflow-hidden text-ellipsis">
                                {w > 96 ? t.name : ""}
                              </em>
                              <b className="font-mono text-[11px]">
                                {g}/{s.need}
                              </b>
                            </span>
                          </Tag>
                        );
                      })}
                    </div>
                  </div>
                );
              }),
          )}
        </div>
        <div className="flex flex-wrap gap-4 mt-2 text-[11px] uppercase font-mono text-derby-ink/60">
          <span><i className="inline-block w-3.5 h-2.5 rounded-sm bg-white border border-derby-ink/20 mr-1.5 align-middle" />Wedstrijd</span>
          {(Object.keys(AREAS) as (keyof typeof AREAS)[]).map((k) => (
            <span key={k}>
              <i className="inline-block w-3.5 h-2.5 rounded-sm mr-1.5 align-middle" style={{ background: AREA_COLOR[k] }} />
              {AREAS[k]}
            </span>
          ))}
        </div>
      </Card>

      <Card title="Nog te vullen" sub="Precies wat er nog open staat: hoeveel mensen, en wanneer.">
        {gaps.length === 0 ? (
          <div className="text-center text-derby-ink/60 border border-dashed border-derby-ink/20 rounded-lg py-4 text-sm">Alles bezet.</div>
        ) : (
          gaps.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-2.5 py-2 border-b border-derby-ink/10 last:border-b-0 text-sm">
              <span className="font-mono w-28 shrink-0">{m2s(s.start)} tot {m2s(s.end)}</span>
              <span className="flex-1 font-medium min-w-[130px]">{s.task.name}</span>
              <span className="font-mono text-xs font-bold bg-derby-accent text-white rounded-full px-2.5 py-0.5">
                nog {s.need - s.who.length}
              </span>
              {org && (
                <button type="button" className={btnGhost} onClick={() => onOpenShift(s.id)}>
                  Indelen
                </button>
              )}
            </div>
          ))
        )}
      </Card>
    </>
  );
}

function Label({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div
      className={`sticky left-0 z-10 shrink-0 w-[120px] sm:w-[176px] px-3 py-2 border-r border-white/10 flex items-center gap-2 ${dark ? "bg-[#1A1A20]" : "bg-derby-ink"}`}
    >
      {children}
    </div>
  );
}
// Lane labels share text styling.
const range = (a: number, b: number, step: number) => {
  const out: number[] = [];
  for (let m = a; m <= b; m += step) out.push(m);
  return out;
};
const short = (n: string) => (n || "?").replace(/^Team /, "").slice(0, 14);
