import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function createPrompt(formData: FormData) {
  "use server";
  await requireAdmin();
  const text = String(formData.get("text") || "").trim();
  if (!text) return;
  const category = String(formData.get("category") || "").trim() || null;
  await prisma.bingoPrompt.create({ data: { text, category } });
  revalidatePath("/admin/bingo");
  revalidatePath("/bingo");
}

async function togglePrompt(id: string) {
  "use server";
  await requireAdmin();
  const current = await prisma.bingoPrompt.findUnique({ where: { id } });
  if (!current) return;
  await prisma.bingoPrompt.update({
    where: { id },
    data: { active: !current.active },
  });
  revalidatePath("/admin/bingo");
  revalidatePath("/bingo");
}

async function deletePrompt(id: string) {
  "use server";
  await requireAdmin();
  await prisma.bingoPrompt.delete({ where: { id } });
  revalidatePath("/admin/bingo");
  revalidatePath("/bingo");
}

export default async function AdminBingoPage() {
  await requireAdmin();
  const prompts = await prisma.bingoPrompt.findMany({
    orderBy: [{ category: "asc" }, { text: "asc" }],
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl">Bingo prompts</h1>

      <form
        action={createPrompt}
        className="bg-white rounded-2xl p-5 shadow space-y-3"
      >
        <h2 className="font-display text-2xl">Nieuwe prompt</h2>
        <input
          name="text"
          required
          placeholder="Iemand krijgt een track cut penalty"
          className="w-full border border-derby-ink/20 rounded-lg px-3 py-2"
        />
        <input
          name="category"
          placeholder="categorie (optioneel)"
          className="w-full border border-derby-ink/20 rounded-lg px-3 py-2"
        />
        <button
          type="submit"
          className="bg-derby-ink text-derby-yellow rounded-full px-4 py-2 font-bold"
        >
          Toevoegen
        </button>
      </form>

      <ul className="space-y-2">
        {prompts.map((p) => (
          <li
            key={p.id}
            className="bg-white rounded-xl p-3 shadow flex items-center gap-3"
          >
            <form action={togglePrompt.bind(null, p.id)}>
              <button
                type="submit"
                aria-label={p.active ? "Uitzetten" : "Aanzetten"}
                className={`w-10 h-6 rounded-full transition ${
                  p.active ? "bg-derby-accent" : "bg-derby-ink/20"
                } relative`}
              >
                <span
                  className={`absolute top-0.5 bg-white w-5 h-5 rounded-full transition ${
                    p.active ? "left-[18px]" : "left-0.5"
                  }`}
                />
              </button>
            </form>
            <div className="flex-1">
              <div className={p.active ? "" : "line-through opacity-50"}>
                {p.text}
              </div>
              {p.category && (
                <div className="text-xs text-derby-ink/50">{p.category}</div>
              )}
            </div>
            <form action={deletePrompt.bind(null, p.id)}>
              <button
                type="submit"
                className="text-sm text-derby-accent underline"
              >
                verwijder
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
