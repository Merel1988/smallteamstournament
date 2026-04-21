"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const s = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(s);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

type Status = "loading" | "unsupported" | "denied" | "off" | "on";

export default function NotificationsToggle({ vapidKey }: { vapidKey: string }) {
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setStatus(sub ? "on" : "off"));
  }, []);

  async function enable() {
    setError(null);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setStatus(perm === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      const raw = sub.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: raw.endpoint,
          keys: raw.keys,
        }),
      });
      setStatus("on");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inschakelen mislukt.");
    }
  }

  async function disable() {
    setError(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        });
      }
      setStatus("off");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Uitschakelen mislukt.");
    }
  }

  if (status === "loading") return <p>Bezig met laden…</p>;
  if (status === "unsupported")
    return (
      <p className="text-derby-ink/70">
        Je browser ondersteunt geen push notifications. Gebruik Chrome, Firefox
        of Safari 16+.
      </p>
    );
  if (status === "denied")
    return (
      <p className="text-derby-accent">
        Notificaties zijn geblokkeerd. Zet ze aan in je browserinstellingen en
        herlaad de pagina.
      </p>
    );

  return (
    <div className="space-y-3">
      {status === "off" ? (
        <button
          type="button"
          onClick={enable}
          className="bg-derby-ink text-derby-yellow rounded-full px-5 py-3 font-bold"
        >
          🔔 Zet notificaties aan
        </button>
      ) : (
        <button
          type="button"
          onClick={disable}
          className="bg-white border border-derby-ink/20 rounded-full px-5 py-3 font-bold"
        >
          🔕 Zet notificaties uit
        </button>
      )}
      {error && <p className="text-sm text-derby-accent">{error}</p>}
    </div>
  );
}
