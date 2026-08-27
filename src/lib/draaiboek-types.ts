// Types and constants shared between server (Prisma) and client components.
// Keep this file free of server-only imports.

export const AREAS = {
  zaal: "Zaal",
  kantine: "Kantine",
  officials: "Officials",
  algemeen: "Algemeen",
} as const;
export type Area = keyof typeof AREAS;

// Minutes before/after a volunteer's own game during which a shift is flagged
// as "tight" (they still can sign up, with a warning).
export const PRE_GAME_MARGIN = 45;
export const POST_GAME_MARGIN = 15;
export const GAME_MINUTES = 20;


export type InfoItem = { text: string; done: boolean };
export type ShiftDTO = {
  id: string;
  taskId: string;
  start: number;
  end: number;
  need: number;
  who: string[]; // volunteer ids
};
export type TaskDTO = {
  id: string;
  area: Area;
  name: string;
  info: InfoItem[];
  sortOrder: number;
  shifts: ShiftDTO[];
};
export type VolunteerDTO = { id: string; name: string; teamId: string | null };
export type TeamDTO = { id: string; name: string };
export type GameDTO = { id: string; start: number; end: number; teamAId: string; teamBId: string };
export type ItemDTO = {
  id: string;
  kind: "prep" | "issue" | "role";
  fase: string;
  text: string;
  note: string;
  wie: string;
  datum: string;
  done: boolean;
  sortOrder: number;
};
export type DraaiboekState = {
  items: ItemDTO[];
  tasks: TaskDTO[];
  volunteers: VolunteerDTO[];
  teams: TeamDTO[];
  games: GameDTO[];
  pre: number;
  post: number;
};


export type Role = "vrijwilliger" | "organisatie";
