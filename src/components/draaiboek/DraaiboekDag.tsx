"use client";

import { useState } from "react";
import type { DraaiboekState, TaskDTO } from "@/lib/draaiboek-types";
import { AREAS } from "@/lib/draaiboek-types";
import type { Api } from "./Draaiboek";
import { AREA_COLOR, s2m, when } from "./util";
import { Card, Pill, btnGhost, btnRed, input, label } from "./ui";

export default function DraaiboekDag({ S, api, onOpenShift }: { S: DraaiboekState; api: Api; onOpenShift: (id: string) => void }) {
  const [name, setName] = useState("");
  const [area, setArea] = useState("zaal");
  const [from, setFrom] = useState("12:00");
  const [to, setTo] = useState("18:00");
  const [need, setNeed] = useState("2");
  const [split, setSplit] = useState("120");
  const [editing, setEditing] = useState<string | null>(null);
  const nameOf = (id: string) => S.volunteers.find((v) => v.id === id)?.name ?? "?";

  const add = async () => {
    const allDay = split === "allday";
    const perGame = split === "pergame";
    const friday = split === "friday";
    const r = await api("addTask", {
      name,
      area,
      from: s2m(from),
      to: s2m(to),
      need: Number(need),
      split: allDay || perGame || friday ? 0 : Number(split),
      allDay,
      perGame,
      friday,
    });
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
            <input id="tFrom" type="time" step={300} className={input} disabled={["allday", "pergame", "friday"].includes(split)} value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className={label} htmlFor="tTo">Tot</label>
            <input id="tTo" type="time" step={300} className={input} disabled={["allday", "pergame", "friday"].includes(split)} value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div>
            <label className={label} htmlFor="tNeed">Mensen</label>
            <input id="tNeed" type="number" min={1} max={30} className={input} value={need} onChange={(e) => setNeed(e.target.value)} />
          </div>
          <div>
            <label className={label} htmlFor="tSplit">Verdeling</label>
            <select id="tSplit" className={input} value={split} onChange={(e) => setSplit(e.target.value)}>
              <option value="0">één blok</option>
              <option value="allday">hele dag (bijv. aanspreekpunt)</option>
              <option value="pergame">per wedstrijd (bijv. track monkey)</option>
              <option value="friday">vrijdagavond (tijdens training)</option>
              <option value="30">blokken van 30 min</option>
              <option value="45">blokken van 45 min</option>
              <option value="60">blokken van 1 uur</option>
              <option value="90">blokken van 1,5 uur</option>
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
                  {editing === t.id && <TaskEditor task={t} api={api} onDone={() => setEditing(null)} />}
                  <div className={`flex flex-wrap items-center gap-2 ${editing === t.id ? "hidden" : ""}`}>
                    <span className="font-display text-xl flex-1 min-w-[150px]">{t.name}</span>
                    <Pill>{t.shifts.length} dienst{t.shifts.length === 1 ? "" : "en"}</Pill>
                    <button type="button" className={btnGhost} onClick={() => setEditing(t.id)}>Bewerken</button>
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
                      <span className="font-mono w-28 shrink-0">{when(s)}</span>
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

function TaskEditor({ task, api, onDone }: { task: TaskDTO; api: Api; onDone: () => void }) {
  const [name, setName] = useState(task.name);
  const [area, setArea] = useState<string>(task.area);
  const [info, setInfo] = useState(task.info.map((i) => i.text).join("\n"));

  const save = async () => {
    const r = await api("updateTask", { id: task.id, name, area, info: info.split("\n") });
    if (r.ok) onDone();
  };

  return (
    <div className="grid gap-3 sm:grid-cols-3 mb-2">
      <div className="sm:col-span-2">
        <label className={label} htmlFor={`eName-${task.id}`}>Naam post</label>
        <input id={`eName-${task.id}`} className={input} value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label className={label} htmlFor={`eArea-${task.id}`}>Onderdeel</label>
        <select id={`eArea-${task.id}`} className={input} value={area} onChange={(e) => setArea(e.target.value)}>
          {Object.entries(AREAS).map(([k, l]) => (
            <option key={k} value={k}>{l}</option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-3">
        <label className={label} htmlFor={`eInfo-${task.id}`}>Checklist, één punt per regel</label>
        <textarea id={`eInfo-${task.id}`} rows={Math.max(3, task.info.length + 1)} className={input} value={info} onChange={(e) => setInfo(e.target.value)} />
      </div>
      <div className="sm:col-span-3 flex gap-2">
        <button type="button" className={btnRed} disabled={!name.trim()} onClick={save}>Opslaan</button>
        <button type="button" className={btnGhost} onClick={onDone}>Annuleren</button>
      </div>
    </div>
  );
}
