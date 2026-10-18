import { zipSync } from "fflate";

type Downloadable = { id: string; url: string };

async function fetchFile(photo: Downloadable, index: number): Promise<File> {
  const res = await fetch(photo.url);
  if (!res.ok) throw new Error("download");
  const blob = await res.blob();
  return new File([blob], `small-teams-tournament-${index + 1}.jpg`, { type: "image/jpeg" });
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function prefersShareSheet(files: File[]): boolean {
  return (
    typeof navigator.canShare === "function" &&
    window.matchMedia("(pointer: coarse)").matches &&
    navigator.canShare({ files })
  );
}

export async function downloadPhotos(photos: Downloadable[]): Promise<void> {
  const files = await Promise.all(photos.map(fetchFile));

  if (prefersShareSheet(files)) {
    try {
      await navigator.share({ files });
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
  }

  if (files.length === 1) {
    saveBlob(files[0], files[0].name);
    return;
  }

  const entries: Record<string, Uint8Array> = {};
  for (const file of files) {
    entries[file.name] = new Uint8Array(await file.arrayBuffer());
  }
  const zip = zipSync(entries, { level: 0 });
  saveBlob(new Blob([zip as BlobPart], { type: "application/zip" }), "small-teams-tournament-fotos.zip");
}
