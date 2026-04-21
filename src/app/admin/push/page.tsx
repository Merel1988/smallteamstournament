import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { sendToAll } from "@/lib/push";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function sendPush(formData: FormData) {
  "use server";
  await requireAdmin();
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const url = String(formData.get("url") || "").trim() || undefined;
  if (!title || !body) return;
  await sendToAll({ title, body, url });
  revalidatePath("/admin/push");
}

export default async function AdminPushPage() {
  await requireAdmin();
  const subs = await prisma.pushSubscription.count().catch(() => 0);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl">Push notificaties</h1>
      <p className="text-derby-ink/70">
        {subs} {subs === 1 ? "abonnee" : "abonnees"} staan ingeschreven.
      </p>

      <form
        action={sendPush}
        className="bg-white rounded-2xl p-5 shadow space-y-3"
      >
        <input
          name="title"
          required
          placeholder="Titel (bv. 'Finale begint over 5 min!')"
          className="w-full border border-derby-ink/20 rounded-lg px-3 py-2"
        />
        <textarea
          name="body"
          required
          placeholder="Berichttekst"
          className="w-full border border-derby-ink/20 rounded-lg px-3 py-2"
          rows={3}
        />
        <input
          name="url"
          placeholder="Link (optioneel, bv. /schema)"
          className="w-full border border-derby-ink/20 rounded-lg px-3 py-2"
        />
        <button
          type="submit"
          className="bg-derby-accent text-white rounded-full px-5 py-2 font-bold"
        >
          Verstuur naar iedereen
        </button>
      </form>
    </div>
  );
}
