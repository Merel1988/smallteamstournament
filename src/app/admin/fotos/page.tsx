import { requireAdmin } from "@/lib/admin-auth";
import { deleteFromBlob } from "@/lib/blob";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function deletePhoto(id: string) {
  "use server";
  await requireAdmin();
  const photo = await prisma.photo.findUnique({ where: { id } });
  if (!photo) return;
  await deleteFromBlob(photo.url);
  await prisma.photo.delete({ where: { id } });
  revalidatePath("/admin/fotos");
  revalidatePath("/fotos");
}

export default async function AdminFotosPage() {
  await requireAdmin();
  const photos = await prisma.photo.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl">Foto&apos;s</h1>
      <p className="text-derby-ink/70 text-sm">
        Moderatie-knop per foto voor ongewenste inzendingen.
      </p>

      {photos.length === 0 ? (
        <p className="text-derby-ink/60">Nog geen inzendingen.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {photos.map((p) => (
            <div key={p.id} className="bg-white rounded-xl p-2 shadow">
              <Image
                src={p.url}
                alt={p.caption || "Foto"}
                width={400}
                height={400}
                unoptimized
                className="w-full h-40 object-cover rounded-lg"
              />
              <div className="text-xs text-derby-ink/70 mt-2 min-h-[2em]">
                {p.uploaderName && <div className="italic">{p.uploaderName}</div>}
                {p.caption && <div>{p.caption}</div>}
              </div>
              <form action={deletePhoto.bind(null, p.id)} className="mt-2">
                <button
                  type="submit"
                  className="w-full bg-white border border-derby-accent text-derby-accent rounded-full px-3 py-1 text-sm font-bold"
                >
                  Verwijder
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
