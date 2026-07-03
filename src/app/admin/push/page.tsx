import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import PushForm from "./PushForm";

export const dynamic = "force-dynamic";

export default async function AdminPushPage() {
  await requireAdmin();
  const subs = await prisma.pushSubscription.count().catch(() => 0);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl">Push notificaties</h1>
      <p className="text-derby-ink/70">
        {subs} {subs === 1 ? "abonnee" : "abonnees"} staan ingeschreven.
      </p>

      <PushForm />
    </div>
  );
}
