"use client";

import { useState } from "react";
import type { DraaiboekState } from "@/lib/draaiboek-types";
import { AREAS } from "@/lib/draaiboek-types";
import type { Api } from "./Draaiboek";
import { AREA_COLOR, m2s, s2m } from "./util";
import { Card, Pill, btnGhost, btnRed, input, label } from "./ui";

export default function DraaiboekDag({ S, api, onOpenShift }: { S: DraaiboekState; api: Api; onOpenShift: (id: string) => void }) {
  const [name, setName] = useState("");
  const [area, setArea] = useState("zaal");
  const [from, setFrom] = useState("12:00");
  const [to, setTo] = useState("18:00");
  const [need, setNeed] = useState("2");
  const [split, setSplit] = useState("120");
  const nameOf = (id: string) => S.volunteers.find((v) => v.id === id)?.name ?? "?";

  const add = async () => {
    const r = await api("addTask", { name, area, from: s2m(from), to: s2m(to), need: Number(need), split: Number(split) });
    if (r.ok) setName("");
  };

  return (
    <>
      <Card title="Post toevoegen">
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 items-end">
          <div className="col-span-2">
            <label className={label} htmlFor="tName">Post</label>
            <input id="tName" className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Bijv. penalty box" />
          </div>
          <div>
            <label className={label} htmlFor="tArea">Onderdeel</label>
            <select id="tArea" className={input} value={area} onChange={(e) => setArea(e.target.value)}>
              {Object.entries(AREAS).map(([k, l]) => (
                <option key={k} value={k}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="tFrom">Van</label>
            <input id="tFrom" type="time" step={900} className={input} value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className={label} htmlFor="tTo">Tot</label>
            <input id="tTo" type="time" step={900} className={input} value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div>
            <label className={label} htmlFor="tNeed">Mensen</label>
            <input id="tNeed" type="number" min={1} max={30} className={input} value={need} onChange={(e) => setNeed(e.target.value)} />
          </div>
          <div>
            <label className={label} htmlFor="tSplit">Verdeling</label>
            <select id="tSplit" className={input} value={split} onChange={(e) => setSplit(e.target.value)}>
              <option value="0">één blok</option>
              <option value="120">blokken van 2 uur</option>
              <option value="180">blokken van 3 uur</option>
            </select>
          </div>
          <button type="button" className={btnRed} disabled={!name.trim()} onClick={add}>Toevoegen</button>
        </div>
      </Card>

      {(Object.keys(AREAS) as (keyof typeof AREAS)[]).map((k) => {
        const list = S.tasks.filter((t) => t.area === k).sort((a, b) => (a.shifts[0]?.start ?? 9999) - (b.shifts[0]?.start ?? 9999));
        if (!list.length) return null;
        return (
          <div key={k}>
            <div className="flex items-center gap-3 mt-6 mb-2">
              <h3 className="font-display text-2xl">{AREAS[k]}</h3>
              <i className="h-1 flex-1 rounded" style={{ background: AREA_COLOR[k] }} />
            </div>
            <Card>
              {list.map((t) => (
                <div key={t.id} className="border border-derby-ink/10 rounded-xl p-3 mb-2.5 last:mb-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-xl flex-1 min-w-[150px]">{t.name}</span>
                    <Pill>{t.shifts.length} dienst{t.shifts.length === 1 ? "" : "en"}</Pill>
                    <button type="button" className={btnGhost} onClick={() => api("addShift", { taskId: t.id })}>+ dienst</button>
                    <button
                      type="button"
                      className="px-2 text-derby-ink/50 hover:text-derby-accent text-lg"
                      aria-label="Post verwijderen"
                      onClick={() => confirm("Deze post en alle diensten verwijderen?") && api("deleteTask", { id: t.id })}
                    >
                      ×
                    </button>
                  </div>
                  {t.shifts.map((s) => (
                    <div key={s.id} className="flex flex-wrap items-center gap-2.5 py-1.5 border-t border-dotted border-derby-ink/10 text-sm">
                      <span className="font-mono w-28 shrink-0">{m2s(s.start)} tot {m2s(s.end)}</span>
                      <span className={`font-mono text-xs font-bold ${s.who.length >= s.need ? "text-green-700" : "text-derby-accent"}`}>
                        {s.who.length}/{s.need}
                      </span>
                      <span className="flex-1 text-derby-ink/60 text-xs">{s.who.map(nameOf).join(", ") || "nog niemand"}</span>
                      <button type="button" className={btnGhost} onClick={() => onOpenShift(s.id)}>Indelen</button>
                    </div>
                  ))}
                  {t.info.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-dotted border-derby-ink/10">
                      {t.info.map((i, idx) => (
                        <label key={idx} className={`flex items-start gap-2 py-0.5 text-sm ${i.done ? "line-through text-derby-ink/50" : ""}`}>
                          <input
                            type="checkbox"
                            className="mt-1 accent-derby-accent"
                            checked={i.done}
                            onChange={(e) => api("setInfo", { taskId: t.id, index: idx, done: e.target.checked })}
                          />
                          {i.text}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </Card>
          </div>
        );
      })}
    </>
  );
}
