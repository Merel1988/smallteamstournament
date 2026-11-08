const SWATCH: Record<string, string> = {
  zwart: "#111111",
  wit: "#ffffff",
  paars: "#7c3aed",
  roze: "#ec4899",
  groen: "#16a34a",
  rood: "#dc2626",
  blauw: "#2563eb",
  geel: "#facc15",
  oranje: "#f97316",
  grijs: "#9ca3af",
};

const EN: Record<string, string> = {
  zwart: "black",
  wit: "white",
  paars: "purple",
  roze: "pink",
  groen: "green",
  rood: "red",
  blauw: "blue",
  geel: "yellow",
  oranje: "orange",
  grijs: "grey",
  of: "or",
};

// Swatch for the first colour mentioned, e.g. "paars of wit" shows purple.
export function shirtSwatch(shirt: string): string | null {
  const word = shirt.toLowerCase().match(/[a-z]+/g)?.find((w) => w in SWATCH);
  return word ? SWATCH[word] : null;
}

export function shirtLabel(shirt: string, locale: string): string {
  if (locale !== "en") return shirt;
  return shirt.replace(/[a-zA-Z]+/g, (w) => EN[w.toLowerCase()] ?? w);
}
