import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import PushForm from "./PushForm";

export const dynamic = "force-dynamic";

function formatWhen(date: Date) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Amsterdam",
  }).format(date);
}

export default async function AdminPushPage() {
  await requireAdmin();
  const subs = await prisma.pushSubscription.count().catch(() => 0);
  const history = await prisma.sentNotification
    .findMany({ orderBy: { createdAt: "desc" }, take: 20 })
    .catch(() => []);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl">Push notificaties</h1>
      <p className="text-derby-ink/70">
        {subs} {subs === 1 ? "abonnee" : "abonnees"} staan ingeschreven.
      </p>

      <PushForm />

      <section className="space-y-3">
        <h2 className="font-display text-2xl">Recent verstuurd</h2>
        {history.length === 0 ? (
          <p className="text-derby-ink/70">Nog niks verstuurd.</p>
        ) : (
          <ul className="space-y-3">
            {history.map((n) => (
              <li key={n.id} className="bg-white rounded-2xl p-4 shadow space-y-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-bold">{n.title}</p>
                  <time className="text-sm text-derby-ink/60 shrink-0">
                    {formatWhen(n.createdAt)}
                  </time>
                </div>
                <p className="text-derby-ink/70">{n.body}</p>
                {n.url && (
                  <p className="text-sm text-derby-ink/60">Link: {n.url}</p>
                )}
                <p className="text-sm text-derby-ink/70">
                  {n.sentCount} verstuurd
                  {n.removedCount > 0 && `, ${n.removedCount} opgeruimd`}
                  {n.failedCount > 0 && `, ${n.failedCount} mislukt`}
                </p>
                {n.errors && (
                  <p className="text-sm text-derby-accent-dark whitespace-pre-line break-words">
                    {n.errors}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
