"use client";

import { useState } from "react";
import type { DraaiboekState } from "@/lib/draaiboek-types";
import { AREAS } from "@/lib/draaiboek-types";
import { allShifts, m2s, myGames, volShifts } from "./util";
import { Card, btnDark } from "./ui";

export default function Delen({ S }: { S: DraaiboekState }) {
  const [copied, setCopied] = useState<string | null>(null);
  const nameOf = (id: string) => S.volunteers.find((v) => v.id === id)?.name ?? "?";
  const gaps = allShifts(S).filter((s) => s.who.length < s.need).sort((a, b) => a.start - b.start);

  const oproep =
    `Small Teams Tournament, zaterdag 21 november, De Horstacker\nWe zoeken nog handen. Laat weten waar je kunt:\n\n` +
    (gaps.map((s) => `• ${m2s(s.start)} tot ${m2s(s.end)}  ${s.task.name}, nog ${s.need - s.who.length} nodig`).join("\n") ||
      "• Niets meer open, we zijn rond!") +
    `\n\nSkate je zelf mee? Geef je team door, dan plannen we om je wedstrijden heen.`;

  const briefjes =
    S.volunteers
      .map((v) => {
        const sh = volShifts(S, v.id);
        const g = myGames(S, v);
        return (
          `${v.name}\n` +
          (g.length ? `  Eigen wedstrijden: ${g.map((x) => m2s(x.start)).join(", ")}\n` : "") +
          (sh.map((s) => `  ${m2s(s.start)} tot ${m2s(s.end)}  ${s.task.name}`).join("\n") || "  (nog geen dienst)")
        );
      })
      .join("\n\n") || "(nog geen vrijwilligers)";

  let run = `DRAAIBOEK SMALL TEAMS TOURNAMENT, zaterdag 21 november 2026\nDe Horstacker, Nijmegen\n`;
  (Object.keys(AREAS) as (keyof typeof AREAS)[]).forEach((k) => {
    const list = S.tasks.filter((t) => t.area === k).sort((a, b) => (a.shifts[0]?.start ?? 9999) - (b.shifts[0]?.start ?? 9999));
    if (!list.length) return;
    run += `\n\n=== ${AREAS[k].toUpperCase()} ===`;
    list.forEach((t) => {
      run += `\n\n${t.name}`;
      t.shifts.forEach((s) => {
        run += `\n  ${m2s(s.start)} tot ${m2s(s.end)}  ${s.need} pers.  ${s.who.map(nameOf).join(", ") || "-"}`;
      });
      t.info.forEach((i) => (run += `\n    - ${i.done ? "[x] " : "[ ] "}${i.text}`));
    });
  });

  const rows = [["Onderdeel", "Van", "Tot", "Post", "Nodig", "Ingedeeld", "Namen"]];
  allShifts(S)
    .sort((a, b) => a.start - b.start)
    .forEach((s) =>
      rows.push([AREAS[s.task.area], m2s(s.start), m2s(s.end), s.task.name, String(s.need), String(s.who.length), s.who.map(nameOf).join(" / ")]),
    );
  const csv = rows.map((r) => r.map((c) => (/[",;\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(",")).join("\n");

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  };

  const block = (key: string, title: string, sub: string, text: string, rowsN = 10) => (
    <Card title={title} sub={sub}>
      <textarea readOnly rows={rowsN} className="w-full rounded-lg border border-derby-ink/20 bg-white p-3 font-mono text-xs leading-relaxed" value={text} />
      <button type="button" className={`${btnDark} mt-2`} onClick={() => copy(key, text)}>
        {copied === key ? "Gekopieerd" : "Kopieer"}
      </button>
    </Card>
  );

  return (
    <>
      {block("gaps", "Oproep voor de groepsapp", "De openstaande plekken, klaar om te plakken.", oproep)}
      {block("vols", "Persoonlijke briefjes", "Per vrijwilliger het eigen rooster, met de eigen wedstrijden erbij.", briefjes)}
      {block("run", "Draaiboek als tekst", "De hele dag met namen erbij, om in een document te plakken of te printen voor de coördinatoren.", run, 16)}
      {block("csv", "Rooster als tabel", "Komma-gescheiden, zo in Excel te plakken naast je aanmeldingenbestand.", csv)}
    </>
  );
}
