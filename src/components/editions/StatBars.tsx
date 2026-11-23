export type BarRow = {
  id: string;
  label: React.ReactNode;
  sub?: React.ReactNode;
  value: number;
  display: string;
  dim?: boolean;
  rank?: number;
};

export function BarList({ rows, diverging = false }: { rows: BarRow[]; diverging?: boolean }) {
  const max = Math.max(...rows.map((r) => Math.abs(r.value))) || 1;
  return (
    <ol className="space-y-1.5">
      {rows.map((r) => {
        const pct = (Math.abs(r.value) / max) * 100;
        return (
          <li
            key={r.id}
            className={`grid grid-cols-[minmax(0,1fr)_6.5rem] sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_6.5rem] items-center gap-x-3 gap-y-0.5 text-sm transition-opacity ${
              r.dim ? "opacity-30" : ""
            }`}
          >
            <span className="min-w-0 truncate col-span-2 sm:col-span-1">
              {r.rank !== undefined && <span className="text-derby-ink/50 tabular-nums mr-1">{r.rank}.</span>}
              <span className="font-bold">{r.label}</span>
              {r.sub && <span className="text-derby-ink/60 text-xs"> {r.sub}</span>}
            </span>
            {diverging ? (
              <span className="relative h-3 flex" aria-hidden>
                <span className="w-1/2 flex justify-end">
                  {r.value < 0 && <span className="h-3 rounded-l bg-derby-ink/70" style={{ width: `${pct}%` }} />}
                </span>
                <span className="w-px bg-derby-ink/30" />
                <span className="w-1/2">
                  {r.value > 0 && <span className="block h-3 rounded-r bg-derby-accent" style={{ width: `${pct}%` }} />}
                </span>
              </span>
            ) : (
              <span className="h-3 rounded bg-derby-ink/5" aria-hidden>
                <span className="block h-3 rounded bg-derby-accent" style={{ width: `${pct}%` }} />
              </span>
            )}
            <span className="tabular-nums text-right font-bold">{r.display}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="bg-derby-bg rounded-xl p-3">
      <div className="text-xs uppercase tracking-wide text-derby-ink/60">{label}</div>
      <div className="font-display text-3xl mt-1 tabular-nums">{value}</div>
      {note && <div className="text-xs text-derby-ink/60">{note}</div>}
    </div>
  );
}

export function Pills<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-full px-3 py-1 text-sm font-bold transition ${
            value === o.value ? "bg-derby-ink text-white" : "bg-derby-bg hover:bg-derby-ink/10"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
