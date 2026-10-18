import { put } from "@vercel/blob";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteFromBlob } from "@/lib/blob";
import { listPublicPhotos, uploadsOpen } from "@/lib/photos";
import { moderatePhoto } from "@/lib/photo-moderation";

export const maxDuration = 60;

const MAX_FULL_BYTES = 3 * 1024 * 1024;
const MAX_THUMB_BYTES = 400 * 1024;

function isJpeg(bytes: Uint8Array): boolean {
  return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

function toDimension(value: FormDataEntryValue | null): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 && n <= 10000 ? n : null;
}

export async function POST(request: NextRequest) {
  if (!(await uploadsOpen())) {
    return Response.json({ error: "closed" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  const full = form.get("full");
  const thumb = form.get("thumb");
  const consent = form.get("shareable");
  if (!(full instanceof File) || !(thumb instanceof File)) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }
  if (consent !== "yes" && consent !== "no") {
    return Response.json({ error: "consent" }, { status: 400 });
  }
  if (full.size > MAX_FULL_BYTES || thumb.size > MAX_THUMB_BYTES) {
    return Response.json({ error: "too_large" }, { status: 413 });
  }

  const fullBytes = Buffer.from(await full.arrayBuffer());
  const thumbBytes = Buffer.from(await thumb.arrayBuffer());
  if (!isJpeg(fullBytes) || !isJpeg(thumbBytes)) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  const rawName = form.get("name");
  const uploaderName =
    typeof rawName === "string" && rawName.trim() ? rawName.trim().slice(0, 60) : null;

  const options = {
    access: "public" as const,
    addRandomSuffix: true,
    contentType: "image/jpeg",
  };
  const fullBlob = await put("photos/photo.jpg", fullBytes, options);
  let thumbBlob;
  try {
    thumbBlob = await put("photos/thumbs/photo.jpg", thumbBytes, options);
  } catch (error) {
    await deleteFromBlob(fullBlob.url);
    throw error;
  }

  const moderation = await moderatePhoto(fullBytes);
  const status = moderation.allowed ? "approved" : "pending";

  try {
    await prisma.photo.create({
      data: {
        url: fullBlob.url,
        thumbUrl: thumbBlob.url,
        width: toDimension(form.get("width")),
        height: toDimension(form.get("height")),
        uploaderName,
        shareable: consent === "yes",
        status,
        moderationNote: moderation.note || null,
      },
    });
  } catch (error) {
    await deleteFromBlob(fullBlob.url);
    await deleteFromBlob(thumbBlob.url);
    throw error;
  }

  return Response.json({ status });
}

export async function GET(request: NextRequest) {
  const cursor = request.nextUrl.searchParams.get("cursor");
  return Response.json(await listPublicPhotos(cursor));
}
