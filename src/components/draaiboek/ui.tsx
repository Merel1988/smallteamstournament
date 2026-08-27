import type { ReactNode } from "react";

export function Card({ title, sub, children }: { title?: string; sub?: ReactNode; children: ReactNode }) {
  return (
    <section className="bg-white border border-derby-ink/10 rounded-2xl p-4 mb-4">
      {title && <h2 className="font-display text-2xl leading-tight">{title}</h2>}
      {sub && <p className="text-sm text-derby-ink/60 mt-0.5 mb-3">{sub}</p>}
      {children}
    </section>
  );
}

export function Pill({ tone = "", children }: { tone?: "" | "ok" | "bad" | "soft"; children: ReactNode }) {
  const cls =
    tone === "ok"
      ? "bg-green-50 border-green-200 text-green-800"
      : tone === "bad"
        ? "bg-red-50 border-red-200 text-red-800"
        : tone === "soft"
          ? "bg-amber-50 border-amber-200 text-amber-800"
          : "bg-derby-bg border-derby-ink/15 text-derby-ink/70";
  return (
    <span className={`inline-block text-[11px] uppercase font-mono rounded-full px-2 py-0.5 border whitespace-nowrap ${cls}`}>
      {children}
    </span>
  );
}

export const btn = "rounded-lg px-3 py-1.5 text-sm font-semibold uppercase tracking-wide disabled:opacity-50";
export const btnDark = `${btn} bg-derby-ink text-white hover:bg-derby-ink/80`;
export const btnRed = `${btn} bg-derby-accent text-white hover:bg-derby-accent-dark`;
export const btnGhost = `${btn} border border-derby-ink/20 text-derby-ink/70 hover:bg-derby-bg`;
export const input = "w-full rounded-lg border border-derby-ink/20 bg-white px-3 py-2 text-sm";
export const label = "block text-[10px] uppercase tracking-widest text-derby-ink/60 mb-1 font-mono";
