"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
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
  const tA11y = useTranslations("A11y");
  const [photos, setPhotos] = useState<Photo[]>(initial);
  const [lightbox, setLightbox] = useState<Photo | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  async function reload() {
    const res = await fetch("/api/photos");
    if (res.ok) {
      const { photos } = (await res.json()) as { photos: Photo[] };
      setPhotos(photos);
    }
  }

  function openLightbox(photo: Photo) {
    lastFocusedRef.current = document.activeElement as HTMLElement;
    setLightbox(photo);
  }

  function closeLightbox() {
    setLightbox(null);
    lastFocusedRef.current?.focus();
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Move focus into the dialog when it opens.
  useEffect(() => {
    if (lightbox) closeButtonRef.current?.focus();
  }, [lightbox]);

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
              onClick={() => openLightbox(p)}
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
          aria-modal="true"
          aria-label={lightbox.caption || t("altFallback")}
          onClick={closeLightbox}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
        >
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeLightbox}
            aria-label={tA11y("closePhoto")}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/90 text-derby-ink text-xl font-bold flex items-center justify-center shadow"
          >
            ✕
          </button>
          <Image
            src={lightbox.url}
            alt={lightbox.caption || t("altFallback")}
            width={1200}
            height={1200}
            unoptimized
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-full w-auto h-auto rounded-lg"
          />
        </div>
      )}
    </div>
  );
}
