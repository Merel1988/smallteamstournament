// Shared between server and client components: no Prisma imports here.

export type ProgramEntry = {
  id: string;
  start: number;
  end: number | null;
  title: string;
  note: string | null;
  kind: "item" | "match" | "break";
};

export const REFEREE_POSITIONS = ["HR", "IPR", "JR", "JR", "OPR", "OPR", "OPR", "ALT"];
export const NSO_POSITIONS = ["HNSO", "JT", "PLT", "PLT", "PBM", "PBT", "PBT", "SBO", "SK", "SK"];
export const DEFAULT_POSITIONS = [...REFEREE_POSITIONS, ...NSO_POSITIONS];

const REF_SET = new Set(["HR", "IPR", "FIPR", "BIPR", "JR", "OPR", "ALT", "ALTR", "THR"]);
const NSO_SET = new Set(["HNSO", "JT", "PLT", "EPLT", "PBM", "PBT", "SBO", "SK", "PW", "PT", "IWB", "LT", "ALTN", "SO"]);

export type CrewGroup = "referees" | "nsos" | "other";

export function crewGroup(position: string): CrewGroup {
  const parts = position.toUpperCase().split(/[\s/]+/);
  if (parts.some((p) => REF_SET.has(p))) return "referees";
  if (parts.some((p) => NSO_SET.has(p))) return "nsos";
  return "other";
}
