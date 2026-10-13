"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Audience, ProgramEntry } from "@/lib/infopack";
import { formatMinutes } from "@/lib/time";

type Filter = "everything" | "public" | "teams" | "officials";
const FILTERS: Filter[] = ["everything", "public", "teams", "officials"];

function visible(entry: ProgramEntry, filter: Filter): boolean {
  if (filter === "everything" || entry.audience === "all") return true;
  if (filter === "public") return false;
  return entry.audience === filter;
}

const AUDIENCE_BADGE: Record<Exclude<Audience, "all">, string> = {
  teams: "bg-derby-accent text-white",
  officials: "bg-derby-ink text-white",
};

export default function DayProgram({ entries }: { entries: ProgramEntry[] }) {
  const t = useTranslations("Info");
  const [filter, setFilter] = useState<Filter>("everything");
  const shown = entries.filter((e) => visible(e, filter));

  return (
    <div className="space-y-4">
      <div role="group" aria-label={t("filterLabel")} className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${
              filter === f ? "bg-derby-ink text-white" : "bg-white shadow-sm hover:bg-derby-ink/10"
            }`}
          >
            {t(`filter.${f}`)}
          </button>
        ))}
      </div>

      <ol className="relative border-l-4 border-derby-ink/15 ml-3 space-y-3">
        {shown.map((e) => (
          <li key={e.id} className="relative pl-6">
            <span
              className={`absolute -left-[0.6rem] top-3 w-4 h-4 rounded-full ${e.kind === "match" ? "scale-75" : ""} ring-4 ring-derby-bg ${
                e.kind === "match" ? "bg-derby-accent" : e.kind === "break" ? "bg-derby-ink/30" : "bg-derby-ink"
              }`}
              aria-hidden
            />
            <div
              className={`rounded-xl px-4 ${e.kind === "match" ? "py-1.5" : "py-2.5"} flex flex-wrap items-baseline gap-x-3 gap-y-1 ${
                e.kind === "match" ? "bg-white/60" : e.kind === "break" ? "border-2 border-dashed border-derby-ink/20" : "bg-white shadow"
              }`}
            >
              <span className={`tabular-nums whitespace-nowrap w-32 shrink-0 ${e.kind === "match" ? "text-sm text-derby-ink/70" : "font-bold"}`}>
                {formatMinutes(e.start)}
                {e.end != null && ` → ${formatMinutes(e.end)}`}
              </span>
              <span className={`flex-1 min-w-48 ${e.kind === "match" ? "text-sm text-derby-ink/80" : "font-bold"}`}>
                {e.kind === "break" && <span aria-hidden>☕ </span>}
                {e.title}
                {e.note && <span className="block font-normal text-sm text-derby-ink/60">{e.note}</span>}
              </span>
              {e.audience !== "all" && (
                <span className={`text-xs font-bold rounded-full px-2.5 py-0.5 ${AUDIENCE_BADGE[e.audience]}`}>
                  {t(`audience.${e.audience}`)}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
