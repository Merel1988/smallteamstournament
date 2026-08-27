"use client";

import { useEffect, useState } from "react";
import type { DraaiboekState } from "@/lib/draaiboek-types";
import type { Api } from "./Draaiboek";
import { hours, m2s, s2m, status, volMinutes } from "./util";
import { Pill, btnGhost, input, label } from "./ui";

export default function ShiftDrawer({ S, shiftId, api, onClose }: { S: DraaiboekState; shiftId: string; api: Api; onClose: () => void }) {
  const found = S.tasks.flatMap((t) => t.shifts.map((s) => ({ t, s }))).find((x) => x.s.id === shiftId);
  const [from, setFrom] = useState(found ? m2s(found.s.start) : "");
  const [to, setTo] = useState(found ? m2s(found.s.end) : "");
  const [need, setNeed] = useState(found ? String(found.s.need) : "1");

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [onClose]);

  if (!found) return null;
  const { t, s } = found;
  const save = () => api("updateShift", { id: s.id, start: s2m(from), end: s2m(to), need: Number(need) });
  const rank = (v: DraaiboekState["volunteers"][number]) => {
    const on = s.who.includes(v.id);
    const k = status(S, v, s).k;
    return (on ? 0 : 10) + (k === "free" ? 0 : k === "soft" ? 1 : 2);
  };
  const list = [...S.volunteers].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));

  return (
    <>
      <div className="fixed inset-0 bg-derby-ink/60 z-40" onClick={onClose} />
      <aside className="fixed top-0 right-0 bottom-0 w-full max-w-[440px] bg-white z-50 flex flex-col shadow-2xl" role="dialog" aria-label={t.name}>
        <div className="bg-derby-ink text-white p-4 border-b-4 border-derby-accent flex justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl leading-tight">{t.name}</h2>
            <div className="font-mono text-sm text-derby-accent">{m2s(s.start)} tot {m2s(s.end)}</div>
          </div>
          <button type="button" className="text-white/60 hover:text-white text-2xl px-2" onClick={onClose} aria-label="Sluiten">×</button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div>
              <label className={label}>Nodig</label>
              <input type="number" min={1} max={30} className={input} value={need} onChange={(e) => setNeed(e.target.value)} onBlur={save} />
            </div>
            <div>
              <label className={label}>Van</label>
              <input type="time" step={900} className={input} value={from} onChange={(e) => setFrom(e.target.value)} onBlur={save} />
            </div>
            <div>
              <label className={label}>Tot</label>
              <input type="time" step={900} className={input} value={to} onChange={(e) => setTo(e.target.value)} onBlur={save} />
            </div>
          </div>
          <p className="text-sm text-derby-ink/60 mb-2">
            <b className="font-mono text-derby-ink">{s.who.length}/{s.need}</b> ingedeeld. Klik een naam aan of uit.
          </p>
          {list.length === 0 && (
            <div className="text-center text-derby-ink/60 border border-dashed border-derby-ink/20 rounded-lg py-4 text-sm">Voeg eerst vrijwilligers toe.</div>
          )}
          {list.map((v) => {
            const on = s.who.includes(v.id);
            const st = status(S, v, s);
            const tone = st.k === "free" ? "ok" : st.k === "soft" ? "soft" : "bad";
            return (
              <button
                key={v.id}
                type="button"
                className={`flex flex-wrap items-center gap-2 w-full text-left border rounded-lg px-3 py-2 mb-1.5 ${on ? "bg-green-50 border-green-600" : "border-derby-ink/15 hover:border-derby-ink/40"}`}
                onClick={() => api(on ? "unsign" : "signup", { shiftId: s.id, volunteerId: v.id })}
              >
                <span className="font-mono font-bold text-green-700 w-4">{on ? "✓" : ""}</span>
                <span className="flex-1 font-medium min-w-[80px]">{v.name}</span>
                <Pill tone={on ? "ok" : tone}>{st.t}</Pill>
                <Pill>{hours(volMinutes(S, v.id))}u</Pill>
              </button>
            );
          })}
          <button
            type="button"
            className={`${btnGhost} mt-5`}
            onClick={() => {
              if (confirm("Deze dienst verwijderen?")) api("deleteShift", { id: s.id }).then(onClose);
            }}
          >
            Dienst verwijderen
          </button>
        </div>
      </aside>
    </>
  );
}
