"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import PhotoUpload from "./PhotoUpload";

type Photo = {
  id: string;
  url: string;
  uploaderName: string | null;
  caption: string | null;
  createdAt: string;
};

export default function PhotoGallery({ initial }: { initial: Photo[] }) {
  const t = useTranslations("Photos");
  const [photos, setPhotos] = useState<Photo[]>(initial);
  const [lightbox, setLightbox] = useState<Photo | null>(null);

  async function reload() {
    const res = await fetch("/api/photos");
    if (res.ok) {
      const { photos } = (await res.json()) as { photos: Photo[] };
      setPhotos(photos);
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="space-y-6">
      <PhotoUpload onUploaded={reload} />

      {photos.length === 0 ? (
        <p className="text-derby-ink/60">{t("empty")}</p>
      ) : (
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-2">
          {photos.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setLightbox(p)}
              className="block mb-2 break-inside-avoid w-full"
            >
              <Image
                src={p.url}
                alt={p.caption || t("altFallback")}
                width={400}
                height={400}
                unoptimized
                className="w-full h-auto rounded-lg shadow"
              />
              {(p.caption || p.uploaderName) && (
                <p className="text-xs text-derby-ink/70 mt-1 text-left">
                  {p.caption}
                  {p.caption && p.uploaderName ? " · " : ""}
                  {p.uploaderName && (
                    <span className="italic">{p.uploaderName}</span>
                  )}
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          role="dialog"
          onClick={() => setLightbox(null)}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
        >
          <Image
            src={lightbox.url}
            alt={lightbox.caption || "Derby foto"}
            width={1200}
            height={1200}
            unoptimized
            className="max-h-full max-w-full w-auto h-auto rounded-lg"
          />
        </div>
      )}
    </div>
  );
}
