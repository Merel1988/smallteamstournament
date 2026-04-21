import PhotoGallery from "@/components/PhotoGallery";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function FotosPage() {
  const photos = await prisma.photo
    .findMany({ orderBy: { createdAt: "desc" }, take: 200 })
    .catch(() => []);

  const serialized = photos.map((p) => ({
    id: p.id,
    url: p.url,
    uploaderName: p.uploaderName,
    caption: p.caption,
    createdAt: p.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-5xl">Foto&apos;s</h1>
        <p className="text-derby-ink/70 mt-1">
          Deel je leukste derby-moment. Alle foto&apos;s verschijnen direct in
          de galerij.
        </p>
      </header>
      <PhotoGallery initial={serialized} />
    </div>
  );
}
