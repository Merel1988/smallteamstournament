import type { ProgramEntry } from "@/lib/infopack";
import { formatMinutes } from "@/lib/time";

export default function DayProgram({ entries }: { entries: ProgramEntry[] }) {
  return (
    <ol className="relative border-l-4 border-derby-ink/15 ml-3 space-y-3">
      {entries.map((e) => (
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
          </div>
        </li>
      ))}
    </ol>
  );
}
