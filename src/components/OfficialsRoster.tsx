"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { crewGroup, type CrewGroup, type RosterMatch } from "@/lib/infopack";
import { formatMinutes } from "@/lib/time";

const GROUPS: CrewGroup[] = ["referees", "nsos", "other"];

function normalize(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

export default function OfficialsRoster({ matches }: { matches: RosterMatch[] }) {
  const t = useTranslations("Info");
  const [query, setQuery] = useState("");
  const q = normalize(query);
  const hits = (name: string) => q.length >= 2 && normalize(name).includes(q);

  const found = q.length >= 2 ? matches.filter((m) => m.assignments.some((a) => hits(a.name))) : matches;
  const summary =
    q.length >= 2
      ? found.map((m) => ({
          id: m.id,
          start: m.start,
          positions: m.assignments.filter((a) => hits(a.name)).map((a) => a.position),
        }))
      : [];

  return (
    <div className="space-y-4">
      <label className="block max-w-md">
        <span className="block text-sm font-bold mb-1">{t("searchLabel")}</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full rounded-full border-2 border-derby-ink/20 bg-white px-4 py-2 focus:border-derby-ink"
        />
      </label>

      {q.length >= 2 && (
        <div role="status" className="bg-derby-ink text-white rounded-2xl px-5 py-3">
          {summary.length === 0 ? (
            t("noneFound")
          ) : (
            <>
              <p className="font-bold">{t("found", { count: summary.length })}</p>
              <ul className="mt-1 flex flex-wrap gap-2 text-sm">
                {summary.map((s) => (
                  <li key={s.id} className="bg-white/15 rounded-full px-3 py-0.5 tabular-nums">
                    {formatMinutes(s.start)} · {s.positions.join(", ")}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {found.map((m) => (
          <article key={m.id} className="bg-white rounded-2xl shadow p-4 space-y-3">
            <header>
              <p className="text-sm text-derby-ink/60 tabular-nums">
                {formatMinutes(m.start)}
                {m.poule && ` · ${m.poule}`}
              </p>
              <h3 className="font-display text-2xl leading-tight">{m.label}</h3>
            </header>
            {GROUPS.map((g) => {
              const rows = m.assignments.filter((a) => crewGroup(a.position) === g);
              if (rows.length === 0) return null;
              return (
                <div key={g}>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-derby-ink/50 mb-1">
                    {t(`groups.${g}`)}
                  </h4>
                  <dl className="grid grid-cols-[3.5rem_1fr] gap-x-2 text-sm">
                    {rows.map((a) => (
                      <div
                        key={a.id}
                        className={`contents ${hits(a.name) ? "[&>*]:bg-derby-accent [&>*]:text-white" : ""}`}
                      >
                        <dt className="font-bold py-0.5 px-1 rounded-l">{a.position}</dt>
                        <dd className="py-0.5 px-1 rounded-r">
                          {a.name}
                          {a.pronouns && <span className="opacity-60"> ({a.pronouns})</span>}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              );
            })}
          </article>
        ))}
      </div>
    </div>
  );
}
