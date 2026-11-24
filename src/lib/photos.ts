import { prisma } from "@/lib/prisma";
import type { Photo } from "@/generated/prisma/client";

export const PHOTO_PAGE_SIZE = 24;
export const UPLOADS_SETTING_KEY = "fotos-upload";
export const ALBUM_SETTING_KEY = "fotograaf-album";

export type PhotoStatus = "approved" | "pending";

export type PublicPhoto = {
  id: string;
  url: string;
  thumbUrl: string;
  width: number | null;
  height: number | null;
  uploaderName: string | null;
  caption: string | null;
  shareable: boolean;
};

export function toPublicPhoto(p: Photo): PublicPhoto {
  return {
    id: p.id,
    url: p.url,
    thumbUrl: p.thumbUrl ?? p.url,
    width: p.width,
    height: p.height,
    uploaderName: p.uploaderName,
    caption: p.caption,
    shareable: p.shareable,
  };
}

export async function listPublicPhotos(
  cursor?: string | null,
): Promise<{ photos: PublicPhoto[]; nextCursor: string | null }> {
  const rows = await prisma.photo
    .findMany({
      where: { status: "approved", reportedAt: null },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: PHOTO_PAGE_SIZE + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })
    .catch(() => [] as Photo[]);
  const hasMore = rows.length > PHOTO_PAGE_SIZE;
  const page = rows.slice(0, PHOTO_PAGE_SIZE);
  return {
    photos: page.map(toPublicPhoto),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  };
}

export async function listHighlightPhotos(year: number): Promise<PublicPhoto[]> {
  const rows = await prisma.photo
    .findMany({
      where: { highlightYear: year, status: "approved", reportedAt: null },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    })
    .catch(() => [] as Photo[]);
  return rows.map(toPublicPhoto);
}

async function settingOn(key: string, fallback: boolean): Promise<boolean> {
  const row = await prisma.pageVisibility.findUnique({ where: { key } }).catch(() => null);
  return row?.visible ?? fallback;
}

export function uploadsOpen(): Promise<boolean> {
  return settingOn(UPLOADS_SETTING_KEY, true);
}

// Off until an organiser turns it on in /admin/fotos.
export function photographerAlbumVisible(): Promise<boolean> {
  return settingOn(ALBUM_SETTING_KEY, false);
}
