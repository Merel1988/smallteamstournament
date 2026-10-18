import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import PhotoGallery from "@/components/PhotoGallery";
import { assertPageVisible } from "@/lib/page-visibility";
import { listPublicPhotos, uploadsOpen } from "@/lib/photos";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const meta = await pageMetadata({ locale, page: "fotos", path: "fotos" });
  return { ...meta, robots: { index: true, follow: true, noimageindex: true } };
}

export default async function FotosPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await assertPageVisible("fotos");
  setRequestLocale(locale);
  const t = await getTranslations("Photos");

  const [{ photos, nextCursor }, open] = await Promise.all([
    listPublicPhotos(),
    uploadsOpen(),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-5xl">{t("title")}</h1>
        <p className="text-derby-ink/70 mt-1">{t("subtitle")}</p>
      </header>
      <PhotoGallery initial={photos} initialCursor={nextCursor} uploadsOpen={open} />
    </div>
  );
}
