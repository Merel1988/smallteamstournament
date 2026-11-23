import type { Edition, EditionSnapshot } from "@/lib/edition-types";
import snapshot2026 from "@/data/editions/2026/snapshot.json";
import { stats2026 } from "@/data/editions/2026/stats";

// Newest first. Add a year with scripts/snapshot-edition.mjs and, when available, a stats file.
const EDITIONS: Record<number, Edition> = {
  2026: { snapshot: snapshot2026 as EditionSnapshot, stats: stats2026 },
};

export const EDITION_YEARS = Object.keys(EDITIONS)
  .map(Number)
  .sort((a, b) => b - a);

export function getEdition(year: number): Edition | null {
  return EDITIONS[year] ?? null;
}

export function editionFinal(snapshot: EditionSnapshot) {
  const final = snapshot.matches.find((m) => /final/i.test(m.poule ?? ""));
  if (!final) return null;
  const aWon = final.scoreA > final.scoreB;
  return {
    match: final,
    champion: aWon ? final.teamA : final.teamB,
    runnerUp: aWon ? final.teamB : final.teamA,
  };
}
