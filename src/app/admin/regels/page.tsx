import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function createRule(formData: FormData) {
  "use server";
  await requireAdmin();
  const title = String(formData.get("title") || "").trim();
  if (!title) return;
  const body = String(formData.get("body") || "").trim();
  const order = Number(formData.get("order") || 0);
  await prisma.houseRule.create({ data: { title, body, order } });
  revalidatePath("/admin/regels");
  revalidatePath("/regels");
}

async function updateRule(id: string, formData: FormData) {
  "use server";
  await requireAdmin();
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const order = Number(formData.get("order") || 0);
  await prisma.houseRule.update({
    where: { id },
    data: { title, body, order },
  });
  revalidatePath("/admin/regels");
  revalidatePath("/regels");
}

async function deleteRule(id: string) {
  "use server";
  await requireAdmin();
  await prisma.houseRule.delete({ where: { id } });
  revalidatePath("/admin/regels");
  revalidatePath("/regels");
}

export default async function AdminRegelsPage() {
  await requireAdmin();
  const rules = await prisma.houseRule.findMany({ orderBy: { order: "asc" } });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl">Huisregels</h1>

      <form
        action={createRule}
        className="bg-white rounded-2xl p-5 shadow space-y-3"
      >
        <h2 className="font-display text-2xl">Nieuwe regel</h2>
        <input
          name="title"
          required
          placeholder="Titel"
          className="w-full border border-derby-ink/20 rounded-lg px-3 py-2"
        />
        <textarea
          name="body"
          placeholder="Toelichting (optioneel)"
          className="w-full border border-derby-ink/20 rounded-lg px-3 py-2"
        />
        <input
          type="number"
          name="order"
          defaultValue={rules.length}
          className="w-full border border-derby-ink/20 rounded-lg px-3 py-2"
        />
        <button
          type="submit"
          className="bg-derby-ink text-derby-yellow rounded-full px-4 py-2 font-bold"
        >
          Toevoegen
        </button>
      </form>

      <ul className="space-y-3">
        {rules.map((r) => (
          <li key={r.id}>
            <form
              action={updateRule.bind(null, r.id)}
              className="bg-white rounded-xl p-4 shadow space-y-2"
            >
              <input
                name="title"
                defaultValue={r.title}
                required
                className="w-full border border-derby-ink/20 rounded-lg px-3 py-2"
              />
              <textarea
                name="body"
                defaultValue={r.body}
                className="w-full border border-derby-ink/20 rounded-lg px-3 py-2"
              />
              <input
                type="number"
                name="order"
                defaultValue={r.order}
                className="w-24 border border-derby-ink/20 rounded-lg px-3 py-2"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-derby-ink text-derby-yellow rounded-full px-4 py-2 font-bold"
                >
                  Opslaan
                </button>
                <button
                  type="submit"
                  formAction={deleteRule.bind(null, r.id)}
                  className="bg-white border border-derby-accent text-derby-accent rounded-full px-4 py-2 font-bold"
                >
                  Verwijder
                </button>
              </div>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
