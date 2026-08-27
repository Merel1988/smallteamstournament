import type { DraaiboekState, ShiftDTO, TaskDTO, VolunteerDTO } from "@/lib/draaiboek-types";

export const m2s = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
export const s2m = (s: string) => {
  const [a, b] = s.split(":").map(Number);
  return (a || 0) * 60 + (b || 0);
};
export const overlaps = (a1: number, a2: number, b1: number, b2: number) => a1 < b2 && b1 < a2;

export type ShiftWithTask = ShiftDTO & { task: TaskDTO };

export const allShifts = (S: DraaiboekState): ShiftWithTask[] =>
  S.tasks.flatMap((t) => t.shifts.map((s) => ({ ...s, task: t })));

export const myGames = (S: DraaiboekState, v: VolunteerDTO) =>
  v.teamId ? S.games.filter((g) => g.teamAId === v.teamId || g.teamBId === v.teamId) : [];

export const volShifts = (S: DraaiboekState, vid: string) =>
  allShifts(S).filter((s) => s.who.includes(vid)).sort((a, b) => a.start - b.start);

export const volMinutes = (S: DraaiboekState, vid: string) =>
  volShifts(S, vid).reduce((a, s) => a + (s.end - s.start), 0);

export const hours = (min: number) => (min / 60).toFixed(1).replace(".", ",");

export type Status = { k: "game" | "soft" | "clash" | "free"; t: string };

export function status(S: DraaiboekState, v: VolunteerDTO, sh: ShiftDTO): Status {
  for (const g of myGames(S, v)) {
    if (overlaps(g.start, g.end, sh.start, sh.end)) return { k: "game", t: `speelt om ${m2s(g.start)}` };
    if (overlaps(g.start - S.pre, g.end + S.post, sh.start, sh.end))
      return { k: "soft", t: `wedstrijd om ${m2s(g.start)}` };
  }
  const c = allShifts(S).find(
    (o) => o.id !== sh.id && o.who.includes(v.id) && overlaps(o.start, o.end, sh.start, sh.end),
  );
  if (c) return { k: "clash", t: `staat al bij ${c.task.name}` };
  return { k: "free", t: "kan" };
}

export const hard = (k: Status["k"]) => k === "game" || k === "clash";

export const AREA_COLOR: Record<string, string> = {
  zaal: "#E30613",
  kantine: "#2FA8E0",
  officials: "#F2B705",
  algemeen: "#A76BF0",
};

export const teamName = (S: DraaiboekState, id: string | null) =>
  (id && S.teams.find((t) => t.id === id)?.name) || "";
