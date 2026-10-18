import Link from "next/link";
import Image from "next/image";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { deleteFromBlob } from "@/lib/blob";
import { prisma } from "@/lib/prisma";
import { UPLOADS_SETTING_KEY, uploadsOpen } from "@/lib/photos";
import type { Prisma } from "@/generated/prisma/client";
import SubmitButton from "@/components/SubmitButton";

export const dynamic = "force-dynamic";

const TABS = {
  review: { label: "Te beoordelen", where: { status: "pending" } },
  reports: { label: "Verwijderverzoeken", where: { reportedAt: { not: null } } },
  live: { label: "Zichtbaar", where: { status: "approved", reportedAt: null } },
} satisfies Record<string, { label: string; where: Prisma.PhotoWhereInput }>;

type TabKey = keyof typeof TABS;

function refresh() {
  revalidatePath("/admin/fotos");
  revalidatePath("/fotos");
  revalidatePath("/en/fotos");
}

async function deletePhotos(ids: string[]) {
  const photos = await prisma.photo.findMany({ where: { id: { in: ids } } });
  for (const photo of photos) {
    await deleteFromBlob(photo.url);
    if (photo.thumbUrl) await deleteFromBlob(photo.thumbUrl);
  }
  await prisma.photo.deleteMany({ where: { id: { in: photos.map((p) => p.id) } } });
}

async function deleteOne(id: string) {
  "use server";
  await requireAdmin();
  await deletePhotos([id]);
  refresh();
}

async function deleteSelected(formData: FormData) {
  "use server";
  await requireAdmin();
  const ids = formData.getAll("ids").filter((v): v is string => typeof v === "string");
  if (ids.length) await deletePhotos(ids);
  refresh();
}

async function approve(id: string) {
  "use server";
  await requireAdmin();
  await prisma.photo.update({
    where: { id },
    data: { status: "approved", reportedAt: null, reportReason: null },
  });
  refresh();
}

async function setUploads(open: boolean) {
  "use server";
  await requireAdmin();
  await prisma.pageVisibility.upsert({
    where: { key: UPLOADS_SETTING_KEY },
    create: { key: UPLOADS_SETTING_KEY, visible: open },
    update: { visible: open },
  });
  refresh();
}

export default async function AdminFotosPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireAdmin();
  const { tab: rawTab } = await searchParams;
  const tab: TabKey = rawTab && rawTab in TABS ? (rawTab as TabKey) : "review";

  const [photos, counts, open] = await Promise.all([
    prisma.photo
      .findMany({ where: TABS[tab].where, orderBy: { createdAt: "desc" } })
      .catch(() => []),
    Promise.all(
      (Object.keys(TABS) as TabKey[]).map((key) =>
        prisma.photo.count({ where: TABS[key].where }).catch(() => 0),
      ),
    ),
    uploadsOpen(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl">Foto&apos;s</h1>

      <div className="bg-white rounded-xl p-4 shadow flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm">
          Uploaden staat <b>{open ? "open" : "dicht"}</b>.
          {!open && " Bezoekers zien een melding dat uploaden gesloten is."}
        </p>
        <form action={setUploads.bind(null, !open)}>
          <SubmitButton
            className={`rounded-full px-4 py-1.5 text-sm font-bold ${
              open ? "border border-derby-accent text-derby-accent bg-white" : "bg-derby-accent text-white"
            }`}
          >
            {open ? "Uploaden sluiten" : "Uploaden openen"}
          </SubmitButton>
        </form>
      </div>

      <nav className="flex flex-wrap gap-2" aria-label="Foto-tabbladen">
        {(Object.keys(TABS) as TabKey[]).map((key, i) => (
          <Link
            key={key}
            href={`/admin/fotos?tab=${key}`}
            aria-current={tab === key ? "page" : undefined}
            className={`rounded-full px-4 py-1.5 text-sm font-bold ${
              tab === key ? "bg-derby-ink text-white" : "bg-white shadow"
            }`}
          >
            {TABS[key].label} ({counts[i]})
          </Link>
        ))}
      </nav>

      {tab === "review" && (
        <p className="text-derby-ink/70 text-sm">
          Deze foto&apos;s zijn door de automatische controle tegengehouden en nog niet zichtbaar.
        </p>
      )}
      {tab === "reports" && (
        <p className="text-derby-ink/70 text-sm">
          Iemand heeft gevraagd deze foto&apos;s te verwijderen. Ze zijn verborgen tot je ze goedkeurt
          of verwijdert.
        </p>
      )}

      {photos.length === 0 ? (
        <p className="text-derby-ink/60">Niks te zien hier.</p>
      ) : (
        <form action={deleteSelected} className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {photos.map((p) => (
              <div key={p.id} className="bg-white rounded-xl p-2 shadow flex flex-col">
                <label className="relative block cursor-pointer">
                  <input
                    type="checkbox"
                    name="ids"
                    value={p.id}
                    className="absolute top-2 left-2 h-5 w-5 z-10"
                    aria-label="Selecteer foto"
                  />
                  <Image
                    src={p.thumbUrl ?? p.url}
                    alt={p.caption || "Foto"}
                    width={480}
                    height={480}
                    unoptimized
                    className="w-full h-40 object-cover rounded-lg"
                  />
                </label>
                <div className="text-xs text-derby-ink/70 mt-2 space-y-1 flex-1">
                  <div>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 font-bold ${
                        p.shareable ? "bg-green-100 text-green-800" : "bg-derby-ink/10"
                      }`}
                    >
                      {p.shareable ? "Mag gedeeld worden" : "Alleen bekijken"}
                    </span>
                  </div>
                  {p.uploaderName && <div className="italic">{p.uploaderName}</div>}
                  {tab === "review" && p.moderationNote && <div>AI: {p.moderationNote}</div>}
                  {p.reportedAt && (
                    <div className="text-derby-accent">
                      Verzoek: {p.reportReason || "geen reden opgegeven"}
                    </div>
                  )}
                  <a href={p.url} target="_blank" rel="noreferrer" className="underline">
                    Groot bekijken
                  </a>
                </div>
                <div className="mt-2 flex gap-2">
                  {tab !== "live" && (
                    <SubmitButton
                      formAction={approve.bind(null, p.id)}
                      className="flex-1 bg-derby-ink text-white rounded-full px-3 py-1 text-sm font-bold"
                    >
                      Goedkeuren
                    </SubmitButton>
                  )}
                  <SubmitButton
                    formAction={deleteOne.bind(null, p.id)}
                    className="flex-1 bg-white border border-derby-accent text-derby-accent rounded-full px-3 py-1 text-sm font-bold"
                  >
                    Verwijder
                  </SubmitButton>
                </div>
              </div>
            ))}
          </div>
          <div className="sticky bottom-4 flex justify-center">
            <SubmitButton className="bg-derby-accent text-white rounded-full px-6 py-2 font-bold shadow-lg">
              Geselecteerde foto&apos;s verwijderen
            </SubmitButton>
          </div>
        </form>
      )}
    </div>
  );
}
