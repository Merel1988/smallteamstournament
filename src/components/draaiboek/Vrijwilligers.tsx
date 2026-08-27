"use client";

import { useState } from "react";
import Link from "next/link";
import type { DraaiboekState } from "@/lib/draaiboek-types";
import type { Api } from "./Draaiboek";
import { hours, m2s, myGames, status, teamName, volMinutes, volShifts } from "./util";
import { Card, Pill, btnRed, input, label } from "./ui";

export default function Vrijwilligers({ S, org, api, busy }: { S: DraaiboekState; org: boolean; api: Api; busy: boolean }) {
  const [name, setName] = useState("");
  const [team, setTeam] = useState("");
  const add = async () => {
    const n = name.trim();
    if (!n) return;
    const r = await api("addVolunteer", { name: n, teamId: team || null });
    if (r.ok) setName("");
  };

  return (
    <>
      <Card
        title="Vrijwilliger toevoegen"
        sub={
          <>
            Koppel iemand aan een team als die zelf skate. Officials en zaalvrijwilligers laat je op &lsquo;speelt niet mee&rsquo; staan. Alleen namen, geen telefoonnummers: iedereen met de link kan deze lijst zien.
            {org && S.teams.length === 0 && (
              <>
                {" "}
                De teamkeuze is nog leeg: teams vul je in via{" "}
                <Link className="underline" href="/admin/teams">/admin/teams</Link>, wedstrijden via{" "}
                <Link className="underline" href="/admin/schema">/admin/schema</Link>.
              </>
            )}
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-4 items-end">
          <div className="sm:col-span-2">
            <label className={label} htmlFor="vName">Naam of derbynaam</label>
            <input id="vName" className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Bijv. Merel" onKeyDown={(e) => e.key === "Enter" && add()} />
          </div>
          <div>
            <label className={label} htmlFor="vTeam">Team</label>
            <select id="vTeam" className={input} value={team} onChange={(e) => setTeam(e.target.value)}>
              <option value="">speelt niet mee</option>
              {S.teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <button type="button" className={btnRed} disabled={busy || !name.trim()} onClick={add}>Toevoegen</button>
        </div>
      </Card>

      <Card title="Wie doet wat" sub="Rood betekent dat iemand op dat moment zelf op de track staat of dubbel ingedeeld is.">
        {S.volunteers.length === 0 && (
          <div className="text-center text-derby-ink/60 border border-dashed border-derby-ink/20 rounded-lg py-4 text-sm">Nog geen vrijwilligers.</div>
        )}
        {S.volunteers.map((v) => {
          const sh = volShifts(S, v.id);
          const g = myGames(S, v);
          return (
            <div key={v.id} className="py-3 border-b border-derby-ink/10 last:border-b-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display text-xl flex-1 min-w-[150px]">{v.name}</span>
                {org ? (
                  <select
                    className="rounded-lg border border-derby-ink/20 bg-white px-2 py-1 text-xs"
                    value={v.teamId ?? ""}
                    onChange={(e) => api("setVolunteerTeam", { id: v.id, teamId: e.target.value || null })}
                    aria-label={`Team van ${v.name}`}
                  >
                    <option value="">speelt niet mee</option>
                    {S.teams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                ) : v.teamId ? (
                  <Pill tone="bad">{teamName(S, v.teamId) || "team"}</Pill>
                ) : (
                  <Pill>speelt niet</Pill>
                )}
                <Pill>{hours(volMinutes(S, v.id))} uur</Pill>
                {org && (
                  <button
                    type="button"
                    className="px-2 text-derby-ink/50 hover:text-derby-accent text-lg"
                    aria-label={`${v.name} verwijderen`}
                    onClick={() => confirm(`${v.name} verwijderen, inclusief alle diensten?`) && api("removeVolunteer", { id: v.id })}
                  >
                    ×
                  </button>
                )}
              </div>
              {g.length > 0 && (
                <div className="text-xs text-derby-ink/60 mt-1">
                  Eigen wedstrijden: {g.map((x) => `${m2s(x.start)} tot ${m2s(x.end)}`).join(", ")}
                </div>
              )}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {sh.length === 0 && <span className="text-xs text-derby-ink/60">Nog niet ingedeeld.</span>}
                {sh.map((s) => {
                  const st = status(S, v, s);
                  const tone = st.k === "free" ? "bg-derby-bg border-derby-ink/15" : st.k === "soft" ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-red-50 border-red-200 text-red-800";
                  return (
                    <span key={s.id} className={`inline-flex items-center gap-1 border rounded-full pl-2.5 pr-1 py-0.5 text-xs ${tone}`} title={st.t}>
                      {m2s(s.start)} {s.task.name}
                      {org && (
                        <button
                          type="button"
                          aria-label="Uit dienst halen"
                          className="px-1 rounded-full hover:bg-red-100 hover:text-derby-accent"
                          onClick={() => api("unsign", { shiftId: s.id, volunteerId: v.id })}
                        >
                          ×
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </Card>
    </>
  );
}
