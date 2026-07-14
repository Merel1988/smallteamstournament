import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { TOGGLABLE_PAGES } from "@/lib/pages";

export const dynamic = "force-dynamic";

async function saveVisibility(formData: FormData) {
  "use server";
  await requireAdmin();
  // A checked box submits "on"; unchecked keys are absent from the form data.
  await Promise.all(
    TOGGLABLE_PAGES.map((page) => {
      const visible = formData.get(page.key) === "on";
      return prisma.pageVisibility.upsert({
        where: { key: page.key },
        create: { key: page.key, visible },
        update: { visible },
      });
    }),
  );
  // Refresh nav (in the shared layout) + all public pages so the change lands
  // everywhere, and this admin screen itself.
  revalidatePath("/", "layout");
  revalidatePath("/admin/zichtbaarheid");
}

export default async function AdminZichtbaarheidPage() {
  await requireAdmin();
  const rows = await prisma.pageVisibility.findMany();
  // Absent row = visible (default on).
  const hidden = new Set(
    rows.filter((r) => !r.visible).map((r) => r.key),
  );

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl">Zichtbaarheid van pagina&rsquo;s</h1>
      <p className="text-sm text-derby-ink/70">
        Zet hier hele pagina&rsquo;s aan of uit. Een uitgezette pagina verdwijnt
        uit het menu (in beide talen) en is niet meer bereikbaar via de URL — ook
        niet in de sitemap. De <strong>Home</strong>-pagina staat altijd aan en
        kun je niet uitzetten.
      </p>

      <form
        action={saveVisibility}
        className="bg-white rounded-2xl p-5 shadow space-y-3"
      >
        <ul className="divide-y divide-derby-ink/10">
          {TOGGLABLE_PAGES.map((page) => {
            const isHidden = hidden.has(page.key);
            return (
              <li
                key={page.key}
                className="flex items-center justify-between gap-4 py-3"
              >
                <div>
                  <span className="font-bold">{page.adminLabel}</span>
                  <span className="ml-2 text-xs text-derby-ink/50">
                    /{page.path}
                  </span>
                  {isHidden && (
                    <span className="ml-2 rounded-full bg-derby-ink/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-derby-ink/60">
                      verborgen
                    </span>
                  )}
                </div>
                <label className="flex items-center gap-2 text-sm font-bold shrink-0">
                  <input
                    type="checkbox"
                    name={page.key}
                    defaultChecked={!isHidden}
                    className="h-4 w-4"
                  />
                  Zichtbaar
                </label>
              </li>
            );
          })}
        </ul>
        <button
          type="submit"
          className="bg-derby-ink text-white rounded-full px-4 py-2 font-bold"
        >
          Opslaan
        </button>
      </form>
    </div>
  );
}
