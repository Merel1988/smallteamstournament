import { put, del } from "@vercel/blob";

export async function uploadToBlob(
  file: File,
  prefix: string,
): Promise<string> {
  const safeName = file.name.replace(/[^a-z0-9._-]+/gi, "_");
  const key = `${prefix}/${Date.now()}-${safeName}`;
  const { url } = await put(key, file, {
    access: "public",
    addRandomSuffix: true,
  });
  return url;
}

export async function deleteFromBlob(url: string): Promise<void> {
  try {
    await del(url);
  } catch {
    // swallow: blob may already be gone
  }
}
