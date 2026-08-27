"use client";

import { useState } from "react";
import type { DraaiboekState } from "@/lib/draaiboek-types";
import type { Api } from "./Draaiboek";
import { allShifts, hours, m2s, myGames, status, volMinutes, volShifts } from "./util";
import { Card, Pill, btnDark, btnGhost, btnRed, input, label } from "./ui";

export default function Inschrijven({
  S,
  me,
  setMe,
  api,
  busy,
}: {
  S: DraaiboekState;
  me: string | null;
  setMe: (id: string | null) => void;
  api: Api;
  busy: boolean;
}) {
  const [pick, setPick] = useState("");
  const [name, setName] = useState("");
  const [team, setTeam] = useState("");
  const v = S.volunteers.find((x) => x.id === me);

  const add = async () => {
    const n = name.trim();
    if (!n) return;
    const r = await api("addVolunteer", { name: n, teamId: team || null });
    if (r.id) {
      setMe(r.id);
      setName("");
    }
  };

  if (!v) {
    return (
      <>
        <Card
          title="Wie ben je?"
          sub="Kies je naam als die er al tussen staat, of voeg jezelf toe. Skate je zelf mee? Kies dan je team, dan plannen we om je wedstrijden heen."
        >
          <div className="grid gap-3 sm:grid-cols-3 items-end">
            <div className="sm:col-span-2">
              <label className={label} htmlFor="mePick">Ik sta er al tussen</label>
              <select id="mePick" className={input} value={pick} onChange={(e) => setPick(e.target.value)}>
                <option value="">kies je naam</option>
                {S.volunteers.map((x) => (
                  <option key={x.id} value={x.id}>{x.name}</option>
                ))}
              </select>
            </div>
            <button type="button" className={btnDark} disabled={!pick} onClick={() => setMe(pick)}>
              Dit ben ik
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-4 items-end mt-5">
            <div className="sm:col-span-2">
              <label className={label} htmlFor="meName">Of nieuw: naam of derbynaam</label>
              <input id="meName" className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Bijv. Spicy Boy" onKeyDown={(e) => e.key === "Enter" && add()} />
            </div>
            <div>
              <label className={label} htmlFor="meTeam">Team</label>
              <select id="meTeam" className={input} value={team} onChange={(e) => setTeam(e.target.value)}>
                <option value="">speelt niet mee</option>
                {S.teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <button type="button" className={btnRed} disabled={busy || !name.trim()} onClick={add}>
              Toevoegen
            </button>
          </div>
        </Card>
        <Card title="Open plekken">
          <div className="text-center text-derby-ink/60 border border-dashed border-derby-ink/20 rounded-lg py-4 text-sm">
            Kies eerst hierboven wie je bent.
          </div>
        </Card>
      </>
    );
  }

  const games = myGames(S, v);
  const mine = volShifts(S, v.id);
  const open = allShifts(S)
    .filter((s) => s.who.length < s.need && !s.who.includes(v.id))
    .sort((a, b) => a.start - b.start);

  return (
    <>
      <Card title={`Hoi ${v.name}`}>
        <p className="text-sm text-derby-ink/60 mb-3">
          {games.length
            ? `Je eigen wedstrijden: ${games.map((g) => `${m2s(g.start)} tot ${m2s(g.end)}`).join(", ")}.`
            : v.teamId
              ? "Je staat bij een team. Zodra het speelschema bekend is, plannen we om je wedstrijden heen."
              : "Je staat niet bij een team, dus je bent de hele dag inzetbaar."}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {mine.length === 0 && <span className="text-sm text-derby-ink/60">Je hebt nog geen dienst, kies er hieronder een.</span>}
          {mine.map((s) => {
            const st = status(S, v, s);
            const tone = st.k === "free" ? "bg-derby-bg border-derby-ink/15" : st.k === "soft" ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-red-50 border-red-200 text-red-800";
            return (
              <span key={s.id} className={`inline-flex items-center gap-1.5 border rounded-full pl-3 pr-1 py-0.5 text-sm ${tone}`}>
                {m2s(s.start)} tot {m2s(s.end)} {s.task.name}
                <button
                  type="button"
                  aria-label="Afmelden"
                  title="Afmelden"
                  className="px-1.5 rounded-full hover:bg-red-100 hover:text-derby-accent"
                  onClick={() => api("unsign", { shiftId: s.id, volunteerId: v.id })}
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Pill>{hours(volMinutes(S, v.id))} uur totaal</Pill>
          <button type="button" className={btnGhost} onClick={() => setMe(null)}>
            Ik ben iemand anders
          </button>
        </div>
      </Card>

      <Card
        title="Open plekken"
        sub="Tik aan waar je bij kunt. Sta je bij een team, dan zie je diensten tijdens je eigen wedstrijden niet, en krijg je een waarschuwing als een dienst dicht op een wedstrijd zit."
      >
        {open.length === 0 && (
          <div className="text-center text-derby-ink/60 border border-dashed border-derby-ink/20 rounded-lg py-4 text-sm">Alles is gevuld, dank je!</div>
        )}
        {open.map((s) => {
          const st = status(S, v, s);
          if (st.k === "game") return null;
          return (
            <div key={s.id} className="flex flex-wrap items-center gap-2.5 py-2 border-b border-derby-ink/10 last:border-b-0 text-sm">
              <span className="font-mono w-28 shrink-0">{m2s(s.start)} tot {m2s(s.end)}</span>
              <span className="flex-1 font-medium min-w-[130px]">{s.task.name}</span>
              {st.k === "clash" ? (
                <Pill tone="bad">{st.t}</Pill>
              ) : (
                <>
                  {st.k === "soft" && <Pill tone="soft">{st.t}</Pill>}
                  <Pill>nog {s.need - s.who.length} nodig</Pill>
                  <button type="button" className={btnRed} disabled={busy} onClick={() => api("signup", { shiftId: s.id, volunteerId: v.id })}>
                    Ik doe deze
                  </button>
                </>
              )}
            </div>
          );
        })}
      </Card>
    </>
  );
}
