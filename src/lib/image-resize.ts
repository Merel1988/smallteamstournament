export type ResizedImage = { blob: Blob; width: number; height: number };

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("decode"));
    };
    img.src = url;
  });
}

// Re-encoding through a canvas also strips EXIF data such as GPS location.
function encode(img: HTMLImageElement, maxSide: number, quality: number): Promise<ResizedImage> {
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.round(img.naturalWidth * scale);
  const height = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("canvas"));
  ctx.drawImage(img, 0, 0, width, height);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve({ blob, width, height }) : reject(new Error("encode"))),
      "image/jpeg",
      quality,
    ),
  );
}

export async function prepareUpload(file: File, maxSide: number) {
  const img = await loadImage(file);
  const full = await encode(img, maxSide, 0.82);
  const thumb = await encode(img, 480, 0.72);
  return { full, thumb };
}
