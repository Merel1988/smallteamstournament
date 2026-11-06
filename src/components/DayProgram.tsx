import type { ProgramEntry } from "@/lib/infopack";
import { formatMinutes } from "@/lib/time";

const DOT: Record<ProgramEntry["kind"], string> = {
  item: "bg-derby-ink",
  match: "bg-derby-accent scale-75",
  warmup: "bg-derby-ink/30 scale-75",
  break: "bg-derby-ink/30",
};

const ROW: Record<ProgramEntry["kind"], string> = {
  item: "py-2.5 bg-white shadow",
  match: "py-1.5 bg-white/60",
  warmup: "py-1.5 border border-derby-ink/10",
  break: "py-2.5 border-2 border-dashed border-derby-ink/20",
};

export default function DayProgram({ entries }: { entries: ProgramEntry[] }) {
  return (
    <ol className="relative border-l-4 border-derby-ink/15 ml-3 space-y-3">
      {entries.map((e) => {
        const small = e.kind === "match" || e.kind === "warmup";
        return (
          <li key={e.id} className="relative pl-6">
            <span
              className={`absolute -left-[0.6rem] top-3 w-4 h-4 rounded-full ring-4 ring-derby-bg ${DOT[e.kind]}`}
              aria-hidden
            />
            <div className={`rounded-xl px-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 ${ROW[e.kind]}`}>
              <span className={`tabular-nums whitespace-nowrap w-32 shrink-0 ${small ? "text-sm text-derby-ink/70" : "font-bold"}`}>
                {formatMinutes(e.start)}
                {e.end != null && ` → ${formatMinutes(e.end)}`}
              </span>
              <span className={`flex-1 min-w-48 ${small ? "text-sm text-derby-ink/80" : "font-bold"}`}>
                {e.kind === "break" && <span aria-hidden>☕ </span>}
                {e.color && (
                  <span className="inline-block w-2.5 h-2.5 rounded-full mr-1.5" style={{ backgroundColor: e.color }} aria-hidden />
                )}
                {e.title}
                {e.note && <span className="block font-normal text-sm text-derby-ink/60">{e.note}</span>}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
