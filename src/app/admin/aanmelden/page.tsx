import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

function revalidatePublic() {
  revalidatePath("/admin/aanmelden");
  revalidatePath("/aanmelden");
  revalidatePath("/en/aanmelden");
}

function parseForm(formData: FormData) {
  return {
    url: String(formData.get("url") || "").trim(),
    labelNl: String(formData.get("labelNl") || "").trim(),
    labelEn: String(formData.get("labelEn") || "").trim() || null,
    descriptionNl: String(formData.get("descriptionNl") || "").trim() || null,
    descriptionEn: String(formData.get("descriptionEn") || "").trim() || null,
    order: Number(formData.get("order") || 0),
    visible: formData.get("visible") === "on",
  };
}

async function createLink(formData: FormData) {
  "use server";
  await requireAdmin();
  const data = parseForm(formData);
  if (!data.url || !data.labelNl) return;
  await prisma.registrationLink.create({ data });
  revalidatePublic();
}

async function updateLink(id: string, formData: FormData) {
  "use server";
  await requireAdmin();
  const data = parseForm(formData);
  if (!data.url || !data.labelNl) return;
  await prisma.registrationLink.update({ where: { id }, data });
  revalidatePublic();
}

async function deleteLink(id: string) {
  "use server";
  await requireAdmin();
  await prisma.registrationLink.delete({ where: { id } });
  revalidatePublic();
}

const inputClass = "w-full border border-derby-ink/20 rounded-lg px-3 py-2";

export default async function AdminAanmeldenPage() {
  await requireAdmin();
  const links = await prisma.registrationLink.findMany({
    orderBy: { order: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl">Aanmeldlinks</h1>
      <p className="text-sm text-derby-ink/70">
        Links naar externe aanmeldformulieren. Nieuwe links staan standaard{" "}
        <strong>verborgen</strong> — vink &ldquo;Zichtbaar&rdquo; aan om ze op de
        publieke pagina te tonen. Engelse velden vallen terug op het Nederlands
        als ze leeg zijn.
      </p>

      <form action={createLink} className="bg-white rounded-2xl p-5 shadow space-y-3">
        <h2 className="font-display text-2xl">Nieuwe link</h2>
        <input name="url" required placeholder="https://…" className={inputClass} />
        <div className="grid sm:grid-cols-2 gap-3">
          <input name="labelNl" required placeholder="Label (NL)" className={inputClass} />
          <input name="labelEn" placeholder="Label (EN, optioneel)" className={inputClass} />
          <textarea name="descriptionNl" placeholder="Omschrijving (NL, optioneel)" className={inputClass} />
          <textarea name="descriptionEn" placeholder="Omschrijving (EN, optioneel)" className={inputClass} />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            Volgorde
            <input type="number" name="order" defaultValue={links.length} className="w-20 border border-derby-ink/20 rounded-lg px-3 py-2" />
          </label>
          <label className="flex items-center gap-2 text-sm font-bold">
            <input type="checkbox" name="visible" className="h-4 w-4" />
            Zichtbaar
          </label>
          <button type="submit" className="bg-derby-ink text-white rounded-full px-4 py-2 font-bold ml-auto">
            Toevoegen
          </button>
        </div>
      </form>

      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.id}>
            <form
              action={updateLink.bind(null, link.id)}
              className="bg-white rounded-xl p-4 shadow space-y-3"
            >
              <div className="flex items-center gap-2">
                <input name="url" defaultValue={link.url} required className={inputClass} />
                {!link.visible && (
                  <span className="shrink-0 rounded-full bg-derby-ink/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-derby-ink/60">
                    verborgen
                  </span>
                )}
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <input name="labelNl" defaultValue={link.labelNl} required placeholder="Label (NL)" className={inputClass} />
                <input name="labelEn" defaultValue={link.labelEn ?? ""} placeholder="Label (EN, optioneel)" className={inputClass} />
                <textarea name="descriptionNl" defaultValue={link.descriptionNl ?? ""} placeholder="Omschrijving (NL, optioneel)" className={inputClass} />
                <textarea name="descriptionEn" defaultValue={link.descriptionEn ?? ""} placeholder="Omschrijving (EN, optioneel)" className={inputClass} />
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  Volgorde
                  <input type="number" name="order" defaultValue={link.order} className="w-20 border border-derby-ink/20 rounded-lg px-3 py-2" />
                </label>
                <label className="flex items-center gap-2 text-sm font-bold">
                  <input type="checkbox" name="visible" defaultChecked={link.visible} className="h-4 w-4" />
                  Zichtbaar
                </label>
                <div className="flex gap-2 ml-auto">
                  <button type="submit" className="bg-derby-ink text-white rounded-full px-4 py-2 font-bold">
                    Opslaan
                  </button>
                  <button
                    type="submit"
                    formAction={deleteLink.bind(null, link.id)}
                    className="bg-white border border-derby-accent text-derby-accent rounded-full px-4 py-2 font-bold"
                  >
                    Verwijder
                  </button>
                </div>
              </div>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
