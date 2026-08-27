"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { DraaiboekState, Role } from "@/lib/draaiboek-types";
import DagOverzicht from "./DagOverzicht";
import Inschrijven from "./Inschrijven";
import Vrijwilligers from "./Vrijwilligers";
import DraaiboekDag from "./DraaiboekDag";
import Voorbereiding from "./Voorbereiding";
import Delen from "./Delen";
import ShiftDrawer from "./ShiftDrawer";

export type Api = (action: string, payload?: Record<string, unknown>) => Promise<{ ok: boolean; id?: string; message?: string }>;

type Tab = { key: string; label: string; org?: boolean };
const TABS: Tab[] = [
  { key: "dag", label: "Dagoverzicht" },
  { key: "ik", label: "Inschrijven" },
  { key: "mensen", label: "Vrijwilligers" },
  { key: "draaiboek", label: "Draaiboek dag", org: true },
  { key: "voor", label: "Voorbereiding", org: true },
  { key: "delen", label: "Delen", org: true },
];

const ME_KEY = "stt-draaiboek-me";

// localStorage-backed "who am I" as an external store, so the server render
// (no identity) and the client hydrate cleanly without setState-in-effect.
const meListeners = new Set<() => void>();
const readMe = () => {
  try {
    return localStorage.getItem(ME_KEY) || null;
  } catch {
    return null;
  }
};
const writeMe = (id: string | null) => {
  try {
    if (id) localStorage.setItem(ME_KEY, id);
    else localStorage.removeItem(ME_KEY);
  } catch {}
  meListeners.forEach((l) => l());
};
const subscribeMe = (l: () => void) => {
  meListeners.add(l);
  window.addEventListener("storage", l);
  return () => {
    meListeners.delete(l);
    window.removeEventListener("storage", l);
  };
};

export default function Draaiboek({ token, role, initial, days }: { token: string; role: Role; initial: DraaiboekState; days: number }) {
  const org = role === "organisatie";
  const [S, setS] = useState<DraaiboekState>(initial);
  const [tab, setTab] = useState("dag");
  const me = useSyncExternalStore(subscribeMe, readMe, () => null);
  const [toast, setToast] = useState<string | null>(null);
  const [openShift, setOpenShift] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const toastT = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setMe = writeMe;

  const showToast = useCallback((t: string) => {
    setToast(t);
    if (toastT.current) clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const api: Api = useCallback(
    async (action, payload = {}) => {
      setBusy(true);
      try {
        const res = await fetch("/api/draaiboek", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, action, ...payload }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          showToast(data.error || "Er ging iets mis.");
          return { ok: false, id: data.id };
        }
        if (data.state) setS(data.state);
        if (data.message) showToast(data.message);
        return { ok: true, id: data.id, message: data.message };
      } catch {
        showToast("Geen verbinding. Probeer het nog eens.");
        return { ok: false };
      } finally {
        setBusy(false);
      }
    },
    [token, showToast],
  );

  // Pull fresh data every 30s so co-volunteers' signups show up.
  useEffect(() => {
    const id = setInterval(async () => {
      if (document.hidden || openShift) return;
      try {
        const res = await fetch(`/api/draaiboek?token=${encodeURIComponent(token)}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.state) setS(data.state);
        }
      } catch {}
    }, 30000);
    return () => clearInterval(id);
  }, [token, openShift]);

  const tabs = TABS.filter((t) => !t.org || org);

  return (
    <div className="min-h-screen flex flex-col bg-derby-bg text-derby-ink">
      <header className="bg-derby-ink text-white border-b-4 border-derby-accent">
        <div className="max-w-6xl mx-auto px-4 pt-5 flex flex-wrap gap-4 items-end justify-between">
          <div>
            <h1 className="font-display text-4xl leading-none">
              Draaiboek <span className="text-derby-accent">STT</span>
            </h1>
            <p className="text-xs uppercase tracking-widest text-white/50 mt-1">
              Roadkill Rollers · 21 november 2026 · De Horstacker, Nijmegen
              {org && <span className="ml-2 text-derby-accent">· organisatie</span>}
            </p>
          </div>
          <div className="text-right text-xs uppercase tracking-widest text-white/50">
            <b className="block font-display text-4xl text-white tracking-normal leading-none">{days}</b>
            dagen te gaan
          </div>
        </div>
        <nav className="max-w-6xl mx-auto px-4 pt-3 flex flex-wrap gap-1" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => {
                setTab(t.key);
                window.scrollTo(0, 0);
              }}
              className={`px-3 py-2 rounded-t-lg font-display text-lg tracking-wide ${
                tab === t.key ? "bg-derby-accent text-white" : "text-white/60 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto w-full px-4 py-5 pb-20 flex-1">
        {tab === "dag" && <DagOverzicht S={S} org={org} onOpenShift={setOpenShift} />}
        {tab === "ik" && <Inschrijven S={S} me={me} setMe={setMe} api={api} busy={busy} />}
        {tab === "mensen" && <Vrijwilligers S={S} org={org} api={api} busy={busy} />}
        {tab === "draaiboek" && org && <DraaiboekDag S={S} api={api} onOpenShift={setOpenShift} />}
        {tab === "voor" && org && <Voorbereiding S={S} api={api} />}
        {tab === "delen" && org && <Delen S={S} />}
      </main>

      {openShift && org && (
        <ShiftDrawer S={S} shiftId={openShift} api={api} onClose={() => setOpenShift(null)} />
      )}

      {toast && (
        <div
          role="status"
          className="fixed left-1/2 -translate-x-1/2 bottom-6 bg-derby-ink text-white px-5 py-2 rounded-full text-sm shadow-lg z-50"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
