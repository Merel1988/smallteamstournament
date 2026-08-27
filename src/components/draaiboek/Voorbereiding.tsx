"use client";

import { useState } from "react";
import type { DraaiboekState, ItemDTO } from "@/lib/draaiboek-types";
import { PREP_PHASES } from "@/lib/draaiboek-seed";
import type { Api } from "./Draaiboek";
import { Card, btnRed, input, label } from "./ui";

const CURRENT_PHASE = "Augustus tot september";
const cell = "rounded-md border border-derby-ink/20 bg-white px-2 py-1 text-sm w-full";
const ROLE_PHASES = ["Voorbereiding", "Op de dag"];

export default function Voorbereiding({ S, api }: { S: DraaiboekState; api: Api }) {
  const issues = S.items.filter((i) => i.kind === "issue");
  const prep = S.items.filter((i) => i.kind === "prep");
  const roles = S.items.filter((i) => i.kind === "role");
  const patch = (id: string, p: Partial<ItemDTO>) => api("setItem", { id, patch: p });
  const remove = (i: ItemDTO) => confirm(`"${i.text}" verwijderen?`) && api("deleteItem", { id: i.id });

  return (
    <>
      <Card title="Eerst uitzoeken" sub="Punten waar het draaiboek zichzelf tegenspreekt of waar iets ontbreekt. Vink af zodra het besloten is.">
        {issues.map((i) => (
          <div key={i.id} className="flex items-start gap-2 py-1 text-sm group">
            <input type="checkbox" className="mt-1 accent-derby-accent" checked={i.done} onChange={(e) => patch(i.id, { done: e.target.checked })} id={`q${i.id}`} />
            <label htmlFor={`q${i.id}`} className={`flex-1 ${i.done ? "line-through text-derby-ink/50" : ""}`}>{i.text}</label>
            <DeleteButton onClick={() => remove(i)} />
          </div>
        ))}
        <AddForm api={api} kind="issue" placeholder="Nieuw punt om uit te zoeken" />
      </Card>

      <Card title="Tijdlijn tot 21 november" sub="Zet er een naam en een datum bij. 'Oktober' wordt anders 3 november.">
        {PREP_PHASES.map((f) => {
          const items = prep.filter((p) => p.fase === f);
          const idx = PREP_PHASES.indexOf(f);
          const now = PREP_PHASES.indexOf(CURRENT_PHASE);
          return (
            <div key={f} className="mb-5">
              <h3 className={`font-display text-xl flex items-center gap-2 ${idx < now ? "text-derby-ink/50" : ""}`}>
                {f}
                {idx === now && <span className="text-[10px] font-mono bg-derby-accent text-white rounded-full px-2 py-0.5 tracking-widest">nu</span>}
              </h3>
              {items.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm mt-1">
                    <thead>
                      <tr className="text-left text-[10px] font-mono uppercase tracking-widest text-derby-ink/60">
                        <th className="w-7" />
                        <th className="pb-1">Wat</th>
                        <th className="pb-1 w-36">Wie</th>
                        <th className="pb-1 w-40">Wanneer</th>
                        <th className="w-8" />
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((p) => (
                        <tr key={p.id} className="border-t border-derby-ink/10 align-top">
                          <td className="py-1.5">
                            <input type="checkbox" className="accent-derby-accent" checked={p.done} onChange={(e) => patch(p.id, { done: e.target.checked })} />
                          </td>
                          <td className={`py-1.5 pr-2 ${p.done ? "line-through text-derby-ink/50" : ""}`}>
                            <b>{p.text}</b>
                            {p.note && <div className="text-xs text-derby-ink/60">{p.note}</div>}
                          </td>
                          <td className="py-1.5 pr-2">
                            <input className={cell} defaultValue={p.wie} placeholder="naam" onBlur={(e) => e.target.value !== p.wie && patch(p.id, { wie: e.target.value })} />
                          </td>
                          <td className="py-1.5">
                            <input type="date" className={cell} defaultValue={p.datum} onChange={(e) => patch(p.id, { datum: e.target.value })} />
                          </td>
                          <td className="py-1.5 text-right">
                            <DeleteButton onClick={() => remove(p)} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <AddForm api={api} kind="prep" fase={f} placeholder={`Nieuwe taak voor ${f.toLowerCase()}`} withNote />
            </div>
          );
        })}
      </Card>

      <Card title="Wie is waarvan" sub="Zolang deze kolom leeg is, is het een wensenlijst.">
        {ROLE_PHASES.map((f) => (
          <div key={f} className="mb-4">
            <h3 className="font-display text-xl">{f}</h3>
            <table className="w-full text-sm mt-1">
              <tbody>
                {roles.filter((r) => r.fase === f).map((r) => (
                  <tr key={r.id} className="border-t border-derby-ink/10">
                    <td className="py-1.5 pr-2">{r.text}</td>
                    <td className="py-1.5 w-52">
                      <input className={cell} defaultValue={r.wie} placeholder="naam" onBlur={(e) => e.target.value !== r.wie && patch(r.id, { wie: e.target.value })} />
                    </td>
                    <td className="py-1.5 w-8 text-right">
                      <DeleteButton onClick={() => remove(r)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <AddForm api={api} kind="role" fase={f} placeholder="Nieuwe rol" />
          </div>
        ))}
      </Card>
    </>
  );
}

function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="px-1.5 text-derby-ink/40 hover:text-derby-accent text-lg leading-none" aria-label="Verwijderen" title="Verwijderen" onClick={onClick}>
      ×
    </button>
  );
}

function AddForm({ api, kind, fase = "", placeholder, withNote }: { api: Api; kind: ItemDTO["kind"]; fase?: string; placeholder: string; withNote?: boolean }) {
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const add = async () => {
    if (!text.trim()) return;
    const r = await api("addItem", { kind, fase, text, note });
    if (r.ok) {
      setText("");
      setNote("");
    }
  };
  return (
    <div className="flex flex-wrap gap-2 items-end mt-2 pt-2 border-t border-dotted border-derby-ink/10">
      <div className="flex-1 min-w-[200px]">
        <label className={label}>Toevoegen</label>
        <input className={input} value={text} placeholder={placeholder} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
      </div>
      {withNote && (
        <div className="flex-1 min-w-[160px]">
          <label className={label}>Toelichting</label>
          <input className={input} value={note} placeholder="optioneel" onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        </div>
      )}
      <button type="button" className={btnRed} disabled={!text.trim()} onClick={add}>+</button>
    </div>
  );
}
