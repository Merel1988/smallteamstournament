import { getTranslations } from "next-intl/server";
import { PHOTOGRAPHER, type Photographer } from "@/lib/event";
import { photographerAlbumVisible } from "@/lib/photos";

export default async function PhotographerAlbum({
  photographer = PHOTOGRAPHER,
}: {
  photographer?: Photographer;
}) {
  if (!(await photographerAlbumVisible())) return null;
  const t = await getTranslations("PhotographerAlbum");

  return (
    <section
      aria-labelledby="photographer-album-heading"
      className="bg-white rounded-2xl p-6 shadow-lg border border-derby-ink/10"
    >
      <h2 id="photographer-album-heading" className="font-display text-3xl">
        <span aria-hidden>📷 </span>
        {t("heading", { name: photographer.name })}
      </h2>
      <p className="text-derby-ink/80 mt-1">{t("body", { name: photographer.name })}</p>
      <p className="text-derby-ink/80 mt-2">
        {t.rich("credit", {
          instagram: photographer.instagram,
          ig: (chunks) => (
            <a
              href={photographer.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-derby-accent underline"
            >
              {chunks}
            </a>
          ),
        })}
      </p>
      <a
        href={photographer.albumUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block mt-4 rounded-full bg-derby-accent text-white px-5 py-2 font-bold hover:bg-derby-ink transition"
      >
        {t("cta")} ↗
      </a>
    </section>
  );
}
