import NotificationsToggle from "@/components/NotificationsToggle";

export default function NotificatiesPage() {
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <header>
        <h1 className="font-display text-5xl">Notificaties</h1>
        <p className="text-derby-ink/70 mt-1">
          Zet notificaties aan en mis niks op de dag zelf: &quot;wedstrijd
          begint zo&quot;, uitslagen, winnaar foto-contest en meer.
        </p>
      </header>

      {vapidKey ? (
        <NotificationsToggle vapidKey={vapidKey} />
      ) : (
        <p className="text-derby-ink/60">
          Notificaties zijn op dit moment niet geconfigureerd.
        </p>
      )}

      <section className="bg-white rounded-2xl p-5 shadow text-sm text-derby-ink/80 space-y-2">
        <p>
          <strong>Tip:</strong> voeg deze app toe aan je startscherm voor de
          beste ervaring. Op iPhone: Safari → Delen → &quot;Zet op
          beginscherm&quot;. Op Android: Chrome-menu → &quot;App
          installeren&quot;.
        </p>
      </section>
    </div>
  );
}
