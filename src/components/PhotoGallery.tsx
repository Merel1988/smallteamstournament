"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import PhotoUpload from "./PhotoUpload";
import { downloadPhotos } from "@/lib/photo-download";
import type { PublicPhoto } from "@/lib/photos";

const blockSave = {
  onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  onDragStart: (e: React.DragEvent) => e.preventDefault(),
  style: { WebkitTouchCallout: "none" } as React.CSSProperties,
};

export default function PhotoGallery({
  initial,
  initialCursor,
  uploadsOpen,
}: {
  initial: PublicPhoto[];
  initialCursor: string | null;
  uploadsOpen: boolean;
}) {
  const t = useTranslations("Photos");
  const tA11y = useTranslations("A11y");
  const [photos, setPhotos] = useState<PublicPhoto[]>(initial);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const touchStartX = useRef<number | null>(null);

  const current = openIndex !== null ? photos[openIndex] : null;

  async function reload() {
    const res = await fetch("/api/photos");
    if (!res.ok) return;
    const data = (await res.json()) as { photos: PublicPhoto[]; nextCursor: string | null };
    setPhotos(data.photos);
    setCursor(data.nextCursor);
  }

  async function loadMore() {
    if (!cursor) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/photos?cursor=${encodeURIComponent(cursor)}`);
      if (!res.ok) return;
      const data = (await res.json()) as { photos: PublicPhoto[]; nextCursor: string | null };
      setPhotos((prev) => {
        const known = new Set(prev.map((p) => p.id));
        return [...prev, ...data.photos.filter((p) => !known.has(p.id))];
      });
      setCursor(data.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }

  function open(index: number) {
    lastFocusedRef.current = document.activeElement as HTMLElement;
    setOpenIndex(index);
  }

  const close = useCallback(() => {
    setOpenIndex(null);
    lastFocusedRef.current?.focus();
  }, []);

  const step = useCallback(
    (delta: number) =>
      setOpenIndex((i) => (i === null ? i : Math.min(photos.length - 1, Math.max(0, i + delta)))),
    [photos.length],
  );

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, close, step]);

  useEffect(() => {
    if (openIndex !== null) closeButtonRef.current?.focus();
  }, [openIndex]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function download(list: PublicPhoto[]) {
    setDownloading(true);
    setMessage(null);
    try {
      await downloadPhotos(list);
    } catch {
      setMessage(t("downloadError"));
    } finally {
      setDownloading(false);
    }
  }

  async function report(photo: PublicPhoto) {
    const reason = window.prompt(t("reportPrompt"));
    if (reason === null) return;
    const res = await fetch("/api/photos/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: photo.id, reason }),
    });
    if (!res.ok) {
      setMessage(t("reportError"));
      return;
    }
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    setOpenIndex(null);
    setMessage(t("reportDone"));
  }

  const shareableCount = photos.filter((p) => p.shareable).length;

  return (
    <div className="space-y-6">
      <PhotoUpload open={uploadsOpen} onUploaded={reload} />

      {message && (
        <p role="status" className="text-sm bg-white rounded-lg px-4 py-2 shadow">
          {message}
        </p>
      )}

      {photos.length === 0 ? (
        <p className="text-derby-ink/60">{t("empty")}</p>
      ) : (
        <>
          {shareableCount > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelecting((s) => !s);
                  setSelected(new Set());
                }}
                className="border border-derby-ink/30 rounded-full px-4 py-1.5 text-sm font-bold bg-white"
              >
                {selecting ? t("selectCancel") : t("selectStart")}
              </button>
              {selecting && (
                <span className="text-sm text-derby-ink/70">{t("selectHint")}</span>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {photos.map((p, index) => {
              const isSelected = selected.has(p.id);
              const selectable = selecting && p.shareable;
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={selecting && !p.shareable}
                  aria-pressed={selecting ? isSelected : undefined}
                  onClick={() => (selectable ? toggle(p.id) : open(index))}
                  className={`relative block aspect-square overflow-hidden rounded-lg shadow bg-derby-ink/5 disabled:opacity-40 ${
                    isSelected ? "ring-4 ring-derby-accent" : ""
                  }`}
                  {...(p.shareable ? {} : blockSave)}
                >
                  <Image
                    src={p.thumbUrl}
                    alt={p.caption || t("altFallback")}
                    width={480}
                    height={480}
                    unoptimized
                    draggable={false}
                    loading="lazy"
                    className="h-full w-full object-cover select-none"
                  />
                  {!p.shareable && <span className="absolute inset-0" aria-hidden />}
                  {selecting && p.shareable && (
                    <span
                      aria-hidden
                      className={`absolute top-2 right-2 h-6 w-6 rounded-full border-2 border-white flex items-center justify-center text-sm font-bold ${
                        isSelected ? "bg-derby-accent text-white" : "bg-black/30"
                      }`}
                    >
                      {isSelected ? "✓" : ""}
                    </span>
                  )}
                  {p.uploaderName && (
                    <span className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent text-white text-xs px-2 pt-4 pb-1 text-left truncate">
                      {p.uploaderName}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {cursor && (
            <div className="text-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="bg-white border border-derby-ink/30 rounded-full px-5 py-2 font-bold disabled:opacity-40"
              >
                {loadingMore ? t("loading") : t("loadMore")}
              </button>
            </div>
          )}
        </>
      )}

      {selecting && (
        <div className="fixed bottom-4 inset-x-4 z-40 flex justify-center">
          <button
            type="button"
            disabled={selected.size === 0 || downloading}
            onClick={() => download(photos.filter((p) => selected.has(p.id)))}
            className="bg-derby-accent text-white rounded-full px-6 py-3 font-bold shadow-lg disabled:opacity-60"
          >
            {downloading ? t("downloading") : t("downloadSelected", { count: selected.size })}
          </button>
        </div>
      )}

      {current && openIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.caption || t("altFallback")}
          onClick={close}
          onTouchStart={(e) => (touchStartX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchStartX.current;
            touchStartX.current = null;
            if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
          }}
          className="fixed inset-0 bg-black/90 z-50 flex flex-col"
        >
          <div className="flex items-center justify-end gap-2 p-3" onClick={(e) => e.stopPropagation()}>
            {current.shareable && (
              <button
                type="button"
                onClick={() => download([current])}
                disabled={downloading}
                className="rounded-full bg-white/90 text-derby-ink px-4 py-2 text-sm font-bold disabled:opacity-60"
              >
                {downloading ? t("downloading") : t("download")}
              </button>
            )}
            <button
              type="button"
              onClick={() => report(current)}
              className="rounded-full bg-white/20 text-white px-4 py-2 text-sm font-bold"
            >
              {t("report")}
            </button>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={close}
              aria-label={tA11y("closePhoto")}
              className="h-10 w-10 rounded-full bg-white/90 text-derby-ink text-xl font-bold flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          <div className="relative flex-1 min-h-0 flex items-center justify-center px-2">
            <div
              className="relative max-h-full max-w-full"
              onClick={(e) => e.stopPropagation()}
              {...(current.shareable ? {} : blockSave)}
            >
              <Image
                key={current.id}
                src={current.url}
                alt={current.caption || t("altFallback")}
                width={current.width ?? 1280}
                height={current.height ?? 1280}
                unoptimized
                draggable={false}
                className="max-h-[calc(100dvh-8rem)] w-auto h-auto max-w-full rounded-lg select-none"
              />
              {!current.shareable && <span className="absolute inset-0" aria-hidden />}
            </div>
            {openIndex > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
                aria-label={t("previous")}
                className="absolute left-2 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/80 text-derby-ink text-2xl font-bold hidden sm:flex items-center justify-center"
              >
                ‹
              </button>
            )}
            {openIndex < photos.length - 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
                aria-label={t("next")}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/80 text-derby-ink text-2xl font-bold hidden sm:flex items-center justify-center"
              >
                ›
              </button>
            )}
          </div>

          <div className="p-3 text-center text-white/90 text-sm min-h-[2.5rem]" onClick={(e) => e.stopPropagation()}>
            {current.uploaderName && <span className="italic">{t("by", { name: current.uploaderName })}</span>}
            {!current.shareable && <span className="block text-white/60 text-xs mt-1">{t("viewOnly")}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
